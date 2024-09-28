const express = require('express');
const { google } = require('googleapis');
const functions = require('firebase-functions/v2'); // Use v2 for Gen 2 functions
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Initialize Google OAuth2 client using environment variables
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID, 
  process.env.GOOGLE_CLIENT_SECRET
);

// Ensure refresh token is set
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Initialize Google Calendar API
const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// API endpoint to create Google Meet
app.post('/create-google-meet', async (req, res) => {
  const { appointmentDate, clientEmail } = req.body;

  // Validate the request
  if (!appointmentDate || !clientEmail) {
    return res.status(400).json({ 
      error: 'Missing required fields: appointmentDate and clientEmail are required.' 
    });
  }

  try {
    // Prepare the event object for Google Calendar
    const event = {
      summary: 'Online Consultation',
      description: 'Consultation with client.',
      start: {
        dateTime: new Date(appointmentDate).toISOString(),
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: new Date(new Date(appointmentDate).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'Asia/Manila',
      },
      attendees: [{ email: clientEmail }],
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),  // Random ID to avoid duplication
          conferenceSolutionKey: { type: 'hangoutsMeet' },  // Request a Google Meet link
        },
      },
    };

    // Insert the event into the Google Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,  // Ensure conference data is created (for Meet link)
    });

    // Respond with the created Google Meet link
    res.status(200).json({ hangoutLink: response.data.hangoutLink });
  } catch (error) {
    console.error('Error creating Google Meet event:', error.message || error);
    res.status(500).json({ error: 'Failed to create Google Meet event. Please try again later.' });
  }
});

// Firebase Functions deployment configuration
exports.createGoogleMeet = functions
  .runWith({ memory: '256MB', cpu: 1 })  // Valid options for Gen 2
  .region('us-central1')  // Set your preferred region
  .https.onRequest(app);
