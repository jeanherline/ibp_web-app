import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import { getAppointments, updateAppointment } from "../../Config/FirebaseServices";
import "./Appointments.css";

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
  const [eligibility, setEligibility] = useState("");
  const [denialReasons, setDenialReasons] = useState([]);
  const [notes, setNotes] = useState("");
  const [ibpParalegalStaff, setIbpParalegalStaff] = useState("");
  const [assistingCounsel, setAssistingCounsel] = useState("");

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
    setEligibility(e.target.value);
  };

  const handleDenialReasonChange = (e) => {
    const value = e.target.value;
    setDenialReasons(prev =>
      prev.includes(value) ? prev.filter(reason => reason !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedData = {
      eligibility,
      denialReasons: eligibility === "no" ? denialReasons : [],
      notes,
      ibpParalegalStaff,
      assistingCounsel,
      appointmentStatus: eligibility === "yes" ? "approved" : "cancelled",
    };

    await updateAppointment(selectedAppointment.id, updatedData);
    setSelectedAppointment(null);
    setEligibility("");
    setDenialReasons([]);
    setNotes("");
    setIbpParalegalStaff("");
    setAssistingCounsel("");

    // Refresh the appointments list
    const data = await getAppointments(filter, lastVisible, pageSize, searchText);
    setAppointments(data);
    setHasMore(data.length === pageSize);
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
              <th>Status</th>
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
                <td>{appointment.appointmentStatus}</td>
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
                  <th>User ID (UID)</th>
                  <td>{selectedAppointment.uid}</td>
                </tr>
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
                  <td>{selectedAppointment.appointmentStatus}</td>
                </tr>
              </tbody>
            </table>

            <table>
              <caption>Applicant Profile</caption>
              <tbody>
                <tr>
                  <th>Buong Pangalan (Full Name)</th>
                  <td>{selectedAppointment.fullName}</td>
                </tr>
                <tr>
                  <th>Araw ng Kapanganakan (Date of Birth)</th>
                  <td>
                    {selectedAppointment.createdDate
                      ? new Date(
                          selectedAppointment.createdDate.seconds * 1000
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
                <tr>
                  <th>Adres o Tinitirahan (Address)</th>
                  <td>{selectedAppointment?.address || "Not Available"}</td>
                </tr>
                <tr>
                  <th>Numero ng Telepono (Contact Number)</th>
                  <td>
                    {selectedAppointment?.contactNumber || "Not Available"}
                  </td>
                </tr>
                <tr>
                  <th>Kasarian (Gender)</th>
                  <td>
                    {selectedAppointment?.selectedGender || "Not Specified"}
                  </td>
                </tr>
                <tr>
                  <th>Pangalan ng Asawa (Name of Spouse)</th>
                  <td>{selectedAppointment.spouseName || "Not Available"}</td>
                </tr>
                <tr>
                  <th>Trabaho ng Asawa (Spouse Occupation)</th>
                  <td>
                    {selectedAppointment.spouseOccupation || "Not Available"}
                  </td>
                </tr>
                <th>Pangalan at edad ng mga anak (Children Names and Ages)</th>
                <td>
                  {selectedAppointment.childrenNamesAges || "Not Available"}
                </td>
              </tbody>
            </table>

            <table>
              <caption>Employment Profile</caption>
              <tbody>
                <tr>
                  <th>Hanapbuhay (Occupation)</th>
                  <td>{selectedAppointment.occupation || "Not Available"}</td>
                </tr>
                <tr>
                  <th>Klase ng Trabaho (Type of Employment)</th>
                  <td>
                    {selectedAppointment?.kindOfEmployment || "Not Specified"}
                  </td>
                </tr>
                <tr>
                  <th>Pangalan ng iyong amo (Employer Name)</th>
                  <td>
                    {selectedAppointment?.employerName || "Not Available"}
                  </td>
                </tr>
                <tr>
                  <th>Adres o Tinitirahan ng amo (Employer Address)</th>
                  <td>
                    {selectedAppointment.employerAddress || "Not Available"}
                  </td>
                </tr>
                <tr>
                  <th>Buwanang sahod ng buong pamilya (Monthly Income)</th>
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
                  <th>Klase ng tulong legal (Nature of Legal assistance)</th>
                  <td>
                    {selectedAppointment?.selectedAssistanceType ||
                      "Not Specified"}
                  </td>
                </tr>
                <tr>
                  <th>Ano ang iyong problema? (Problem/s or Complaint/s)</th>
                  <td>{selectedAppointment?.problems || "Not Available"}</td>
                </tr>
                <tr>
                  <th>
                    Bakit o papaano nagkaroon ng ganoong problema? (Why or how
                    did such problem/s arise?)
                  </th>
                  <td>
                    {selectedAppointment?.problemReason || "Not Available"}
                  </td>
                </tr>
                <tr>
                  <th>
                    Ano ang mga maaaring solusyon na gusto mong ibigay ng
                    Abogado sa iyo? (What possible solution/s would you like to
                    be given by the lawyer to you?)
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
                        href={selectedAppointment.barangayImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Barangay Certificate of Indigency
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
                        href={selectedAppointment.dswdImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View DSWD Certificate of Indigency
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
                        href={selectedAppointment.paoImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Disqualification Letter from PAO
                      </a>
                    ) : (
                      "Not Available"
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <br />
        <br />
        {selectedAppointment && (
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
              {eligibility === "no" && (
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
                      type="checkbox"
                      name="denialReason"
                      value="meansTest"
                      onChange={handleDenialReasonChange}
                      required
                    />{" "}
                    Persons who do not pass the means and merit test (sec. 5 of
                    the Revised Manual of Operations of the NCLA)
                  </label>
                  <br />
                  <br />
                  <label>
                    <input
                      type="checkbox"
                      name="denialReason"
                      value="alreadyRepresented"
                      onChange={handleDenialReasonChange}
                      required
                    />{" "}
                    Parties already represented by a counsel de parte (sec. 5 of
                    the Revised Manual of Operations of the NCLA)
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
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
              <div>
                <b>
                  <label>IBP Paralegal/Staff:</label>
                </b>
                <input
                  type="text"
                  name="ibpParalegalStaff"
                  placeholder="Enter name here..."
                  value={ibpParalegalStaff}
                  onChange={(e) => setIbpParalegalStaff(e.target.value)}
                  required
                />
                <b>
                  <label>Assisting Counsel:</label>
                </b>
                <input
                  type="text"
                  name="assistingCounsel"
                  placeholder="Enter name here..."
                  value={assistingCounsel}
                  onChange={(e) => setAssistingCounsel(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Submit</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointments;
