import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login/Login';
import LawyerDashboard from './Components/Dashboard/LawyerDashboard';
import Appointments from './Components/Appointments/Appointments'; // Ensure all used components are imported
import { NameProvider } from './Components/SideNavBar/NameContext';
import './App.css';

function App() {
  return (
    <Router>
      <NameProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/lawyer_dashboard" element={<LawyerDashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          {/* Ensure all routes are properly declared */}
        </Routes>
      </NameProvider>
    </Router>
  );
}

export default App;
