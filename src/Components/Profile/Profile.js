import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import {
  getUserById,
  updateUser,
  uploadImage,
  linkGoogleAccount,
} from "../../Config/FirebaseServices"; // import the linkGoogleAccount function
import { useAuth } from "../../AuthContext";
import "./Profile.css";
import { getAuth, GoogleAuthProvider, linkWithPopup } from "firebase/auth";

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
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await getUserById(currentUser.uid);
      setUserData(user);
      setImageUrl(user.photo_url || defaultImageUrl);
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProfileImage(e.target.files[0]);
      const objectUrl = URL.createObjectURL(e.target.files[0]);
      setImageUrl(objectUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let updatedData = { ...userData };

    // Remove any invalid keys from updatedData
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] === "") {
        delete updatedData[key];
      }
    });

    if (profileImage) {
      const imageUrl = await uploadImage(
        profileImage,
        `profile_images/${currentUser.uid}`
      );
      updatedData.photo_url = imageUrl;
    }

    try {
      await updateUser(currentUser.uid, updatedData);
      setSnackbarMessage("Profile has been successfully updated.");
    } catch (error) {
      setSnackbarMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  const handleGoogleConnect = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      await linkWithPopup(auth.currentUser, provider);
      setSnackbarMessage("Google account successfully linked.");
    } catch (error) {
      console.error("Error linking Google account:", error);
      setSnackbarMessage("Failed to link Google account.");
    } finally {
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
        <br />
        <h3>Edit Profile</h3>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="profile-section">
            <div className="profile-image">
              <div className="image-wrapper">
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
            </div>
            <div className="profile-details">
              {/* Existing form fields */}
              <div className="form-group">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </button>
              </div>

              {/* Google Connect Button */}
              <div className="form-group">
                <button
                  type="button"
                  className="google-connect-button"
                  onClick={handleGoogleConnect}
                >
                  Connect Google Account
                </button>
              </div>
            </div>
          </div>
        </form>
        {showSnackbar && <div className="snackbar">{snackbarMessage}</div>}
      </div>
    </div>
  );
}

export default Profile;
