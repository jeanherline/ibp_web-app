import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { fs } from '../../Config/Firebase';

// Function to subscribe to real-time user updates
export function subscribeToAllUserUpdates(callback, onError) {
  try {
    const usersRef = collection(fs, 'users');
    const q = query(usersRef, orderBy('timestamp', 'desc'));

    // Real-time subscription to the query
    return onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const changes = [];

          querySnapshot.docChanges().forEach((change) => {
            console.log('Document Change:', change); // Debugging

            const data = change.doc.data();
            changes.push({
              id: change.doc.id,
              field: change.doc.id, // Assuming field is the document ID for simplicity
              oldValue: change.oldValue || 'N/A',
              newValue: data,
              changeType: change.type,
              timestamp: data.timestamp // Timestamp of the change
            });
          });

          console.log('Fetched Logs:', changes); // Debugging
          callback(changes);
        } else {
          console.log('No logs found.'); // Debugging
          callback([]);
        }
      },
      (error) => {
        console.error('Error fetching real-time user updates:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error('Error setting up user update subscription:', err);
    if (onError) onError(err);
  }
}
