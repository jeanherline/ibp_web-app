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
  unlink,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../../Config/Firebase.js";
import "./Profile.css";

const defaultImageUrl =
  "https://firebasestorage.googleapis.com/v0/b/lawyer-app-ed056.appspot.com/o/DefaultUserImage.jpg?alt=media&token=732f4963-f27f-4270-8b7d-9beeb10e6862";

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

  // Fetch current user and update UI
  useEffect(() => {
    const auth = getAuth();

    const checkGoogleLinkedFromFirestore = async (user) => {
      try {
        // Fetch user data from Firestore
        const fetchedUserData = await getUserById(user.uid);

        // Log user data for debugging
        console.log("Fetched User Data:", fetchedUserData);

        if (fetchedUserData) {
          setUserData(fetchedUserData);
          setImageUrl(fetchedUserData.photo_url || defaultImageUrl);

          // Set the `isGoogleLinked` state based on Firestore data
          setIsGoogleLinked(fetchedUserData.isGoogleConnected);
        }
      } catch (error) {
        console.error("Error fetching user data from Firestore:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch Firestore data directly and check if Google is connected
        await checkGoogleLinkedFromFirestore(user);
      } else {
        resetUserData(); // Reset UI when user is not authenticated
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // Debugging: Track if the Google account linked state is updated correctly
  useEffect(() => {
    console.log("Google Linked Status:", isGoogleLinked);
  }, [isGoogleLinked]);

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

  const handleImageChange = async (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl); // Preview the image immediately

      try {
        const imageUrl = await uploadImage(
          file,
          `profile_images/${currentUser.uid}`
        );
        setProfileImage(imageUrl); // Store the uploaded image URL
        await updateUser(currentUser.uid, { photo_url: imageUrl });
      } catch (error) {
        console.error("Error uploading image: ", error);
        setSnackbarMessage("Failed to upload profile image.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let updatedData = { ...userData };

    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] === "") {
        delete updatedData[key];
      }
    });

    try {
      if (profileImage) {
        const imageUrl = await uploadImage(
          profileImage,
          `profile_images/${currentUser.uid}`
        );
        updatedData.photo_url = imageUrl;
      }

      const allowedFields = {
        display_name: updatedData.display_name,
        middle_name: updatedData.middle_name,
        last_name: updatedData.last_name,
        dob: updatedData.dob,
        phone: updatedData.phone,
        gender: updatedData.gender,
        spouse: updatedData.spouse,
        spouseOccupation: updatedData.spouseOccupation,
        email: updatedData.email,
        city: updatedData.city,
        member_type: updatedData.member_type,
        user_status: updatedData.user_status,
        appRating: updatedData.appRating,
        userQrCode: updatedData.userQrCode,
        isGoogleConnected: updatedData.isGoogleConnected,
      };

      // Update the user in Firestore with allowed fields
      await updateUser(currentUser.uid, allowedFields);

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

  const handleGoogleConnect = async () => {
    const provider = new GoogleAuthProvider();
    const user = auth.currentUser;

    try {
      // Link the Google account directly
      const result = await linkWithPopup(user, provider);
      const googleEmail = result.user.email;

      // Update Firestore and set the state accordingly
      if (user.email !== googleEmail) {
        await user.updateEmail(googleEmail);
      }

      await updateUser(user.uid, {
        email: googleEmail,
        isGoogleConnected: true,
      });
      setIsGoogleLinked(true);
      setSnackbarMessage("Google account linked successfully.");
    } catch (error) {
      handleAuthError(error, "Google");
    } finally {
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  const handleGoogleUnlink = async () => {
    try {
      const user = auth.currentUser;

      // Unlink Google account
      await unlink(user, "google.com");

      // Immediately set the state to false before updating Firestore
      setIsGoogleLinked(false);

      // Update Firestore with isGoogleConnected: false
      await updateUser(user.uid, { isGoogleConnected: false });

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
      setSnackbarMessage(
        `${provider} sign-in popup was closed. Please try again.`
      );
    } else if (error.code === "auth/credential-already-in-use") {
      setSnackbarMessage(
        `This ${provider} account is already linked to another user.`
      );
    } else {
      console.error(`Error linking ${provider} account:`, error);
      setSnackbarMessage(
        `Failed to link ${provider} account. Please try again.`
      );
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
                  value={userData.display_name || ""} // Provide a default value to avoid undefined
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
                  value={userData.middle_name || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={userData.last_name || ""}
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
                  value={userData.dob || ""}
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
                  value={userData.phone || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={userData.gender || ""}
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
                  value={userData.city || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select City</option>
                  <option value="Angat">Angat</option>
                  <option value="Balagtas">Balagtas</option>
                  <option value="Baliuag">Baliuag</option>
                  <option value="Bocaue">Bocaue</option>
                  <option value="Bulakan">Bulakan</option>
                  <option value="Bustos">Bustos</option>
                  <option value="Calumpit">Calumpit</option>
                  <option value="Doña Remedios Trinidad">
                    Doña Remedios Trinidad
                  </option>
                  <option value="Guiguinto">Guiguinto</option>
                  <option value="Hagonoy">Hagonoy</option>
                  <option value="Marilao">Marilao</option>
                  <option value="Norzagaray">Norzagaray</option>
                  <option value="Obando">Obando</option>
                  <option value="Pandi">Pandi</option>
                  <option value="Paombong">Paombong</option>
                  <option value="Plaridel">Plaridel</option>
                  <option value="Pulilan">Pulilan</option>
                  <option value="San Ildefonso">San Ildefonso</option>
                  <option value="San Miguel">San Miguel</option>
                  <option value="San Rafael">San Rafael</option>
                  <option value="Santa Maria">Santa Maria</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userData.email || ""}
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

              <div className="form-group">
                <button
                  type="button"
                  className="google-connect-button"
                  onClick={handleGoogleConnect}
                  disabled={isGoogleLinked} // Should disable when Google is linked
                >
                  {isGoogleLinked
                    ? "Google Account Linked"
                    : "Connect Google Account"}
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
