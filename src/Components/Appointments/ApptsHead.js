import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import "./Appointments.css";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Pagination from "react-bootstrap/Pagination";
import {
  getAdminAppointments,
  updateAppointment,
  getBookedSlots,
  getUserById,
  getUsers,
  sendNotification,
  getHeadLawyerUid,
  getAppointments,
} from "../../Config/FirebaseServices";
import { useAuth } from "../../AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  addDoc,
  collection,
  getFirestore,
  Timestamp,
} from "firebase/firestore";
import { fs, auth } from "../../Config/Firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  faEye,
  faCheck,
  faCalendarAlt,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import ibpLogo from "../../Assets/img/ibp_logo.png";

function ApptsHead() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const pageSize = 7;
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
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [natureOfLegalAssistanceFilter, setNatureOfLegalAssistanceFilter] =
    useState("all");
  const [totalFilteredItems, setTotalFilteredItems] = useState(0);
  const [lawyers, setLawyers] = useState([]);
  const [assignedLawyerDetails, setAssignedLawyerDetails] = useState(null);
  const [isRescheduleHistoryOpen, setIsRescheduleHistoryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proceedingFile, setProceedingFile] = useState(null);
  const [clientAttend, setClientAttend] = useState(null);

  const toggleRescheduleHistory = () => {
    setIsRescheduleHistoryOpen((prevState) => !prevState);
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
      // Fetch a large number of appointments instead of null for the limit
      const { data, total } = await getAdminAppointments(
        filter,
        null, // No lastVisible, fetch all appointments
        1000, // Set a large limit instead of null
        searchText,
        natureOfLegalAssistanceFilter,
        currentUser
      );

      // Sort appointments to have pending first
      const sortedAppointments = data.sort((a, b) => {
        if (
          a.appointmentStatus === "pending" &&
          b.appointmentStatus !== "pending"
        ) {
          return -1; // "pending" comes first
        }
        if (
          a.appointmentStatus !== "pending" &&
          b.appointmentStatus === "pending"
        ) {
          return 1; // "pending" comes first
        }
        return 0; // Keep order for other statuses
      });

      // Set total pages based on sorted data and pageSize
      const paginatedAppointments = sortedAppointments.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      );

      setAppointments(paginatedAppointments);
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
    currentPage, // Make sure it re-fetches when page changes
  ]);

  const handlePrint = () => {
    if (!selectedAppointment) {
      alert("No appointment selected");
      return;
    }

    // Get the contents of the appointment details section
    const printContents = document.getElementById(
      "appointment-details-section"
    ).innerHTML;

    // Create a temporary div to modify the contents for printing
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = printContents;

    // Remove any elements you don't want to print (with class 'no-print')
    const noPrintSection = tempDiv.querySelectorAll(".no-print");
    noPrintSection.forEach((section) => section.remove());

    const modifiedPrintContents = tempDiv.innerHTML;

    // Open a new window for printing
    const printWindow = window.open("", "", "height=500, width=500");
    printWindow.document.write(
      "<html><head><title>Appointment Details</title></head><body>"
    );

    // Add modern, professional styles for printing
    printWindow.document.write("<style>");
    printWindow.document.write(`
      @media print {
        @page {
          size: A4;
          margin: 0.8in;
        }
        body {
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h2 {
          font-size: 18px;
          font-weight: normal;
          color: #333;
          margin-bottom: 5px;
        }
        .header img {
          width: 60px;
          display: block;
          margin: 0 auto;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          margin-top: 30px;
          margin-bottom: 10px;
          color: #555;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12px;
          color: #333;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f7f7f7;
          font-weight: normal;
          font-size: 12px;
          text-transform: uppercase;
          color: #555;
        }
        td {
          font-size: 12px;
          color: #333;
        }
        .form-label {
          font-size: 12px;
          font-weight: bold;
          margin-top: 15px;
          color: #333;
        }
        .form-field {
          font-size: 12px;
          padding: 5px 0;
          border-bottom: 1px solid #ddd;
          color: #555;
        }
        .print-image {
          width: 100%;
          height: auto;
          max-height: 10in;
          object-fit: contain;
          display: block;
          margin-bottom: 10px;
        }
        .no-print {
          display: none;
        }
        /* Modern table style */
        table thead {
          background-color: #f9f9f9;
        }
        table th {
          letter-spacing: 1px;
        }
        table tbody tr:nth-child(even) {
          background-color: #f5f5f5;
        }
        /* Add a page break before Employment Profile section */
        .employment-profile {
          page-break-before: always; /* Forces a page break before this section */
        }
      }
    `);
    printWindow.document.write("</style>");

    // Add the IBP logo and QR code to the print layout
    printWindow.document.write(`
      <div class="header">
        <img src="${ibpLogo}" alt="IBP Logo" />
        <h2>Integrated Bar of the Philippines - Malolos</h2>
        ${
          selectedAppointment.appointmentDetails.qrCode
            ? `<img src="${selectedAppointment.appointmentDetails.qrCode}" alt="QR Code" style="width: 60px; margin: 0 auto;" />`
            : ""
        }
      </div>
    `);

    // Insert the modified contents
    printWindow.document.write(modifiedPrintContents);

    // Handle image printing with modern margins and scaling
    const images = document.querySelectorAll(".img-thumbnail");
    images.forEach((image) => {
      if (!image.classList.contains("qr-code-image")) {
        printWindow.document.write("<div class='page-break'></div>");
        printWindow.document.write(
          `<img src='${image.src}' class='print-image' />`
        );
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
    const now = new Date();

    if (hours < 13 || hours >= 17 || time <= now) return false;

    const dateTime = new Date(appointmentDate);
    dateTime.setHours(hours, minutes, 0, 0);

    // Check if the time slot is booked by the assigned lawyer (selected appointment)
    return !isSlotBookedByAssignedLawyer(dateTime);
  };

  const isTimeSlotAssignedToCurrentLawyer = (dateTime) => {
    return appointments.some(
      (appointment) =>
        appointment.assignedLawyer === currentUser.uid &&
        appointment.appointmentDate.toDate().getTime() === dateTime.getTime()
    );
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      const { data, lastDoc } = await getAdminAppointments(
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
      const { data, firstDoc } = await getAdminAppointments(
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
    const { data, firstDoc } = await getAdminAppointments(
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
    const { data, lastDoc } = await getAdminAppointments(
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

    if (!selectedAppointment) {
      console.error("Selected appointment is not available.");
      alert("Selected appointment is not available.");
      return;
    }

    console.log("Selected Appointment:", selectedAppointment);

    if (!selectedAppointment.uid) {
      console.error("Applicant UID is not available.", selectedAppointment);
      alert("Applicant UID is not available.");
      return;
    }

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

    // Notify the user
    const userMessage =
      clientEligibility.eligibility === "yes"
        ? `Your appointment with Ticket Number ${selectedAppointment.controlNumber} has been approved. Please wait for the specific date of appointment.`
        : `Your appointment with Ticket Number ${selectedAppointment.controlNumber} has been denied. Reason: ${clientEligibility.denialReason}.`;

    await addDoc(collection(fs, "notifications"), {
      uid: selectedAppointment.uid,
      message: userMessage,
      type: "appointment",
      read: false,
      timestamp: Timestamp.fromDate(new Date()),
    });

    // Notify the assigned lawyer
    if (
      clientEligibility.eligibility === "yes" &&
      clientEligibility.assistingCounsel
    ) {
      const lawyerMessage = `An appointment request with Ticket Number ${selectedAppointment.controlNumber} has been approved. Please schedule the appointment for the client assigned to you.`;

      await addDoc(collection(fs, "notifications"), {
        uid: clientEligibility.assistingCounsel,
        message: lawyerMessage,
        type: "appointment",
        read: false,
        timestamp: Timestamp.fromDate(new Date()),
      });
    }

    // Notify the current authenticated user
    const authUserMessage =
      clientEligibility.eligibility === "yes"
        ? `You have successfully approved the appointment request with Ticket Number ${selectedAppointment.controlNumber}.`
        : `You have successfully denied the appointment request with Ticket Number ${selectedAppointment.controlNumber}.`;

    await addDoc(collection(fs, "notifications"), {
      uid: currentUser.uid,
      message: authUserMessage,
      type: "appointment",
      read: false,
      timestamp: Timestamp.fromDate(new Date()),
    });

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

    const { data, total } = await getAdminAppointments(
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

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let fileUrl = null;

      // Check if a file is selected and upload it to Firebase Storage
      if (proceedingFile) {
        const currentUid = currentUser.uid; // Current user's UID
        const controlNumber = selectedAppointment.controlNumber; // Get control number from selected appointment
        const fullName = selectedAppointment.fullName.replace(/ /g, "_"); // Replace spaces with underscores in full name

        // Get Firebase storage reference
        const storage = getStorage(); // Initialize Firebase Storage
        const fileRef = ref(
          storage,
          `konsulta_user_uploads/${currentUid}/${controlNumber}/${fullName}_${controlNumber}_proceedingNotesFile`
        );

        // Upload the file
        await uploadBytes(fileRef, proceedingFile);
        fileUrl = await getDownloadURL(fileRef); // Get the download URL after upload
      }

      // Update appointment data in Firestore
      const updatedData = {
        "appointmentDetails.proceedingNotes": proceedingNotes,
        "appointmentDetails.ibpParalegalStaff":
          clientEligibility.ibpParalegalStaff,
        "appointmentDetails.assistingCounsel":
          clientEligibility.assistingCounsel,
        "appointmentDetails.appointmentStatus": "done",
        "appointmentDetails.updatedTime": Timestamp.fromDate(new Date()),
        "appointmentDetails.clientAttend": clientAttend,
        "appointmentDetails.proceedingFileUrl": fileUrl, // Save the file URL (if uploaded)
      };

      // Update the appointment document in Firestore with the proceeding notes and file URL
      await updateAppointment(selectedAppointment.id, updatedData);

      // Notify success and reset form values
      setSnackbarMessage("Remarks have been successfully submitted.");
      setProceedingNotes(""); // Reset proceeding notes
      setProceedingFile(null); // Reset file input
      setClientAttend(null);
      setClientEligibility({
        ...clientEligibility,
        ibpParalegalStaff: "",
        assistingCounsel: "",
      });

      // Send notifications as needed
      const clientFullName = selectedAppointment.fullName;
      const appointmentId = selectedAppointment.id;

      await sendNotification(
        `Your appointment (ID: ${appointmentId}) has been marked as done.`,
        selectedAppointment.uid,
        "appointment",
        selectedAppointment.controlNumber
      );

      if (assignedLawyerDetails?.uid) {
        await sendNotification(
          `You have successfully marked the appointment (ID: ${appointmentId}) for ${clientFullName} as done.`,
          assignedLawyerDetails.uid,
          "appointment",
          selectedAppointment.controlNumber
        );
      }

      const headLawyerUid = await getHeadLawyerUid();
      if (headLawyerUid) {
        await sendNotification(
          `The appointment (ID: ${appointmentId}) for ${clientFullName} has been marked as done.`,
          headLawyerUid,
          "appointment",
          selectedAppointment.controlNumber
        );
      }

      // Optionally close the form/modal after successful submission
      setShowProceedingNotesForm(false);
    } catch (error) {
      setSnackbarMessage("Error submitting remarks, please try again.");
    } finally {
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
      setIsSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!appointmentDate) {
      setSnackbarMessage("Appointment date is required.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
      return;
    }

    const updatedData = {
      "appointmentDetails.appointmentDate": Timestamp.fromDate(appointmentDate),
      "appointmentDetails.appointmentStatus": "scheduled",
      "appointmentDetails.updatedTime": Timestamp.fromDate(new Date()),
    };

    await updateAppointment(selectedAppointment.id, updatedData);

    setSelectedAppointment(null);
    setAppointmentDate(null);
    setShowScheduleForm(false);

    const { data, total } = await getAdminAppointments(
      filter,
      lastVisible,
      pageSize,
      searchText,
      natureOfLegalAssistanceFilter,
      currentUser
    );
    setAppointments(data);
    setTotalPages(Math.ceil(total / pageSize));

    setSnackbarMessage("Appointment has been successfully scheduled.");
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

    const updatedData = {
      "appointmentDetails.appointmentDate": Timestamp.fromDate(rescheduleDate),
      "appointmentDetails.rescheduleReason": rescheduleReason,
      "appointmentDetails.updatedTime": Timestamp.fromDate(new Date()),
    };

    await updateAppointment(selectedAppointment.id, updatedData);

    setSelectedAppointment(null);
    setRescheduleDate(null);
    setRescheduleReason("");
    setShowRescheduleForm(false);

    const { data, total } = await getAdminAppointments(
      filter,
      lastVisible,
      pageSize,
      searchText,
      natureOfLegalAssistanceFilter,
      currentUser
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

    // Check if the date is assigned to the current lawyer
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
    const hours = time.getHours();

    // Hide times outside of 1:00 PM to 4:00 PM
    if (hours < 13 || hours > 16) {
      return "hidden-time"; // Apply the hidden-time class to hide these times
    }

    const dateTime = new Date(appointmentDate);
    dateTime.setHours(hours, time.getMinutes(), 0, 0);

    // Check if the slot is already booked
    if (isSlotBookedByAssignedLawyer(dateTime)) {
      return "booked-time disabled-time"; // Mark the slot as booked and disable it
    }

    return ""; // Return no class if the time slot is valid
  };

  const filterRescheduleTime = (time) => {
    if (!(time instanceof Date)) return false;
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const now = new Date();

    if (hours < 13 || hours >= 17 || time <= now) return false;

    const dateTime = new Date(rescheduleDate);
    dateTime.setHours(hours, minutes, 0, 0);

    // Check if the time slot is booked by the assigned lawyer (selected appointment)
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
    const hours = time.getHours();

    // Hide times outside of 1:00 PM to 4:00 PM
    if (hours < 13 || hours > 16) {
      return "hidden-time"; // Apply the hidden-time class
    }

    const dateTime = new Date(rescheduleDate);
    dateTime.setHours(hours, time.getMinutes(), 0, 0);

    // Check if the slot is booked by the assigned lawyer
    if (isSlotBookedByAssignedLawyer(dateTime)) {
      return "booked-time disabled-time"; // Apply class for booked slots
    }

    return ""; // Default return if slot is valid
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
          <option value="pending">Pending</option>
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
        <table class="flexible-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Control Number</th>
              <th>Full Name</th>
              <th>Nature of Legal Assistance Requested</th>
              <th>Scheduled Date</th>
              <th>Type</th>
              <th>Status</th>
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
                  <td>
                    {capitalizeFirstLetter(
                      appointment.appointmentDetails?.apptType || "N/A"
                    )}
                  </td>
                  <td>
                    {capitalizeFirstLetter(
                      appointment.appointmentDetails?.appointmentStatus
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        color:
                          appointment.appointmentStatus === "pending"
                            ? "red"
                            : "black", // Highlight the "Pending" status
                        fontWeight:
                          appointment.appointmentStatus === "pending"
                            ? "bold"
                            : "normal", // Make it bold for "Pending"
                      }}
                    >
                      {capitalizeFirstLetter(appointment.appointmentStatus)}
                    </span>
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
                    &nbsp; &nbsp;
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
                    &nbsp; &nbsp;
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
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
                <br />
                <section className="mb-4 print-section">
                  {(selectedAppointment.appointmentDetails?.newRequest ||
                    selectedAppointment.appointmentDetails?.requestReason) && (
                      <section className="mb-4 print-section no-print">
                      <h2>
                        <em style={{ color: "#a34bc9", fontSize: "16px" }}>
                          New Request Details
                        </em>
                      </h2>
                      <table className="table table-striped table-bordered">
                        <tbody>
                          {/* Only show the control number if newRequest is true */}
                          {selectedAppointment.appointmentDetails?.newRequest &&
                            !selectedAppointment.appointmentDetails
                              ?.requestReason && (
                              <tr>
                                <th>New Request Control Number:</th>
                                <td>
                                  {selectedAppointment.appointmentDetails
                                    ?.newControlNumber || "N/A"}
                                </td>
                              </tr>
                            )}
                          <tr>
                            <th>Reason for New Request:</th>
                            <td>
                              {selectedAppointment.appointmentDetails
                                ?.requestReason || "N/A"}
                            </td>
                          </tr>
                          {/* Only show Attached File if it exists */}
                          {selectedAppointment.appointmentDetails
                            ?.newRequestUrl && (
                            <tr>
                              <th>Attached File:</th>
                              <td>
                                <a
                                  href={
                                    selectedAppointment.appointmentDetails
                                      ?.newRequestUrl
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View File
                                </a>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </section>
                  )}
                  <br />
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
                      {selectedAppointment.appointmentDetails?.apptType ===
                        "Online" && (
                        <tr className="no-print">
                          <th>Meeting Link:</th>
                          <td>
                            {selectedAppointment.appointmentDetails
                              ?.apptType === "Online" ? (
                              selectedAppointment.appointmentDetails
                                ?.appointmentStatus === "done" ? (
                                // Appointment is done, show "Done" with a check icon
                                <button
                                  style={{
                                    backgroundColor: "#1DB954", // Green background for "Done"
                                    color: "white",
                                    border: "none",
                                    padding: "5px 8px",
                                    cursor: "not-allowed",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                  disabled // Make the button unclickable
                                >
                                  <FontAwesomeIcon
                                    icon={faCheck}
                                    style={{ marginRight: "8px" }}
                                  />
                                  Done
                                </button>
                              ) : selectedAppointment.clientAttend === "no" ? (
                                // If client didn't attend, show "Unavailable" with a red background
                                <button
                                  style={{
                                    backgroundColor: "#dc3545", // Red background for "Unavailable"
                                    color: "white",
                                    border: "none",
                                    padding: "5px 8px",
                                    cursor: "not-allowed",
                                  }}
                                  disabled // Make the button unclickable
                                >
                                  Unavailable
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    window.open(
                                      `/vpaas-magic-cookie-ef5ce88c523d41a599c8b1dc5b3ab765/${selectedAppointment.id}`,
                                      "_blank"
                                    )
                                  }
                                  style={{
                                    backgroundColor: "#28a745", // Green background for active join meeting
                                    color: "white",
                                    border: "none",
                                    padding: "5px 8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faVideo}
                                    style={{ marginRight: "8px" }}
                                  />
                                  Join Meeting
                                </button>
                              )
                            ) : (
                              "N/A"
                            )}
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
                <br />
                {selectedAppointment?.rescheduleHistory &&
                selectedAppointment.rescheduleHistory.length > 0 ? (
                  <section className="mb-4 print-section no-print">
                    <h2
                      style={{ cursor: "pointer" }}
                      onClick={toggleRescheduleHistory}
                    >
                      <em style={{ color: "#a34bc9", fontSize: "16px" }}>
                        Reschedule History {isRescheduleHistoryOpen ? "▲" : "▼"}
                      </em>
                    </h2>
                    {isRescheduleHistoryOpen && (
                      <table className="table table-striped table-bordered">
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#f2f2f2",
                              textAlign: "left",
                            }}
                          >
                            <th style={{ padding: "10px" }}>Original Date</th>
                            <th style={{ padding: "10px" }}>Original Type</th>
                            <th style={{ padding: "10px" }}>Reason</th>
                            <th style={{ padding: "10px" }}>Reschedule Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAppointment.rescheduleHistory.map(
                            (entry, index) => (
                              <tr key={index}>
                                <td style={{ padding: "10px" }}>
                                  {getFormattedDate(entry.rescheduleDate, true)}
                                </td>
                                <td style={{ padding: "10px" }}>
                                  {entry.rescheduleAppointmentType || "N/A"}
                                </td>
                                <td style={{ padding: "10px" }}>
                                  {entry.rescheduleReason || "N/A"}
                                </td>
                                <td style={{ padding: "10px" }}>
                                  {getFormattedDate(
                                    entry.rescheduleTimestamp,
                                    true
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )}
                  </section>
                ) : (
                  <p>No reschedule history available.</p>
                )}
                <br />
                <section className="mb-4 print-section employment-profile">
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
                <br />
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
                <br />
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
                      <tr>
                        <th>Consultation Remarks Attached File:</th>
                        <td>
                          {selectedAppointment.proceedingFileUrl ? (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openImageModal(
                                  selectedAppointment.proceedingFileUrl
                                );
                              }}
                            >
                              <img
                                src={selectedAppointment.proceedingFileUrl}
                                alt="Consultation Remarks Attached File"
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
                        <th>New Appointment Request File:</th>
                        <td>
                          {selectedAppointment.newRequestUrl ? (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openImageModal(
                                  selectedAppointment.newRequestUrl
                                );
                              }}
                            >
                              <img
                                src={selectedAppointment.newRequestUrl}
                                alt="New Appointment Request File"
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
                <br />
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
            <table className="table table-striped table-bordered">
              <tbody>
                <tr>
                  <th>Control Number:</th>
                  <td>{selectedAppointment.controlNumber}</td>
                </tr>
                <tr>
                  <th>Full Name:</th>
                  <td>{selectedAppointment.fullName}</td>
                </tr>
              </tbody>
            </table>
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

              {/* Only show these fields if the client attended (if 'Yes' is selected) */}
              {clientAttend === "yes" && (
                <>
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
                      <label>Attach File (optional):</label>
                    </b>
                    <input
                      type="file"
                      name="proceedingFile"
                      accept="application/pdf, image/*" // Limit the file types
                      onChange={(e) => setProceedingFile(e.target.files[0])} // Capture file
                    />
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
                </>
              )}

              <button disabled={isSubmitting}>Submit</button>
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
            <table className="table table-striped table-bordered">
              <tbody>
                <tr>
                  <th>Control Number:</th>
                  <td>{selectedAppointment.controlNumber}</td>
                </tr>
                <tr>
                  <th>Full Name:</th>
                  <td>{selectedAppointment.fullName}</td>
                </tr>
              </tbody>
            </table>
            <br />
            <p>
              <strong>Current Appointment Date:</strong> <br></br>
              {getFormattedDate(
                selectedAppointment.appointmentDetails.appointmentDate,
                true
              )}
            </p>
            <form onSubmit={handleRescheduleSubmit}>
              <div>
                <ReactDatePicker
                  selected={rescheduleDate}
                  onChange={(date) => setRescheduleDate(date)}
                  showTimeSelect
                  filterDate={(date) => filterDate(date) && date > new Date()}
                  filterTime={(time) => filterRescheduleTime(time)} // Apply the correct filter
                  dateFormat="MM/dd/yy h:mm aa"
                  inline
                  timeIntervals={60}
                  minTime={new Date(new Date().setHours(13, 0, 0))} // Starting from 1:00 PM
                  maxTime={new Date(new Date().setHours(17, 0, 0))} // Ending at 5:00 PM
                  dayClassName={(date) => getDayClassName(date)}
                  timeClassName={(time) => getTimeRescheduleClassName(time)} // Ensure className application
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
                  required
                ></textarea>
              </div>
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
            <table className="table table-striped table-bordered">
              <tbody>
                <tr>
                  <th>Control Number:</th>
                  <td>{selectedAppointment.controlNumber}</td>
                </tr>
                <tr>
                  <th>Full Name:</th>
                  <td>{selectedAppointment.fullName}</td>
                </tr>
              </tbody>
            </table>
            <br />
            <form onSubmit={handleScheduleSubmit}>
              <div>
                <ReactDatePicker
                  selected={appointmentDate} // Correct state for scheduling
                  onChange={(date) => setAppointmentDate(date)} // Ensure it updates appointmentDate
                  showTimeSelect
                  filterDate={(date) => filterDate(date) && date > new Date()}
                  filterTime={(time) => filterTime(time)} // Apply correct filtering for valid times
                  dateFormat="MM/dd/yy h:mm aa"
                  inline
                  timeIntervals={60} // Set to 60 minutes for 1-hour intervals
                  minTime={new Date(new Date().setHours(13, 0, 0))} // Starting from 1:00 PM
                  maxTime={new Date(new Date().setHours(17, 0, 0))} // Ending at 5:00 PM
                  dayClassName={(date) => getDayClassName(date)} // Add class for fully booked days
                  timeClassName={(time) => getTimeClassName(time)} // Ensure className application for time
                />
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

export default ApptsHead;
