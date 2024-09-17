const express = require('express');
const { createGoogleMeetEvent } = require('./googleMeet'); // Import the Google Meet logic
const dotenv = require('dotenv');

// Initialize dotenv to access environment variables
dotenv.config();

const app = express();
app.use(express.json()); // To handle JSON requests

// Endpoint to create Google Meet event
app.post('/api/create-google-meet', async (req, res) => {
  const { appointmentDate, clientEmail } = req.body;

  try {
    const eventData = await createGoogleMeetEvent(new Date(appointmentDate), clientEmail);
    res.status(200).json(eventData);  // Return the event details (includes the Meet link)
  } catch (error) {
    console.error('Error creating Google Meet event:', error);
    res.status(500).json({ error: 'Failed to create Google Meet event' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
