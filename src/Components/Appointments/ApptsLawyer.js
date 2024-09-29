import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import "./Appointments.css";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Pagination from "react-bootstrap/Pagination";
import {
  getLawyerAppointments,
  updateAppointment,
  getBookedSlots,
  getUserById,
  getUsers,
} from "../../Config/FirebaseServices";
import { useAuth } from "../../AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fs, auth } from "../../Config/Firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { faEye, faCheck, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import ibpLogo from "../../Assets/img/ibp_logo.png";
import axios from "axios"; // Import axios for Google Meet API requests

function ApptsLawyer() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const pageSize = 7;
  const [clientAttend, setClientAttend] = useState(null);
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
  const [appointmentType, setAppointmentType] = useState(""); // New state for Appointment Type (In-person or Online)
  const [rescheduleAppointmentType, setRescheduleAppointmentType] = useState(""); // New state for rescheduled appointment type
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
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [natureOfLegalAssistanceFilter, setNatureOfLegalAssistanceFilter] = useState("all");
  const [totalFilteredItems, setTotalFilteredItems] = useState(0);
  const [lawyers, setLawyers] = useState([]);
  const [assignedLawyerDetails, setAssignedLawyerDetails] = useState(null);
  const [holidays, setHolidays] = useState([]);


  // Helper function to fetch holidays for a given year
  const fetchPhilippineHolidays = async (year) => {
    const apiKey = "Tg81da2wKkGUa2ESCULJSPpHitfrWmjF"; // Your Calendarific API key
    const country = "PH"; // Country code for the Philippines
    const url = `https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=${country}&year=${year}`;

    try {
      const response = await axios.get(url);
      const holidays = response.data.response.holidays;

      // Filter only public holidays
      return holidays
        .filter((holiday) => holiday.type.includes("National holiday"))
        .map((holiday) => new Date(holiday.date.iso));
    } catch (error) {
      console.error("Error fetching holidays from Calendarific:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadHolidays = async () => {
      const currentYear = new Date().getFullYear();
      const holidaysCurrentYear = await fetchPhilippineHolidays(currentYear);
      const holidaysNextYear = await fetchPhilippineHolidays(currentYear + 1);

      setHolidays([...holidaysCurrentYear, ...holidaysNextYear]);
    };

    loadHolidays();
  }, []);

  const handlePrint = () => {
    if (!selectedAppointment) {
      alert("No appointment selected");
      return;
    }
  
    // Get the contents of the appointment details section
    const printContents = document.getElementById("appointment-details-section").innerHTML;
  
    // Create a temporary div to modify the contents for printing
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = printContents;
  
    // Remove any elements you don't want to print (with class 'no-print')
    const noPrintSection = tempDiv.querySelectorAll(".no-print");
    noPrintSection.forEach((section) => section.remove());
  
    // Extract the modified contents
    const modifiedPrintContents = tempDiv.innerHTML;
  
    // Open a new window for printing
    const printWindow = window.open("", "", "height=500, width=500");
    printWindow.document.write("<html><head><title>Appointment Details</title></head><body>");
  
    // Add custom styles for the print layout
    printWindow.document.write("<style>");
    printWindow.document.write(`
      @media print {
        .page-break { page-break-before: always; }
        .print-section { page-break-inside: avoid; }
        .print-image { width: 100%; height: auto; object-fit: cover; }
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
  
    // Add the IBP logo and QR code to the print layout
    printWindow.document.write(`
      <div style="text-align: center;">
        <img src="${ibpLogo}" alt="IBP Logo" style="width: 100px; display: block; margin: 0 auto;" />
        <h2>Integrated Bar of the Philippines - Malolos</h2>
        ${selectedAppointment.appointmentDetails.qrCode ? 
          `<img src="${selectedAppointment.appointmentDetails.qrCode}" alt="QR Code" style="width: 100px; display: block; margin: 0 auto;" />` : ''}
      </div>
      <hr />
    `);
  
    // Insert the modified contents
    printWindow.document.write(modifiedPrintContents);
  
    // Include any relevant images for printing
    const images = document.querySelectorAll(".img-thumbnail");
    images.forEach((image) => {
      if (!image.classList.contains("qr-code-image")) {
        printWindow.document.write("<div class='page-break'></div>");
        printWindow.document.write(`<img src='${image.src}' class='print-image' />`);
      }
    });
  
    // Close and trigger the print dialog
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus(); // Focus the window to ensure it shows up
    printWindow.print(); // Trigger print
  
    // Close the print window after printing
    printWindow.onafterprint = () => printWindow.close();
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
    if (!currentUser) return;

    const fetchAppointments = async () => {
      const { data, total } = await getLawyerAppointments(
        filter,
        lastVisible,
        pageSize,
        searchText,
        natureOfLegalAssistanceFilter,
        currentUser
      );
      setAppointments(data);
      setTotalPages(Math.ceil(total / pageSize));
      setTotalFilteredItems(total);
    };
    fetchAppointments();
  }, [
    filter,
    lastVisible,
    searchText,
    natureOfLegalAssistanceFilter,
    currentUser,
  ]);

  useEffect(() => {
    const unsubscribe = getBookedSlots((slots) => {
      setBookedSlots(slots);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setSelectedAppointment(null);
    setShowProceedingNotesForm(false);
    setShowRescheduleForm(false);
    setShowScheduleForm(false);
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

  useEffect(() => {
    const fetchAssignedLawyerDetails = async (assignedLawyerId) => {
      if (assignedLawyerId) {
        const userData = await getUserById(assignedLawyerId);
        setAssignedLawyerDetails(userData);
      }
    };

    if (selectedAppointment?.appointmentDetails?.assignedLawyer) {
      fetchAssignedLawyerDetails(
        selectedAppointment.appointmentDetails.assignedLawyer
      );
    }
  }, [selectedAppointment]);

  useEffect(() => {
    const fetchLawyers = async () => {
      const { users } = await getUsers(
        "active",
        "lawyer",
        "all",
        "",
        null,
        100
      );
      setLawyers(users);
    };
    fetchLawyers();
  }, [clientEligibility.eligibility]);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
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

    // Check if the date is a holiday
    const isHoliday = holidays.some(
      (holiday) =>
        holiday.getFullYear() === date.getFullYear() &&
        holiday.getMonth() === date.getMonth() &&
        holiday.getDate() === date.getDate()
    );

    const isFullyBooked =
      bookedSlots.filter(
        (slot) =>
          slot.getDate() === date.getDate() &&
          slot.getMonth() === date.getMonth() &&
          slot.getFullYear() === date.getFullYear() &&
          slot.getHours() >= 13 &&
          slot.getHours() < 17
      ).length === 4;

    return !isHoliday && isWeekday(date) && date >= today && !isFullyBooked;
  };

  const filterTime = (time) => {
    if (!(time instanceof Date)) return false;
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const now = new Date();

    if (hours < 13 || hours >= 17 || time <= now) return false;

    const dateTime = new Date(appointmentDate);
    dateTime.setHours(hours, minutes, 0, 0);

    return !isSlotBookedByAssignedLawyer(dateTime);
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      const { data, lastDoc } = await getLawyerAppointments(
        filter,
        lastVisible,
        pageSize,
        searchText,
        natureOfLegalAssistanceFilter,
        currentUser
      );
      setAppointments(data);
      setLastVisible(lastDoc);
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevious = async () => {
    if (currentPage > 1) {
      const { data, firstDoc } = await getLawyerAppointments(
        filter,
        lastVisible,
        pageSize,
        searchText,
        natureOfLegalAssistanceFilter,
        currentUser,
        true
      );
      setAppointments(data);
      setLastVisible(firstDoc);
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleFirst = async () => {
    const { data, firstDoc } = await getLawyerAppointments(
      filter,
      null,
      pageSize,
      searchText,
      natureOfLegalAssistanceFilter,
      currentUser
    );
    setAppointments(data);
    setLastVisible(firstDoc);
    setCurrentPage(1);
  };

  const handleLast = async () => {
    const { data, lastDoc } = await getLawyerAppointments(
      filter,
      lastVisible,
      pageSize,
      searchText,
      natureOfLegalAssistanceFilter,
      currentUser,
      false,
      true
    );
    setAppointments(data);
    setLastVisible(lastDoc);
    setCurrentPage(totalPages);
  };

  const toggleDetails = (appointment) => {
    setSelectedAppointment(
      selectedAppointment?.id === appointment.id ? null : appointment
    );
    setShowProceedingNotesForm(false);
    setShowRescheduleForm(false);
    setShowScheduleForm(false);
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };

  const handleEligibilityChange = (e) => {
    setClientEligibility({ ...clientEligibility, eligibility: e.target.value });
    setAppointmentDate(null);
  };

  const openImageModal = (url) => {
    setCurrentImageUrl(url);
    setIsModalOpen(true);
  };

  // ImageModal Component Definition
  const ImageModal = ({ isOpen, url, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="image-container">
            <img
              src={url}
              alt="Fullscreen Image"
              className="fullscreen-image"
            />
          </div>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>
      </div>
    );
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

    let status = "pending";
    if (clientEligibility.eligibility === "yes") {
      status = "approved";
    } else if (clientEligibility.eligibility === "no") {
      status = "denied";
    }

    const updatedData = {
      "clientEligibility.eligibility": clientEligibility.eligibility,
      "clientEligibility.notes": clientEligibility.notes,
      "appointmentDetails.appointmentStatus": status,
      "appointmentDetails.assignedLawyer": clientEligibility.assistingCounsel,
      "clientEligibility.denialReason": clientEligibility.denialReason,
      "appointmentDetails.updatedTime": Timestamp.fromDate(new Date()),
    };

    await updateAppointment(selectedAppointment.id, updatedData);

    setSelectedAppointment(null);
    setClientEligibility({
      eligibility: "",
      denialReason: "",
      notes: "",
      ibpParalegalStaff: "",
      assistingCounsel: "",
    });
    setShowProceedingNotesForm(false);
    setShowRescheduleForm(false);
    setShowScheduleForm(false);

    const { data, total } = await getLawyerAppointments(
      filter,
      lastVisible,
      pageSize,
      searchText,
      natureOfLegalAssistanceFilter,
      currentUser
    );
    setAppointments(data);
    setTotalPages(Math.ceil(total / pageSize));

    setSnackbarMessage("Form has been successfully submitted.");
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const handleSubmitProceedingNotes = async (e) => {
    e.preventDefault();

    const updatedData = {
      "appointmentDetails.proceedingNotes": proceedingNotes,
      "appointmentDetails.ibpParalegalStaff":
        clientEligibility.ibpParalegalStaff,
      "appointmentDetails.assistingCounsel": clientEligibility.assistingCounsel,
      "appointmentDetails.appointmentStatus": "done",
      "appointmentDetails.updatedTime": Timestamp.fromDate(new Date()),
      "appointmentDetails.clientAttend": clientAttend,
    };

    await updateAppointment(selectedAppointment.id, updatedData);

    setSelectedAppointment(null);
    setProceedingNotes("");
    setShowProceedingNotesForm(false);

    const { data, total } = await getLawyerAppointments(
      filter,
      lastVisible,
      pageSize,
      searchText,
      natureOfLegalAssistanceFilter,
      currentUser
    );
    setAppointments(data);
    setTotalPages(Math.ceil(total / pageSize));

    const formattedDate = selectedAppointment.appointmentDetails.appointmentDate
      .toDate()
      .toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

    const statusMessage =
      clientAttend === "yes"
        ? `Your appointment with Ticket Number ${selectedAppointment.controlNumber} has been completed on ${formattedDate}.`
        : `You did not attend your appointment with Ticket Number ${selectedAppointment.controlNumber} scheduled on ${formattedDate}.`;

    if (selectedAppointment?.applicantProfile?.uid) {
      await addDoc(collection(fs, "notifications"), {
        uid: selectedAppointment.applicantProfile.uid,
        message: statusMessage,
        type: "appointment",
        read: false,
        timestamp: Timestamp.fromDate(new Date()),
      });
    } else {
      console.error("Applicant UID is undefined");
    }

    if (currentUser?.uid) {
      const lawyerMessage =
        clientAttend === "yes"
          ? `You have marked the appointment for Ticket Number ${selectedAppointment.controlNumber} as completed on ${formattedDate}.`
          : `You have marked the appointment for Ticket Number ${selectedAppointment.controlNumber} as not attended on ${formattedDate}.`;

      await addDoc(collection(fs, "notifications"), {
        uid: currentUser.uid,
        message: lawyerMessage,
        type: "appointment",
        read: false,
        timestamp: Timestamp.fromDate(new Date()),
      });
    } else {
      console.error("Current User UID is undefined");
    }

    setSnackbarMessage("Remarks have been successfully submitted.");
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!appointmentDate) {
      setSnackbarMessage("Appointment date is required.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
      return;
    }

    if (!appointmentType) {
      setSnackbarMessage("Please select appointment type.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
      return;
    }

    let googleMeetLink = null;

    if (appointmentType === 'online') {
      try {
        // Correct endpoint for the Firebase Cloud Function
        const response = await axios.post('https://api-4n4atauzwq-uc.a.run.app/create-google-meet', {
          appointmentDate: appointmentDate.toISOString(),
          clientEmail: selectedAppointment.applicantProfile?.email,
        });
        googleMeetLink = response.data.hangoutLink; // Capture the Google Meet link from the response
      } catch (error) {
        console.error('Error creating Google Meet event:', error.response?.data || error.message);
        setSnackbarMessage('Failed to create Google Meet event.');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
        return; // Exit if the Google Meet event creation fails
      }
    }

    // Continue with saving appointment details
    const updatedData = {
      "appointmentDetails.appointmentDate": Timestamp.fromDate(appointmentDate),
      "appointmentDetails.appointmentStatus": "scheduled",
      "appointmentDetails.apptType": appointmentType,
      ...(googleMeetLink && {
        "appointmentDetails.googleMeetLink": googleMeetLink, // Add Google Meet link if applicable
      }),
    };

    await updateAppointment(selectedAppointment.id, updatedData);

    setSnackbarMessage('Appointment has been successfully scheduled.');
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };
  
  
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();

    if (!rescheduleDate) {
      setSnackbarMessage("Reschedule date is required.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
      return;
    }

    if (!rescheduleAppointmentType) {
      setSnackbarMessage("Please select appointment type.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
      return;
    }

    let googleMeetLink = selectedAppointment.appointmentDetails?.googleMeetLink || null;

    if (rescheduleAppointmentType === "online" && !googleMeetLink) {
      try {
        // Correct endpoint for the Firebase Cloud Function
        const response = await axios.post('https://api-4n4atauzwq-uc.a.run.app/create-google-meet', {
          appointmentDate: rescheduleDate.toISOString(),
          clientEmail: selectedAppointment.applicantProfile?.email,
        });
        googleMeetLink = response.data.hangoutLink; // Capture the Google Meet link from the response
      } catch (error) {
        console.error("Error creating Google Meet event:", error.response?.data || error.message);
        setSnackbarMessage("Failed to create Google Meet event.");
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
        return; // Exit if the Google Meet event creation fails
      }
    }

    // Continue with updating the rescheduled appointment details
    const updatedData = {
      "appointmentDetails.appointmentDate": Timestamp.fromDate(rescheduleDate),
      "appointmentDetails.rescheduleReason": rescheduleReason,
      "appointmentDetails.updatedTime": Timestamp.fromDate(new Date()),
      "appointmentDetails.apptType": rescheduleAppointmentType,
      ...(googleMeetLink && { "appointmentDetails.googleMeetLink": googleMeetLink }),
    };

    await updateAppointment(selectedAppointment.id, updatedData);

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

    const isAssignedToCurrentLawyer = appointments.some(
      (appointment) =>
        appointment.assignedLawyer === currentUser.uid &&
        appointment.appointmentDate.toDate().toDateString() ===
          date.toDateString()
    );

    return isFullyBooked || isAssignedToCurrentLawyer
      ? "fully-booked-day disabled-day"
      : "";
  };

  const getTimeClassName = (time) => {
    const dateTime = new Date(appointmentDate);
    dateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
  
    const hours = time.getHours();
  
    // Hide times outside of 1:00 PM to 4:00 PM
    if (hours < 13 || hours > 16) {
      return "hidden-time"; // Apply the hidden-time class to hide these times
    }
  
    // Keep current logic for checking booked slots
    if (isSlotBookedByAssignedLawyer(dateTime)) {
      return "booked-time disabled-time"; // Apply class for booked slots
    }
  
    return "";
  };
  

  const filterRescheduleTime = (time) => {
    if (!(time instanceof Date)) return false;
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const now = new Date();

    if (hours < 13 || hours >= 17 || time <= now) return false;

    const dateTime = new Date(rescheduleDate);
    dateTime.setHours(hours, minutes, 0, 0);

    return !isSlotBookedByAssignedLawyer(dateTime);
  };

  const isSlotBookedByAssignedLawyer = (dateTime) => {
    return appointments.some((appointment) => {
      const appointmentDate = appointment.appointmentDetails?.appointmentDate;
      const assignedLawyer = appointment.appointmentDetails?.assignedLawyer;
      return (
        assignedLawyer ===
          selectedAppointment?.appointmentDetails?.assignedLawyer &&
        appointmentDate?.toDate().getTime() === dateTime.getTime()
      );
    });
  };

  const isSlotBookedByCurrentUser = (dateTime) => {
    return bookedSlots.some(
      (slot) =>
        slot.getDate() === dateTime.getDate() &&
        slot.getMonth() === dateTime.getMonth() &&
        slot.getFullYear() === dateTime.getFullYear() &&
        slot.getHours() === dateTime.getHours() &&
        slot.getMinutes() === dateTime.getMinutes() &&
        slot.assignedLawyer === currentUser.uid
    );
  };

  const getTimeRescheduleClassName = (time) => {
    const dateTime = new Date(rescheduleDate);
    dateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

    if (isSlotBookedByAssignedLawyer(dateTime)) {
      return "booked-time disabled-time";
    }

    return "";
  };

  const resetFilters = () => {
    setFilter("all");
    setSearchText("");
    setNatureOfLegalAssistanceFilter("all");
    setLastVisible(null);
    setCurrentPage(1);
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {props.title}
    </Tooltip>
  );

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
          <option value="all">Status</option>
          <option value="approved">Approved</option>
          <option value="scheduled">Scheduled</option>
          <option value="denied">Denied</option>
          <option value="done">Done</option>
        </select>
        &nbsp;&nbsp;
        <select
          onChange={(e) => setNatureOfLegalAssistanceFilter(e.target.value)}
          value={natureOfLegalAssistanceFilter}
        >
          <option value="all">Nature of Legal Assistance</option>
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
              <th>Legal Assistance</th>
              <th>Scheduled Date</th>
              <th>Type</th>
              <th>Status</th>
              <th>Link</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.map((appointment, index) => (
                <tr key={appointment.id}>
                  <td>{(currentPage - 1) * pageSize + index + 1}.</td>
                  <td>{appointment.controlNumber}</td>
                  <td>{appointment.fullName}</td>
                  <td>{appointment.selectedAssistanceType}</td>
                  <td>{getFormattedDate(appointment.appointmentDate, true)}</td>
                  <td>{appointment.appointmentDetails?.apptType}</td>
                  <td>
                    {capitalizeFirstLetter(appointment.appointmentStatus)}
                  </td>
                  <td>
                    {/* Show the Google Meet link if the appointment is online */}
                    {appointment.appointmentDetails?.apptType === "online" &&
                    appointment.appointmentDetails?.googleMeetLink ? (
                      <>
                        <a
                          href={appointment.appointmentDetails.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Join Google Meet
                        </a>
                      </>
                    ) : (
                      "N/A"
                    )}
                  </td>
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
                    {appointment.appointmentStatus === "approved" && (
                      <>
                        <OverlayTrigger
                          placement="top"
                          overlay={renderTooltip({ title: "Schedule" })}
                        >
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowProceedingNotesForm(false);
                              setShowRescheduleForm(false);
                              setShowScheduleForm(true);
                            }}
                            style={{
                              backgroundColor: "#1DB954",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              cursor: "pointer",
                            }}
                          >
                            <FontAwesomeIcon icon={faCalendarAlt} />
                          </button>
                        </OverlayTrigger>
                        &nbsp; &nbsp;
                        <OverlayTrigger
                          placement="top"
                          overlay={renderTooltip({ title: "Done" })}
                        >
                          <button
                            disabled
                            style={{
                              backgroundColor: "gray",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              cursor: "not-allowed",
                            }}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        </OverlayTrigger>
                      </>
                    )}
                    {appointment.appointmentStatus === "scheduled" && (
                      <>
                        <OverlayTrigger
                          placement="top"
                          overlay={renderTooltip({ title: "Reschedule" })}
                        >
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowProceedingNotesForm(false);
                              setShowRescheduleForm(true);
                              setShowScheduleForm(false);
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
                        </OverlayTrigger>
                        &nbsp; &nbsp;
                        <OverlayTrigger
                          placement="top"
                          overlay={renderTooltip({ title: "Done" })}
                        >
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowProceedingNotesForm(true);
                              setShowRescheduleForm(false);
                              setShowScheduleForm(false);
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
                        </OverlayTrigger>
                      </>
                    )}
                    {(appointment.appointmentStatus === "pending" ||
                      appointment.appointmentStatus === "done" ||
                      appointment.appointmentStatus === "denied") && (
                      <>
                        <OverlayTrigger
                          placement="top"
                          overlay={renderTooltip({ title: "Schedule" })}
                        >
                          <button
                            disabled
                            style={{
                              backgroundColor: "gray",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              cursor: "not-allowed",
                            }}
                          >
                            <FontAwesomeIcon icon={faCalendarAlt} />
                          </button>
                        </OverlayTrigger>
                        &nbsp; &nbsp;
                        <OverlayTrigger
                          placement="top"
                          overlay={renderTooltip({ title: "Done" })}
                        >
                          <button
                            disabled
                            style={{
                              backgroundColor: "gray",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              cursor: "not-allowed",
                            }}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        </OverlayTrigger>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No results found.
                </td>
              </tr>
            )}
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
          !showProceedingNotesForm &&
          !showRescheduleForm &&
          (!showScheduleForm ||
            selectedAppointment.appointmentStatus !== "approved") && (
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
                      {selectedAppointment.appointmentDetails
                        ?.appointmentType === "online" && (
                        <tr>
                          <th>Google Meet Link:</th>
                          <td>
                            <a
                              href={
                                selectedAppointment.appointmentDetails
                                  ?.googleMeetLink
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Join Google Meet
                            </a>
                          </td>
                        </tr>
                      )}
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
                              <th>Eligibility:</th>
                              <td>
                                {capitalizeFirstLetter(
                                  selectedAppointment.clientEligibility
                                    ?.eligibility || "N/A"
                                )}
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
                          </>
                        )}
                        {selectedAppointment.appointmentStatus === "denied" && (
                          <>
                            <tr>
                              <th>Assigned Lawyer:</th>
                              <td>
                                {assignedLawyerDetails
                                  ? `${assignedLawyerDetails.display_name} ${assignedLawyerDetails.middle_name} ${assignedLawyerDetails.last_name}`
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
                              <th>Eligibility:</th>
                              <td>
                                {capitalizeFirstLetter(
                                  selectedAppointment.clientEligibility
                                    ?.eligibility || "N/A"
                                )}
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
                        {selectedAppointment.appointmentStatus ===
                          "approved" && (
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
                    <em
                      style={{
                        color: "#a34bc9",
                        fontSize: "16px",
                      }}
                    >
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
                        <th>Contact Number:</th>
                        <td>
                          {selectedAppointment?.contactNumber ||
                            "Not Available"}
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
                      <tr>
                        <th>DSWD Certificate of Indigency:</th>
                        <td>
                          {selectedAppointment.dswdImageUrl ? (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openImageModal(
                                  selectedAppointment.dswdImageUrl
                                );
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
                  No, the client is DISQUALIFIED/DENIED
                </label>
                <br />
                <br />
                {clientEligibility.eligibility === "yes" && (
                  <div>
                    <b>
                      <label>Assign a Lawyer: *</label>
                    </b>
                    <select
                      name="assistingCounsel"
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a Lawyer</option>
                      {lawyers.map((lawyer) => (
                        <option key={lawyer.uid} value={lawyer.uid}>
                          {`${lawyer.display_name} ${lawyer.middle_name} ${lawyer.last_name}`}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    required
                  ></textarea>
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
            <h2>Remarks</h2>
            <form onSubmit={handleSubmitProceedingNotes}>
              <div>
                <b>
                  <label>Did the client attend the appointment? *</label>
                </b>
                <label>
                  <input
                    type="radio"
                    name="clientAttend"
                    value="yes"
                    onChange={(e) => setClientAttend(e.target.value)}
                    required
                  />{" "}
                  Yes
                </label>
                <br />
                <label>
                  <input
                    type="radio"
                    name="clientAttend"
                    value="no"
                    onChange={(e) => setClientAttend(e.target.value)}
                    required
                  />{" "}
                  No
                </label>
              </div>
              <br />
              <div>
                <b>
                  <label>Record of Consultation *</label>
                </b>
                <textarea
                  name="proceedingNotes"
                  rows="4"
                  placeholder="Enter proceeding notes here..."
                  value={proceedingNotes}
                  onChange={handleNotesChange}
                  required
                ></textarea>
              </div>
              <br />
              <div>
                <b>
                  <label>IBP Paralegal/Staff:</label>
                </b>
                <input
                  type="text"
                  name="ibpParalegalStaff"
                  placeholder="Enter name here..."
                  value={clientEligibility.ibpParalegalStaff}
                  onChange={handleChange}
                />
                <b>
                  <label>Assisting Counsel:</label>
                </b>
                <input
                  type="text"
                  name="assistingCounsel"
                  placeholder="Enter name here..."
                  value={clientEligibility.assistingCounsel}
                  onChange={handleChange}
                />
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
              {getFormattedDate(
                selectedAppointment.appointmentDetails.appointmentDate,
                true
              )}
            </p>
            <form onSubmit={handleRescheduleSubmit}>
              <div>
                <b>
                  <label>Reason for Reschedule: *</label>
                </b>
                <textarea
                  name="rescheduleReason"
                  rows="4"
                  placeholder="Enter reason for reschedule..."
                  value={rescheduleReason}
                  onChange={handleRescheduleChange}
                  required
                ></textarea>
              </div>
              <div>
                <b>
                  <label>Reschedule Date and Time: *</label>
                </b>
                <br />
                <ReactDatePicker
                  selected={rescheduleDate}
                  onChange={(date) => setRescheduleDate(date)}
                  showTimeSelect
                  filterDate={(date) => filterDate(date) && date > new Date()}
                  filterTime={(time) => filterRescheduleTime(time)}
                  dateFormat="MM/dd/yy h:mm aa"
                  inline
                  timeIntervals={60}
                  minTime={new Date(new Date().setHours(13, 0, 0))}
                  maxTime={new Date(new Date().setHours(17, 0, 0))}
                  dayClassName={(date) => getDayClassName(date)}
                  timeClassName={(time) => getTimeRescheduleClassName(time)}
                />
              </div>
              <br />
              <div>
                <b>
                  <label>Type of Rescheduled Appointment *</label>
                </b>
                <select
                  name="rescheduleAppointmentType"
                  value={rescheduleAppointmentType}
                  onChange={(e) => setRescheduleAppointmentType(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select Type
                  </option>
                  <option value="in-person">In-person Consultation</option>
                  <option value="online">Online Video Consultation</option>
                </select>
              </div>
              <br />
              <button>Submit</button>
            </form>
          </div>
        )}
        {selectedAppointment && showScheduleForm && (
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
            <h2>Schedule Appointment</h2>
            <form onSubmit={handleScheduleSubmit}>
              <div>
                <b>
                  <label>Appointment Date and Time: *</label>
                </b>
                <br />
                <ReactDatePicker
                  selected={rescheduleDate}
                  onChange={(date) => setRescheduleDate(date)}
                  showTimeSelect
                  filterDate={(date) => filterDate(date) && date > new Date()}
                  filterTime={(time) => filterRescheduleTime(time)}
                  dateFormat="MM/dd/yy h:mm aa"
                  inline
                  timeIntervals={60} // Set to 60 minutes for 1-hour intervals
                  minTime={new Date(new Date().setHours(13, 0, 0))} // Starting from 1:00 PM
                  maxTime={new Date(new Date().setHours(17, 0, 0))} // Ending at 5:00 PM
                  dayClassName={(date) => getDayClassName(date)}
                  timeClassName={(time) => getTimeRescheduleClassName(time)}
                />
              </div>
              <br />
              <div>
                <b>
                  <label>Type of Appointment *</label>
                </b>
                <select
                  name="appointmentType"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select Type
                  </option>
                  <option value="in-person">In-person Consultation</option>
                  <option value="online">Online Video Consultation</option>
                </select>
              </div>
              <br />
              <button>Submit</button>
            </form>
          </div>
        )}
        <br />
        {showSnackbar && (
          <div className="snackbar">
            <p>{snackbarMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApptsLawyer;