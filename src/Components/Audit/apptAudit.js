import { doc, updateDoc } from 'firebase/firestore';
import { logAudit } from './userAudit'; // Correct the path to the logAudit function
import { fs } from './firebaseConfig'; // Firebase config

// Function to reschedule an appointment and log the action with all appointment details
export async function rescheduleAppointment(appointmentId, newDate, appointmentDetails) {
  try {
    const appointmentRef = doc(fs, 'appointments', appointmentId);
    
    // Update the appointment date
    await updateDoc(appointmentRef, { appointmentDate: newDate });

    // Log the appointment reschedule action in audit logs with detailed appointment data
    await logAudit(appointmentDetails.uid, 'APPOINTMENT_RESCHEDULED', 'appointments', appointmentId, {
      fullName: appointmentDetails.fullName,
      dob: appointmentDetails.dob,
      address: appointmentDetails.address,
      city: appointmentDetails.city,
      contactNumber: appointmentDetails.contactNumber,
      selectedGender: appointmentDetails.selectedGender,
      spouseName: appointmentDetails.spouseName,
      spouseOccupation: appointmentDetails.spouseOccupation,
      childrenNamesAges: appointmentDetails.childrenNamesAges,
      
      // Appointment details
      appointmentDate: newDate,
      appointmentStatus: appointmentDetails.appointmentStatus,
      apptType: appointmentDetails.apptType,
      assignedLawyer: appointmentDetails.assignedLawyer,
      assistingCounsel: appointmentDetails.assistingCounsel,
      clientAttend: appointmentDetails.clientAttend,
      controlNumber: appointmentDetails.controlNumber,
      createdDate: appointmentDetails.createdDate,
      ibpParalegalStaff: appointmentDetails.ibpParalegalStaff,
      proceedingNotes: appointmentDetails.proceedingNotes,
      qrCode: appointmentDetails.qrCode,
      read: appointmentDetails.read,
      rescheduleReason: appointmentDetails.rescheduleReason,
      updatedTime: appointmentDetails.updatedTime,

      // Client eligibility
      clientEligibility: {
        denialReason: appointmentDetails.clientEligibility.denialReason,
        eligibility: appointmentDetails.clientEligibility.eligibility,
        notes: appointmentDetails.clientEligibility.notes,
      },

      // Employment profile
      employmentProfile: {
        employerAddress: appointmentDetails.employmentProfile.employerAddress,
        employerName: appointmentDetails.employmentProfile.employerName,
        kindOfEmployment: appointmentDetails.employmentProfile.kindOfEmployment,
        monthlyIncome: appointmentDetails.employmentProfile.monthlyIncome,
        occupation: appointmentDetails.employmentProfile.occupation,
      },

      // Legal assistance requested
      legalAssistanceRequested: {
        desiredSolutions: appointmentDetails.legalAssistanceRequested.desiredSolutions,
        problemReason: appointmentDetails.legalAssistanceRequested.problemReason,
        problems: appointmentDetails.legalAssistanceRequested.problems,
        selectedAssistanceType: appointmentDetails.legalAssistanceRequested.selectedAssistanceType,
      },

      // Uploaded images
      uploadedImages: {
        barangayImageUrl: appointmentDetails.uploadedImages.barangayImageUrl,
        dswdImageUrl: appointmentDetails.uploadedImages.dswdImageUrl,
        paoImageUrl: appointmentDetails.uploadedImages.paoImageUrl,
      }
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
  }
}
