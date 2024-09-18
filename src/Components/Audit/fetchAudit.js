import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { fs } from '../../Config/Firebase'; // Ensure Firebase config is correctly imported

// Function to subscribe to real-time audit logs using onSnapshot
export function subscribeToAuditLogs(callback, onError) {
  const logsRef = collection(fs, 'audit_logs');
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));

  return onSnapshot(q, (querySnapshot) => {
    if (!querySnapshot.empty) {
      const changes = [];

      // Log each document change for debugging purposes
      querySnapshot.docChanges().forEach((change) => {
        console.log('Document Change:', change); // Debugging

        changes.push({
          id: change.doc.id,
          ...change.doc.data(),
          changeType: change.type, // Track the type of change
        });
      });

      console.log('Fetched Logs:', changes); // Debugging logs
      callback(changes); // Send the changes back to the UI
    } else {
      console.log('No logs found.'); // Debugging
      callback([]); // Pass an empty array if no logs
    }
  }, (error) => {
    console.error('Error fetching real-time audit logs:', error);
    if (onError) onError(error); // Call error handler
  });
}
