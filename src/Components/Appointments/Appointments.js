import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import "./Appointments.css";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Pagination from "react-bootstrap/Pagination";
import {
  getAppointments,
  updateAppointment,
  getBookedSlots,
  getUserById,
} from "../../Config/FirebaseServices";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "../../AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { auth } from "../../Config/Firebase";
import {
  faEye,
  faCheck,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const pageSize = 10;
  const [clientEligibility, setClientEligibility] = useState({
    eligibility: "",
    denialReason: "",
    notes: "",
    ibpParalegalStaff: "",
    assistingCounsel: "",
  });
  const [appointmentDate, setAppointmentDate] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const { currentUser } = useAuth();
  const [reviewerDetails, setReviewerDetails] = useState(null);
  const [proceedingNotes, setProceedingNotes] = useState("");
  const [showProceedingNotesForm, setShowProceedingNotesForm] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [natureOfLegalAssistanceFilter, setNatureOfLegalAssistanceFilter] =
    useState("all");
  const [totalFilteredItems, setTotalFilteredItems] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "/";
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, total } = await getAppointments(
        filter,
        lastVisible,
        pageSize,
        searchText,
        natureOfLegalAssistanceFilter
      );
      setAppointments(data);
      setTotalPages(Math.ceil(total / pageSize));
      setTotalFilteredItems(total);
    };
    fetchAppointments();
  }, [filter, lastVisible, searchText, natureOfLegalAssistanceFilter]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      const data = await getBookedSlots();
      setBookedSlots(data.map((slot) => new Date(slot)));
    };
    fetchBookedSlots();
  }, []);

  useEffect(() => {
    setSelectedAppointment(null);
    setShowProceedingNotesForm(false);
    setShowRescheduleForm(false);
  }, [filter]);

  useEffect(() => {
    const fetchReviewerDetails = async (reviewedBy) => {
      if (reviewedBy) {
        const userData = await getUserById(reviewedBy);
        setReviewerDetails(userData);
      }
    };

    if (selectedAppointment?.appointmentDetails?.reviewedBy) {
      fetchReviewerDetails(selectedAppointment.appointmentDetails.reviewedBy);
    }
  }, [selectedAppointment]);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const isWeekday = (date) => {
    const day = date.getDay();
    return day === 2 || day === 4;
  };

  const isSlotBooked = (dateTime) => {
    return bookedSlots.some(
      (bookedDate) =>
        dateTime.getDate() === bookedDate.getDate() &&
        dateTime.getMonth() === bookedDate.getMonth() &&
        dateTime.getFullYear() === bookedDate.getFullYear() &&
        dateTime.getHours() === bookedDate.getHours() &&
        dateTime.getMinutes() === bookedDate.getMinutes()
    );
  };

  const filterDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isFullyBooked =
      bookedSlots.filter(
        (slot) =>
          slot.getDate() === date.getDate() &&
          slot.getMonth() === date.getMonth() &&
          slot.getFullYear() === date.getFullYear() &&
          slot.getHours() >= 13 &&
          slot.getHours() < 17
      ).length === 4;
    return isWeekday(date) && date >= today && !isFullyBooked;
  };

  const filterTime = (time) => {
    if (!(time instanceof Date)) return false;
    const hours = time.getHours();
    const minutes = time.getMinutes();

    if (hours < 13 || hours >= 17) return false;

    const dateTime = new Date(appointmentDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return !isSlotBooked(dateTime);
  };

  const handleNext = () => {
    setLastVisible(appointments[appointments.length - 1]);
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePrevious = () => {
    setLastVisible(appointments[0]);
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleFirst = () => {
    setLastVisible(null);
    setCurrentPage(1);
  };

  const handleLast = () => {
    setLastVisible(appointments[appointments.length - 1]);
    setCurrentPage(totalPages);
  };

  const toggleDetails = (appointment) => {
    setSelectedAppointment(
      selectedAppointment?.id === appointment.id ? null : appointment
    );
    setShowProceedingNotesForm(false);
    setShowRescheduleForm(false);
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };

  const handleEligibilityChange = (e) => {
    setClientEligibility({ ...clientEligibility, eligibility: e.target.value });
    setAppointmentDate(null);
  };

  const openImageModal = (url) => {
    window.open(url, "_blank");
  };

  const handleDenialReasonChange = (e) => {
    const value = e.target.value;
    const denialReasonMap = {
      meansTest:
        "Persons who do not pass the means and merit test (sec. 5 of the Revised Manual of Operations of the NCLA)",
      alreadyRepresented:
        "Parties already represented by a counsel de parte (sec. 5 of the Revised Manual of Operations of the NCLA)",
    };
    setClientEligibility({
      ...clientEligibility,
      denialReason: denialReasonMap[value],
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientEligibility({ ...clientEligibility, [name]: value });
  };

  const handleNotesChange = (e) => {
    setProceedingNotes(e.target.value);
  };

  const handleRescheduleChange = (e) => {
    setRescheduleReason(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const status =
      clientEligibility.eligibility === "yes"
        ? "approved"
        : clientEligibility.eligibility === "no"
        ? "denied"
        : "done";

    const updatedData = {
      clientEligibility,
      "appointmentDetails.appointmentDate": Timestamp.fromDate(appointmentDate),
      "appointmentDetails.appointmentStatus": status,
      "appointmentDetails.reviewedBy": currentUser.uid,
    };

    if (status === "done") {
      updatedData["appointmentDetails.proceedingNotes"] = proceedingNotes;
    }

    await updateAppointment(selectedAppointment.id, updatedData);

    setSelectedAppointment(null);
    setClientEligibility({
      eligibility: "",
      denialReason: "",
      notes: "",
      ibpParalegalStaff: "",
      assistingCounsel: "",
    });
    setProceedingNotes("");
    setShowProceedingNotesForm(false);
    setShowRescheduleForm(false);

    const { data, total } = await getAppointments(
      filter,
      lastVisible,
      pageSize,
      searchText
    );
    setAppointments(data);
    setTotalPages(Math.ceil(total / pageSize));

    setSnackbarMessage("Form has been successfully submitted.");
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();

    const updatedData = {
      "appointmentDetails.appointmentDate": Timestamp.fromDate(rescheduleDate),
      "appointmentDetails.rescheduleReason": rescheduleReason,
      "appointmentDetails.reviewedBy": currentUser.uid,
    };

    await updateAppointment(selectedAppointment.id, updatedData);

    setSelectedAppointment(null);
    setRescheduleDate(null);
    setRescheduleReason("");
    setShowRescheduleForm(false);

    const { data, total } = await getAppointments(
      filter,
      lastVisible,
      pageSize,
      searchText
    );
    setAppointments(data);
    setTotalPages(Math.ceil(total / pageSize));

    setSnackbarMessage("Appointment has been successfully rescheduled.");
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
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

  const getDayClassName = (date) => {
    const isFullyBooked =
      bookedSlots.filter(
        (slot) =>
          slot.getDate() === date.getDate() &&
          slot.getMonth() === date.getMonth() &&
          slot.getFullYear() === date.getFullYear() &&
          slot.getHours() >= 13 &&
          slot.getHours() < 17
      ).length === 4;
    return isFullyBooked ? "fully-booked-day disabled-day" : "";
  };

  const getTimeClassName = (time) => {
    const dateTime = new Date(appointmentDate);
    dateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return isSlotBooked(dateTime) ? "booked-time" : "";
  };

  const resetFilters = () => {
    setFilter("all");
    setSearchText("");
    setNatureOfLegalAssistanceFilter("all");
    setLastVisible(null);
    setCurrentPage(1);
  };

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
        <br />
        <h3>Appointments</h3>
        <br />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search..."
        />
        &nbsp;&nbsp;
        <select onChange={(e) => setFilter(e.target.value)} value={filter}>
          <option value="all" disabled>
            Status
          </option>{" "}
          {/* Updated from "" to "all" */}
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="done">Done</option>
        </select>
        &nbsp;&nbsp;
        <select
          onChange={(e) => setNatureOfLegalAssistanceFilter(e.target.value)}
          value={natureOfLegalAssistanceFilter}
        >
          <option value="all" disabled>
            Nature of Legal Assistance
          </option>
          <option value="Payong Legal (Legal Advice)">
            Payong Legal (Legal Advice)
          </option>
          <option value="Legal na Representasyon (Legal Representation)">
            Legal na Representasyon (Legal Representation)
          </option>
          <option value="Pag gawa ng Legal na Dokumento (Drafting of Legal Document)">
            Pag gawa ng Legal na Dokumento (Drafting of Legal Document)
          </option>
        </select>
        &nbsp;&nbsp;
        <button onClick={resetFilters}>Reset Filters</button>
        <br />
        <p>Total Filtered Items: {totalFilteredItems}</p>
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>Control Number</th>
              <th>Full Name</th>
              <th>Nature of Legal Assistance Requested</th>
              <th>Date Submitted</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment, index) => (
              <tr key={appointment.id}>
                <td>{(currentPage - 1) * pageSize + index + 1}.</td>
                <td>{appointment.controlNumber}</td>
                <td>{appointment.fullName}</td>
                <td>{appointment.selectedAssistanceType}</td>
                <td>{getFormattedDate(appointment.createdDate)}</td>
                <td>{capitalizeFirstLetter(appointment.appointmentStatus)}</td>
                <td>
                  <button
                    onClick={() => toggleDetails(appointment)}
                    style={{
                      backgroundColor: "#4267B2",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  &nbsp; &nbsp;
                  {filter === "approved" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowProceedingNotesForm(true);
                          setShowRescheduleForm(false);
                        }}
                        style={{
                          backgroundColor: "#1DB954",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                        }}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      &nbsp; &nbsp;
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowProceedingNotesForm(false);
                          setShowRescheduleForm(true);
                        }}
                        style={{
                          backgroundColor: "#ff8b61",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                        }}
                      >
                        <FontAwesomeIcon icon={faCalendarAlt} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination>
          <Pagination.First
            onClick={handleFirst}
            disabled={currentPage === 1}
          />
          <Pagination.Prev
            onClick={handlePrevious}
            disabled={currentPage === 1}
          />
          {[...Array(totalPages).keys()].map((_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => {
                setCurrentPage(index + 1);
                setLastVisible(appointments[index]);
              }}
            >
              {index + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next
            onClick={handleNext}
            disabled={currentPage === totalPages}
          />
          <Pagination.Last
            onClick={handleLast}
            disabled={currentPage === totalPages}
          />
        </Pagination>
        {selectedAppointment &&
          selectedAppointment.appointmentStatus !== "done" &&
          !showProceedingNotesForm &&
          !showRescheduleForm && (
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
                <h2>
                  <em
                    style={{
                      color: "#a34bc9",
                      fontSize: "16px",
                    }}
                  >
                    Basic Information
                  </em>
                </h2>
                <p></p>
                <table>
                  <th>
                    <p>
                      <strong>Control Number:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td> {selectedAppointment.controlNumber}</td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Appointment Type:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {" "}
                      {selectedAppointment.appointmentDetails?.apptType || "-"}
                    </td>
                  </tr>
                </table>
                <p></p>
                <table>
                  <th>
                    <p>
                      <strong>Date Request Created:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {" "}
                      {getFormattedDate(selectedAppointment.createdDate)}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Appointment Status:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {" "}
                      {capitalizeFirstLetter(
                        selectedAppointment.appointmentStatus
                      )}
                    </td>
                  </tr>
                </table>
                {selectedAppointment.appointmentStatus !== "pending" && (
                  <>
                    <table>
                      <th>
                        <p>
                          <strong>Appointment Date:</strong>{" "}
                        </p>
                      </th>
                      <tr>
                        <td>
                          {getFormattedDate(
                            selectedAppointment.appointmentDate,
                            true
                          )}
                        </td>
                      </tr>
                    </table>
                    <table>
                      <th>
                        <p>
                          <strong>Eligibility:</strong>{" "}
                        </p>
                      </th>
                      <tr>
                        <td>
                          {capitalizeFirstLetter(
                            selectedAppointment.clientEligibility
                              ?.eligibility || "-"
                          )}
                        </td>
                      </tr>
                    </table>
                    {selectedAppointment.appointmentStatus === "denied" && (
                      <table>
                        <th>
                          <p>
                            <strong>Denial Reason:</strong>{" "}
                          </p>
                        </th>
                        <tr>
                          <td>
                            {selectedAppointment.clientEligibility
                              ?.denialReason || "-"}
                          </td>
                        </tr>
                      </table>
                    )}
                    <table>
                      <th>
                        <p>
                          <strong>Notes:</strong>{" "}
                        </p>
                      </th>
                      <tr>
                        <td>
                          {selectedAppointment.clientEligibility?.notes || "-"}
                        </td>
                      </tr>
                    </table>
                    <table>
                      <th>
                        <p>
                          <strong>IBP Paralegal Staff:</strong>{" "}
                        </p>
                      </th>
                      <tr>
                        <td>
                          {selectedAppointment.clientEligibility
                            ?.ibpParalegalStaff || "-"}
                        </td>
                      </tr>
                    </table>
                    <table>
                      <th>
                        <p>
                          <strong>Assisting Counsel:</strong>{" "}
                        </p>
                      </th>
                      <tr>
                        <td>
                          {selectedAppointment.clientEligibility
                            ?.assistingCounsel || "-"}
                        </td>
                      </tr>
                    </table>
                    <table>
                      <th>
                        <p>
                          <strong>Reviewed By:</strong>{" "}
                        </p>
                      </th>
                      <tr>
                        <td>
                          {reviewerDetails
                            ? `${reviewerDetails.display_name} ${reviewerDetails.middle_name} ${reviewerDetails.last_name}`
                            : "Not Available"}
                        </td>
                      </tr>
                    </table>
                    <table>
                      <th>
                        <p>
                          <strong>Appointment Experience Rating:</strong>{" "}
                        </p>
                      </th>
                      <tr>
                        <td>
                          {" "}
                          {selectedAppointment.appointmentDetails?.ratings ||
                            "-"}{" "}
                          Star/s Ratings
                        </td>
                      </tr>
                    </table>
                  </>
                )}
              </section>

              <section className="mb-4">
                <h2>
                  <em
                    style={{
                      color: "#a34bc9",
                      fontSize: "16px",
                    }}
                  >
                    Applicant Profile
                  </em>
                </h2>
                <table>
                  <th>
                    <p>
                      <strong>Full Name:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>{selectedAppointment.fullName}</td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Date of Birth:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment.dob
                        ? new Date(selectedAppointment.dob).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )
                        : "N/A"}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Address:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>{selectedAppointment?.address || "Not Available"}</td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Contact Number:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment?.contactNumber || "Not Available"}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Gender:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment?.selectedGender || "Not Specified"}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Spouse Name:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>{selectedAppointment.spouseName || "Not Available"}</td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Spouse Occupation:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment.spouseOccupation || "Not Available"}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Children Names and Ages:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment.childrenNamesAges || "Not Available"}
                    </td>
                  </tr>
                </table>
              </section>

              <section className="mb-4">
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
                <table>
                  <th>
                    <p>
                      <strong>Occupation:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>{selectedAppointment.occupation || "Not Available"}</td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Type of Employment:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment?.kindOfEmployment || "Not Specified"}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Employer Name:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment?.employerName || "Not Available"}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Employer Address:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment.employerAddress || "Not Available"}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Monthly Income:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment.monthlyIncome || "Not Available"}
                    </td>
                  </tr>
                </table>
              </section>

              <section className="mb-4">
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
                <table>
                  <th>
                    <p>
                      <strong>Type of Legal Assistance:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment.selectedAssistanceType ||
                        "Not Specified"}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Problem:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>{selectedAppointment.problems || "Not Available"}</td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Reason for Problem:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment.problemReason || "Not Available"}
                    </td>
                  </tr>
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Desired Solutions:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment.desiredSolutions || "Not Available"}
                    </td>
                  </tr>
                </table>
              </section>
              <section>
                <h2>
                  <em
                    style={{
                      color: "#a34bc9",
                      fontSize: "16px",
                    }}
                  >
                    Uploaded Images
                  </em>
                </h2>

                <table>
                  <th>
                    <p>
                      <strong>Barangay Certificate of Indigency:</strong>{" "}
                    </p>
                  </th>
                  <tr>
                    <td>
                      {selectedAppointment.barangayImageUrl ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            openImageModal(
                              selectedAppointment.barangayImageUrl
                            );
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
                </table>
                <table>
                  <th>
                    <p>
                      <strong>DSWD Certificate of Indigency:</strong>{" "}
                    </p>
                  </th>
                  <tr>
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
                </table>
                <table>
                  <th>
                    <p>
                      <strong>Disqualification Letter from PAO:</strong>{" "}
                    </p>
                  </th>
                  <tr>
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
          )}
        <br />
        <br />
        {selectedAppointment &&
          selectedAppointment.appointmentStatus === "pending" && (
            <div className="client-eligibility">
              <h2>Client's Eligibility</h2>
              <form onSubmit={handleSubmit}>
                <b>
                  <p>Is the client eligible?</p>
                </b>
                <label>
                  <input
                    type="radio"
                    name="eligibility"
                    value="yes"
                    onChange={handleEligibilityChange}
                    required
                  />{" "}
                  Yes, the client is Eligible
                </label>
                <br />
                <label>
                  <input
                    type="radio"
                    name="eligibility"
                    value="no"
                    onChange={handleEligibilityChange}
                    required
                  />{" "}
                  No, the client MAY BE DISQUALIFIED/DENIED, subject to further
                  assessment by the volunteer legal aid lawyer
                </label>
                <br />
                <br />
                {clientEligibility.eligibility === "yes" && (
                  <ReactDatePicker
                    selected={appointmentDate}
                    onChange={(date) => setAppointmentDate(date)}
                    showTimeSelect
                    filterDate={filterDate}
                    filterTime={filterTime}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    inline
                    timeIntervals={15}
                    minTime={new Date(new Date().setHours(13, 0, 0))}
                    maxTime={new Date(new Date().setHours(17, 0, 0))}
                    dayClassName={getDayClassName}
                    timeClassName={getTimeClassName}
                  />
                )}
                {clientEligibility.eligibility === "no" && (
                  <div>
                    <b>
                      <p>If Disqualified/Denied:</p>
                    </b>
                    <em>
                      <p>
                        Please select the reason for the possible
                        Denial/Disqualification of the Client
                      </p>
                    </em>
                    <label>
                      <input
                        type="radio"
                        name="denialReason"
                        value="meansTest"
                        onChange={handleDenialReasonChange}
                        required
                      />{" "}
                      Persons who do not pass the means and merit test (sec. 5
                      of the Revised Manual of Operations of the NCLA)
                    </label>
                    <br />
                    <br />
                    <label>
                      <input
                        type="radio"
                        name="denialReason"
                        value="alreadyRepresented"
                        onChange={handleDenialReasonChange}
                        required
                      />{" "}
                      Parties already represented by a counsel de parte (sec. 5
                      of the Revised Manual of Operations of the NCLA)
                    </label>
                  </div>
                )}
                <br />
                <div>
                  <b>
                    <label>Notes:</label>
                  </b>
                  <textarea
                    name="notes"
                    rows="4"
                    placeholder="Enter any relevant notes here..."
                    value={clientEligibility.notes}
                    onChange={handleChange}
                  ></textarea>
                </div>
                <div>
                  <b>
                    <label>IBP Paralegal/Staff: *</label>
                  </b>
                  <input
                    type="text"
                    name="ibpParalegalStaff"
                    placeholder="Enter name here..."
                    value={clientEligibility.ibpParalegalStaff}
                    onChange={handleChange}
                    required
                  />
                  <b>
                    <label>Assisting Counsel: *</label>
                  </b>
                  <input
                    type="text"
                    name="assistingCounsel"
                    placeholder="Enter name here..."
                    value={clientEligibility.assistingCounsel}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button>Submit</button>
              </form>
            </div>
          )}
        {selectedAppointment && showProceedingNotesForm && (
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
            <h2>Proceeding Notes</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <b>
                  <label>Proceeding Notes:</label>
                </b>
                <textarea
                  name="proceedingNotes"
                  rows="4"
                  placeholder="Enter proceeding notes here..."
                  value={proceedingNotes}
                  onChange={handleNotesChange}
                ></textarea>
              </div>
              <button>Submit</button>
            </form>
          </div>
        )}
        {selectedAppointment && showRescheduleForm && (
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
            <h2>Reschedule Appointment</h2>
            <p>
              <strong>Current Appointment Date:</strong> <br></br>
              {getFormattedDate(selectedAppointment.appointmentDate, true)}
            </p>
            <form onSubmit={handleRescheduleSubmit}>
              <div>
                <ReactDatePicker
                  selected={appointmentDate}
                  onChange={(date) => setAppointmentDate(date)}
                  showTimeSelect
                  filterDate={filterDate}
                  filterTime={filterTime}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  inline
                  timeIntervals={15}
                  minTime={new Date(new Date().setHours(13, 0, 0))}
                  maxTime={new Date(new Date().setHours(17, 0, 0))}
                  dayClassName={getDayClassName}
                  timeClassName={getTimeClassName}
                />
              </div>
              <div>
                <b>
                  <label>Reason for Reschedule:</label>
                </b>
                <textarea
                  name="rescheduleReason"
                  rows="4"
                  placeholder="Enter reason for reschedule here..."
                  value={rescheduleReason}
                  onChange={handleRescheduleChange}
                ></textarea>
              </div>
              <button>Submit</button>
            </form>
          </div>
        )}
        {showSnackbar && <div className="snackbar">{snackbarMessage}</div>}
      </div>
    </div>
  );
}

const ImageModal = ({ isOpen, url, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt="Fullscreen Image" className="fullscreen-image" />
        <button onClick={onClose} className="close-button">
          &times;
        </button>
      </div>
    </div>
  );
};

export default Appointments;
