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

  return filtered.map((doc) => ({
    id: doc.id,
    ...doc.data().applicantProfile,
    ...doc.data().employmentProfile,
    ...doc.data().legalAssistanceRequested,
    ...doc.data().uploadedImages,

    createdDate: doc.data().createdDate,
    appointmentStatus: doc.data().appointmentStatus,
    controlNumber: doc.data().controlNumber,
  }));
};

const updateAppointment = async (appointmentId, updatedData) => {
  const appointmentRef = doc(fs, "appointments", appointmentId);
  await updateDoc(appointmentRef, updatedData);
};

export { getAppointments, updateAppointment };
