import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import QrScanner from 'react-qr-scanner';
import './QRCodeScanner.css';
import { auth } from "../../Config/Firebase";

function QRCodeScanner() {
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "/";
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera not supported on this device');
    } else {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          // Do nothing, just to prompt for camera permission
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(err => {
          setCameraError(true);
          setError('Camera permission denied');
        });
    }
  }, []);

  const handleScan = (data) => {
    if (data) {
      console.log('Scanned data:', data); // Log scanned data
      try {
        const url = new URL(data);
        console.log('Valid URL detected. Navigating to:', url.href);
        window.location.href = url.href; // Use window.location.href to navigate to the URL
      } catch (err) {
        setError('Invalid QR code');
        console.error('Error: Invalid QR code - not a valid URL. Scanned data:', data, 'Error:', err);
      }
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
    setError(`Error scanning QR code: ${err.message}`);
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/');
    }).catch((error) => {
      setError(`Error logging out: ${error.message}`);
    });
  };

  const previewStyle = {
    height: 240,
    width: 320,
  };

  const videoConstraints = {
    facingMode: 'environment', // Use the back camera if available
  };

  return (
    <div className="qr-code-scanner-container">
      <h2>Scan QR Code</h2>
      {error && <p className="error">{error}</p>}
      {cameraError ? (
        <p className="error">Camera permission is required to scan QR codes. Please enable camera access in your browser settings.</p>
      ) : (
        <QrScanner
          delay={300}
          style={previewStyle}
          onError={handleError}
          onScan={handleScan}
          videoConstraints={videoConstraints}
        />
      )}
      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default QRCodeScanner;
