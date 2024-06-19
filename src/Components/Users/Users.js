import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import "./Users.css";
import Pagination from "react-bootstrap/Pagination";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import {
  getUsers,
  getUsersCount,
  updateUser,
  getUserById,
  addUser, // Import the function to add a new user
} from "../../Config/FirebaseServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEdit,
  faArchive,
  faCheck,
  faSync,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { auth, doc, fs } from "../../Config/Firebase";
import { getDoc, onSnapshot } from "firebase/firestore";

function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const pageSize = 7;
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [totalFilteredItems, setTotalFilteredItems] = useState(0);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [newUser, setNewUser] = useState({
    display_name: "",
    middle_name: "",
    last_name: "",
    dob: "",
    email: "",
    password: "",
    city: "",
    member_type: "",
    user_status: "active",
    photo_url: "",
    appRating: 0,
  });

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

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userDocRef = doc(fs, "users", user.uid);
        const unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (userDoc) => {
            if (userDoc.exists()) {
              setUserData(userDoc.data());
            } else {
              console.log("User document does not exist");
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user data:", error);
            setLoading(false);
          }
        );

        return () => {
          unsubscribeUserDoc(); // Clean up the user document listener
        };
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth(); // Clean up the auth state listener
    };
  }, []);

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

  const toggleDetails = async (user) => {
    try {
      const userDetails = await getUserById(user.uid);
      setSelectedUser(userDetails);
      setShowUserDetails(true); // Show user details when view button is clicked
      setIsEditing(false); // Reset editing state
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
  };

  const handleEdit = (user) => {
    if (
      userData.member_type === "admin" &&
      ["frontdesk", "head", "lawyer", "client", "admin"].includes(
        user.member_type
      )
    ) {
      setEditingUserId(user.uid);
      setSelectedUser(user); // Set user to selectedUser for editing
      setIsEditing(true);
      setShowUserDetails(false); // Hide user details when editing
    }
  };

  const handleSave = async (user) => {
    try {
      await updateUser(user.uid, {
        ...user,
        member_type: selectedUser.member_type,
      });
      setEditingUserId(null);
      setIsEditing(false);
      fetchUsers(currentPage);
      setSnackbarMessage("User member type has been successfully updated.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (error) {
      console.error("Failed to update user member type:", error);
    }
  };

  const handleArchive = (user) => {
    if (userData.member_type === "admin") {
      setShowArchiveModal(true);
      setSelectedUser(user); // Set user to selectedUser for archiving
      setShowUserDetails(false); // Hide user details when archiving
    }
  };

  const handleActivate = (user) => {
    if (userData.member_type === "admin") {
      setShowActivateModal(true);
      setSelectedUser(user); // Set user to selectedUser for activating
      setShowUserDetails(false); // Hide user details when activating
    }
  };

  const confirmArchive = async () => {
    try {
      await updateUser(selectedUser.uid, {
        ...selectedUser,
        user_status: "inactive",
      });
      setSelectedUser(null);
      setShowArchiveModal(false);
      fetchUsers(currentPage);
      setSnackbarMessage("User has been successfully archived.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (error) {
      console.error("Failed to archive user:", error);
    }
  };

  const confirmActivate = async () => {
    try {
      await updateUser(selectedUser.uid, {
        ...selectedUser,
        user_status: "active",
      });
      setSelectedUser(null);
      setShowActivateModal(false);
      fetchUsers(currentPage);
      setSnackbarMessage("User has been successfully activated.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (error) {
      console.error("Failed to activate user:", error);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setShowUserDetails(false); // Hide user details when closing modal
    setIsEditing(false); // Reset editing state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(selectedUser.uid, selectedUser);
      setSelectedUser(null);
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

  const openImageModal = (imageUrl) => {
    window.open(imageUrl, "_blank");
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleNewUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await addUser(newUser); // Function to add new user to Firestore
      setShowSignUpModal(false);
      fetchUsers(currentPage);
      setSnackbarMessage("New user has been successfully added.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (error) {
      console.error("Failed to add new user:", error);
    }
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
        &nbsp;&nbsp;
        <button
          onClick={() => setShowSignUpModal(true)}
          style={{
            backgroundColor: "#1DB954",
            color: "white",
            border: "none",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          <FontAwesomeIcon icon={faUserPlus} /> Sign Up
        </button>
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
                <td>
                  {editingUserId === user.uid ? (
                    <select
                      name="member_type"
                      value={selectedUser ? selectedUser.member_type : ""}
                      onChange={handleChange}
                    >
                      <option value="admin">Admin</option>
                      <option value="head">Head Lawyer</option>
                      <option value="lawyer">Legal Aid Volunteer</option>
                      <option value="frontdesk">Front Desk</option>
                      <option value="client">Client</option>
                    </select>
                  ) : (
                    capitalizeFirstLetter(user.member_type)
                  )}
                </td>
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
                  {userData?.member_type === "admin" &&
                    ["frontdesk", "head", "lawyer", "client", "admin"].includes(
                      user.member_type
                    ) && (
                      <button
                        onClick={() =>
                          editingUserId === user.uid
                            ? handleSave(user)
                            : handleEdit(user)
                        }
                        style={{
                          backgroundColor:
                            editingUserId === user.uid ? "#4CAF50" : "#1DB954",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={editingUserId === user.uid ? faCheck : faEdit}
                        />
                      </button>
                    )}
                  &nbsp; &nbsp;
                  {userData?.member_type === "admin" && (
                    <>
                      {user.user_status === "inactive" ? (
                        <button
                          onClick={() => handleActivate(user)}
                          style={{
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            cursor: "pointer",
                          }}
                        >
                          <FontAwesomeIcon icon={faSync} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(user)}
                          style={{
                            backgroundColor: "#ff8b61",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            cursor: "pointer",
                          }}
                        >
                          <FontAwesomeIcon icon={faArchive} />
                        </button>
                      )}
                    </>
                  )}
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
        {showUserDetails && selectedUser && !showArchiveModal && (
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
            <br />
            <h2>User Details</h2>
            <section className="mb-4">
              <table>
                <thead>
                  <tr>
                    <th>User ID:</th>
                    <td>{selectedUser.uid}</td>
                  </tr>
                  <tr>
                    <th>Photo:</th>
                    <td>
                      {selectedUser.photo_url ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            openImageModal(selectedUser.photo_url);
                          }}
                        >
                          <img
                            src={selectedUser.photo_url}
                            alt="Profile Photo"
                            className="img-thumbnail"
                            style={{ width: "100px", cursor: "pointer" }}
                          />
                        </a>
                      ) : (
                        "Not Available"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>First Name:</th>
                    <td>{capitalizeFirstLetter(selectedUser.display_name)}</td>
                  </tr>
                  <tr>
                    <th>Middle Name:</th>
                    <td>{capitalizeFirstLetter(selectedUser.middle_name)}</td>
                  </tr>
                  <tr>
                    <th>Last Name:</th>
                    <td>{capitalizeFirstLetter(selectedUser.last_name)}</td>
                  </tr>
                  <tr>
                    <th>Date of Birth:</th>
                    <td>{selectedUser.dob || "-"}</td>
                  </tr>
                  <tr>
                    <th>Email:</th>
                    <td>{selectedUser.email}</td>
                  </tr>
                  <tr>
                    <th>City:</th>
                    <td>{selectedUser.city}</td>
                  </tr>
                  <tr>
                    <th>Member Type:</th>
                    <td>{capitalizeFirstLetter(selectedUser.member_type)}</td>
                  </tr>
                  <tr>
                    <th>Status:</th>
                    <td>{capitalizeFirstLetter(selectedUser.user_status)}</td>
                  </tr>
                  <tr>
                    <th>Created Time:</th>
                    <td>
                      {selectedUser.created_time
                        ? new Date(
                            selectedUser.created_time.seconds * 1000
                          ).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                </thead>
              </table>
            </section>
          </div>
        )}
      </div>

      <Modal show={showArchiveModal} onHide={() => setShowArchiveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Archive User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to archive this account and set it as inactive?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowArchiveModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmArchive}>
            Archive
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showActivateModal}
        onHide={() => setShowActivateModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Activate User</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to activate this account?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowActivateModal(false)}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={confirmActivate}>
            Activate
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showSignUpModal} onHide={() => setShowSignUpModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Sign Up</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleNewUserSubmit}>
            <div className="form-group">
              <label htmlFor="display_name">First Name</label>
              <input
                type="text"
                className="form-control"
                id="display_name"
                name="display_name"
                value={newUser.display_name}
                onChange={handleNewUserChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="middle_name">Middle Name</label>
              <input
                type="text"
                className="form-control"
                id="middle_name"
                name="middle_name"
                value={newUser.middle_name}
                onChange={handleNewUserChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                className="form-control"
                id="last_name"
                name="last_name"
                value={newUser.last_name}
                onChange={handleNewUserChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                id="dob"
                name="dob"
                value={newUser.dob}
                onChange={handleNewUserChange}
                required
              />
            </div>
            <br />
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                required
              />
            </div>
            <br />
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                required
              />
            </div>
            <br />
            <div className="form-group">
              <label htmlFor="city">City</label>
              <select
                className="form-control"
                id="city"
                name="city"
                value={newUser.city}
                onChange={handleNewUserChange}
              >
                <option value="">Select a city</option>
                <option value="Angat">Angat</option>
                <option value="Balagtas">Balagtas</option>
                <option value="Baliuag">Baliuag</option>
                <option value="Bocaue">Bocaue</option>
                <option value="Bulakan">Bulakan</option>
                <option value="Bustos">Bustos</option>
                <option value="Calumpit">Calumpit</option>
                <option value="Doña Remedios Trinidad">
                  Doña Remedios Trinidad
                </option>
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
            </div>
            <br />
            <div className="form-group">
              <label htmlFor="member_type">Role</label>
              <select
                className="form-control"
                id="member_type"
                name="member_type"
                value={newUser.member_type}
                onChange={handleNewUserChange}
                required
              >
                <option value="" disabled>
                  Select role
                </option>
                <option value="admin">Admin</option>
                <option value="head">Head Lawyer</option>
                <option value="lawyer">Legal Aid Volunteer</option>
                <option value="frontdesk">Front Desk</option>
              </select>
            </div>
            <br />
            <center>
              <Button variant="primary" type="submit">
                Add User
              </Button>
            </center>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSignUpModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Users;