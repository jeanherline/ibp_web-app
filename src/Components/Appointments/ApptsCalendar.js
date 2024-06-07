import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getAppointments, getCalendar } from "../../Config/FirebaseServices"; // Assuming getCalendar is correctly named
import "./Appointments.css";

const localizer = momentLocalizer(moment);

function ApptsCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter] = useState("approved"); // Adjust the filter as necessary

  useEffect(() => {
    const fetchAppointmentsAndSlots = async () => {
      const apptData = await getAppointments(statusFilter, null, 50, "");
      const slotsData = await getCalendar();  // Assuming getCalendar fetches the booked slots
      const formattedAppointments = apptData.map((appt) => ({
        start: new Date(appt.appointmentDate),
        end: new Date(appt.appointmentDate),
        title: `${appt.fullName} - ${appt.contactNumber}`,
        allDay: false
      }));
      const formattedBookedSlots = slotsData.map(slot => {
        const timeString = new Date(slot.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        return {
          start: new Date(slot.appointmentDate),
          end: new Date(slot.appointmentDate),
          title: `${timeString} - ${slot.fullName}`, // Title includes time and full name
          allDay: false
        };
      });
      setAppointments([...formattedAppointments, ...formattedBookedSlots]);
    };

    fetchAppointmentsAndSlots();
  }, [statusFilter]);  // Ensure effect runs on statusFilter changes

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
        <div className="appointment-calendar">
          <Calendar
            localizer={localizer}
            events={appointments}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
          />
        </div>
      </div>
    </div>
  );
}

export default ApptsCalendar;
