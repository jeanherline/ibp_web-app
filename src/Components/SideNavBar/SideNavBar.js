import React, { useEffect } from "react";
import { useName } from "./NameContext";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { auth, doc, fs } from "../../Config/Firebase";
import { getDoc } from "firebase/firestore";
import "./SideNavBar.css";

function SideNavBar() {
  const { display_name, setName } = useName(); // Corrected from disply_name to display_name
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchNameTypeFromFirebase();
  }, []);

  const fetchNameTypeFromFirebase = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(fs, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          if (userData && userData.display_name) {
            const capitalizedNameType = capitalizeFirstLetter(userData.display_name);
            setName(capitalizedNameType);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching display name:", error);
    }
  };

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <div className="top-right-container">
        <div className="member-type">Kumusta, {display_name}</div>
        <span className="material-icons icon">help_outline</span>
        <span className="material-icons icon" onClick={handleLogout}>exit_to_app</span>
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
          <center><h1>IBP - Bulacan Chapter</h1></center>
        </div>
        <nav className="nav-menu">
          <ul>
            <li>
              <NavLink to="/lawyer_dashboard" className={({ isActive }) => isActive ? "active" : ""}>Dashboard</NavLink>
            </li>
            <li>
              <NavLink to="/appointments" className={({ isActive }) => isActive ? "active" : ""}>Appointments</NavLink>
            </li>
            <li>
              <NavLink to="/laws" className={({ isActive }) => isActive ? "active" : ""}>Laws</NavLink>
            </li>
            <li>
              <NavLink to="/feedbacks" className={({ isActive }) => isActive ? "active" : ""}>Feedbacks</NavLink>
            </li>
          </ul>
        </nav>
        <footer className="footer">
          <p>Copyright © 2024. All Rights Reserved</p>
        </footer>
      </div>
    </>
  );
}

export default SideNavBar;
