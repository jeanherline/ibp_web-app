import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import {
  getUserById,
  updateUser,
  uploadImage,
} from "../../Config/FirebaseServices"; // No need to import linkGoogleAccount since we directly use Firebase SDK here
import { useAuth } from "../../AuthContext";
import "./Profile.css";
import { getAuth, GoogleAuthProvider, linkWithPopup, fetchSignInMethodsForEmail, EmailAuthProvider } from "firebase/auth";

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
  const [loading, setLoading] = useState(true); // New loading state
  const [isGoogleLinked, setIsGoogleLinked] = useState(false); // Disable button after linking Google

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      const user = await getUserById(currentUser.uid);
      if (isMounted) {
        setUserData(user);
        setImageUrl(user.photo_url || defaultImageUrl);
        setLoading(false); // Data fetched, stop loading
      }
    };

    if (currentUser) {
      fetchUserData();

      // Check if Google account is already linked
      const googleProvider = currentUser.providerData.find(
        (provider) => provider.providerId === "google.com"
      );
      if (googleProvider) {
        setIsGoogleLinked(true); // Disable button if Google account is linked
      }
    }

    return () => {
      isMounted = false; // Cleanup function to avoid memory leaks
    };
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);

      return () => URL.revokeObjectURL(objectUrl); // Revoke object URL after use
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
      setIsGoogleLinked(true); // Disable button after linking
    } catch (error) {
      console.error("Error linking Google account:", error);
  
      if (error.code === "auth/email-already-in-use") {
        // Email is already in use by another provider
        const email = auth.currentUser.email;
        const existingSignInMethods = await fetchSignInMethodsForEmail(auth, email);
  
        if (existingSignInMethods.includes("password")) {
          // Prompt user for password and link accounts
          const password = prompt("Email is already associated with an email/password account. Please enter your password to link Google account.");
  
          if (password) {
            const credential = EmailAuthProvider.credential(email, password);
  
            try {
              await linkWithCredential(auth.currentUser, credential);
              setSnackbarMessage("Google account successfully linked with email/password account.");
              setIsGoogleLinked(true);
            } catch (linkError) {
              console.error("Error linking accounts:", linkError);
              setSnackbarMessage("Failed to link Google account.");
            }
          }
        } else {
          setSnackbarMessage("Google account is already linked with another provider.");
        }
      } else {
        setSnackbarMessage("Failed to link Google account.");
      }
    } finally {
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Show loading indicator while fetching user data
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
              {/* Form fields */}
              <div className="form-group">
                <input
                  type="text"
                  name="display_name"
                  value={userData.display_name}
                  onChange={handleChange}
                  placeholder="Display Name"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="middle_name"
                  value={userData.middle_name}
                  onChange={handleChange}
                  placeholder="Middle Name"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="last_name"
                  value={userData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                />
              </div>
              <div className="form-group">
                <input
                  type="date"
                  name="dob"
                  value={userData.dob}
                  onChange={handleChange}
                  placeholder="Date of Birth"
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="gender"
                  value={userData.gender}
                  onChange={handleChange}
                  placeholder="Gender"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="city"
                  value={userData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              {/* Submit Button */}
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
                  disabled={isGoogleLinked} // Disable the button if the account is already linked
                >
                  {isGoogleLinked ? "Google Account Linked" : "Connect Google Account"}
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
