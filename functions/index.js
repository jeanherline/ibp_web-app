const express = require('express');
const { google } = require('googleapis');
const functions = require('firebase-functions');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Set the OAuth2 credentials (ensure you have a refresh token setup)
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});



const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// API route to create a Google Meet
app.post('/create-google-meet', async (req, res) => {
  const { appointmentDate, clientEmail } = req.body;

  if (!appointmentDate || !clientEmail) {
    return res.status(400).send('Missing required fields');
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
          requestId: 'random-string',
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
    console.error('Error creating Google Meet event:', error);
    res.status(500).send('Failed to create Google Meet event');
  }
});

// Export the function
exports.createGoogleMeet = functions.https.onRequest(app);
