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
        const slotsData = await getCalendar(); // Assuming getCalendar fetches the booked slots

        const formatTime = (date) => {
          let hours = date.getHours();
          const minutes = date.getMinutes().toString().padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          return `${hours}:${minutes} ${ampm}`;
        };

        const formattedAppointments = apptData.data.map((appt) => {
          const appointmentDate = new Date(appt.appointmentDate.seconds * 1000);
          return {
            start: appointmentDate,
            end: appointmentDate,
            title: `${formatTime(appointmentDate)} - ${appt.fullName}`,
            allDay: false,
            ...appt, // Include all appointment data
          };
        });

        const formattedBookedSlots = slotsData.map((slot) => {
          const appointmentDate = new Date(slot.appointmentDate.seconds * 1000);
          return {
            start: appointmentDate,
            end: appointmentDate,
            title: `${formatTime(appointmentDate)} - ${slot.fullName}`,
            allDay: false,
            ...slot, // Include all slot data
          };
        });

        setAppointments([...formattedAppointments, ...formattedBookedSlots]);
      } catch (error) {
        console.error("Error fetching appointments and slots:", error);
      }
    };

    fetchAppointmentsAndSlots();
  }, [statusFilter]); // Ensure effect runs on statusFilter changes

  const handleSelectEvent = (event) => {
    setSelectedAppointment(event);
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getFormattedDate = (timestamp, includeTime = false) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp.seconds * 1000);
    const options = { year: "numeric", month: "long", day: "numeric" };
    if (includeTime) {
      options.hour = "numeric";
      options.minute = "numeric";
      options.hour12 = true;
    }
    return date.toLocaleString("en-US", options);
  };

  const openImageModal = (url) => {
    window.open(url, "_blank");
  };

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
      <br />
      <h3>Appts. Calendar</h3>
        <div className="appointment-calendar">
          <Calendar
            localizer={localizer}
            events={appointments}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            onSelectEvent={handleSelectEvent}
            components={{
              event: ({ event }) => (
                <span>
                  <strong>{event.title}</strong>
                </span>
              ),
              month: {
                dateHeader: ({ date, label }) => (
                  <div>
                    <span>{label}</span>
                    {appointments.filter((appt) =>
                      moment(appt.start).isSame(date, "day")
                    ).length > 1 && (
                      <span style={{ color: "red", marginLeft: "5px" }}>
                        +
                        {appointments.filter((appt) =>
                          moment(appt.start).isSame(date, "day")
                        ).length - 1}{" "}
                        more
                      </span>
                    )}
                  </div>
                ),
              },
            }}
          />
        </div>
        {selectedAppointment && (
          <div className="client-eligibility">
            <div style={{ position: "relative" }}>
              <button
                onClick={handleCloseModal}
                className="close-button"
                style={{ position: "absolute", top: "15px", right: "15px" }}
              >
                ×
              </button>
            </div>
            <br />
            <h2>Appointment Details</h2>

            <section className="mb-4">
              <h3>
                <em>Basic Information</em>
              </h3>
              <p>
                <strong>Control Number:</strong> <br />
                {selectedAppointment.controlNumber}
              </p>
              <br />
              <p>
                <strong>Date Request Created:</strong> <br />
                {getFormattedDate(selectedAppointment.createdDate)}
              </p>
              <br />
              <p>
                <strong>Appointment Status:</strong> <br />
                {capitalizeFirstLetter(selectedAppointment.appointmentStatus)}
              </p>
              <br />
              {selectedAppointment.appointmentStatus !== "pending" && (
                <>
                  <p>
                    <strong>Appointment Date:</strong> <br />
                    {getFormattedDate(
                      selectedAppointment.appointmentDate,
                      true
                    )}
                  </p>
                  <br />
                  <p>
                    <strong>Eligibility:</strong> <br />
                    {capitalizeFirstLetter(
                      selectedAppointment.clientEligibility?.eligibility || "-"
                    )}
                  </p>

                  {selectedAppointment.appointmentStatus === "cancelled" && (
                    <p>
                      <strong>Denial Reason:</strong> <br />
                      {selectedAppointment.clientEligibility?.denialReason ||
                        "-"}
                    </p>
                  )}
                  <br />
                  <p>
                    <strong>Notes:</strong> <br />
                    {selectedAppointment.clientEligibility?.notes || "-"}
                  </p>
                  <br />
                  <p>
                    <strong>IBP Paralegal Staff:</strong> <br />
                    {selectedAppointment.clientEligibility?.ibpParalegalStaff ||
                      "-"}
                  </p>
                  <br />
                  <p>
                    <strong>Assisting Counsel:</strong> <br />
                    {selectedAppointment.clientEligibility?.assistingCounsel ||
                      "-"}
                  </p>
                  <br />
                  <p>
                    <strong>Reviewed By:</strong> <br />
                    {selectedAppointment.reviewer
                      ? `${selectedAppointment.reviewer.display_name} ${selectedAppointment.reviewer.middle_name} ${selectedAppointment.reviewer.last_name}`
                      : "Not Available"}
                  </p>
                  <br />
                  <p>
                    <strong>Appointment Experience Rating:</strong>
                    <br />{" "}
                    {selectedAppointment.appointmentDetails?.ratings ||
                      "-"}{" "}
                    Star/s Ratings
                  </p>
                </>
              )}
            </section>

            <section className="mb-4">
              <h3>
                <em>Applicant Profile</em>
              </h3>
              <p>
                <strong>Full Name:</strong> <br />
                {selectedAppointment.fullName}
              </p>
              <br />
              <p>
                <strong>Date of Birth:</strong> <br />
                {selectedAppointment.dob
                  ? new Date(selectedAppointment.dob).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : "N/A"}
              </p>
              <br />
              <p>
                <strong>Address:</strong> <br />
                {selectedAppointment.address || "Not Available"}
              </p>
              <br />
              <p>
                <strong>Contact Number:</strong> <br />
                {selectedAppointment.contactNumber || "Not Available"}
              </p>
              <br />
              <p>
                <strong>Gender:</strong> <br />
                {selectedAppointment.selectedGender || "Not Specified"}
              </p>
              <br />
              <p>
                <strong>Spouse Name:</strong> <br />
                {selectedAppointment.spouseName || "Not Available"}
              </p>
              <br />
              <p>
                <strong>Spouse Occupation:</strong> <br />
                {selectedAppointment.spouseOccupation || "Not Available"}
              </p>
              <br />
              <p>
                <strong>Children Names and Ages:</strong> <br />
                {selectedAppointment.childrenNamesAges || "Not Available"}
              </p>
              <br />
            </section>

            <section className="mb-4">
              <h3>
                <em>Employment Profile</em>
              </h3>
              <p>
                <strong>Occupation:</strong> <br />
                {selectedAppointment.occupation || "Not Available"}
              </p>
              <br />
              <p>
                <strong>Type of Employment:</strong> <br />
                {selectedAppointment.kindOfEmployment || "Not Specified"}
              </p>
              <br />
              <p>
                <strong>Employer Name:</strong> <br />
                {selectedAppointment.employerName || "Not Available"}
              </p>
              <br />
              <p>
                <strong>Employer Address:</strong> <br />
                {selectedAppointment.employerAddress || "Not Available"}
              </p>
              <br />
              <p>
                <strong>Monthly Income:</strong> <br />
                {selectedAppointment.monthlyIncome || "Not Available"}
              </p>
              <br />
            </section>

            <section className="mb-4">
              <h3>
                <em>Nature of Legal Assistance Requested</em>
              </h3>
              <p>
                <strong>Type of Legal Assistance:</strong> <br />
                {selectedAppointment.selectedAssistanceType || "Not Specified"}
              </p>
              <br />
              <p>
                <strong>Problem:</strong> <br />
                {selectedAppointment.problems || "Not Available"}
              </p>
              <br />
              <p>
                <strong>Reason for Problem:</strong> <br />
                {selectedAppointment.problemReason || "Not Available"}
              </p>
              <br />
              <p>
                <strong>Desired Solutions:</strong> <br />{" "}
                {selectedAppointment.desiredSolutions || "Not Available"}
              </p>
              <br />
            </section>

            <section>
              <h3>
                <em>Uploaded Images</em>
              </h3>
              <div className="mb-3">
                <p>
                  <strong>Barangay Certificate of Indigency:</strong>
                </p>
                {selectedAppointment.barangayImageUrl ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      openImageModal(selectedAppointment.barangayImageUrl);
                    }}
                  >
                    <img
                      src={selectedAppointment.barangayImageUrl}
                      alt="Barangay Certificate of Indigency"
                      className="img-thumbnail"
                      style={{ width: "100px", cursor: "pointer" }}
                    />
                  </a>
                ) : (
                  "Not Available"
                )}
              </div>
              <div className="mb-3">
                <p>
                  <strong>DSWD Certificate of Indigency:</strong>
                </p>
                {selectedAppointment.dswdImageUrl ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      openImageModal(selectedAppointment.dswdImageUrl);
                    }}
                  >
                    <img
                      src={selectedAppointment.dswdImageUrl}
                      alt="DSWD Certificate of Indigency"
                      className="img-thumbnail"
                      style={{ width: "100px", cursor: "pointer" }}
                    />
                  </a>
                ) : (
                  "Not Available"
                )}
              </div>
              <div className="mb-3">
                <p>
                  <strong>Disqualification Letter from PAO:</strong>
                </p>
                {selectedAppointment.paoImageUrl ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      openImageModal(selectedAppointment.paoImageUrl);
                    }}
                  >
                    <img
                      src={selectedAppointment.paoImageUrl}
                      alt="Disqualification Letter from PAO"
                      className="img-thumbnail"
                      style={{ width: "100px", cursor: "pointer" }}
                    />
                  </a>
                ) : (
                  "Not Available"
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApptsCalendar;
