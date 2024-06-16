import {
  collection,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  startAt,
  orderBy,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore"; // Import necessary functions directly from Firebase Firestore

import { fs } from "./Firebase"; // Import fs from your Firebase configuration file

const getAppointments = async (
  statusFilter,
  lastVisible,
  pageSize = 7,
  searchText = "",
  assistanceFilter = "all",
  isPrevious = false
) => {
  let queryRef = collection(fs, "appointments");

  // Apply status filter if not "all"
  if (statusFilter !== "all") {
    queryRef = query(queryRef, where("appointmentDetails.appointmentStatus", "==", statusFilter));
  }

  // Apply assistance filter if not "all"
  if (assistanceFilter !== "all") {
    queryRef = query(queryRef, where("legalAssistanceRequested.selectedAssistanceType", "==", assistanceFilter));
  }

  // Order by controlNumber and limit results for pagination
  queryRef = query(queryRef, orderBy("appointmentDetails.controlNumber"), limit(pageSize));

  // Handle pagination
  if (lastVisible) {
    if (isPrevious) {
      queryRef = query(queryRef, startAt(lastVisible?.appointmentDetails?.controlNumber || ""));
    } else {
      queryRef = query(queryRef, startAfter(lastVisible?.appointmentDetails?.controlNumber || ""));
    }
  }

  const querySnapshot = await getDocs(queryRef);

  // Filter results by searchText, if any
  const filtered = querySnapshot.docs.filter(
    (doc) =>
      doc
        .data()
        .applicantProfile?.fullName?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      doc
        .data()
        .applicantProfile?.address?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      doc.data().applicantProfile?.contactNumber?.includes(searchText) ||
      doc.data().appointmentDetails?.controlNumber?.includes(searchText) ||
      doc.data().legalAssistanceRequested?.selectedAssistanceType?.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalQuery = await getDocs(
    query(
      collection(fs, "appointments"),
      statusFilter !== "all" ? where("appointmentDetails.appointmentStatus", "==", statusFilter) : {}
    )
  );

  return {
    data: filtered.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data.applicantProfile,
        ...data.employmentProfile,
        ...data.legalAssistanceRequested,
        ...data.uploadedImages,
        createdDate: data.appointmentDetails?.createdDate,
        appointmentStatus: data.appointmentDetails?.appointmentStatus,
        controlNumber: data.appointmentDetails?.controlNumber,
        appointmentDate: data.appointmentDetails?.appointmentDate,
        clientEligibility: data.clientEligibility,
        appointmentDetails: data.appointmentDetails, // Include appointmentDetails
      };
    }),
    total: totalQuery.size,
    firstDoc: querySnapshot.docs[0],
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
  };
};
const updateAppointment = async (appointmentId, updatedData) => {
  const appointmentRef = doc(fs, "appointments", appointmentId);
  await updateDoc(appointmentRef, updatedData);
};

export const getBookedSlots = async () => {
  const appointmentsRef = collection(fs, "appointments");
  const q = query(
    appointmentsRef,
    where("appointmentDetails.appointmentStatus", "==", "approved")
  ); // Assuming 'approved' appointments are booked
  const querySnapshot = await getDocs(q);

  const bookedSlots = [];
  querySnapshot.forEach((doc) => {
    const appointmentData = doc.data();
    if (appointmentData.appointmentDetails?.appointmentDate) {
      bookedSlots.push(appointmentData.appointmentDetails.appointmentDate.toDate());
    }
  });

  return bookedSlots;
};

export const getCalendar = async () => {
  const appointmentsRef = collection(fs, "appointments");
  const q = query(
    appointmentsRef,
    where("appointmentDetails.appointmentStatus", "==", "approved")
  ); // Assuming 'approved' appointments are booked
  const querySnapshot = await getDocs(q);

  const bookedSlots = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.appointmentDetails?.appointmentDate) {
      bookedSlots.push({
        appointmentDate: data.appointmentDetails.appointmentDate.toDate(), // Convert Firestore Timestamp to JavaScript Date
        fullName: data.applicantProfile?.fullName, // Fetch fullName from applicantProfile
        contactNumber: data.applicantProfile?.contactNumber, // Fetch contactNumber from applicantProfile
      });
    }
  });

  return bookedSlots;
};

const getUsers = async (statusFilter, filterType, cityFilter, searchText, lastVisible, pageSize, pageNumber = 1) => {
  try {
    let queryRef = collection(fs, "users");

    if (statusFilter !== "all") {
      queryRef = query(queryRef, where("user_status", "==", statusFilter));
    }

    if (filterType) {
      queryRef = query(queryRef, where("member_type", "==", filterType));
    }

    if (cityFilter !== "all") {
      queryRef = query(queryRef, where("city", "==", cityFilter));
    }

    if (searchText) {
      queryRef = query(queryRef, where("display_name", ">=", searchText), where("display_name", "<=", searchText + "\uf8ff"));
    }

    if (lastVisible) {
      queryRef = query(queryRef, limit(pageSize), startAfter(lastVisible));
    } else {
      queryRef = query(queryRef, limit(pageSize));
    }

    const querySnapshot = await getDocs(queryRef);
    const users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { users, lastVisibleDoc };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

const getUsersCount = async (statusFilter, filterType, cityFilter, searchText) => {
  try {
    let queryRef = collection(fs, "users");

    if (statusFilter !== "all") {
      queryRef = query(queryRef, where("user_status", "==", statusFilter));
    }

    if (filterType) {
      queryRef = query(queryRef, where("member_type", "==", filterType));
    }

    if (cityFilter !== "all") {
      queryRef = query(queryRef, where("city", "==", cityFilter));
    }

    if (searchText) {
      queryRef = query(queryRef, where("display_name", ">=", searchText), where("display_name", "<=", searchText + "\uf8ff"));
    }

    const querySnapshot = await getDocs(queryRef);
    return querySnapshot.size;
  } catch (error) {
    console.error("Failed to fetch users count:", error);
    throw error;
  }
};

const updateUser = async (id, userData) => {
  try {
    const userRef = doc(fs, "users", id);
    await updateDoc(userRef, userData);
  } catch (error) {
    console.error("Failed to update user:", error);
    throw error;
  }
};

const getUserById = async (userId) => {
  const userRef = doc(fs, "users", userId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    return userDoc.data();
  } else {
    return null;
  }
};

export { getAppointments, updateAppointment, getUsers, updateUser, getUserById, getUsersCount};