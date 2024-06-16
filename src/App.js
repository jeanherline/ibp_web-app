import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login/Login';
import Dashboard from './Components/Dashboard/Dashboard';
import Appointments from './Components/Appointments/Appointments'; 
import ApptsCalendar from './Components/Appointments/ApptsCalendar';
import Profile from './Components/Profile/Profile';
import Users from './Components/Users/Users';
import QRCodeScanner from './Components/QRCode/QRCodeScanner';
import AppointmentDetails from './Components/QRCode/AppointmentDetails';
import Welcome from './Components/QRCode/Welcome';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/apptsCalendar" element={<ApptsCalendar />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scanner" element={<QRCodeScanner />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/users" element={<Users />} />
          <Route path="/appointment/:controlNumber" element={<AppointmentDetails />} /> {/* Fix route declaration */}
        </Routes>
    </Router>
  );
}

export default App;
