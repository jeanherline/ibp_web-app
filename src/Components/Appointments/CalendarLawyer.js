import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  aptsLawyerCalendar,
  getLawyerCalendar,
} from "../../Config/FirebaseServices"; // Assuming getLawyerCalendar is correctly named
import "./Appointments.css";
import { auth, doc, fs, getDoc } from "../../Config/Firebase";
import ibpLogo from "../../Assets/img/ibp_logo.png";

const localizer = momentLocalizer(moment);

function CalendarLawyer() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null); // State to store the selected appointment details
  const [reviewerDetails, setReviewerDetails] = useState(null);
  const [statusFilters] = useState(["approved", "scheduled", "done"]);
  const [assignedLawyerDetails, setAssignedLawyerDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const fetchReviewerDetails = async (reviewerId) => {
    const reviewerRef = doc(fs, "users", reviewerId);
    const reviewerDoc = await getDoc(reviewerRef);
    if (reviewerDoc.exists()) {
      setReviewerDetails(reviewerDoc.data());
    } else {
      console.log("No such document!");
    }
  };

  const fetchAssignedLawyerDetails = async (lawyerId) => {
    const lawyerRef = doc(fs, "users", lawyerId);
    const lawyerDoc = await getDoc(lawyerRef);
    if (lawyerDoc.exists()) {
      setAssignedLawyerDetails(lawyerDoc.data());
    } else {
      console.log("No such document!");
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "/";
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedAppointment?.appointmentDetails?.reviewedBy) {
      fetchReviewerDetails(selectedAppointment.appointmentDetails.reviewedBy);
    }
  }, [selectedAppointment]);

  useEffect(() => {
    if (selectedAppointment?.appointmentDetails?.assignedLawyer) {
      fetchAssignedLawyerDetails(
        selectedAppointment.appointmentDetails.assignedLawyer
      );
    }
  }, [selectedAppointment]);

  useEffect(() => {
    const fetchAppointmentsAndSlots = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          window.location.href = "/";
          return;
        }

        const apptData = await aptsLawyerCalendar(
          statusFilters,
          null,
          50,
          "",
          user.uid
        );
        const slotsData = await getLawyerCalendar(user.uid);

        const formatTime = (date) => {
          let hours = date.getHours();
          const minutes = date.getMinutes().toString().padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12;
          hours = hours ? 12 : 12;
          return `${hours}:${minutes} ${ampm}`;
        };

        const formattedAppointments = apptData.data.map((appt) => {
          const appointmentDate = new Date(appt.appointmentDate.seconds * 1000);
          return {
            start: appointmentDate,
            end: appointmentDate,
            title: `${formatTime(appointmentDate)} - ${appt.fullName}`,
            allDay: false,
            appointmentStatus: appt.appointmentStatus, // Include appointmentStatus
            ...appt,
          };
        });

        const formattedBookedSlots = slotsData.map((slot) => {
          const appointmentDate = new Date(slot.appointmentDate.seconds * 1000);
          return {
            start: appointmentDate,
            end: appointmentDate,
            title: `${formatTime(appointmentDate)} - ${slot.fullName}`,
            allDay: false,
            appointmentStatus: "scheduled", // Include appointmentStatus
            ...slot,
          };
        });

        setAppointments([...formattedAppointments, ...formattedBookedSlots]);
      } catch (error) {
        console.error("Error fetching appointments and slots:", error);
      }
    };

    fetchAppointmentsAndSlots();
  }, [statusFilters]);

  const handlePrint = () => {
    if (!selectedAppointment) {
      alert("No appointment selected");
      return;
    }

    const printContents = document.getElementById(
      "appointment-details-section"
    ).innerHTML;

    // Exclude the uploaded images section from the print
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = printContents;
    const noPrintSection = tempDiv.querySelector(".no-print");
    if (noPrintSection) {
      noPrintSection.remove();
    }
    const modifiedPrintContents = tempDiv.innerHTML;

    const printWindow = window.open("", "", "height=500, width=500");
    printWindow.document.write(
      "<html><head><title>Appointment Details</title></head><body>"
    );
    printWindow.document.write("<style>");
    printWindow.document.write(`
      @media print {
        .page-break { page-break-before: always; }
        .print-section { page-break-inside: avoid; }
        .print-image { width: 100%; height: 100%; object-fit: cover; }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table, th, td {
          border: 1px solid black;
        }
        th, td {
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .section-title {
          color: #a34bc9;
          font-size: 16px;
        }
        .no-print {
          display: none;
        }
        .print-only {
          display: block;
        }
      }
    `);
    printWindow.document.write("</style>");
    printWindow.document.write(`
      <div style="text-align: center;">
        <img src="${ibpLogo}" alt="IBP Logo" style="width: 100px; display: block; margin: 0 auto;" />
        <h2>Integrated Bar of the Philippines - Malolos</h2>
        <img src="${selectedAppointment.appointmentDetails.qrCode}" alt="QR Code" style="width: 100px; display: block; margin: 0 auto;" />
      </div>
      <hr />
    `);
    printWindow.document.write(modifiedPrintContents);

    const images = document.querySelectorAll(".img-thumbnail");
    images.forEach((image) => {
      if (!image.classList.contains("qr-code-image")) {
        printWindow.document.write("<div class='page-break'></div>");
        printWindow.document.write(
          `<img src='${image.src}' class='print-image' />`
        );
      }
    });

    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
    printWindow.close();

    window.location.reload(); // Reload to ensure the app state is consistent
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectEvent = (event) => {
    setSelectedAppointment(event);
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };

  const capitalizeFirstLetter = (string) => {
    if (string && typeof string === "string") {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    return string; // Return the string as is if it's undefined or not a string
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
    setCurrentImageUrl(url);
    setIsModalOpen(true);
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
            <div id="appointment-details-section">
              <section className="mb-4 print-section">
                <h2>
                  <em style={{ color: "#a34bc9", fontSize: "16px" }}>
                    Basic Information
                  </em>
                </h2>
                <table className="table table-striped table-bordered">
                  <tbody>
                      <tr className="no-print">
                        <th>QR Code:</th>
                        <td>
                          {selectedAppointment.appointmentDetails ? (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openImageModal(
                                  selectedAppointment.appointmentDetails.qrCode
                                );
                              }}
                            >
                              <img
                                src={
                                  selectedAppointment.appointmentDetails.qrCode
                                }
                                alt="QR Code"
                                className="img-thumbnail qr-code-image"
                                style={{ width: "100px", cursor: "pointer" }}
                              />
                            </a>
                          ) : (
                            "Not Available"
                          )}
                        </td>
                      </tr>
                    <tr>
                      <th>Control Number:</th>
                      <td>{selectedAppointment.controlNumber}</td>
                    </tr>
                    <tr>
                      <th>Date Request Created:</th>
                      <td>
                        {getFormattedDate(selectedAppointment.createdDate)}
                      </td>
                    </tr>
                    <tr>
                      <th>Appointment Type:</th>
                      <td>
                        {selectedAppointment.appointmentDetails?.apptType ||
                          "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <th>Appointment Status:</th>
                      <td>
                        {capitalizeFirstLetter(
                          selectedAppointment.appointmentStatus
                        )}
                      </td>
                    </tr>
                    <>
                      {selectedAppointment.appointmentStatus ===
                        "scheduled" && (
                        <>
                          <tr>
                            <th>Appointment Date:</th>
                            <td>
                              {getFormattedDate(
                                selectedAppointment.appointmentDate,
                                true
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Reschedule Reason</th>
                            <td>
                              {capitalizeFirstLetter(
                                selectedAppointment.rescheduleReason
                              ) || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <th>Updated Date and Time:</th>
                            <td>
                              {getFormattedDate(
                                selectedAppointment.appointmentDetails
                                  ?.updatedTime,
                                true
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Eligibility:</th>
                            <td>
                              {capitalizeFirstLetter(
                                selectedAppointment.clientEligibility
                                  ?.eligibility || "N/A"
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Reviewed By:</th>
                            <td>
                              {reviewerDetails
                                ? `${reviewerDetails.display_name} ${
                                    reviewerDetails.middle_name || ""
                                  } ${reviewerDetails.last_name}`
                                : "Not Available"}
                            </td>
                          </tr>

                          <tr>
                            <th>Assigned Lawyer:</th>
                            <td>
                              {assignedLawyerDetails
                                ? `${assignedLawyerDetails.display_name} ${
                                    assignedLawyerDetails.middle_name || ""
                                  } ${assignedLawyerDetails.last_name}`
                                : "Not Available"}
                            </td>
                          </tr>

                          <tr>
                            <th>Eligibility Notes:</th>
                            <td>
                              {selectedAppointment.clientEligibility?.notes ||
                                "N/A"}
                            </td>
                          </tr>
                        </>
                      )}
                      {selectedAppointment.appointmentStatus === "denied" && (
                        <>
                          <tr>
                            <th>Reviewed By:</th>
                            <td>
                              {reviewerDetails
                                ? `${reviewerDetails.display_name} ${reviewerDetails.middle_name} ${reviewerDetails.last_name}`
                                : "Not Available"}
                            </td>
                          </tr>
                          <tr>
                            <th>Denial Reason:</th>
                            <td>
                              {selectedAppointment.clientEligibility
                                ?.denialReason || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <th>Eligibility Notes:</th>
                            <td>
                              {selectedAppointment.clientEligibility?.notes ||
                                "N/A"}
                            </td>
                          </tr>
                        </>
                      )}
                      {selectedAppointment.appointmentStatus === "done" && (
                        <>
                        <tr>
                              <th>Appointment Date:</th>
                              <td>
                                {getFormattedDate(
                                  selectedAppointment.appointmentDate,
                                  true
                                )}
                              </td>
                            </tr>
                          <tr>
                            <th>Reviewed By:</th>
                            <td>
                              {reviewerDetails
                                ? `${reviewerDetails.display_name} ${
                                    reviewerDetails.middle_name || ""
                                  } ${reviewerDetails.last_name}`
                                : "Not Available"}
                            </td>
                          </tr>

                          <tr>
                            <th>Assigned Lawyer:</th>
                            <td>
                              {assignedLawyerDetails
                                ? `${assignedLawyerDetails.display_name} ${
                                    assignedLawyerDetails.middle_name || ""
                                  } ${assignedLawyerDetails.last_name}`
                                : "Not Available"}
                            </td>
                          </tr>

                          <tr>
                            <th>Eligibility Notes:</th>
                            <td>
                              {selectedAppointment.clientEligibility?.notes ||
                                "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <th>Remarks (Record of Consultation):</th>
                            <td>
                              {selectedAppointment.appointmentDetails
                                ?.proceedingNotes || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <th>IBP Paralegal Staff:</th>
                            <td>
                              {selectedAppointment.clientEligibility
                                ?.ibpParalegalStaff || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <th>Assisting Counsel:</th>
                            <td>
                              {selectedAppointment.clientEligibility
                                ?.assistingCounsel || "N/A"}
                            </td>
                          </tr>
                        </>
                      )}
                      {selectedAppointment.appointmentStatus === "approved" && (
                        <>
                          <tr>
                            <th>Eligibility:</th>
                            <td>
                              {capitalizeFirstLetter(
                                selectedAppointment.clientEligibility
                                  ?.eligibility || "N/A"
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Reviewed By:</th>
                            <td>
                              {reviewerDetails
                                ? `${reviewerDetails.display_name} ${reviewerDetails.middle_name} ${reviewerDetails.last_name}`
                                : "Not Available"}
                            </td>
                          </tr>
                          <tr>
                            <th>Assigned Lawyer:</th>
                            <td>
                              {assignedLawyerDetails
                                ? `${assignedLawyerDetails.display_name} ${assignedLawyerDetails.middle_name} ${assignedLawyerDetails.last_name}`
                                : "Not Available"}
                            </td>
                          </tr>
                          <tr>
                            <th>Eligibility Notes:</th>
                            <td>
                              {selectedAppointment.clientEligibility?.notes ||
                                "N/A"}
                            </td>
                          </tr>
                        </>
                      )}
                    </>
                  </tbody>
                </table>
              </section>
              <section className="mb-4 print-section">
                <h2>
                  <em style={{ color: "#a34bc9", fontSize: "16px" }}>
                    Applicant Profile
                  </em>
                </h2>
                <table className="table table-striped table-bordered">
                  <tbody>
                    <tr>
                      <th>Full Name:</th>
                      <td>{selectedAppointment.fullName}</td>
                    </tr>
                    <tr>
                      <th>Date of Birth:</th>
                      <td>
                        {selectedAppointment.dob
                          ? new Date(
                              selectedAppointment.dob
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <th>Address:</th>
                      <td>{selectedAppointment?.address || "Not Available"}</td>
                    </tr>
                    <tr>
                      <th>Contact Number:</th>
                      <td>
                        {selectedAppointment?.contactNumber || "Not Available"}
                      </td>
                    </tr>
                      <>
                        <tr>
                          <th>Address:</th>
                          <td>
                            {selectedAppointment?.address || "Not Available"}
                          </td>
                        </tr>
                        <tr>
                          <th>Gender:</th>
                          <td>
                            {selectedAppointment?.selectedGender ||
                              "Not Specified"}
                          </td>
                        </tr>
                        <tr>
                          <th>Spouse Name:</th>
                          <td>
                            {selectedAppointment.spouseName || "Not Available"}
                          </td>
                        </tr>
                        <tr>
                          <th>Spouse Occupation:</th>
                          <td>
                            {selectedAppointment.spouseOccupation ||
                              "Not Available"}
                          </td>
                        </tr>
                        <tr>
                          <th>Children Names and Ages:</th>
                          <td>
                            {selectedAppointment.childrenNamesAges ||
                              "Not Available"}
                          </td>
                        </tr>
                      </>
                  </tbody>
                </table>
              </section>
                <section className="mb-4 print-section">
                  <h2>
                    <em
                      style={{
                        color: "#a34bc9",
                        fontSize: "16px",
                      }}
                    >
                      Employment Profile
                    </em>
                  </h2>
                  <table className="table table-striped table-bordered">
                    <tbody>
                      <tr>
                        <th>Occupation:</th>
                        <td>
                          {selectedAppointment.occupation || "Not Available"}
                        </td>
                      </tr>
                      <tr>
                        <th>Type of Employment:</th>
                        <td>
                          {selectedAppointment?.kindOfEmployment ||
                            "Not Specified"}
                        </td>
                      </tr>
                      <tr>
                        <th>Employer Name:</th>
                        <td>
                          {selectedAppointment?.employerName || "Not Available"}
                        </td>
                      </tr>
                      <tr>
                        <th>Employer Address:</th>
                        <td>
                          {selectedAppointment.employerAddress ||
                            "Not Available"}
                        </td>
                      </tr>
                      <tr>
                        <th>Monthly Income:</th>
                        <td>
                          {selectedAppointment.monthlyIncome || "Not Available"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              <section className="mb-4 print-section">
                <h2>
                  <em
                    style={{
                      color: "#a34bc9",
                      fontSize: "16px",
                    }}
                  >
                    Nature of Legal Assistance Requested
                  </em>
                </h2>
                <table className="table table-striped table-bordered">
                  <tbody>
                    <tr>
                      <th>Type of Legal Assistance:</th>
                      <td>
                        {selectedAppointment.selectedAssistanceType ||
                          "Not Specified"}
                      </td>
                    </tr>
                    {selectedAppointment.appointmentDetails?.apptType ===
                      "Online" && (
                      <>
                        <tr>
                          <th>Problem:</th>
                          <td>
                            {selectedAppointment.problems || "Not Available"}
                          </td>
                        </tr>
                        <tr>
                          <th>Reason for Problem:</th>
                          <td>
                            {selectedAppointment.problemReason ||
                              "Not Available"}
                          </td>
                        </tr>
                        <tr>
                          <th>Desired Solutions:</th>
                          <td>
                            {selectedAppointment.desiredSolutions ||
                              "Not Available"}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </section>

              <section className="mb-4 print-section no-print">
                <h2>
                  <em style={{ color: "#a34bc9", fontSize: "16px" }}>
                    Uploaded Images
                  </em>
                </h2>
                <table className="table table-striped table-bordered">
                  <tbody>
                    <tr>
                      <th>Barangay Certificate of Indigency:</th>
                      <td>
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
                      </td>
                    </tr>
                    <tr>
                      <th>DSWD Certificate of Indigency:</th>
                      <td>
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
                      </td>
                    </tr>
                    <tr>
                      <th>Disqualification Letter from PAO:</th>
                      <td>
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
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {isModalOpen && (
                <ImageModal
                  isOpen={isModalOpen}
                  url={currentImageUrl}
                  onClose={closeModal}
                />
              )}
            </div>
            <center>
              <button onClick={handlePrint} className="print-button">
                Print Document
              </button>
            </center>
          </div>
        )}
      </div>
    </div>
  );
}

const ImageModal = ({ isOpen, url, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="image-container">
          <img src={url} alt="Fullscreen Image" className="fullscreen-image" />
        </div>
        <button onClick={onClose} className="close-button">
          &times;
        </button>
      </div>
    </div>
  );
};

export default CalendarLawyer;
