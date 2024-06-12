import React, { useState, useEffect, useCallback } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import "./ListOfUsers.css";
import { getUsers, updateUser } from "../../Config/FirebaseServices";

const ListOfUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState("active");
  const [memberTypeFilter, setMemberTypeFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [cursors, setCursors] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText);
  const pageSize = 7;

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers(
        filter,
        lastVisible,
        pageSize,
        debouncedSearchText,
        memberTypeFilter
      );
      if (Array.isArray(data.users)) {
        setUsers((prevUsers) =>
          lastVisible ? [...prevUsers, ...data.users] : data.users
        );
        setHasMore(data.hasMore);
        setLastVisible(data.lastVisible);
      } else {
        console.error("Data is not an array", data);
        setUsers([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, [filter, lastVisible, pageSize, debouncedSearchText, memberTypeFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); // Debounce search input by 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  useEffect(() => {
    setLastVisible(null);
    setCursors([]);
    setCurrentPage(1);
    fetchUsers();
  }, [fetchUsers, filter, debouncedSearchText, memberTypeFilter]);

  useEffect(() => {
    setSelectedUser(null); // Close details when filter changes
  }, [filter, memberTypeFilter]);

  const handleNext = () => {
    setCursors([...cursors, lastVisible]);
    setLastVisible(users[users.length - 1]);
    setCurrentPage(currentPage + 1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      const newCursors = [...cursors];
      const newLastVisible = newCursors.pop();
      setCursors(newCursors);
      setLastVisible(newLastVisible);
      setCurrentPage(currentPage - 1);
    }
  };

  const toggleDetails = (user) => {
    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser(null); // Close details if currently showing
    } else {
      setSelectedUser(user); // Show details for the selected user
    }
  };

  const handleCloseDetails = () => {
    setSelectedUser(null);
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedData = {
      user_status: selectedUser.userStatus,
    };

    await updateUser(selectedUser.id, updatedData);

    setSelectedUser(null);

    fetchUsers();

    setSnackbarMessage("User status has been successfully updated.");
    setShowSnackbar(true);
    setTimeout(() => {
      setShowSnackbar(false);
    }, 3000);
  };

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search..."
        />
        <select onChange={(e) => setFilter(e.target.value)} value={filter}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          onChange={(e) => setMemberTypeFilter(e.target.value)}
          value={memberTypeFilter}
        >
          <option value="all">All</option>
          <option value="client">Client</option>
          <option value="admin">Admin</option>
          <option value="lawyer">Lawyer</option>
        </select>
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Middle Name</th>
              <th>Last Name</th>
              <th>Member Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.displayName}</td>
                <td>{user.middleName}</td>
                <td>{user.lastName}</td>
                <td>{capitalizeFirstLetter(user.memberType)}</td>
                <td>{capitalizeFirstLetter(user.userStatus)}</td>
                <td>
                  <button onClick={() => toggleDetails(user)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button disabled={currentPage === 1} onClick={handlePrevious}>
          Previous
        </button>
        <button disabled={!hasMore} onClick={handleNext}>
          Next
        </button>

        {selectedUser && (
          <div className="user-details">
            <button className="close-button" onClick={handleCloseDetails}>
              x
            </button>
            <h2>User Details</h2>
            <table>
              <caption>Basic Information</caption>
              <tbody>
                <tr>
                  <th>User ID</th>
                  <td>{selectedUser.id}</td>
                </tr>
                <tr>
                  <th>Full Name</th>
                  <td>{`${selectedUser.displayName} ${selectedUser.middleName} ${selectedUser.lastName}`}</td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>{selectedUser.email}</td>
                </tr>
                <tr>
                  <th>Member Type</th>
                  <td>{capitalizeFirstLetter(selectedUser.memberType)}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>{capitalizeFirstLetter(selectedUser.userStatus)}</td>
                </tr>
                <tr>
                  <th>City</th>
                  <td>{selectedUser.city}</td>
                </tr>
                <tr>
                  <th>Created Time</th>
                  <td>
                    {new Date(
                      selectedUser.createdTime.seconds * 1000
                    ).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {selectedUser && (
          <div className="user-status">
            <h2>Update User Status</h2>
            <form onSubmit={handleSubmit}>
              <label>
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={selectedUser.userStatus === "active"}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      userStatus: e.target.value,
                    })
                  }
                  required
                />{" "}
                Active
              </label>
              <br />
              <label>
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={selectedUser.userStatus === "inactive"}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      userStatus: e.target.value,
                    })
                  }
                  required
                />{" "}
                Inactive
              </label>
              <br />
              <button type="submit">Update Status</button>
            </form>
          </div>
        )}
        {showSnackbar && <div className="snackbar">{snackbarMessage}</div>}
      </div>
    </div>
  );
};

export default ListOfUsers;