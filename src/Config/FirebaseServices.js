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
  addDoc, 
  setDoc,
  serverTimestamp 
} from "firebase/firestore"; // Import necessary functions directly from Firebase Firestore
import { fs } from "./Firebase"; // Import fs from your Firebase configuration file
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

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
        appointmentDetails: data.appointmentDetails,
        reviewerDetails: data.reviewerDetails,
        proceedingNotes: data.proceedingNotes, // Include proceedingNotes
      };
    }),
    total: totalQuery.size,
    firstDoc: querySnapshot.docs[0],
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
  };
};


const getLawyerCalendar = async (assignedLawyer) => {
  const appointmentsRef = collection(fs, "appointments");
  const q = query(
    appointmentsRef,
    where("appointmentDetails.appointmentStatus", "==", "scheduled"),
    where("appointmentDetails.assignedLawyer", "==", assignedLawyer)
  );
  const querySnapshot = await getDocs(q);

  const bookedSlots = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.appointmentDetails?.appointmentDate) {
      bookedSlots.push({
        appointmentDate: data.appointmentDetails.appointmentDate.toDate(),
        fullName: data.applicantProfile?.fullName,
        contactNumber: data.applicantProfile?.contactNumber,
      });
    }
  });

  return bookedSlots;
};

const aptsLawyerCalendar = async (
  statusFilters,
  lastVisible,
  pageSize = 7,
  searchText = "",
  assignedLawyer = "",
  assistanceFilter = "all",
  isPrevious = false
) => {
  try {
    let queryRef = collection(fs, "appointments");

    const updatedStatusFilters = ["done", "scheduled"];
    queryRef = query(
      queryRef,
      where("appointmentDetails.appointmentStatus", "in", updatedStatusFilters),
      where("appointmentDetails.assignedLawyer", "==", assignedLawyer)
    );

    if (assistanceFilter !== "all") {
      queryRef = query(queryRef, where("legalAssistanceRequested.selectedAssistanceType", "==", assistanceFilter));
    }

    queryRef = query(queryRef, orderBy("appointmentDetails.controlNumber"), limit(pageSize));

    if (lastVisible) {
      queryRef = isPrevious
        ? query(queryRef, startAt(lastVisible?.appointmentDetails?.controlNumber || ""))
        : query(queryRef, startAfter(lastVisible?.appointmentDetails?.controlNumber || ""));
    }

    const querySnapshot = await getDocs(queryRef);

    const filtered = querySnapshot.docs.filter(
      (doc) =>
        doc.data().applicantProfile?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        doc.data().applicantProfile?.address?.toLowerCase().includes(searchText.toLowerCase()) ||
        doc.data().applicantProfile?.contactNumber?.includes(searchText) ||
        doc.data().appointmentDetails?.controlNumber?.includes(searchText) ||
        doc.data().legalAssistanceRequested?.selectedAssistanceType?.toLowerCase().includes(searchText.toLowerCase())
    );

    const totalQuery = await getDocs(
      query(
        collection(fs, "appointments"),
        where("appointmentDetails.appointmentStatus", "in", updatedStatusFilters),
        where("appointmentDetails.assignedLawyer", "==", assignedLawyer)
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
          appointmentDetails: data.appointmentDetails,
        };
      }),
      total: totalQuery.size,
      firstDoc: querySnapshot.docs[0],
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    throw error;
  }
};

const aptsCalendar = async (
  statusFilters,
  lastVisible,
  pageSize = 7,
  searchText = "",
  assistanceFilter = "all",
  isPrevious = false
) => {
  try {
    let queryRef = collection(fs, "appointments");

    // Ensure statusFilters include "done" and "scheduled"
    const updatedStatusFilters = ["done", "scheduled"];
    queryRef = query(queryRef, where("appointmentDetails.appointmentStatus", "in", updatedStatusFilters));

    if (assistanceFilter !== "all") {
      queryRef = query(queryRef, where("legalAssistanceRequested.selectedAssistanceType", "==", assistanceFilter));
    }

    queryRef = query(queryRef, orderBy("appointmentDetails.controlNumber"), limit(pageSize));

    if (lastVisible) {
      queryRef = isPrevious
        ? query(queryRef, startAt(lastVisible?.appointmentDetails?.controlNumber || ""))
        : query(queryRef, startAfter(lastVisible?.appointmentDetails?.controlNumber || ""));
    }

    const querySnapshot = await getDocs(queryRef);

    const filtered = querySnapshot.docs.filter(
      (doc) =>
        doc.data().applicantProfile?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        doc.data().applicantProfile?.address?.toLowerCase().includes(searchText.toLowerCase()) ||
        doc.data().applicantProfile?.contactNumber?.includes(searchText) ||
        doc.data().appointmentDetails?.controlNumber?.includes(searchText) ||
        doc.data().legalAssistanceRequested?.selectedAssistanceType?.toLowerCase().includes(searchText.toLowerCase())
    );

    const totalQuery = await getDocs(
      query(
        collection(fs, "appointments"),
        where("appointmentDetails.appointmentStatus", "in", updatedStatusFilters)
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
          appointmentDetails: data.appointmentDetails,
        };
      }),
      total: totalQuery.size,
      firstDoc: querySnapshot.docs[0],
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    throw error;
  }
};

const getLawyerAppointments = async (
  filter,
  lastVisible,
  pageSize,
  searchText,
  natureOfLegalAssistanceFilter,
  currentUser,
  appointmentStatus,
  assignedLawyer
) => {
  try {
    let queryRef = collection(fs, "appointments");

    // Apply appointment status filter
    if (filter && filter !== "all") {
      queryRef = query(queryRef, where("appointmentDetails.appointmentStatus", "==", filter));
    }

    if (natureOfLegalAssistanceFilter !== "all") {
      queryRef = query(queryRef, where("legalAssistanceRequested.selectedAssistanceType", "==", natureOfLegalAssistanceFilter));
    }

    if (assignedLawyer) {
      queryRef = query(queryRef, where("appointmentDetails.assignedLawyer", "==", assignedLawyer));
    }

    // Order by controlNumber and limit results for pagination
    queryRef = query(queryRef, orderBy("appointmentDetails.controlNumber"), limit(pageSize));

    // Handle pagination
    if (lastVisible) {
      queryRef = query(queryRef, startAfter(lastVisible));
    }

    const querySnapshot = await getDocs(queryRef);

    // Filter results by searchText, if any
    const filtered = querySnapshot.docs.filter(
      (doc) => {
        const data = doc.data();
        return (
          data.applicantProfile?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
          data.applicantProfile?.address?.toLowerCase().includes(searchText.toLowerCase()) ||
          data.applicantProfile?.contactNumber?.includes(searchText) ||
          data.appointmentDetails?.controlNumber?.includes(searchText) ||
          data.legalAssistanceRequested?.selectedAssistanceType?.toLowerCase().includes(searchText.toLowerCase())
        );
      }
    );

    // Manually count total documents matching the filters
    let totalQueryRef = collection(fs, "appointments");
    if (filter && filter !== "all") {
      totalQueryRef = query(totalQueryRef, where("appointmentDetails.appointmentStatus", "==", filter));
    }
    if (natureOfLegalAssistanceFilter !== "all") {
      totalQueryRef = query(totalQueryRef, where("legalAssistanceRequested.selectedAssistanceType", "==", natureOfLegalAssistanceFilter));
    }
    if (assignedLawyer) {
      totalQueryRef = query(totalQueryRef, where("appointmentDetails.assignedLawyer", "==", assignedLawyer));
    }
    const totalQuerySnapshot = await getDocs(totalQueryRef);
    const total = totalQuerySnapshot.size;

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
          appointmentDetails: data.appointmentDetails,
        };
      }),
      total: total,
      firstDoc: querySnapshot.docs[0],
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    throw error;
  }
};

const updateAppointment = async (appointmentId, updatedData) => {
  const appointmentRef = doc(fs, "appointments", appointmentId);
  await updateDoc(appointmentRef, updatedData);
};

export const getBookedSlots = async () => {
  const appointmentsRef = collection(fs, "appointments");
  const q = query(
    appointmentsRef,
    where("appointmentDetails.appointmentStatus", "==", "scheduled")
  ); 
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
    where("appointmentDetails.appointmentStatus", "==", "scheduled")
  );
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

const addUser = async (userData) => {
  const {
    display_name,
    middle_name,
    last_name,
    dob,
    email,
    password,
    city,
    member_type,
    user_status,
  } = userData;

  const auth = getAuth();
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get the user's UID
    const uid = user.uid;

    // Reference to the users collection
    const userCollectionRef = collection(fs, "users");

    // Create a document in Firestore with the UID as the document ID
    const userDocRef = doc(userCollectionRef, uid);
    await setDoc(userDocRef, {
      display_name: display_name,
      middle_name: middle_name,
      last_name: last_name,
      dob: dob, // Assuming dob is a Date object or a valid Firestore timestamp
      email: email,
      password: password,
      city: city,
      member_type: member_type,
      user_status: user_status || "active", // Defaulting to "active" if user_status is not provided
      created_time: serverTimestamp(),
      uid: uid
    });
  } catch (error) {
    console.error("Error creating user:", error);
    // Handle errors here
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


// Function to get users with pagination, filtering, and search
export const getRatingsUsers = async (filterStatus, cityFilter, searchText, lastVisible, pageSize) => {
  let query = fs.collection("users");

  // Apply city filter
  if (cityFilter !== "all") {
    query = query.where("city", "==", cityFilter);
  }

  // Apply search text filter
  if (searchText) {
    query = query.where("display_name", ">=", searchText).where("display_name", "<=", searchText + "\uf8ff");
  }

  // Apply pagination
  if (lastVisible) {
    query = query.startAfter(lastVisible);
  }

  query = query.limit(pageSize);

  const snapshot = await query.get();
  const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

  return { users, lastVisibleDoc };
};

// Function to get total user count with filters and search
export const getRatingsUsersCount = async (filterStatus, cityFilter, searchText) => {
  let query = fs.collection("users");

  // Apply city filter
  if (cityFilter !== "all") {
    query = query.where("city", "==", cityFilter);
  }

  // Apply search text filter
  if (searchText) {
    query = query.where("display_name", ">=", searchText).where("display_name", "<=", searchText + "\uf8ff");
  }

  const snapshot = await query.get();
  return snapshot.size;
};

// Function to get appointment ratings for a specific user
export const getRatingsAppointmentsRatings = async (userId) => {
  const appointmentsRef = fs.collection("appointments");
  const snapshot = await appointmentsRef.where("userId", "==", userId).get();
  const ratings = [];

  snapshot.forEach(doc => {
    const appointment = doc.data();
    if (appointment.appointmentDetails && appointment.appointmentDetails.aptRating !== undefined) {
      ratings.push(appointment.appointmentDetails.aptRating);
    }
  });

  return ratings;
};

// Function to get application ratings for a specific user
export const getRatingsAppRatings = async (userId) => {
  const usersRef = fs.collection("users").doc(userId);
  const doc = await usersRef.get();

  if (doc.exists && doc.data().appRating !== undefined) {
    return [doc.data().appRating];
  }

  return [];
};

export { getAppointments, updateAppointment, getLawyerAppointments, getLawyerCalendar, aptsLawyerCalendar, getUsers, updateUser, addUser, getUserById, getUsersCount, aptsCalendar};