import React from 'react';
import './AptModal.css';

function AptModal({ appointment, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Appointment Details</h2>
        <p><strong>Control Number:</strong> {appointment.controlNumber}</p>
        <p><strong>Full Name:</strong> {appointment.fullName}</p>
        <p><strong>Address:</strong> {appointment.address}</p>
        <p><strong>Contact Number:</strong> {appointment.contactNumber}</p>
        <p><strong>Date Submitted:</strong> {appointment.createdDate ? new Date(appointment.createdDate.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Status:</strong> {appointment.appointmentStatus}</p>
        <p><strong>Date of Birth:</strong> {appointment.dob}</p>
        <p><strong>Gender:</strong> {appointment.selectedGender}</p>
        <p><strong>Spouse Name:</strong> {appointment.spouseName}</p>
        <p><strong>Spouse Occupation:</strong> {appointment.spouseOccupation}</p>

        <h3>Employment Profile</h3>
        <p><strong>Employer Address:</strong> {appointment.employmentProfile?.employerAddress || 'N/A'}</p>
        <p><strong>Employer Name:</strong> {appointment.employmentProfile?.employerName || 'N/A'}</p>
        <p><strong>Kind of Employment:</strong> {appointment.employmentProfile?.kindOfEmployment || 'N/A'}</p>
        <p><strong>Monthly Income:</strong> {appointment.employmentProfile?.monthlyIncome || 'N/A'}</p>
        <p><strong>Occupation:</strong> {appointment.employmentProfile?.occupation || 'N/A'}</p>

        <h3>Legal Assistance Requested</h3>
        <p><strong>Problem Reason:</strong> {appointment.legalAssistanceRequested?.problemReason || 'N/A'}</p>
        <p><strong>Desired Solutions:</strong> {appointment.legalAssistanceRequested?.desiredSolutions || 'N/A'}</p>

        <h3>Uploaded Images</h3>
        <p><strong>Barangay Image URL:</strong> {appointment.uploadedImages?.barangayImageUrl ? <a href={appointment.uploadedImages.barangayImageUrl} target="_blank" rel="noopener noreferrer">View Image</a> : 'N/A'}</p>
        <p><strong>DSWD Image URL:</strong> {appointment.uploadedImages?.dswdImageUrl ? <a href={appointment.uploadedImages.dswdImageUrl} target="_blank" rel="noopener noreferrer">View Image</a> : 'N/A'}</p>
        <p><strong>PAO Image URL:</strong> {appointment.uploadedImages?.paoImageUrl ? <a href={appointment.uploadedImages.paoImageUrl} target="_blank" rel="noopener noreferrer">View Image</a> : 'N/A'}</p>
        
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default AptModal;
