import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import {
  getUserById,
  updateUser,
  uploadImage,
  createAppointment,
  generateControlNumber,
  generateQrCodeImageUrl,
} from "../../Config/FirebaseServices";
import { useAuth } from "../../AuthContext";
import Camera, { FACING_MODES, IMAGE_TYPES } from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";
import "./WalkInForm.css";

const defaultImageUrl =
  "https://as2.ftcdn.net/v2/jpg/03/49/49/79/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5.jpg";

function WalkInForm() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState({
    display_name: "",
    middle_name: "",
    last_name: "",
    selectedAssistanceType: "",
    dob: "",
    phone: "",
    gender: "",
    city: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannedDocuments, setScannedDocuments] = useState({
    applicationFormPage1: null,
    applicationFormPage2: null,
    certificateBarangay: null,
    certificateDSWD: null,
    disqualificationLetterPAO: null,
  });
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [currentDocumentType, setCurrentDocumentType] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const user = await getUserById(currentUser.uid);
          setUserData(user);
          setImageUrl(user.photo_url || defaultImageUrl);
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      }
    };

    fetchUserData();
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

  const handleTakePhoto = (dataUri) => {
    setScannedDocuments((prev) => ({ ...prev, [currentDocumentType]: dataUri }));
    setSnackbarMessage(
      `Successfully captured ${currentDocumentType
        .replace(/([A-Z])/g, " $1")
        .trim()}`
    );
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
    setShowCamera(false);
  };

  const handleDocumentScan = (documentType) => {
    setCurrentDocumentType(documentType);
    setShowCamera(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      // Upload profile image if available
      let photo_url;
      if (profileImage) {
        photo_url = await uploadImage(profileImage, `profile_images/${currentUser.uid}`);
        setUserData((prev) => ({ ...prev, photo_url }));
      }
  
      // Upload scanned documents
      const uploadDocument = async (file, path) => {
        if (file) {
          return await uploadImage(file, path);
        }
        return null;
      };
  
      const form1Url = await uploadDocument(scannedDocuments.applicationFormPage1, `documents/${currentUser.uid}/applicationFormPage1`);
      const form2Url = await uploadDocument(scannedDocuments.applicationFormPage2, `documents/${currentUser.uid}/applicationFormPage2`);
      const barangayImageUrl = await uploadDocument(scannedDocuments.certificateBarangay, `documents/${currentUser.uid}/certificateBarangay`);
      const dswdImageUrl = await uploadDocument(scannedDocuments.certificateDSWD, `documents/${currentUser.uid}/certificateDSWD`);
      const paoImageUrl = await uploadDocument(scannedDocuments.disqualificationLetterPAO, `documents/${currentUser.uid}/disqualificationLetterPAO`);
  
      await updateUser(currentUser.uid, userData);
  
      const controlNumber = generateControlNumber();
      const qrCodeUrl = await generateQrCodeImageUrl(controlNumber);
  
      const appointmentData = {
        applicantProfile: {
          city: userData.city,
          uid: currentUser.uid,
          dob: userData.dob,
          fullName: `${userData.display_name} ${userData.middle_name} ${userData.last_name}`,
          gender: userData.gender,
          contactNumber: userData.phone,
        },
        appointmentDetails: {
          appointmentStatus: "pending",
          controlNumber,
          createdDate: new Date(),
          apptType: "Walk-in",
          qrCode: qrCodeUrl,
        },
        legalAssistanceRequested: {
          selectedAssistanceType: userData.selectedAssistanceType,
        },
        uploadedImages: {
          form1: form1Url,
          form2: form2Url,
          barangayImageUrl: barangayImageUrl,
          dswdImageUrl: dswdImageUrl,
          paoImageUrl: paoImageUrl,
        },
      };
  
      console.log("Appointment Data: ", appointmentData);
  
      await createAppointment(appointmentData);
  
      setSnackbarMessage("Walk-In form has been successfully submitted.");
    } catch (error) {
      console.error("Error submitting form: ", error.message);
      setSnackbarMessage(`Failed to submit form. Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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
        <h3>Walk-In Form</h3>
        <br />
        <form onSubmit={handleSubmit} className="walkin-form">
          <div className="profile-section">
            <div className="profile-details">
              <div className="form-group">
                <label htmlFor="display_name">First Name</label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  placeholder="First Name"
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
                  placeholder="Middle Name"
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
                  placeholder="Last Name"
                  value={userData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="selectedAssistanceType">
                  Nature of Legal Assistance Requested
                </label>
                <select
                  id="selectedAssistanceType"
                  name="selectedAssistanceType"
                  value={userData.selectedAssistanceType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Nature of Legal Assistance</option>
                  <option value="Payong Legal (Legal Advice)">
                    Payong Legal (Legal Advice)
                  </option>
                  <option value="Legal na Representasyon (Legal Representation)">
                    Legal na Representasyon (Legal Representation)
                  </option>
                  <option value="Pag gawa ng Legal na Dokumento (Drafting of Legal Document)">
                    Pag gawa ng Legal na Dokumento (Drafting of Legal Document)
                  </option>
                </select>
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
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  placeholder="Phone Number"
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
              <div className="form-group scan-buttons">
                <button
                  type="button"
                  className="scan-button"
                  onClick={() => handleDocumentScan("applicationFormPage1")}
                >
                  Capture Application Form Page 1
                </button>
                <button
                  type="button"
                  className="scan-button"
                  onClick={() => handleDocumentScan("applicationFormPage2")}
                >
                  Capture Application Form Page 2
                </button>
                <button
                  type="button"
                  className="scan-button"
                  onClick={() =>
                    handleDocumentScan("certificateBarangay")
                  }
                >
                  Capture Certificate of Indigency from Barangay
                </button>
                <button
                  type="button"
                  className="scan-button"
                  onClick={() =>
                    handleDocumentScan("certificateDSWD")
                  }
                >
                  Capture Certificate of Indigency from DSWD
                </button>
                <button
                  type="button"
                  className="scan-button"
                  onClick={() =>
                    handleDocumentScan("disqualificationLetterPAO")
                  }
                >
                  Capture Disqualification Letter from PAO
                </button>
              </div>
              <div className="form-group submit-group">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Walk-In Form"}
                </button>
              </div>
            </div>
          </div>
          <br />
          <div className="scanned-documents">
            <h4>Captured Documents</h4>
            <div>
              {scannedDocuments.applicationFormPage1 && (
                <div className="document-thumbnail">
                  <img
                    src={scannedDocuments.applicationFormPage1}
                    alt="Application Form Page 1"
                  />
                  <p>Application Form Page 1</p>
                </div>
              )}
              {scannedDocuments.applicationFormPage2 && (
                <div className="document-thumbnail">
                  <img
                    src={scannedDocuments.applicationFormPage2}
                    alt="Application Form Page 2"
                  />
                  <p>Application Form Page 2</p>
                </div>
              )}
              {scannedDocuments.certificateBarangay && (
                <div className="document-thumbnail">
                  <img
                    src={scannedDocuments.certificateBarangay}
                    alt="Certificate of Indigency from Barangay"
                  />
                  <p>Certificate of Indigency from Barangay</p>
                </div>
              )}
              {scannedDocuments.certificateDSWD && (
                <div className="document-thumbnail">
                  <img
                    src={scannedDocuments.certificateDSWD}
                    alt="Certificate of Indigency from DSWD"
                  />
                  <p>Certificate of Indigency from DSWD</p>
                </div>
              )}
              {scannedDocuments.disqualificationLetterPAO && (
                <div className="document-thumbnail">
                  <img
                    src={scannedDocuments.disqualificationLetterPAO}
                    alt="Disqualification Letter from PAO"
                  />
                  <p>Disqualification Letter from PAO</p>
                </div>
              )}
            </div>
          </div>
        </form>
        {showSnackbar && <div className="snackbar">{snackbarMessage}</div>}
        {showCamera && (
          <div className="camera-container">
            <div className="camera-header">
              <h4>Capture {currentDocumentType.replace(/([A-Z])/g, ' $1').trim()}</h4>
              <button onClick={() => setShowCamera(false)} className="close-camera-button">Close</button>
            </div>
            <Camera
              onTakePhoto={(dataUri) => { handleTakePhoto(dataUri); }}
              idealFacingMode={FACING_MODES.ENVIRONMENT}
              imageType={IMAGE_TYPES.JPG}
              isImageMirror={false}
              sizeFactor={1}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default WalkInForm;
