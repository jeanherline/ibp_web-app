import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login/Login';
import Dashboard from './Components/Dashboard/Dashboard';
import Appointments from './Components/Appointments/Appointments'; 
import ApptsCalendar from './Components/Appointments/ApptsCalendar';
import Profile from './Components/Profile/Profile';// Ensure all used components are imported
import './App.css';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/apptsCalendar" element={<ApptsCalendar />} />
          <Route path="/profile" element={<Profile />} />
          {/* Ensure all routes are properly declared */}
        </Routes>
    </Router>
  );
}

export default App;
