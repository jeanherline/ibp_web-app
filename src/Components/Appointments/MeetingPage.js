import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { fs } from "../../Config/Firebase";
import SideNavBar from "../SideNavBar/SideNavBar";
import "./Appointments.css";

const MeetingPage = () => {
  const { id } = useParams(); // Get the meeting ID from the route params
  const [meetingData, setMeetingData] = useState(null);
  const [lawyerData, setLawyerData] = useState(null); // State to store lawyer's data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const jitsiApiRef = useRef(null); // Ref to store the Jitsi API instance
  const navigate = useNavigate(); // Hook to navigate to the /lawyer page

  // Fetch meeting details from Firestore
  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        const meetingDoc = await getDoc(doc(fs, "appointments", id)); // Fetch meeting from Firestore
        if (meetingDoc.exists()) {
          setMeetingData(meetingDoc.data());
        } else {
          setError("No such meeting found!");
        }
      } catch (err) {
        console.error("Error fetching meeting:", err);
        setError("Failed to load meeting details.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingDetails();
  }, [id]);

  // Fetch lawyer data
  useEffect(() => {
    const fetchLawyerData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          const userDoc = await getDoc(doc(fs, "users", user.uid)); // Fetch current authenticated user
          if (userDoc.exists()) {
            setLawyerData(userDoc.data()); // Store lawyer's data
          } else {
            setError("User data not found");
          }
        } catch (err) {
          console.error("Error fetching lawyer data:", err);
          setError("Failed to load lawyer data.");
        }
      } else {
        setError("No authenticated user");
      }
    };

    fetchLawyerData();
  }, []);

  // Get display name for the lawyer
  const getDisplayName = () => {
    if (!lawyerData) return "Lawyer";
    const title = lawyerData.gender === "Male" ? "Mr." : "Ms.";
    return `${title} ${lawyerData.display_name} ${lawyerData.last_name}`;
  };

  // Start Jitsi meeting
  const startJitsiMeeting = useCallback(() => {
    if (!window.JitsiMeetExternalAPI) {
      console.error("JitsiMeetExternalAPI not loaded.");
      return;
    }

    // Clean up previous Jitsi instance if it exists
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose(); // Dispose of the existing Jitsi instance
    }

    try {
      const domain = "8x8.vc";
      const roomName = meetingData.appointmentDetails?.meetingLink
        .split("/")
        .pop();

      if (!roomName) {
        console.error("Room name is missing or invalid");
        return;
      }

      const options = {
        roomName: `vpaas-magic-cookie-ef5ce88c523d41a599c8b1dc5b3ab765/${roomName}`,
        parentNode: document.querySelector("#jaas-container"),
        userInfo: {
          displayName: getDisplayName(),
        },
        configOverwrite: {
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          prejoinPageEnabled: false,
          enableUserRolesBasedOnToken: true,
        },
        interfaceConfigOverwrite: {
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);

      // Add event listeners to monitor the meeting
      api.on("participantJoined", (participant) => {
        console.log("Participant joined:", participant);
      });

      api.on("videoConferenceLeft", () => {
        console.log("User left the meeting. Navigating back to /lawyer...");
        navigate("/lawyer"); // Navigate to the /lawyer page
      });

      api.on("videoConferenceJoined", () => {
        console.log("Joined the meeting!");
      });

      jitsiApiRef.current = api; // Store the Jitsi API instance
    } catch (error) {
      console.error("Error initializing Jitsi meeting:", error);
    }
  }, [meetingData, getDisplayName, navigate]);

  // Load Jitsi API script and start the meeting
  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src =
        "https://8x8.vc/vpaas-magic-cookie-ef5ce88c523d41a599c8b1dc5b3ab765/external_api.js";
      script.async = true;
      script.onload = () => {
        if (meetingData) {
          startJitsiMeeting();
        }
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup the script and Jitsi instance on component unmount
        document.body.removeChild(script);
        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose(); // Dispose of the existing Jitsi instance
        }
      };
    } else if (meetingData) {
      startJitsiMeeting(); // Start meeting if script is already loaded
    }
  }, [meetingData, startJitsiMeeting]);

  if (loading) {
    return <div>Loading meeting...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!meetingData) {
    return <div>No meeting found</div>;
  }

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
        <br />
        <h3>Meeting Details</h3>
        <br />
        <div
          id="jaas-container"
          style={{ height: "800px", width: "100%" }}
        ></div>
      </div>
    </div>
  );
};

export default MeetingPage;
