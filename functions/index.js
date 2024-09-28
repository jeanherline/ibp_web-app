const express = require('express');
const { google } = require('googleapis');
const functions = require('firebase-functions');
const app = express();

// Load environment variables from .env file for local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Middleware to parse JSON requests
app.use(express.json());

// OAuth2 client using environment variables
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || functions.config().google.client_id,
  process.env.GOOGLE_CLIENT_SECRET || functions.config().google.client_secret
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN || functions.config().google.refresh_token,
});

// Google Calendar API instance
const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// API endpoint to create Google Meet
app.post('/create-google-meet', async (req, res) => {
  const { appointmentDate, clientEmail } = req.body;

  // Validate request
  if (!appointmentDate || !clientEmail) {
    return res.status(400).json({ error: 'Missing required fields: appointmentDate and clientEmail are required.' });
  }

  try {
    // Create Google Calendar event
    const event = {
      summary: 'Online Consultation',
      description: 'Consultation with client.',
      start: {
        dateTime: appointmentDate,
        timeZone: 'Asia/Manila',  // Set your timezone
      },
      end: {
        dateTime: new Date(new Date(appointmentDate).getTime() + 60 * 60 * 1000).toISOString(),  // 1-hour meeting
        timeZone: 'Asia/Manila',
      },
      attendees: [{ email: clientEmail }],
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),  // Generate a random request ID
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    // Insert event into the primary Google Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,  // Ensure Google Meet link is generated
    });

    // Respond with the Google Meet link
    res.status(200).json({ hangoutLink: response.data.hangoutLink });
  } catch (error) {
    console.error('Error creating Google Meet event:', error.message || error);
    res.status(500).json({ error: 'Failed to create Google Meet event. Please try again later.' });
  }
});

// Export the function without app.listen()
exports.createGoogleMeet = functions.https.onRequest(app);
