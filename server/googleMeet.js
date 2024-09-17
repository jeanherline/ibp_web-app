const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Path to your service account JSON file (update to your path)
const keyPath = path.join(__dirname, '../keys/google-meet-services.json');

// Initialize Google Auth Client
const auth = new google.auth.GoogleAuth({
  keyFile: keyPath,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

// Ensure auth is working
auth.getClient().then((client) => {
  console.log("Google API authenticated successfully");
}).catch((error) => {
  console.error("Authentication error: ", error.message);
});

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

    // Logging the full response to debug
    console.log('Event creation response:', response.data);
    if (response.data.hangoutLink) {
      console.log('Google Meet link created:', response.data.hangoutLink);
    } else {
      console.warn('Google Meet link not found in response');
    }
    
    return response.data.hangoutLink; // Return the Meet link
    
  } catch (error) {
    console.error('Error creating Google Meet event:', error.response?.data || error.message);
    throw error;
  }
};


module.exports = { createGoogleMeetEvent };
