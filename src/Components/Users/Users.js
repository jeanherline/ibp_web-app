import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import "./Users.css";
import Pagination from "react-bootstrap/Pagination";
import {
  getUsers,
  getUsersCount,
  updateUser,
} from "../../Config/FirebaseServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faArchive } from "@fortawesome/free-solid-svg-icons";
import { auth } from "../../Config/Firebase";

function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const pageSize = 10;
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState("all");
  const [totalFilteredItems, setTotalFilteredItems] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "/";
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchUsers(1); // Fetch users when component mounts or filters change
  }, [filterStatus, filterType, cityFilter, searchText]);

  const fetchUsers = async (page) => {
    try {
      const totalUsers = await getUsersCount(
        filterStatus,
        filterType,
        cityFilter,
        searchText
      );
      const newTotalPages = Math.ceil(totalUsers / pageSize);
      const { users, lastVisibleDoc } = await getUsers(
        filterStatus,
        filterType,
        cityFilter,
        searchText,
        page === 1 ? null : lastVisible,
        pageSize
      );
      setUsers(users);
      setTotalPages(newTotalPages);
      setLastVisible(lastVisibleDoc);
      setCurrentPage(page);
      setTotalFilteredItems(totalUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      fetchUsers(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      fetchUsers(currentPage - 1);
    }
  };

  const handleFirst = () => {
    fetchUsers(1);
  };

  const handleLast = () => {
    fetchUsers(totalPages);
  };

  const handlePageClick = (page) => {
    fetchUsers(page);
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
    try {
      await updateUser(selectedUser.uid, selectedUser);
      setSelectedUser(null);
      setIsModalOpen(false);
      fetchUsers(currentPage);
      setSnackbarMessage("User details have been successfully updated.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser({ ...selectedUser, [name]: value });
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setLastVisible(null);
    fetchUsers(1);
  };

  const resetFilters = () => {
    setFilterStatus("all");
    setFilterType("");
    setCityFilter("all");
    setSearchText("");
    setLastVisible(null);
    fetchUsers(1);
  };

  return (
    <div className="dashboard-container">
      <SideNavBar />
      <div className="main-content">
        <br />
        <h3>Users</h3>
        <br />
        <input
          type="text"
          value={searchText}
          onChange={handleFilterChange(setSearchText)}
          placeholder="Search..."
        />
        &nbsp;&nbsp;
        <select onChange={handleFilterChange(setFilterType)} value={filterType}>
          <option value="" disabled>
            Roles
          </option>
          <option value="admin">Admin</option>
          <option value="lawyer">Lawyer</option>
          <option value="frontdesk">Frontdesk</option>
          <option value="client">Client</option>
        </select>
        &nbsp;&nbsp;
        <select onChange={handleFilterChange(setCityFilter)} value={cityFilter}>
          <option value="all" disabled>
            Cities
          </option>
          <option value="Angat">Angat</option>
          <option value="Balagtas">Balagtas</option>
          <option value="Baliuag">Baliuag</option>
          <option value="Bocaue">Bocaue</option>
          <option value="Bulakan">Bulakan</option>
          <option value="Bustos">Bustos</option>
          <option value="Calumpit">Calumpit</option>
          <option value="Doña Remedios Trinidad">Doña Remedios Trinidad</option>
          <option value="Guiguinto">Guiguinto</option>
          <option value="Hagonoy">Hagonoy</option>
          <option value="Marilao">Marilao</option>
          <option value="Norzagaray">Norzagaray</option>
          <option value="Obando">Obando</option>
          <option value="Pandi">Pandi</option>
          <option value="Paombong">Paombong</option>
          <option value="Plaridel">Plaridel</option>
          <option value="Pulilan">Pulilan</option>
          <option value="San Ildefonso">San Ildefonso</option>
          <option value="San Miguel">San Miguel</option>
          <option value="San Rafael">San Rafael</option>
          <option value="Santa Maria">Santa Maria</option>
        </select>
        &nbsp;&nbsp;
        <select
          onChange={handleFilterChange(setFilterStatus)}
          value={filterStatus}
        >
          <option value="all" disabled>
            Active / Inactive
          </option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        &nbsp;&nbsp;
        <button onClick={resetFilters}>Reset Filters</button>
        <br />
        <p>Total Filtered Items: {totalFilteredItems}</p>
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
                  <button
                    onClick={() => toggleDetails(user)}
                    style={{
                      backgroundColor: "#4267B2",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  &nbsp; &nbsp;
                  <button
                    onClick={() => toggleDetails(user)}
                    style={{
                      backgroundColor: "#1DB954",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  &nbsp; &nbsp;
                  <button
                    onClick={() => toggleDetails(user)}
                    style={{
                      backgroundColor: "ff8b61",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <FontAwesomeIcon icon={faArchive} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination>
          <Pagination.First
            onClick={handleFirst}
            disabled={currentPage === 1}
          />
          <Pagination.Prev
            onClick={handlePrevious}
            disabled={currentPage === 1}
          />
          {[...Array(totalPages).keys()].map((_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => handlePageClick(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next
            onClick={handleNext}
            disabled={currentPage === totalPages}
          />
          <Pagination.Last
            onClick={handleLast}
            disabled={currentPage === totalPages}
          />
        </Pagination>
        {showSnackbar && <div className="snackbar">{snackbarMessage}</div>}
      </div>
    </div>
  );
}

export default Users;
