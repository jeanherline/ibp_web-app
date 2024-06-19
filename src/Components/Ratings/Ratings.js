import React, { useState, useEffect } from "react";
import SideNavBar from "../SideNavBar/SideNavBar";
import "../Dashboard/Dashboard.css";
import "./Ratings.css";
import Pagination from "react-bootstrap/Pagination";
import {
  getRatingsUsers,
  getRatingsUsersCount,
  getRatingsAppointmentsRatings,
  getRatingsAppRatings,
} from "../../Config/FirebaseServices";
import { auth } from "../../Config/Firebase";

function Ratings() {
  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const pageSize = 10;
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
  }, [filterStatus, cityFilter, searchText]);

  const fetchUsers = async (page) => {
    try {
      const totalUsers = await getRatingsUsersCount(filterStatus, cityFilter, searchText);
      const newTotalPages = Math.ceil(totalUsers / pageSize);
      const { users, lastVisibleDoc } = await getRatingsUsers(
        filterStatus,
        cityFilter,
        searchText,
        page === 1 ? null : lastVisible,
        pageSize
      );

      // Fetch appropriate ratings based on filterStatus
      const usersWithRatings = await Promise.all(users.map(async (user) => {
        let rating = "N/A";
        if (filterStatus === "appointments") {
          const aptRatings = await getRatingsAppointmentsRatings(user.uid);
          rating = aptRatings.length > 0 ? (aptRatings.reduce((a, b) => a + b, 0) / aptRatings.length).toFixed(2) : "N/A";
        } else if (filterStatus === "application") {
          const appRatings = await getRatingsAppRatings(user.uid);
          rating = appRatings.length > 0 ? (appRatings.reduce((a, b) => a + b, 0) / appRatings.length).toFixed(2) : "N/A";
        }
        return { ...user, ratingType: filterStatus === "appointments" ? "Appointment" : "Application", rating };
      }));

      setUsers(usersWithRatings);
      setTotalPages(newTotalPages);
      setLastVisible(lastVisibleDoc);
      setCurrentPage(page);
      setTotalFilteredItems(totalUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
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

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setLastVisible(null);
    fetchUsers(1);
  };

  const resetFilters = () => {
    setFilterStatus("all");
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
        <h3>Ratings</h3>
        <br />
        <input
          type="text"
          value={searchText}
          onChange={handleFilterChange(setSearchText)}
          placeholder="Search..."
        />
        &nbsp;&nbsp;
        <select
          onChange={handleFilterChange(setFilterStatus)}
          value={filterStatus}
        >
          <option value="all">All</option>
          <option value="application">Application</option>
          <option value="appointments">Appointments</option>
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
              <th>Rating Type</th>
              <th>User Rating</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.uid}>
                <td>{index + 1 + (currentPage - 1) * pageSize}</td>
                <td>{user.display_name}</td>
                <td>{user.middle_name}</td>
                <td>{user.last_name}</td>
                <td>{user.email}</td>
                <td>{user.city}</td>
                <td>{user.ratingType}</td>
                <td>{user.rating}</td>
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
              onClick={() => handlePageClick(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next onClick={handleNext} disabled={currentPage === totalPages} />
          <Pagination.Last onClick={handleLast} disabled={currentPage === totalPages} />
        </Pagination>
      </div>
    </div>
  );
}

export default Ratings;
