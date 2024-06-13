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
  const [selectedAppointment, setSelectedAppointment] = useState(null); // State to store the selected appointment details
  const [statusFilter] = useState("approved" || "done"); // Adjust the filter as necessary

  useEffect(() => {
    const fetchAppointmentsAndSlots = async () => {
      try {
        const apptData = await getAppointments(statusFilter, null, 50, "");
        const slotsData = await getCalendar();  // Assuming getCalendar fetches the booked slots

        const formattedAppointments = apptData.data.map((appt) => ({
          start: new Date(appt.appointmentDate.seconds * 1000),
          end: new Date(appt.appointmentDate.seconds * 1000),
          title: `${appt.fullName} - ${appt.contactNumber}`,
          allDay: false,
          ...appt // Include all appointment data
        }));

        const formattedBookedSlots = slotsData.map(slot => {
          const timeString = new Date(slot.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          return {
            ...slot // Include all slot data
          };
        });

        setAppointments([...formattedAppointments, ...formattedBookedSlots]);
      } catch (error) {
        console.error("Error fetching appointments and slots:", error);
      }
    };

    fetchAppointmentsAndSlots();
  }, [statusFilter]);  // Ensure effect runs on statusFilter changes

  const handleSelectEvent = (event) => {
    setSelectedAppointment(event);
  };

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
            onSelectEvent={handleSelectEvent}
          />
        </div>
        {selectedAppointment && (
          <div className="appointment-details">
            <h3>Appointment Details</h3>
            <p><strong>Full Name:</strong> {selectedAppointment.fullName}</p>
            <p><strong>Contact Number:</strong> {selectedAppointment.contactNumber}</p>
            <p><strong>Appointment Date:</strong> {new Date(selectedAppointment.appointmentDate).toLocaleString()}</p>
            <p><strong>Appointment Status:</strong> {selectedAppointment.appointmentStatus}</p>
            {/* Add any other relevant appointment details here */}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApptsCalendar;
