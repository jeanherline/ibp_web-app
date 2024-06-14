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

        const formattedBookedSlots = slotsData.map(slot => ({
          start: new Date(slot.appointmentDate.seconds * 1000),
          end: new Date(slot.appointmentDate.seconds * 1000),
          title: `${slot.fullName} - ${slot.contactNumber}`,
          allDay: false,
          ...slot // Include all slot data
        }));

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
          <div className="client-eligibility">
            <div style={{ position: 'relative' }}>
              <button onClick={handleCloseModal} className="close-button" style={{ position: 'absolute', top: '15px', right: '15px' }}>×</button>
            </div>
            <br />
            <h2>Appointment Details</h2>

            <section className="mb-4">
              <h3>
                <em>Basic Information</em>
              </h3>
              <p>
                <strong>Control Number:</strong> <br></br>{" "}
                {selectedAppointment.controlNumber}
              </p>
              <br></br>
              <p>
                <strong>Date Request Created:</strong> <br></br>
                {getFormattedDate(selectedAppointment.createdDate)}
              </p>
              <br></br>
              <p>
                <strong>Appointment Status:</strong> <br></br>
                {capitalizeFirstLetter(selectedAppointment.appointmentStatus)}
              </p>
              <br></br>
              {selectedAppointment.appointmentStatus !== "pending" && (
                <>
                  <p>
                    <strong>Appointment Date:</strong> <br></br>
                    {getFormattedDate(
                      selectedAppointment.appointmentDate,
                      true
                    )}
                  </p>
                  <br></br>
                  <p>
                    <strong>Eligibility:</strong> <br></br>
                    {capitalizeFirstLetter(
                      selectedAppointment.clientEligibility?.eligibility || "-"
                    )}
                  </p>

                  {selectedAppointment.appointmentStatus === "cancelled" && (
                    <p>
                      <strong>Denial Reason:</strong> <br></br>
                      {selectedAppointment.clientEligibility?.denialReason ||
                        "-"}
                    </p>
                  )}
                  <br></br>
                  <p>
                    <strong>Notes:</strong> <br></br>
                    {selectedAppointment.clientEligibility?.notes || "-"}
                  </p>
                  <br></br>
                  <p>
                    <strong>IBP Paralegal Staff:</strong> <br></br>
                    {selectedAppointment.clientEligibility?.ibpParalegalStaff ||
                      "-"}
                  </p>
                  <br></br>
                  <p>
                    <strong>Assisting Counsel:</strong> <br></br>
                    {selectedAppointment.clientEligibility?.assistingCounsel ||
                      "-"}
                  </p>
                  <br></br>
                  <p>
                    <strong>Reviewed By:</strong> <br></br>
                    {selectedAppointment.reviewer
                      ? `${selectedAppointment.reviewer.display_name} ${selectedAppointment.reviewer.middle_name} ${selectedAppointment.reviewer.last_name}`
                      : "Not Available"}
                  </p>
                  <br></br>
                  <p>
                    <strong>Appointment Experience Rating:</strong>
                    <br></br>{" "}
                    {selectedAppointment.appointmentDetails?.feedbackRating ||
                      "-"}{" "}
                    Star/s Rating
                  </p>
                </>
              )}
            </section>

            <section className="mb-4">
              <h3>
                <em>Applicant Profile</em>
              </h3>
              <p>
                <strong>Full Name:</strong> <br></br>
                {selectedAppointment.fullName}
              </p>
              <br></br>
              <p>
                <strong>Date of Birth:</strong> <br></br>
                {selectedAppointment.dob
                  ? new Date(selectedAppointment.dob).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : "N/A"}
              </p>
              <br></br>
              <p>
                <strong>Address:</strong> <br></br>
                {selectedAppointment.address || "Not Available"}
              </p>
              <br></br>
              <p>
                <strong>Contact Number:</strong> <br></br>
                {selectedAppointment.contactNumber || "Not Available"}
              </p>
              <br></br>
              <p>
                <strong>Gender:</strong> <br></br>
                {selectedAppointment.selectedGender || "Not Specified"}
              </p>
              <br></br>
              <p>
                <strong>Spouse Name:</strong> <br></br>
                {selectedAppointment.spouseName || "Not Available"}
              </p>
              <br></br>
              <p>
                <strong>Spouse Occupation:</strong> <br></br>
                {selectedAppointment.spouseOccupation || "Not Available"}
              </p>
              <br></br>
              <p>
                <strong>Children Names and Ages:</strong> <br></br>
                {selectedAppointment.childrenNamesAges || "Not Available"}
              </p>
              <br></br>
            </section>

            <section className="mb-4">
              <h3>
                <em>Employment Profile</em>
              </h3>
              <p>
                <strong>Occupation:</strong> <br></br>
                {selectedAppointment.occupation || "Not Available"}
              </p>
              <br></br>
              <p>
                <strong>Type of Employment:</strong> <br></br>
                {selectedAppointment.kindOfEmployment || "Not Specified"}
              </p>
              <br></br>
              <p>
                <strong>Employer Name:</strong>
                <br></br> {selectedAppointment.employerName || "Not Available"}
              </p>
              <br></br>
              <p>
                <strong>Employer Address:</strong> <br></br>
                {selectedAppointment.employerAddress || "Not Available"}
              </p>
              <br></br>
              <p>
                <strong>Monthly Income:</strong> <br></br>
                {selectedAppointment.monthlyIncome || "Not Available"}
              </p>
              <br></br>
            </section>

            <section className="mb-4">
              <h3>
                <em>Nature of Legal Assistance Requested</em>
              </h3>
              <p>
                <strong>Type of Legal Assistance:</strong> <br></br>
                {selectedAppointment.selectedAssistanceType || "Not Specified"}
              </p>
              <br></br>
              <p>
                <strong>Problem:</strong> <br></br>
                {selectedAppointment.problems || "Not Available"}
              </p>
              <br></br>
              <p>
                <strong>Reason for Problem:</strong> <br></br>
                {selectedAppointment.problemReason || "Not Available"}
              </p>
              <br></br>
              <p>
                <strong>Desired Solutions:</strong>
                <br></br>{" "}
                {selectedAppointment.desiredSolutions || "Not Available"}
              </p>
              <br></br>
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
