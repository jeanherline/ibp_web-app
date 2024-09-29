import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import {
  getUserById,
  updateUser,
  uploadImage,
} from "../../Config/FirebaseServices";
import { useAuth } from "../../AuthContext";
import { getAuth, GoogleAuthProvider, linkWithPopup, fetchSignInMethodsForEmail } from "firebase/auth";
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
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false); // For Google Auth linking status

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await getUserById(currentUser.uid);
      setUserData(user);
      setImageUrl(user.photo_url || defaultImageUrl);
      checkGoogleLinked(); // Check if Google account is already linked
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

  const checkGoogleLinked = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const signInMethods = await fetchSignInMethodsForEmail(user.email);
      if (signInMethods.includes("google.com")) {
        setIsGoogleLinked(true);
      }
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
      setSnackbarMessage("Failed to link Google account. Please try again.");
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
              <div className="form-group submit-group">
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
                  disabled={isGoogleLinked} // Disable the button if Google account is already linked
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
