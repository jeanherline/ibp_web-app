import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  startAfter, 
  orderBy, 
  doc, 
  updateDoc,
  getDoc 
} from "firebase/firestore"; // Import necessary functions directly from Firebase Firestore

import { fs } from "./Firebase"; // Import fs from your Firebase configuration file


const getAppointments = async (statusFilter, lastVisible, pageSize = 7, searchText = "") => {
  let queryRef = query(
    collection(fs, "appointments"),
    where("appointmentDetails.appointmentStatus", "==", statusFilter),
    orderBy("appointmentDetails.controlNumber"), // Order by controlNumber
    limit(pageSize)
  );

  if (lastVisible) {
    queryRef = query(
      queryRef,
      startAfter(lastVisible?.appointmentDetails?.controlNumber || "") // Use the controlNumber for pagination
    );
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
      doc.data().applicantProfile?.contactNumber?.includes(searchText)
  );

  const totalQuery = await getDocs(
    query(
      collection(fs, "appointments"),
      where("appointmentDetails.appointmentStatus", "==", statusFilter)
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
    total: totalQuery.size
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

const getUsers = async (
  statusFilter,
  lastVisible,
  pageSize = 7,
  searchText = "",
  memberTypeFilter
) => {
  try {
    let queryRef = query(
      collection(fs, "users"),
      where("user_status", "==", statusFilter),
      orderBy("created_time"),
      limit(pageSize)
    );

    if (searchText) {
      // Implement search functionality here, for example using name fields
      // This is just a placeholder implementation
      queryRef = query(queryRef, where("name", "==", searchText));
    }

    if (memberTypeFilter !== "all") {
      queryRef = query(queryRef, where("member_type", "==", memberTypeFilter));
    }

    if (lastVisible) {
      queryRef = query(queryRef, startAfter(lastVisible));
    }

    console.log("Executing query:", queryRef); // Debug log

    const querySnapshot = await getDocs(queryRef);

    const users = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        city: data.city,
        createdTime: data.created_time,
        displayName: data.display_name,
        email: data.email,
        lastName: data.last_name,
        memberType: data.member_type,
        middleName: data.middle_name,
        userStatus: data.user_status,
      };
    });

    console.log("Fetched users data:", users); // Debug log

    return {
      users,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      hasMore: querySnapshot.docs.length === pageSize,
    };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

const updateUser = async (id, updatedData) => {
  const usersRef = doc(fs, "users", id);
  await updateDoc(usersRef, updatedData);
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



export { getAppointments, updateAppointment, getUsers, updateUser, getUserById };