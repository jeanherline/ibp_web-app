import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { fs } from '../../Config/Firebase';
import { subscribeToAllUserUpdates } from '../Audit/fetchAudit';
import SideNavBar from '../SideNavBar/SideNavBar';
import './Audit.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [fetchAll, setFetchAll] = useState(false);

  useEffect(() => {
    const auth = getAuth();

    const checkUserRole = async () => {
      const user = auth.currentUser;

      if (user) {
        try {
          const userRef = doc(fs, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data from Firestore:', userData);

            if (userData.member_type === 'admin') {
              setIsAdmin(true);
              // Start fetching logs
              subscribeToAllUserUpdates(
                (changes) => {
                  console.log('Real-time updates received:', changes); // Debugging
                  setLogs((prevLogs) => [...prevLogs, ...changes]); // Append new logs
                  setLoading(false);
                  setFirstLoad(false);
                },
                (error) => {
                  console.error('Error subscribing to real-time updates:', error);
                  setError('Error subscribing to real-time updates.');
                  setLoading(false);
                }
              );
            } else {
              setIsAdmin(false);
              setError('You do not have access to view audit logs.');
              setLoading(false);
            }
          } else {
            setError('User document not found in Firestore.');
            setLoading(false);
          }
        } catch (err) {
          console.error('Error fetching user document:', err);
          setError('Error verifying user role.');
          setLoading(false);
        }
      } else {
        setError('User is not authenticated.');
        setLoading(false);
      }
    };

    checkUserRole();

    return () => {
      console.log("Cleaning up...");
    };
  }, [fetchAll]);

  return (
    <div className="main-container">
      <SideNavBar className="sidebar" />

      <div className="content-container">
        <h1>User Logs (Real-Time)</h1>

        {loading && <p className="loading-message">Loading user logs...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && logs.length === 0 && <p className="no-logs-message">No user logs available.</p>}

        {isAdmin && logs.length > 0 && (
          <>
            <table className="logs-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Field</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Change Type</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.field || 'N/A'}</td>
                    <td>{log.oldValue || 'N/A'}</td>
                    <td>{log.newValue || 'N/A'}</td>
                    <td>{log.changeType || 'N/A'}</td>
                    <td>{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!firstLoad && !fetchAll && (
              <button onClick={() => setFetchAll(true)} className="load-more-button">
                Load All
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
