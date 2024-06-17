import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "./Profile.css";
import { auth } from "../../Config/Firebase";

function Profile() {
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
        <div className="profile">
         
        </div>
      </div>
    </div>
  );
}

export default Profile;
