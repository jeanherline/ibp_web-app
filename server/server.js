const express = require('express');
const { createGoogleMeetEvent } = require('./googleMeet');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json()); // To handle JSON requests

// Endpoint to create Google Meet event
app.post('/api/create-google-meet', async (req, res) => {
  const { appointmentDate, clientEmail } = req.body;

  try {
    const eventData = await createGoogleMeetEvent(new Date(appointmentDate), clientEmail);
    res.status(200).json({ hangoutLink: eventData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Google Meet event' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
