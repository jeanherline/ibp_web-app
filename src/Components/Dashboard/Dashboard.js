import SideNavBar from '../SideNavBar/SideNavBar'; // Corrected path
import './Dashboard.css';
import { auth } from "../../Config/Firebase";
import React, { useEffect } from "react";

function Dashboard() {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "/";
      }
    });

    return () => unsubscribe();
  }, []);
  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
        {/* Main content goes here */}
      </div>
    </div>
  );
}

export default Dashboard;
