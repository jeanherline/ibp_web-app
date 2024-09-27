const { OAuth2Client } = require('google-auth-library');
const functions = require('firebase-functions');
const express = require('express');
const { google } = require('googleapis');
const app = express();
const cors = require('cors');
app.use(cors({ origin: true }));
app.use(express.json());

const oAuth2Client = new google.auth.OAuth2(
  functions.config().google.client_id,
  functions.config().google.client_secret,
  functions.config().google.redirect_uri
);

// Middleware to authenticate Firebase token and retrieve user info
const authenticateFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send('Unauthorized');
  }
};

app.post('/create-google-meet', authenticateFirebaseToken, async (req, res) => {
  const { appointmentDate, clientEmail } = req.body;

  if (!appointmentDate || !clientEmail) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const tokens = req.user.googleTokens; // Retrieve OAuth tokens from Firestore or DB

    // Ensure the lawyer has OAuth tokens, or initiate the OAuth flow
    if (!tokens || !tokens.access_token) {
      return res.status(401).json({ error: 'Google authentication required' });
    }

    // Set the OAuth2 credentials for the current user
    oAuth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

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

exports.createGoogleMeet = functions.https.onRequest(app);
