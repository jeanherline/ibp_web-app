import React, { useEffect, useState } from 'react';
import { subscribeToAuditLogs } from './fetchAudit';
import SideNavBar from '../SideNavBar/SideNavBar'; // Adjust the path to SideNavBar
import './Audit.css'; // Import the CSS file for styling

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);  // Add loading state
  const [error, setError] = useState(null);      // Add error state

  useEffect(() => {
    console.log("Subscribing to audit logs...");
    
    // Subscribe to audit logs when the component mounts
    const unsubscribe = subscribeToAuditLogs((fetchedLogs) => {
      console.log("Fetched logs:", fetchedLogs); // Debugging: Check if logs are fetched
      setLogs(fetchedLogs);
      setLoading(false); // Set loading to false when data is fetched
    }, (err) => {
      console.error("Error fetching logs:", err); // Debugging: Log error
      setError(err.message); // Handle errors
      setLoading(false);      // Stop loading on error
    });

    // Cleanup the subscription when the component unmounts
    return () => {
      console.log("Unsubscribing from audit logs...");
      unsubscribe();
    };
  }, []);

  return (
    <div className="main-container">
      <SideNavBar className="sidebar" /> {/* Integrating SideNavBar */}
      
      <div className="content-container">
        <h1>Audit Logs (Real-Time)</h1>

        {/* Loading Indicator */}
        {loading && <p>Loading audit logs...</p>}

        {/* Error Handling */}
        {error && <p className="error-message">Error fetching logs: {error}</p>}

        {/* No logs available */}
        {!loading && logs.length === 0 && <p>No audit logs available.</p>}

        {/* Display Logs */}
        {logs.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Resource ID</th>
                <th>Changes</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.userId}</td>
                  <td>{log.action}</td>
                  <td>{log.resource}</td>
                  <td>{log.resourceId}</td>
                  <td>{JSON.stringify(log.changes)}</td>
                  <td>{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
