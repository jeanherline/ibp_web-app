import {
  fs,
  collection,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  orderBy,
  doc,
  updateDoc,
} from "./Firebase"; // Import necessary functions

const getAppointments = async (
  statusFilter,
  lastVisible,
  pageSize = 7,
  searchText = ""
) => {
  let queryRef = query(
    collection(fs, "appointments"),
    where("appointmentStatus", "==", statusFilter),
    orderBy("controlNumber"), // Added an orderBy clause
    limit(pageSize)
  );

  if (lastVisible) {
    queryRef = query(
      queryRef,
      startAfter(lastVisible.controlNumber) // Use the controlNumber for pagination
    );
  }

  const querySnapshot = await getDocs(queryRef);

  // Filter results by searchText, if any
  const filtered = querySnapshot.docs.filter(
    (doc) =>
      doc
        .data()
        .applicantProfile.fullName.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      doc
        .data()
        .applicantProfile.address.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      doc.data().applicantProfile.contactNumber.includes(searchText)
  );

  return filtered.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data.applicantProfile,
      ...data.employmentProfile,
      ...data.legalAssistanceRequested,
      ...data.uploadedImages,
      createdDate: data.createdDate,
      appointmentStatus: data.appointmentStatus,
      controlNumber: data.controlNumber,
      // Ensure these fields are included
      appointmentDate: data.appointmentDate,
      clientEligibility: data.clientEligibility,
    };
  });
};

const updateAppointment = async (appointmentId, updatedData) => {
  const appointmentRef = doc(fs, "appointments", appointmentId);
  await updateDoc(appointmentRef, updatedData);
};


// In src/Config/FirebaseServices.js or wherever your Firebase utils are located
export const getBookedSlots = async () => {
  const appointmentsRef = collection(fs, 'appointments');
  const q = query(appointmentsRef, where('appointmentStatus', '==', 'approved')); // Assuming 'approved' appointments are booked
  const querySnapshot = await getDocs(q);

  const bookedSlots = [];
  querySnapshot.forEach(doc => {
    const appointmentData = doc.data();
    if (appointmentData.appointmentDate) {
      bookedSlots.push(appointmentData.appointmentDate.toDate());
    }
  });

  return bookedSlots;
};


export const getCalendar = async () => {
  const appointmentsRef = collection(fs, 'appointments');
  const q = query(appointmentsRef, where('appointmentStatus', '==', 'approved')); // Assuming 'approved' appointments are booked
  const querySnapshot = await getDocs(q);

  const bookedSlots = [];
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.appointmentDate) {
      bookedSlots.push({
        appointmentDate: data.appointmentDate.toDate(), // Convert Firestore Timestamp to JavaScript Date
        fullName: data.applicantProfile.fullName,       // Fetch fullName from applicantProfile
        contactNumber: data.applicantProfile.contactNumber // Fetch contactNumber from applicantProfile
      });
    }
  });

  return bookedSlots;
};


export { getAppointments, updateAppointment };
