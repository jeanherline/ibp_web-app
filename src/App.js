import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login/Login';
import Dashboard from './Components/Dashboard/Dashboard';
import Appointments from './Components/Appointments/Appointments'; 
import ApptsFrontDesk from './Components/Appointments/ApptsFrontDesk'; 
import ApptsLawyer from './Components/Appointments/ApptsLawyer'; 
import ApptsHead from './Components/Appointments/ApptsHead'; 
import WalkInForm from './Components/WalkInForm/WalkInForm'; 
import CalendarLawyer from './Components/Appointments/CalendarLawyer'; 
import ApptsCalendar from './Components/Appointments/ApptsCalendar';
import Profile from './Components/Profile/Profile';
import Users from './Components/Users/Users';
import Ratings from './Components/Ratings/Ratings';
import QRCodeScanner from './Components/QRCode/QRCodeScanner';
import AppointmentDetails from './Components/QRCode/AppointmentDetails';
import Welcome from './Components/QRCode/Welcome';
import AuditLogs from './Components/Audit/AuditLogs';
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
          <Route path="/walkin" element={<WalkInForm />} /> 
          <Route path="/frontdesk" element={<ApptsFrontDesk />} />
          <Route path="/head" element={<ApptsHead />} />
          <Route path="/calendarLawyer" element={<CalendarLawyer />} />
          <Route path="/lawyer" element={<ApptsLawyer />} />
          <Route path="/ratings" element={<Ratings />} />
          <Route path="/auditLogs" element={<AuditLogs />}/>
          <Route path="/appointment/:controlNumber" element={<AppointmentDetails />} /> {/* Fix route declaration */}
        </Routes>
    </Router>
  );
}

export default App;
