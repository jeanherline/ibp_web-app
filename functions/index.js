const express = require('express');
const { google } = require('googleapis');
const functions = require('firebase-functions/v1'); // Explicitly using v1
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Google OAuth2 client using environment variables
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
    const event = {
      summary: 'Online Consultation',
      description: 'Consultation with client.',
      start: {
        dateTime: appointmentDate,
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: new Date(new Date(appointmentDate).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'Asia/Manila',
      },
      attendees: [{ email: clientEmail }],
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    res.status(200).json({ hangoutLink: response.data.hangoutLink });
  } catch (error) {
    console.error('Error creating Google Meet event:', error.message || error);
    res.status(500).json({ error: 'Failed to create Google Meet event. Please try again later.' });
  }
});

// Correct usage of functions.region
exports.createGoogleMeet = functions.region('us-central1').https.onRequest(app);
