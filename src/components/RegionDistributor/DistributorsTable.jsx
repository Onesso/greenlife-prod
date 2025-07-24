import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import GenericModal from "../GenericModal";
import DistributorRegistration from "./DistributorRegistration";
import DistributorUpdate from "./DistributorUpdate";
import DistributorView from "./DistributorView";
import { useSelector } from "react-redux";
import apiClient from "../apiClient";
import "../../styles/registeredTables.css";
import { usePagination } from "../PaginationContext";

const DistributorsTable = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const groupData = useSelector((state) => state.auth.groupData);
  const [registerMode, setRegisterMode] = useState(false);
  const [distributors, setDistributors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  const { pages, setPageForTab, rowsPerPage } = usePagination();
  const currentPage = pages.all || 1;

  const fetchDistributors = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/distributor/email/region");
      setDistributors(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchDistributors();
    }
  }, [accessToken]);

  useEffect(() => {
    setPageForTab("all", 1);
  }, [searchTerm]);

  const filteredDistributors = distributors.filter((distributor) => {
    const businessName = (distributor.businessName || "").toLowerCase();
    const region = (distributor.regionName || "").toLowerCase();
    const subregion = (distributor.subRegionName || "").toLowerCase();
    const phone = (distributor.phoneNumber || "").toLowerCase();
    const email = (distributor.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return (
      businessName.includes(term) ||
      region.includes(term) ||
      subregion.includes(term) ||
      phone.includes(term) ||
      email.includes(term)
    );
  });

  const totalPages = Math.ceil(filteredDistributors.length / rowsPerPage);
  const paginatedDistributors = filteredDistributors.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDelete = async (email) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete the distributor with email: ${email}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      const { data: successMessage } = await apiClient.delete(
        `/distributor/delete?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      Swal.fire({ icon: "success", title: "Deleted!", text: successMessage });
      setDistributors(
        distributors.filter((distributor) => distributor.email !== email)
      );
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err.response?.data || err.message,
      });
    }
  };

  const handleEdit = (record) => setEditingRecord(record);
  const handleView = (record) => setViewRecord(record);

  const isModalOpen = registerMode || editingRecord || viewRecord;

  if (loading)
    return <div className="registered-table">Loading distributors...</div>;
  if (error) return <div className="registered-table">Error: {error}</div>;

  return (
    <>
      {isModalOpen ? (
        <>
          {registerMode && (
            <GenericModal onClose={() => setRegisterMode(false)}>
              <DistributorRegistration
                onClose={() => setRegisterMode(false)}
                onRegistrationSuccess={fetchDistributors}
              />
            </GenericModal>
          )}
          {editingRecord && (
            <GenericModal onClose={() => setEditingRecord(null)}>
              <DistributorUpdate
                record={editingRecord}
                onClose={() => setEditingRecord(null)}
                onUpdateSuccess={fetchDistributors}
              />
            </GenericModal>
          )}
          {viewRecord && (
            <GenericModal onClose={() => setViewRecord(null)}>
              <DistributorView
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
              src="https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Distributors"
              className="header-image"
            />
            <div className="header-overlay">
              <h2>Dealers</h2>
            </div>
          </div>
          <div className="table-content">
            <div className="table-controls">
              <button
                className="register-btn"
                onClick={() => {
                  if (!groupData?.permissions?.createDistributor) {
                    Swal.fire({
                      icon: "error",
                      title: "Access Denied",
                      text: "You do not have permission to register a distributor.",
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
              placeholder="Search distributors by business name, region, subregion, phone or email..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <table>
              <thead>
                <tr>
                  <th>SN</th>
                  <th>Business Name</th>
                  <th>Region</th>
                  <th>Area</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDistributors.length > 0 ? (
                  paginatedDistributors.map((distributor, index) => (
                    <tr key={distributor.id}>
                      <td data-label="SN">
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td data-label="Business Name">
                        {distributor.businessName}
                      </td>
                      <td data-label="Region">{distributor.regionName}</td>
                      <td data-label="Area">{distributor.subRegionName}</td>
                      <td data-label="Phone">{distributor.phoneNumber}</td>
                      <td data-label="Email">{distributor.email}</td>
                      <td data-label="Status">
                        <span
                          className={`status ${
                            distributor.active ? "active" : "inactive"
                          }`}
                        >
                          {distributor.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="dropdown">
                          <button className="dropbtn">action</button>
                          <div className="dropdown-content">
                            <button
                              className="action-btn update-btn"
                              onClick={() => {
                                if (
                                  !groupData?.permissions?.updateDistributor
                                ) {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Access Denied",
                                    text: "You do not have permission to update a distributor.",
                                  });
                                  return;
                                }
                                handleEdit(distributor);
                              }}
                            >
                              Update
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => {
                                if (
                                  !groupData?.permissions?.deleteDistributor
                                ) {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Access Denied",
                                    text: "You do not have permission to delete a distributor.",
                                  });
                                  return;
                                }
                                handleDelete(distributor.email);
                              }}
                            >
                              Delete
                            </button>
                            <button
                              className="action-btn view-btn"
                              onClick={() => {
                                if (!groupData?.permissions?.readDistributor) {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Access Denied",
                                    text: "You do not have permission to view distributor details.",
                                  });
                                  return;
                                }
                                handleView(distributor);
                              }}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">
                      No dealers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredDistributors.length >= rowsPerPage && (
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
};

export default DistributorsTable;
