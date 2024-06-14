import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import "./Users.css";
import Pagination from "react-bootstrap/Pagination";
import { getUsers, getUsersCount, updateUser } from "../../Config/FirebaseServices";
import { useAuth } from "../../AuthContext";

function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const pageSize = 7;
  const { currentUser } = useAuth();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const totalUsers = await getUsersCount(filterStatus, filterType, searchText);
        const newTotalPages = Math.ceil(totalUsers / pageSize);
        const { users, lastVisibleDoc } = await getUsers(
          filterStatus,
          filterType,
          searchText,
          null,
          pageSize
        );
        setUsers(users);
        setTotalPages(newTotalPages);
        setLastVisible(lastVisibleDoc);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, [filterStatus, filterType, searchText]);
  

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      try {
        const { users, lastVisibleDoc } = await getUsers(
          filterStatus,
          filterType,
          searchText,
          lastVisible,
          pageSize
        );
        setUsers(users);
        setLastVisible(lastVisibleDoc);
        setCurrentPage(currentPage + 1);
      } catch (error) {
        console.error("Failed to fetch next page of users:", error);
      }
    }
  };
  
  const handlePrevious = async () => {
    if (currentPage > 1) {
      try {
        const { users, lastVisibleDoc } = await getUsers(
          filterStatus,
          filterType,
          searchText,
          lastVisible,
          pageSize,
          true
        );
        setUsers(users);
        setLastVisible(lastVisibleDoc);
        setCurrentPage(currentPage - 1);
      } catch (error) {
        console.error("Failed to fetch previous page of users:", error);
      }
    }
  };
  

  const handleFirst = async () => {
    const { users, lastVisibleDoc } = await getUsers(
      filterStatus,
      filterType,
      searchText,
      null,
      pageSize
    );
    setUsers(users);
    setLastVisible(lastVisibleDoc);
    setCurrentPage(1);
  };

  const handleLast = async () => {
    const totalUsers = await getUsersCount(filterStatus, filterType, searchText);
    const newTotalPages = Math.ceil(totalUsers / pageSize);
    const { users, lastVisibleDoc } = await getUsers(
      filterStatus,
      filterType,
      searchText,
      null,
      pageSize,
      newTotalPages
    );
    setUsers(users);
    setLastVisible(lastVisibleDoc);
    setCurrentPage(newTotalPages);
  };

  const toggleDetails = (user) => {
    setSelectedUser(selectedUser?.uid === user.uid ? null : user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateUser(selectedUser.uid, selectedUser);
    setSelectedUser(null);
    setIsModalOpen(false);
    const totalUsers = await getUsersCount(filterStatus, filterType, searchText);
    const newTotalPages = Math.ceil(totalUsers / pageSize);
    const { users, lastVisibleDoc } = await getUsers(
      filterStatus,
      filterType,
      searchText,
      null,
      pageSize
    );
    setUsers(users);
    setTotalPages(newTotalPages);
    setSnackbarMessage("User details have been successfully updated.");
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser({ ...selectedUser, [name]: value });
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setLastVisible(null);
    setCurrentPage(1);
  };

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
      <input
  type="text"
  value={searchText}
  onChange={handleFilterChange(setSearchText)}
  placeholder="Search..."
/>
<select onChange={handleFilterChange(setFilterType)} value={filterType}>
  <option value="">All</option>
  <option value="admin">Admin</option>
  <option value="lawyer">Lawyer</option>
  <option value="frontdesk">Frontdesk</option>
  <option value="client">Client</option>
</select>
<select onChange={handleFilterChange(setFilterStatus)} value={filterStatus}>
  <option value="all">All</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</select>
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>First Name</th>
              <th>Middle Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>City</th>
              <th>Member Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.uid}>
                <td>{(currentPage - 1) * pageSize + index + 1}.</td>
                <td>{user.display_name}</td>
                <td>{user.middle_name}</td>
                <td>{user.last_name}</td>
                <td>{user.email}</td>
                <td>{user.city || "N/A"}</td>
                <td>{capitalizeFirstLetter(user.member_type)}</td>
                <td>{capitalizeFirstLetter(user.user_status)}</td>
                <td>
                  <button onClick={() => toggleDetails(user)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination>
          <Pagination.First onClick={handleFirst} disabled={currentPage === 1} />
          <Pagination.Prev onClick={handlePrevious} disabled={currentPage === 1} />
          {[...Array(totalPages).keys()].map((_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next onClick={handleNext} disabled={currentPage === totalPages} />
          <Pagination.Last onClick={handleLast} disabled={currentPage === totalPages} />
        </Pagination>

        {selectedUser && (
          <div className="client-eligibility">
            <div style={{ position: "relative" }}>
              <button
                onClick={handleCloseModal}
                className="close-button"
                style={{ position: "absolute", top: "15px", right: "15px" }}
              >
                ×
              </button>
            </div>
            <h2>User Details</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <b>
                  <label>Full Name:</label>
                </b>
                <input
                  type="text"
                  name="display_name"
                  value={selectedUser.display_name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="middle_name"
                  value={selectedUser.middle_name}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="last_name"
                  value={selectedUser.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <b>
                  <label>Email:</label>
                </b>
                <input
                  type="email"
                  name="email"
                  value={selectedUser.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <b>
                  <label>Member Type:</label>
                </b>
                <select
                  name="member_type"
                  value={selectedUser.member_type}
                  onChange={handleChange}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="frontdesk">Frontdesk</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div>
                <b>
                  <label>Status:</label>
                </b>
                <select
                  name="user_status"
                  value={selectedUser.user_status}
                  onChange={handleChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button>Submit</button>
            </form>
          </div>
        )}
        {showSnackbar && <div className="snackbar">{snackbarMessage}</div>}
      </div>
    </div>
  );
}

export default Users;
