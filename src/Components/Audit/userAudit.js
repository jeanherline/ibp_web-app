import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { fs } from './firebaseConfig'; // Ensure Firestore instance is correctly imported

// Function to log the audit trail within the user document
async function logAudit(userId, action, changes) {
  try {
    const userRef = doc(fs, 'users', userId); // Reference to the user document
    const userDoc = await getDoc(userRef); // Fetch the current user document

    if (!userDoc.exists()) {
      console.error('User document not found');
      return;
    }

    // Append the audit information to the user's document (adjust as needed)
    await updateDoc(userRef, {
      audit: {
        action, // What happened (e.g., 'PASSWORD_CHANGE')
        changes, // Object containing the changes (avoid storing sensitive data directly like passwords)
        timestamp: new Date().toISOString() // Current timestamp
      }
    });

    console.log('Audit information successfully logged in user document');
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
}

// Function to change user password and log the action
export async function changeUserPassword(userId, newPassword, userDetails) {
  try {
    const userRef = doc(fs, 'users', userId); // Reference to the user document

    // Update the user's password (hashed or encrypted in reality)
    // This step should be handled securely and may involve Firebase Authentication
    await updateDoc(userRef, { password: newPassword });

    // Log the password change in the user's document
    await logAudit(userId, 'PASSWORD_CHANGE', {
      password: '***', // Never log the actual password
      display_name: userDetails.display_name,
      middle_name: userDetails.middle_name,
      last_name: userDetails.last_name,
      dob: userDetails.dob,
      email: userDetails.email,
      city: userDetails.city,
      member_type: userDetails.member_type,
      user_status: userDetails.user_status,
      photo_url: userDetails.photo_url,
    });

    console.log('Password change and audit log completed successfully');
  } catch (error) {
    console.error('Error changing user password:', error);
  }
}

// Example usage of changeUserPassword function
const userDetails = {
  display_name: "John",
  middle_name: "A.",
  last_name: "Doe",
  dob: "1990-01-01",
  email: "john.doe@example.com",
  city: "New York",
  member_type: "lawyer",
  user_status: "active",
  photo_url: "https://example.com/john_doe.jpg"
};

// Call changeUserPassword with appropriate parameters
changeUserPassword("userId123", "newHashedPassword", userDetails);
