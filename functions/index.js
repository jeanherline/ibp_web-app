const express = require("express");
const { google } = require("googleapis");
const functions = require("firebase-functions/v2"); // Using v2 for Gen 2 functions
const cors = require("cors");

// Initialize Express app
const app = express();

// Enable CORS for all origins or restrict to specific origin
app.use(
  cors({
    origin: "https://lawyer-app-ed056.web.app",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors()); // This ensures preflight requests are handled correctly

// Initialize Google OAuth2 client using environment variables
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Initialize Google Calendar API
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

// Health check route
app.get("/", (req, res) => {
  res.send("Google Meet API is working!");
});

// Route to create Google Meet
app.post("/create-google-meet", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "https://lawyer-app-ed056.web.app");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  const { appointmentDate, clientEmail } = req.body;

  // Validate the request
  if (!appointmentDate || !clientEmail) {
    return res.status(400).json({
      error:
        "Missing required fields: appointmentDate and clientEmail are required.",
    });
  }

  try {
    // Prepare the event object for Google Calendar
    const event = {
      summary: "Online Consultation",
      description: "Consultation with client.",
      start: {
        dateTime: new Date(appointmentDate).toISOString(),
        timeZone: "Asia/Manila",
      },
      end: {
        dateTime: new Date(
          new Date(appointmentDate).getTime() + 60 * 60 * 1000
        ).toISOString(),
        timeZone: "Asia/Manila",
      },
      attendees: [{ email: clientEmail }],
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(7), // Random ID to avoid duplication
          conferenceSolutionKey: { type: "hangoutsMeet" }, // Request a Google Meet link
        },
      },
    };

    // Insert the event into Google Calendar
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1, // Ensure conference data is created (for Meet link)
    });

    // Respond with the created Google Meet link
    return res.status(200).json({ hangoutLink: response.data.hangoutLink });
  } catch (error) {
    console.error("Error creating Google Meet event:", error.message || error);
    if (error.errors) {
      return res.status(500).json({
        error:
          "Failed to create Google Meet event due to Google Calendar API errors.",
        details: error.errors,
      });
    }
    return res.status(500).json({
      error: "Failed to create Google Meet event. Please try again later.",
    });
  }
});

// Export the Express app as a Firebase Cloud Function using Gen 2 Functions
exports.api = functions.https.onRequest(app);
