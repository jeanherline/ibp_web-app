import React, { useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { auth, doc, fs, signOut } from "../../Config/Firebase";
import { getDoc, onSnapshot } from "firebase/firestore";
import "react-tooltip/dist/react-tooltip.css"; // Make sure to import the CSS for react-tooltip
import "./SideNavBar.css";
import { Link } from "react-router-dom";

function SideNavBar() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.replace("/");
  };

  return (
    <>
      <div className="top-right-container">
        {loading ? (
          <div className="member-type">Loading...</div>
        ) : userData ? (
          <div className="member-type">
            Kumusta,{" "}
            {userData.member_type === "lawyer"
              ? `Volunteer Lawyer ${capitalizeFirstLetter(userData.display_name)}`
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
          data-tooltip-content="Help"
        >
          help_outline
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
                <li></li>
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

      <Tooltip id="tooltip" />
    </>
  );
}

export default SideNavBar;
