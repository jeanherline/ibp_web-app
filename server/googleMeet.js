const { google } = require('googleapis');

// Parse the service account key from the environment variable
const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

// Initialize Google Auth Client
const auth = new google.auth.JWT(
  serviceAccountKey.client_email,
  null,
  serviceAccountKey.private_key,
  ['https://www.googleapis.com/auth/calendar']
);

// Function to create a Google Meet event
const createGoogleMeetEvent = async (appointmentDate, clientEmail) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: 'Consultation with Lawyer',
      location: 'Online via Google Meet',
      description: 'Legal Consultation',
      start: {
        dateTime: appointmentDate.toISOString(),
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: new Date(appointmentDate.getTime() + 60 * 60 * 1000).toISOString(),
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

    return response.data.hangoutLink;
  } catch (error) {
    console.error('Error creating Google Meet event:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { createGoogleMeetEvent };
