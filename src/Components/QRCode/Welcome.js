import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import './Welcome.css';
import ibpLogo from '../../Assets/img/ibp_logo.png'; // Adjust the path to your IBP logo
import { auth } from "../../Config/Firebase";
function Welcome() {
  const navigate = useNavigate();

  const handleScanQRCode = () => {
    navigate('/scanner');
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "/";
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="welcome-container">
      <div className="logo-container">
        <img src={ibpLogo} alt="IBP Logo" className="logo" />
      </div>
      <h2>Welcome to the Front Desk</h2>
      <button onClick={handleScanQRCode} className="scan-button">Scan QR Code</button>
    </div>
  );
}

export default Welcome;
