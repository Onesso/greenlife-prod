import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaEye, FaTrash } from "react-icons/fa";
import GenericModal from "../GenericModal";
import SubregionRegistration from "./SubregionRegistration";
import SubregionUpdate from "./SubRegionUpdate";
import SubregionView from "./SubregionView";
import { useSelector } from "react-redux";
import apiClient from "../apiClient";
import "../../styles/registeredTables.css";
import { usePagination } from "../PaginationContext";

const SubregionTable = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const groupData = useSelector((state) => state.auth.groupData);
  const [mode, setMode] = useState("table");
  const [subregions, setSubregions] = useState([]);
  const [setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSubregion, setEditingSubregion] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  // Pagination from context
  const { pages, setPageForTab, rowsPerPage } = usePagination();
  const currentPage = pages.all || 1;

  const fetchSubregions = async () => {
    try {
      // setLoading(true);
      const { data } = await apiClient.get("/subregion/all");
      setSubregions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      //  setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchSubregions();
  }, [accessToken]);

  // Reset page to 1 when search term changes.
  useEffect(() => {
    setPageForTab("all", 1);
  }, [searchTerm]);

  const filteredSubregions = subregions.filter(
    (r) =>
      (r.subRegionName ? r.subRegionName.toLowerCase() : "").includes(
        searchTerm.toLowerCase()
      ) ||
      (r.subRegionCode ? r.subRegionCode.toLowerCase() : "").includes(
        searchTerm.toLowerCase()
      ) ||
      (r.regionName ? r.regionName.toLowerCase() : "").includes(
        searchTerm.toLowerCase()
      )
  );

  const totalPages = Math.ceil(filteredSubregions.length / rowsPerPage);
  const paginatedSubregions = filteredSubregions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDelete = async (id) => {
    const subregion = subregions.find((r) => r.id === id);
    const result = await Swal.fire({
      title: "Confirm Deletion",
      text: `To delete subregion "${subregion.subRegionName}", please type "yes":`,
      icon: "warning",
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
    });
    if (result.isConfirmed && result.value === "yes") {
      try {
        const response = await apiClient.delete("/subregion/delete", {
          params: { subRegionCode: subregion.subRegionCode },
        });
        const successMessage = response.data;
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: successMessage,
          confirmButtonColor: "#2B9843",
        });
        setSubregions(subregions.filter((r) => r.id !== id));
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: err.response?.data || err.message,
        });
      }
    }
  };

  const handleEdit = (id) => {
    const subregion = subregions.find((r) => r.id === id);
    setEditingSubregion(subregion);
    setMode("update");
  };

  const handleView = (subregion) => {
    setViewRecord(subregion);
    setMode("view");
  };

  if (mode === "table") {
    return (
      <div className="registered-table">
        <div className="table-header">
          <img
            src="https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Subregion Header"
            className="header-image"
          />
          <div className="header-overlay">
            <h2>Registered Area</h2>
          </div>
        </div>
        <div className="table-content">
          <div className="table-controls">
            <button
              className="register-btn"
              onClick={() => {
                if (!groupData?.permissions?.createSubRegion) {
                  Swal.fire({
                    icon: "error",
                    title: "Access Denied",
                    text: "You do not have permission to register a subregion.",
                  });
                  return;
                }
                setMode("register");
              }}
            >
              Register Area
            </button>
          </div>
          <input
            type="text"
            placeholder="Search Area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <table>
            <thead>
              <tr>
                <th>Area Name</th>
                <th>Area Code</th>
                <th>Region</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubregions.map((r) => (
                <tr key={r.id}>
                  <td data-label="Area Name">{r.subRegionName}</td>
                  <td data-label="Area Code">{r.subRegionCode}</td>
                  <td data-label="Region">{r.regionName}</td>
                  <td data-label="Actions">
                    <div className="dropdown">
                      <button className="dropbtn">action</button>
                      <div className="dropdown-content">
                        <button
                          className="action-btn update-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.updateSubRegion) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to update a subregion.",
                              });
                              return;
                            }
                            handleEdit(r.id);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.deleteSubRegion) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to delete a subregion.",
                              });
                              return;
                            }
                            handleDelete(r.id);
                          }}
                        >
                          <FaTrash /> Delete
                        </button>
                        <button
                          className="action-btn view-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.readSubRegion) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to view a subregion.",
                              });
                              return;
                            }
                            handleView(r);
                          }}
                        >
                          <FaEye /> View
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSubregions.length >= rowsPerPage && (
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
  if (mode === "register") {
    return (
      <GenericModal onClose={() => setMode("table")}>
        <SubregionRegistration
          onClose={() => setMode("table")}
          onRegistrationSuccess={fetchSubregions}
        />
      </GenericModal>
    );
  }
  if (mode === "update" && editingSubregion) {
    return (
      <GenericModal onClose={() => setMode("table")}>
        <SubregionUpdate
          record={editingSubregion}
          onClose={() => setMode("table")}
          onUpdateSuccess={fetchSubregions}
        />
      </GenericModal>
    );
  }
  if (mode === "view" && viewRecord) {
    return (
      <GenericModal
        onClose={() => {
          setViewRecord(null);
          setMode("table");
        }}
      >
        <SubregionView
          record={viewRecord}
          onClose={() => {
            setViewRecord(null);
            setMode("table");
          }}
        />
      </GenericModal>
    );
  }
  return null;
};

export default SubregionTable;
