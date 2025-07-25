import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaTrash, FaEye } from "react-icons/fa";
import GenericModal from "../GenericModal";
import AgentsRegistration from "./AgentRegistration";
import AgentsUpdate from "./AgentUpdate";
import AgentsView from "./AgentsView";
import { useSelector } from "react-redux";
import apiClient from "../apiClient";
import "../../styles/registeredTables.css";
import { usePagination } from "../PaginationContext";

function AgentsTable() {
  const groupData = useSelector((state) => state.auth.groupData);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [registerMode, setRegisterMode] = useState(false);
  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  const { pages, setPageForTab, rowsPerPage } = usePagination();
  const currentPage = pages.all || 1;

  const fetchAgents = async () => {
    try {
      const { data } = await apiClient.get("/agent/all");
      setAgents(data);
      console.log(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (accessToken) fetchAgents();
  }, [accessToken]);

  useEffect(() => {
    setPageForTab("all", 1);
  }, [searchTerm]);

  const filteredAgents = agents.filter((agent) => {
    const fullName = `${agent.firstName} ${agent.lastName}`.toLowerCase();
    const distributorName = (agent.distributor || "").toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      (agent.idNumber &&
        agent.idNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (agent.subRegion &&
        agent.subRegion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      distributorName.includes(searchTerm.toLowerCase()) ||
      (agent.email &&
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalPages = Math.ceil(filteredAgents.length / rowsPerPage);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDelete = async (email) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete the agent with email: ${email}`,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Type yes to confirm",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      preConfirm: (inputValue) => {
        if (inputValue !== "yes") {
          Swal.showValidationMessage(
            'You must type "yes" to confirm deletion.'
          );
        }
        return inputValue;
      },
    });
    if (!result.isConfirmed) return;
    try {
      const { data: successMessage } = await apiClient.delete(
        `/agent/delete?email=${encodeURIComponent(email)}`
      );
      Swal.fire({ icon: "success", title: "Deleted!", text: successMessage });
      setAgents((prevAgents) =>
        prevAgents.filter((agent) => agent.email !== email)
      );
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete Failed", text: err.message });
    }
  };

  const handleEdit = (record) => setEditingRecord(record);
  const handleView = (record) => setViewRecord(record);

  if (error) return <div className="registered-table">Error: {error}</div>;

  return (
    <>
      {registerMode || editingRecord || viewRecord ? (
        <>
          {registerMode && (
            <GenericModal onClose={() => setRegisterMode(false)}>
              <AgentsRegistration
                onClose={() => setRegisterMode(false)}
                onRegistrationSuccess={fetchAgents}
              />
            </GenericModal>
          )}
          {editingRecord && (
            <GenericModal onClose={() => setEditingRecord(null)}>
              <AgentsUpdate
                record={editingRecord}
                onClose={() => setEditingRecord(null)}
                onUpdateSuccess={fetchAgents}
              />
            </GenericModal>
          )}
          {viewRecord && (
            <GenericModal onClose={() => setViewRecord(null)}>
              <AgentsView
                record={viewRecord}
                onClose={() => setViewRecord(null)}
              />
            </GenericModal>
          )}
        </>
      ) : (
        <div className="registered-table">
          <div className="table-header">
            <img
              src="https://images.pexels.com/photos/3184425/pexels-photo-3184425.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Agents"
              className="header-image"
            />
            <div className="header-overlay">
              <h2>Agents</h2>
            </div>
          </div>
          <div className="table-content">
            <div className="table-controls">
              <button
                className="register-btn"
                onClick={() => {
                  if (!groupData?.permissions?.createAgent) {
                    Swal.fire({
                      icon: "error",
                      title: "Access Denied",
                      text: "You do not have permission to register an agent.",
                    });
                    return;
                  }
                  setRegisterMode(true);
                }}
              >
                Register
              </button>
            </div>
            <input
              type="text"
              placeholder="Search agents by name, id, subregion, distributor, or email..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <table>
              <thead>
                <tr>
                  <th>SN</th>
                  <th>Agent Name</th>
                  <th>ID Number</th>
                  <th>Area</th>
                  <th>Dealer</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAgents.length > 0 ? (
                  paginatedAgents.map((agent, index) => (
                    <tr key={agent.id}>
                      <td data-label="SN">
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td data-label="Agent Name">
                        {agent.firstName} {agent.lastName}
                      </td>
                      <td data-label="ID Number">{agent.idNumber}</td>
                      <td data-label="Area">{agent.subRegion}</td>
                      <td data-label="Dealer">{agent.distributor}</td>
                      <td data-label="Email">{agent.email}</td>
                      <td data-label="Status">
                        <span
                          className={`status ${
                            agent.active ? "active" : "inactive"
                          }`}
                        >
                          {agent.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="dropdown">
                          <button className="dropbtn">action</button>
                          <div className="dropdown-content">
                            <button
                              className="action-btn update-btn"
                              onClick={() => {
                                if (!groupData?.permissions?.updateAgent) {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Access Denied",
                                    text: "You do not have permission to update an agent.",
                                  });
                                  return;
                                }
                                handleEdit(agent);
                              }}
                            >
                              Update
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => {
                                if (!groupData?.permissions?.deleteAgent) {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Access Denied",
                                    text: "You do not have permission to delete an agent.",
                                  });
                                  return;
                                }
                                handleDelete(agent.email);
                              }}
                            >
                              <FaTrash /> Delete
                            </button>
                            <button
                              className="action-btn view-btn"
                              onClick={() => {
                                if (!groupData?.permissions?.readAgent) {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Access Denied",
                                    text: "You do not have permission to view agent details.",
                                  });
                                  return;
                                }
                                handleView(agent);
                              }}
                            >
                              <FaEye /> View
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">
                      No agents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredAgents.length >= rowsPerPage && (
              <div style={{ marginTop: "10px", textAlign: "center" }}>
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
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
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AgentsTable;
