import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { fs } from './firebaseConfig'; // Import Firestore instance

// Function to log the audit trail
export async function logAudit(userId, action, resource, resourceId, changes) {
  try {
    const logRef = collection(fs, 'audit_logs');
    await addDoc(logRef, {
      userId, // ID of the user who triggered the change
      action, // What happened (e.g., 'PASSWORD_CHANGE')
      resource, // Which collection was changed (e.g., 'users')
      resourceId, // ID of the affected document (user or appointment ID)
      changes, // Object containing the changes (avoid storing sensitive data directly like passwords)
      timestamp: serverTimestamp() // Auto-generated timestamp
    });
    console.log('Audit log successfully created');
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
}

// Function to change user password and log the action, including additional user details
export async function changeUserPassword(userId, newPassword, userDetails) {
  try {
    const userRef = doc(fs, 'users', userId);

    // Update the user's password (hashed or encrypted in reality)
    await updateDoc(userRef, { password: newPassword });

    // Log the password change in audit logs with additional user details
    await logAudit(userId, 'PASSWORD_CHANGE', 'users', userId, {
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
  } catch (error) {
    console.error('Error changing user password:', error);
  }
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
  
  changeUserPassword("userId123", "newHashedPassword", userDetails);
  
}

