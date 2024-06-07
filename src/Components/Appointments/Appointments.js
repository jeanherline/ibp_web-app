import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import "./Appointments.css";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  getAppointments,
  updateAppointment,
  getBookedSlots,
} from "../../Config/FirebaseServices";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [cursors, setCursors] = useState([]);
  const pageSize = 7;
  const [hasMore, setHasMore] = useState(true);
  const [clientEligibility, setClientEligibility] = useState({
    eligibility: "",
    denialReason: "",
    notes: "",
    ibpParalegalStaff: "",
    assistingCounsel: "",
  });
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const openImageModal = (url) => {
    setCurrentImageUrl(url);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const ImageModal = ({ isOpen, url, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <img
            src={url}
            alt="Fullscreen Image"
            style={{ width: "100%", height: "auto", maxHeight: "90vh" }}
          />
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 20, right: 20 }}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      const data = await getAppointments(
        filter,
        lastVisible,
        pageSize,
        searchText
      );
      setAppointments(data);
      setHasMore(data.length === pageSize);
    };

    fetchAppointments();
  }, [filter, lastVisible, searchText]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      const data = await getBookedSlots();
      console.log("Fetched booked slots:", data);
      setBookedSlots(data.map((slot) => new Date(slot))); // Ensure they are Date objects
    };

    fetchBookedSlots();
  }, []);

  useEffect(() => {
    setSelectedAppointment(null); // Close details when filter changes
  }, [filter]);

  const isWeekday = (date) => {
    const day = date.getDay();
    return day === 2 || day === 4; // Only allow Tuesdays (2) and Thursdays (4)
  };

  const isTimeAllowed = (time) => {
    if (!(time instanceof Date)) return false;
    const hours = time.getHours();
    const minutes = time.getMinutes();

    return !(
      (
        hours < 1 ||
        (hours === 0 && minutes < 45) ||
        (hours >= 12 && hours < 13) || // 12 PM to 12:45 PM
        (hours >= 17 && (hours < 23 || (hours === 23 && minutes < 45)))
      ) // 5 PM to 11:45 PM
    );
  };

  const isSlotBooked = (dateTime) => {
    const result = bookedSlots.some(
      (bookedDate) =>
        dateTime.getDate() === bookedDate.getDate() &&
        dateTime.getMonth() === bookedDate.getMonth() &&
        dateTime.getFullYear() === bookedDate.getFullYear() &&
        dateTime.getHours() === bookedDate.getHours() &&
        dateTime.getMinutes() === bookedDate.getMinutes()
    );
    console.log(`Checking if slot is booked for ${dateTime}: ${result}`);
    return result;
  };

  const filterDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time portion to midnight
    const isFullyBooked =
      bookedSlots.filter(
        (slot) =>
          slot.getDate() === date.getDate() &&
          slot.getMonth() === date.getMonth() &&
          slot.getFullYear() === date.getFullYear() &&
          slot.getHours() >= 13 &&
          slot.getHours() < 17
      ).length === 4;
    return isWeekday(date) && date >= today && !isFullyBooked; // Disable fully booked dates
  };

  const filterTime = (time) => {
    if (!(time instanceof Date)) {
      console.error("Invalid time object:", time);
      return false;
    }

    const hours = time.getHours();
    const minutes = time.getMinutes();

    // Allow only times between 1 PM to 5 PM
    if (hours < 13 || hours >= 17) {
      // Excludes all hours before 1 PM and from 5 PM onwards
      return false;
    }

    const dateTime = new Date(appointmentDate);
    dateTime.setHours(hours, minutes, 0, 0);

    return !isSlotBooked(dateTime); // Exclude booked slots
  };

  const handleNext = () => {
    setCursors([...cursors, lastVisible]);
    setLastVisible(appointments[appointments.length - 1]);
    setCurrentPage(currentPage + 1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      const newCursors = [...cursors];
      const newLastVisible = newCursors.pop();
      setCursors(newCursors);
      setLastVisible(newLastVisible);
      setCurrentPage(currentPage - 1);
    }
  };

  const toggleDetails = (appointment) => {
    if (selectedAppointment && selectedAppointment.id === appointment.id) {
      setSelectedAppointment(null); // Close details if currently showing
    } else {
      setSelectedAppointment(appointment); // Show details for the selected appointment
    }
  };

  const handleCloseDetails = () => {
    setSelectedAppointment(null);
  };

  const handleEligibilityChange = (e) => {
    setClientEligibility({ ...clientEligibility, eligibility: e.target.value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Set the status based on eligibility
    const status =
      clientEligibility.eligibility === "yes" ? "approved" : "cancelled";

    const updatedData = {
      clientEligibility,
      appointmentDate,
      appointmentStatus: status,
    };

    // Update the appointment in the database
    await updateAppointment(selectedAppointment.id, updatedData);

    // Clear the form
    setSelectedAppointment(null);
    setClientEligibility({
      eligibility: "",
      denialReason: "",
      notes: "",
      ibpParalegalStaff: "",
      assistingCounsel: "",
    });

    // Optionally, refresh the appointments list to reflect the changes
    const data = await getAppointments(
      filter,
      lastVisible,
      pageSize,
      searchText
    );
    setAppointments(data);
    setHasMore(data.length === pageSize);

    // Show snackbar notification
    setSnackbarMessage("Form has been successfully submitted.");
    setShowSnackbar(true);
    setTimeout(() => {
      setShowSnackbar(false);
    }, 3000);
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

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search..."
        />
        <select onChange={(e) => setFilter(e.target.value)} value={filter}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <table>
          <thead>
            <tr>
              <th>Control Number</th>
              <th>Full Name</th>
              <th>Address</th>
              <th>Contact Number</th>
              <th>Date Submitted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.controlNumber}</td>
                <td>{appointment.fullName}</td>
                <td>{appointment.address}</td>
                <td>{appointment.contactNumber}</td>
                <td>
                  {appointment.createdDate
                    ? new Date(
                        appointment.createdDate.seconds * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <button onClick={() => toggleDetails(appointment)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button disabled={currentPage === 1} onClick={handlePrevious}>
          Previous
        </button>
        <button disabled={!hasMore} onClick={handleNext}>
          Next
        </button>

        {selectedAppointment && (
          <div className="appointment-details">
            <button className="close-button" onClick={handleCloseDetails}>
              x
            </button>
            <br />
            <h2>Appointment Details</h2>

            <table>
              <caption>Basic Information</caption>
              <tbody>
                <tr>
                  <th>Control Number</th>
                  <td>{selectedAppointment.controlNumber}</td>
                </tr>
                <tr>
                  <th>Date Request Created</th>
                  <td>
                    {selectedAppointment.createdDate
                      ? new Date(
                          selectedAppointment.createdDate.seconds * 1000
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
                <tr>
                  <th>Appointment Status</th>
                  <td>
                    {capitalizeFirstLetter(
                      selectedAppointment.appointmentStatus
                    )}
                  </td>
                </tr>
                {selectedAppointment.appointmentStatus !== "pending" && (
                  <>
                    <tr>
                      <th>Appointment Date</th>
                      <td>
                        {selectedAppointment.appointmentDate
                          ? new Date(
                              selectedAppointment.appointmentDate.seconds * 1000
                            ).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>Eligibility</th>
                      <td>
                        {capitalizeFirstLetter(
                          selectedAppointment.clientEligibility?.eligibility ||
                            "-"
                        )}
                      </td>
                    </tr>
                    {selectedAppointment.appointmentStatus == "cancelled" && (
                      <tr>
                        <th>Denial Reason</th>
                        <td>
                          {selectedAppointment.clientEligibility
                            ?.denialReason || "-"}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th>Notes</th>
                      <td>
                        {selectedAppointment.clientEligibility?.notes || "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>IBP Paralegal Staff</th>
                      <td>
                        {selectedAppointment.clientEligibility
                          ?.ibpParalegalStaff || "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>Assisting Counsel</th>
                      <td>
                        {selectedAppointment.clientEligibility
                          ?.assistingCounsel || "-"}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            <table>
              <caption>Applicant Profile</caption>
              <tbody>
                <tr>
                  <th>Buong Pangalan</th>
                  <td>{selectedAppointment.fullName}</td>
                </tr>
                <tr>
                  <th>Araw ng Kapanganakan</th>
                  <td>
                    {selectedAppointment.createdDate
                      ? new Date(
                          selectedAppointment.createdDate.seconds * 1000
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
                <tr>
                  <th>Adres o Tinitirahan</th>
                  <td>{selectedAppointment?.address || "Not Available"}</td>
                </tr>
                <tr>
                  <th>Numero ng Telepono</th>
                  <td>
                    {selectedAppointment?.contactNumber || "Not Available"}
                  </td>
                </tr>
                <tr>
                  <th>Kasarian</th>
                  <td>
                    {selectedAppointment?.selectedGender || "Not Specified"}
                  </td>
                </tr>
                <tr>
                  <th>Pangalan ng Asawa</th>
                  <td>{selectedAppointment.spouseName || "Not Available"}</td>
                </tr>
                <tr>
                  <th>Trabaho ng Asawa</th>
                  <td>
                    {selectedAppointment.spouseOccupation || "Not Available"}
                  </td>
                </tr>
                <th>Pangalan at edad ng mga anak</th>
                <td>
                  {selectedAppointment.childrenNamesAges || "Not Available"}
                </td>
              </tbody>
            </table>

            <table>
              <caption>Employment Profile</caption>
              <tbody>
                <tr>
                  <th>Hanapbuhay</th>
                  <td>{selectedAppointment.occupation || "Not Available"}</td>
                </tr>
                <tr>
                  <th>Klase ng Trabaho</th>
                  <td>
                    {selectedAppointment?.kindOfEmployment || "Not Specified"}
                  </td>
                </tr>
                <tr>
                  <th>Pangalan ng iyong amo</th>
                  <td>
                    {selectedAppointment?.employerName || "Not Available"}
                  </td>
                </tr>
                <tr>
                  <th>Adres o Tinitirahan ng amo</th>
                  <td>
                    {selectedAppointment.employerAddress || "Not Available"}
                  </td>
                </tr>
                <tr>
                  <th>Buwanang sahod ng buong pamilya</th>
                  <td>
                    {selectedAppointment.monthlyIncome || "Not Available"}
                  </td>
                </tr>
              </tbody>
            </table>

            <table>
              <caption>Nature of Legal Assistance Requested</caption>
              <tbody>
                <tr>
                  <th>Klase ng tulong legal</th>
                  <td>
                    {selectedAppointment?.selectedAssistanceType ||
                      "Not Specified"}
                  </td>
                </tr>
                <tr>
                  <th>Ano ang iyong problema?</th>
                  <td>{selectedAppointment?.problems || "Not Available"}</td>
                </tr>
                <tr>
                  <th>Bakit o papaano nagkaroon ng ganoong problema?</th>
                  <td>
                    {selectedAppointment?.problemReason || "Not Available"}
                  </td>
                </tr>
                <tr>
                  <th>
                    Ano ang mga maaaring solusyon na gusto mong ibigay ng
                    Abogado sa iyo?
                  </th>
                  <td>
                    {selectedAppointment?.desiredSolutions || "Not Available"}
                  </td>
                </tr>
              </tbody>
            </table>

            <table>
              <caption>Uploaded Images</caption>
              <tbody>
                <tr>
                  <th>Barangay Certificate of Indigency</th>
                  <td>
                    {selectedAppointment?.barangayImageUrl ? (
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
                          style={{ width: "100px", cursor: "pointer" }}
                        />
                      </a>
                    ) : (
                      "Not Available"
                    )}
                  </td>
                </tr>
                <tr>
                  <th>DSWD Certificate of Indigency</th>
                  <td>
                    {selectedAppointment?.dswdImageUrl ? (
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
                          style={{ width: "100px", cursor: "pointer" }}
                        />
                      </a>
                    ) : (
                      "Not Available"
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Disqualification Letter from PAO</th>
                  <td>
                    {selectedAppointment?.paoImageUrl ? (
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
                    filterDate={filterDate} // Continue using existing date filter
                    filterTime={filterTime} // Updated time filter to limit visibility to 1 PM to 5 PM
                    dateFormat="MMMM d, yyyy h:mm aa"
                    inline
                    timeIntervals={15} // Interval for time selection
                    minTime={new Date(new Date().setHours(13, 0, 0))} // Set minimum time to 1 PM
                    maxTime={new Date(new Date().setHours(17, 0, 0))} // Set maximum time to 5 PM
                    dayClassName={getDayClassName} // Optional: add class based on day conditions
                    timeClassName={getTimeClassName} // Optional: add class based on time conditions
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
                    <p>Notes:</p>
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
                <button type="submit">Submit</button>
              </form>
            </div>
          )}
        {showSnackbar && <div className="snackbar">{snackbarMessage}</div>}
      </div>
    </div>
  );
}

export default Appointments;
