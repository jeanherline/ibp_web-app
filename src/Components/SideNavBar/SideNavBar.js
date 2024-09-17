import React, { useState, useEffect, useRef } from "react";
import { Tooltip } from "react-tooltip";
import { useNavigate, NavLink, Link, useLocation } from "react-router-dom";
import { auth, doc, fs, signOut } from "../../Config/Firebase";
import {
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import "./SideNavBar.css";

function SideNavBar() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const notificationsRef = useRef();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userDocRef = doc(fs, "users", user.uid);
        const unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (userDoc) => {
            if (userDoc.exists()) {
              setUserData(userDoc.data());
            } else {
              console.log("User document does not exist");
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user data:", error);
            setLoading(false);
          }
        );

        return () => {
          unsubscribeUserDoc(); // Clean up the user document listener
        };
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth(); // Clean up the auth state listener
    };
  }, []);

  useEffect(() => {
    if (userData) {
      fetchUnreadCount();
    }
  }, [userData]);

  const markNotificationsAsRead = async () => {
    if (notifications.length > 0) {
      const batch = writeBatch(fs);
      notifications.forEach((notification) => {
        if (!notification.read) {
          const notificationRef = doc(fs, "notifications", notification.id);
          batch.update(notificationRef, { read: true });
        }
      });
      await batch.commit();
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.read ? notification : { ...notification, read: true }
        )
      );
      setUnreadCount(0);
    }
  };

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.replace("/");
  };

  const fetchUnreadCount = async () => {
    const notificationsRef = collection(fs, "notifications");
    const unreadQuery = query(
      notificationsRef,
      where("uid", "==", auth.currentUser.uid),
      where("read", "==", false)
    );

    const unreadSnapshot = await getDocs(unreadQuery);
    setUnreadCount(unreadSnapshot.size);
  };

  const handleNotificationsClick = async () => {
    if (!userData) return;

    if (showNotifications) {
      setShowNotifications(false);
      return;
    }

    const notificationsRef = collection(fs, "notifications");
    const userNotificationsQuery = query(
      notificationsRef,
      where("uid", "==", auth.currentUser.uid),
      orderBy("timestamp", "desc")
    );

    const memberTypeNotificationsQuery = query(
      notificationsRef,
      where("member_type", "==", userData.member_type),
      orderBy("timestamp", "desc")
    );

    const userNotificationsSnapshot = await getDocs(userNotificationsQuery);
    const memberTypeNotificationsSnapshot = await getDocs(
      memberTypeNotificationsQuery
    );

    const notificationsData = [
      ...userNotificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
      ...memberTypeNotificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    ];

    setNotifications(notificationsData);
    setShowNotifications(true);

    // Mark notifications as read
    await markNotificationsAsRead();
    fetchUnreadCount(); // Update the unread count after marking notifications as read
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === "appointment") {
      if (userData.member_type === "head") {
        navigate("/head");
      } else if (userData.member_type === "frontdesk") {
        navigate("/frontdesk");
      } else if (userData.member_type === "admin") {
        navigate("/appointments");
      } else if (userData.member_type === "lawyer") {
        navigate("/lawyer");
      }
    }
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="top-right-container">
        {loading ? (
          <div className="member-type">Loading...</div>
        ) : userData ? (
          <div className="member-type">
            Kumusta,{" "}
            {userData.member_type === "lawyer"
              ? `Volunteer Lawyer ${capitalizeFirstLetter(
                  userData.display_name
                )}`
              : userData.member_type === "admin"
              ? `Admin ${capitalizeFirstLetter(userData.display_name)}`
              : userData.member_type === "frontdesk"
              ? `Front Desk ${capitalizeFirstLetter(userData.display_name)}`
              : userData.member_type === "head"
              ? `Head Lawyer ${capitalizeFirstLetter(userData.display_name)}`
              : capitalizeFirstLetter(userData.display_name)}
          </div>
        ) : (
          <div className="member-type">User data not available</div>
        )}
        <Link to="/profile">
          <span
            className="material-icons icon"
            data-tooltip-id="tooltip"
            data-tooltip-content="Profile"
          >
            person
          </span>
        </Link>

        <span
          className="material-icons icon"
          data-tooltip-id="tooltip"
          data-tooltip-content="Notification"
          onClick={handleNotificationsClick}
          ref={notificationsRef}
        >
          notifications
          {unreadCount > 0 && (
            <span className="notification-count">{unreadCount}</span>
          )}
        </span>
        <span
          className="material-icons icon"
          onClick={handleLogout}
          data-tooltip-id="tooltip"
          data-tooltip-content="Logout"
        >
          exit_to_app
        </span>
      </div>

      <div className="sidebar">
        <div className="logo-container">
          <img
            src={require("../../Assets/img/ibp_logo.png")}
            alt="IBP Logo"
            className="logo"
          />
        </div>
        <div className="organization-name">
          <center>
            <h1>IBP - Bulacan Chapter</h1>
          </center>
        </div>
        <nav className="nav-menu">
          <ul>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Dashboard
              </NavLink>
            </li>
            {userData && userData.member_type === "lawyer" && (
              <>
                <li>
                  <NavLink
                    to="/calendarLawyer"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Appts. Calendar
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/lawyer"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Appointments
                  </NavLink>
                </li>
              </>
            )}

            {userData && userData.member_type === "admin" && (
              <>
                <li>
                  <NavLink
                    to="/apptsCalendar"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Appts. Calendar
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/appointments"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Appointments
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/users"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Users
                  </NavLink>
                </li>
              </>
            )}
            {userData && userData.member_type === "head" && (
              <>
                <li>
                  <NavLink
                    to="/apptsCalendar"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Appts. Calendar
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/head"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Appointments
                  </NavLink>
                </li>
              </>
            )}
            {userData && userData.member_type === "frontdesk" && (
              <>
                <li>
                  <NavLink
                    to="/apptsCalendar"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Appts. Calendar
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/frontdesk"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Appointments
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/walkin"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Walk In Form
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
        <footer className="footer">
          <p>Copyright © 2024. All Rights Reserved</p>
        </footer>
      </div>

      {showNotifications && (
        <div className="notifications-dropdown" ref={notificationsRef}>
          <h3>Notifications</h3>
          <ul>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={notification.read ? "read" : "unread"}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.message}
                </li>
              ))
            ) : (
              <li>No notifications available</li>
            )}
          </ul>
        </div>
      )}

      <Tooltip
        className="custom-tooltip"
        style={{ backgroundColor: "black", color: "white" }}
      />
    </>
  );
}

export default SideNavBar;
