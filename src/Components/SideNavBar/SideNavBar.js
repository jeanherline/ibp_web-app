import React, { useState, useEffect, useRef } from "react";
import { Tooltip } from "react-tooltip";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { auth, doc, fs, signOut } from "../../Config/Firebase";
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns"; // Import date-fns for date formatting
import "./SideNavBar.css";

function SideNavBar() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const notificationsIconRef = useRef();
  const notificationsDropdownRef = useRef();

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
          unsubscribeUserDoc();
        };
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (userData) {
      const unsubscribe = fetchNotifications();
      return () => unsubscribe();
    }
  }, [userData]);

  const fetchNotifications = () => {
    const notificationsRef = collection(fs, "notifications");

    const threeMonthsAgo = Timestamp.fromDate(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );

    const userNotificationsQuery = query(
      notificationsRef,
      where("uid", "==", auth.currentUser.uid),
      where("timestamp", ">=", threeMonthsAgo),
      orderBy("timestamp", "desc")
    );

    const memberTypeNotificationsQuery = query(
      notificationsRef,
      where("member_type", "==", userData.member_type),
      where("timestamp", ">=", threeMonthsAgo),
      orderBy("timestamp", "desc")
    );

    const unsubscribeUserNotifications = onSnapshot(
      userNotificationsQuery,
      (snapshot) => {
        const userNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications((prevNotifications) => {
          const updatedNotifications = [
            ...userNotifications,
            ...prevNotifications.filter(
              (notif) =>
                !userNotifications.some((newNotif) => newNotif.id === notif.id)
            ),
          ];
          updateUnreadCount(updatedNotifications); // Update unread count here
          return updatedNotifications;
        });
      }
    );

    const unsubscribeMemberTypeNotifications = onSnapshot(
      memberTypeNotificationsQuery,
      (snapshot) => {
        const memberTypeNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications((prevNotifications) => {
          const updatedNotifications = [
            ...memberTypeNotifications,
            ...prevNotifications.filter(
              (notif) =>
                !memberTypeNotifications.some(
                  (newNotif) => newNotif.id === notif.id
                )
            ),
          ];
          updateUnreadCount(updatedNotifications); // Update unread count here as well
          return updatedNotifications;
        });
      }
    );

    return () => {
      unsubscribeUserNotifications();
      unsubscribeMemberTypeNotifications();
    };
  };

  const updateUnreadCount = (notifications) => {
    const unreadNotifications = notifications.filter(
      (notif) => notif.read === false
    );
    setUnreadCount(unreadNotifications.length);
  };

  const updateNotifications = (newNotifications) => {
    setNotifications((prevNotifications) => {
      // Merge new and old notifications while removing duplicates
      const mergedNotifications = [...prevNotifications, ...newNotifications];
      const uniqueNotifications = mergedNotifications.filter(
        (notif, index, self) =>
          index === self.findIndex((n) => n.id === notif.id)
      );
      updateUnreadCount(uniqueNotifications); // Update unread count based on unique notifications
      return uniqueNotifications;
    });
  };

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
      setUnreadCount(0); // Reset unread count
    }
  };

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.replace("/");
  };

  const handleNotificationsClick = async () => {
    setShowNotifications((prevState) => !prevState);

    if (!showNotifications) {
      // Mark notifications as read when opening
      await markNotificationsAsRead();
    }
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
        notificationsDropdownRef.current &&
        !notificationsDropdownRef.current.contains(event.target) &&
        notificationsIconRef.current &&
        !notificationsIconRef.current.contains(event.target)
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
            data-tooltip-id="tooltip-profile"
            data-tooltip-content="Profile"
          >
            person
          </span>
        </Link>

        <span
          className="material-icons icon"
          data-tooltip-id="tooltip-notifications"
          data-tooltip-content="Notifications"
          onClick={handleNotificationsClick}
          ref={notificationsIconRef}
        >
          notifications
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span> // Show the badge only if unreadCount > 0
          )}
        </span>

        <span
          className="material-icons icon"
          onClick={handleLogout}
          data-tooltip-id="tooltip-logout"
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
                {/* Add the Audit Logs link for admin users */}
                <li>
                  <NavLink
                    to="/auditLogs"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Audit Logs
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
        <div
          className="notifications-dropdown"
          ref={notificationsDropdownRef}
          style={{ maxHeight: "600px", overflowY: "scroll" }} // Scrollable dropdown
        >
          <h4>Notifications</h4>
          <ul>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={notification.read ? "read" : "unread"}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.message}
                  <br />
                  <br />
                  <small>
                    {format(
                      new Date(notification.timestamp.seconds * 1000),
                      "PPpp"
                    )}
                  </small>{" "}
                  {/* Display formatted timestamp */}
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
      <Tooltip id="tooltip-profile" />
      <Tooltip id="tooltip-notifications" />
      <Tooltip id="tooltip-logout" />
    </>
  );
}

export default SideNavBar;
