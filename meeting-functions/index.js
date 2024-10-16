const functions = require("firebase-functions");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

// Initialize Secret Manager Client
const secretManagerClient = new SecretManagerServiceClient();

// Function to get secret from Firebase Secret Manager
async function getSecret() {
  const [version] = await secretManagerClient.accessSecretVersion({
    name: 'projects/lawyer-app-ed056/secrets/PRIVATE_KEY/versions/latest',
  });
  const privateKey = version.payload.data.toString('utf8');
  return privateKey;
}

// Route to generate JWT
app.get('/generate-jwt', async (req, res) => {
  try {
    const { roomName } = req.query;

    // Retrieve private key from Secret Manager
    const privateKey = await getSecret();

    // Define the payload for the JWT
    const payload = {
      aud: 'jitsi',
      iss: 'vpaas-magic-cookie-ef5ce88c523d41a599c8b1dc5b3ab765', // Your AppID
      sub: 'vpaas-magic-cookie-ef5ce88c523d41a599c8b1dc5b3ab765', // Your AppID
      room: roomName, // Room name to identify the meeting
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expiry time (e.g., 1 hour)
      context: {
        user: {
          moderator: "true", // Set moderator flag
        }
      }
    };

    // Sign the token with your private key
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

    // Return the JWT token
    res.json({ token });
  } catch (err) {
    console.error('Error generating JWT:', err);
    res.status(500).send('Failed to generate JWT');
  }
});

// Export your Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
