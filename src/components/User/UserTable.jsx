import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import GenericModal from "../GenericModal";
import UserRegistration from "./UserRegistration";
import UserUpdate from "./UserUpdate";
import UserView from "./UserView";
import { FaTrash, FaEdit } from "react-icons/fa";
import "../../styles/registeredTables.css";
import apiClient from "../apiClient";
import { usePagination } from "../PaginationContext";

function UserTable() {
  const accessToken = useSelector((state) => state.auth.accessToken);

  const getAuthHeaders = () =>
    accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      : { "Content-Type": "application/json" };

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [registrationMode, setRegistrationMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  const { pages, setPageForTab, rowsPerPage } = usePagination();
  const currentPage = pages.all || 1;

  const fetchUsers = async () => {
    try {
      const { data } = await apiClient.get("/registration/users", {
        headers: getAuthHeaders(),
      });
      setUsers(Array.isArray(data) ? data : []);
      console.log("Users:", data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [accessToken]);

  // Reset page to 1 when search term changes.
  useEffect(() => {
    setPageForTab("all", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const filteredUsers = users.filter((user) => {
    const first = (user.firstName || "").toLowerCase();
    const last = (user.lastName || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const group = (user.groupName || "").toLowerCase();
    return (
      first.includes(searchTerm.toLowerCase()) ||
      last.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      group.includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDelete = (staffNumber) => {
    const user = users.find((u) => u.staffNumber === staffNumber);
    Swal.fire({
      title: "Confirm Deletion",
      text: `To delete user "${user.firstName} ${user.lastName}", type "yes":`,
      input: "text",
      inputPlaceholder: "Type yes to confirm",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#2B9843",
      preConfirm: (inputValue) => {
        if (inputValue !== "yes") {
          Swal.showValidationMessage(
            'You must type "yes" to confirm deletion.'
          );
        }
        return inputValue;
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value === "yes") {
        try {
          const { data } = await apiClient.delete("/registration/delete", {
            params: { staffNumber },
            headers: getAuthHeaders(),
          });
          Swal.fire(
            "Success",
            data.message || "User deleted successfully!",
            "success"
          );
          setUsers(users.filter((u) => u.staffNumber !== staffNumber));
        } catch (error) {
          console.error("Error deleting user:", error);
          Swal.fire(
            "Error",
            error.response?.data || error.message || "Error deleting user",
            "error"
          );
        }
      }
    });
  };

  if (registrationMode) {
    return (
      <GenericModal onClose={() => setRegistrationMode(false)}>
        <UserRegistration
          onClose={() => {
            setRegistrationMode(false);
            fetchUsers();
          }}
          onRegistrationSuccess={fetchUsers}
        />
      </GenericModal>
    );
  }
  if (editingUser) {
    return (
      <GenericModal onClose={() => setEditingUser(null)}>
        <UserUpdate
          user={editingUser}
          onClose={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      </GenericModal>
    );
  }
  if (viewingUser) {
    return (
      <GenericModal onClose={() => setViewingUser(null)}>
        <UserView user={viewingUser} onClose={() => setViewingUser(null)} />
      </GenericModal>
    );
  }

  return (
    <div className="registered-table">
      <div className="table-header">
        <img
          src="https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Users"
          className="header-image"
        />
        <div className="header-overlay">
          <h2>Registered Users</h2>
        </div>
      </div>
      <div className="table-content">
        <div className="table-controls">
          <button
            className="register-btn"
            onClick={() => setRegistrationMode(true)}
          >
            Register User
          </button>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Group Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.staffNumber}>
                <td data-label="First Name">{user.firstName}</td>
                <td data-label="Last Name">{user.lastName}</td>
                <td data-label="Phone">{user.phone}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Group Name">{user.groupName}</td>
                <td data-label="Actions">
                  <div className="dropdown">
                    <button className="dropbtn">action</button>
                    <div className="dropdown-content">
                      <button
                        className="action-btn view-btn"
                        onClick={() => setViewingUser(user)}
                      >
                        View
                      </button>
                      <button
                        className="action-btn update-btn"
                        onClick={() => setEditingUser(user)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(user.staffNumber)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length >= rowsPerPage && (
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setPageForTab("all", page)}
                  style={{
                    margin: "0 5px",
                    padding: "5px 10px",
                    backgroundColor:
                      currentPage === page ? "#0a803e" : "#f0f0f0",
                    color: currentPage === page ? "#fff" : "#000",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {page}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserTable;
