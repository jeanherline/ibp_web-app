import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import {
  getUserById,
  updateUser,
  uploadImage,
} from "../../Config/FirebaseServices";
import { useAuth } from "../../AuthContext";
import {
  getAuth,
  GoogleAuthProvider,
  linkWithPopup,
  fetchSignInMethodsForEmail,
  unlink,
  onAuthStateChanged,
} from "firebase/auth";
import "./Profile.css";

const defaultImageUrl =
  "https://as2.ftcdn.net/v2/jpg/03/49/49/79/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5.jpg";

function Profile() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState({
    display_name: "",
    middle_name: "",
    last_name: "",
    dob: "",
    phone: "",
    gender: "",
    city: "",
    email: "",
    isGoogleConnected: false,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);

  // Fetch user data and check Google linked status
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user data from Firestore
          const fetchedUserData = await getUserById(user.uid);
          if (fetchedUserData) {
            setUserData(fetchedUserData);
            setImageUrl(fetchedUserData.photo_url || defaultImageUrl);

            // Check if Google is linked by checking Firestore
            const googleLinkedStatus = fetchedUserData.isGoogleConnected || false;
            setIsGoogleLinked(googleLinkedStatus);
          }
        } catch (error) {
          console.error("Error fetching user data or checking Google linked status:", error);
        }
      } else {
        resetUserData(); // Reset the state if no user is authenticated
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const resetUserData = () => {
    setUserData({
      display_name: "",
      middle_name: "",
      last_name: "",
      dob: "",
      phone: "",
      gender: "",
      city: "",
      email: "",
      isGoogleConnected: false,
    });
    setImageUrl(defaultImageUrl);
    setIsGoogleLinked(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let updatedData = { ...userData };

    // Remove any invalid keys before submitting
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] === "") {
        delete updatedData[key];
      }
    });

    try {
      if (profileImage) {
        const imageUrl = await uploadImage(profileImage, `profile_images/${currentUser.uid}`);
        updatedData.photo_url = imageUrl;
      }
      await updateUser(currentUser.uid, updatedData);
      setSnackbarMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbarMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  const checkGoogleLinked = async (email) => {
    const auth = getAuth();
    try {
      const signInMethods = await fetchSignInMethodsForEmail(email);

      // If Google is one of the sign-in methods, mark Google as linked
      const isGoogleLinked = signInMethods.includes("google.com");
      setIsGoogleLinked(isGoogleLinked);

      // Update Firestore with the Google linked status
      await updateUser(auth.currentUser.uid, { isGoogleConnected: isGoogleLinked });
    } catch (error) {
      console.error("Error checking Google linked status:", error);
    }
  };

  const handleGoogleConnect = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
  
    try {
      const user = auth.currentUser;
  
      if (!isGoogleLinked) {
        const result = await linkWithPopup(user, provider);
        const googleEmail = result.user.email;
  
        // Log Google account linking step
        console.log("Google account linked, updating Firestore...");
  
        // Check if the user has the isGoogleConnected field in Firestore
        const fetchedUserData = await getUserById(user.uid);
  
        if (!fetchedUserData?.isGoogleConnected) {
          // Field does not exist, add it
          console.log("Adding isGoogleConnected field in Firestore...");
          await updateUser(user.uid, {
            email: googleEmail,
            isGoogleConnected: true,  // Adding the field
          });
        } else {
          // Field exists, simply update it
          console.log("Updating isGoogleConnected to true in Firestore...");
          await updateUser(user.uid, { isGoogleConnected: true });
        }
  
        // Log successful Firestore update
        console.log("isGoogleConnected successfully updated in Firestore.");
  
        // Update local state
        setIsGoogleLinked(true);
        setSnackbarMessage("Google account linked successfully.");
      }
    } catch (error) {
      handleAuthError(error, "Google");
    } finally {
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };
  
  

  const handleGoogleUnlink = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    try {
      await unlink(user, "google.com");

      // Update Firestore to mark Google as unlinked
      await updateUser(user.uid, { isGoogleConnected: false });

      setIsGoogleLinked(false);
      setSnackbarMessage("Google account unlinked successfully.");
    } catch (error) {
      console.error("Error unlinking Google account:", error);
      setSnackbarMessage("Failed to unlink Google account. Please try again.");
    } finally {
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  const handleAuthError = (error, provider) => {
    if (error.code === "auth/popup-closed-by-user") {
      setSnackbarMessage(`${provider} sign-in popup was closed. Please try again.`);
    } else if (error.code === "auth/credential-already-in-use") {
      setSnackbarMessage(`This ${provider} account is already linked to another user.`);
    } else {
      console.error(`Error linking ${provider} account:`, error);
      setSnackbarMessage(`Failed to link ${provider} account. Please try again.`);
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
        <h3>Edit Profile</h3>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="profile-section">
            <div className="profile-image">
              <label htmlFor="profileImage" className="image-label">
                <img src={imageUrl} alt="Profile" className="profile-pic" />
              </label>
              <input
                type="file"
                id="profileImage"
                onChange={handleImageChange}
                className="image-input"
              />
            </div>
            <div className="profile-details">
              <div className="form-group">
                <label htmlFor="display_name">Display Name</label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={userData.display_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="middle_name">Middle Name</label>
                <input
                  type="text"
                  id="middle_name"
                  name="middle_name"
                  value={userData.middle_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={userData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={userData.dob}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={userData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <select
                  id="city"
                  name="city"
                  value={userData.city}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select City</option>
                  <option value="Angat">Angat</option>
                  {/* Add other cities */}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group submit-group">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </button>
              </div>

              {/* Google Connect/Unlink Buttons */}
              <div className="form-group">
                <button
                  type="button"
                  className="google-connect-button"
                  onClick={handleGoogleConnect}
                  disabled={isGoogleLinked}
                >
                  {isGoogleLinked ? "Google Account Linked" : "Connect Google Account"}
                </button>
              </div>

              {isGoogleLinked && (
                <div className="form-group">
                  <button
                    type="button"
                    className="google-unlink-button"
                    onClick={handleGoogleUnlink}
                  >
                    Remove Google Authentication
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
        {showSnackbar && <div className="snackbar">{snackbarMessage}</div>}
      </div>
    </div>
  );
}

export default Profile;