import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaTrash, FaEye } from "react-icons/fa";
import GenericModal from "../GenericModal";
import RegionsRegistration from "./RegionRegistration";
import RegionsUpdate from "./RegionUpdate";
import RegionsView from "./RegionsView";
import { useSelector } from "react-redux";
import apiClient from "../apiClient";
import "../../styles/registeredTables.css";
import "../../styles/roles.css";

const RegionsManagement = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const groupData = useSelector((state) => state.auth.groupData);

  const [mode, setMode] = useState("table");
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRegion, setEditingRegion] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    regionName: "",
    regionCode: "",
  });
  //const [updating, setUpdating] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/region/all");
      setRegions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchRegions();
  }, [accessToken]);

  // const handleRegChange = (e) => {
  //   setRegFormData({ ...regFormData, [e.target.id]: e.target.value });
  // };

  // const handleRegSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!regFormData.regionName.trim() || !regFormData.regionCode.trim()) {
  //     setRegError("All fields are required.");
  //     Swal.fire({ title: "Validation Error", text: "All fields are required.", icon: "error", button: "OK" });
  //     return;
  //   }
  //   setRegError("");
  //   const payload = { regionName: regFormData.regionName, regionCode: regFormData.regionCode };
  //   try {
  //     const response = await apiClient.post('/region', payload, {
  //       headers: { "Content-Type": "application/json" }
  //     });
  //     const responseText = response.data;
  //     Swal.fire({ icon: "success", title: "Success", text: responseText, confirmButtonColor: "#2B9843" }).then(() => {
  //       setRegFormData({ regionName: "", regionCode: "" });
  //       setMode("table");
  //       fetchRegions();
  //     });
  //   } catch (err) {
  //     Swal.fire({ icon: "error", title: "Error", text: err.response?.data || err.message });
  //   }
  // };

  // const handleUpdateChange = (e) => {
  //   setUpdateFormData({ ...updateFormData, [e.target.id]: e.target.value });
  // };

  // const handleUpdateSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!updateFormData.regionName.trim() || !updateFormData.regionCode.trim()) {
  //     setUpdateError("All fields are required.");
  //     Swal.fire({ icon: "error", title: "Update Error", text: "All fields are required." });
  //     return;
  //   }
  //   setUpdateError("");
  //   const payload = { regionName: updateFormData.regionName, regionCode: updateFormData.regionCode };
  //   try {
  //     setUpdating(true);
  //     const response = await apiClient.put('/region/update', payload, {
  //       params: { regionCode: editingRegion.regionCode },
  //       headers: { "Content-Type": "application/json" }
  //     });
  //     const updatedRegion = response.data;
  //     setRegions(regions.map(region => region.id === updatedRegion.id ? updatedRegion : region));
  //     setEditingRegion(null);
  //     setMode("table");
  //     Swal.fire({ icon: "success", title: "Update Successful", text: "Region updated successfully!", confirmButtonColor: "#2B9843" });
  //     fetchRegions();
  //   } catch (err) {
  //     setUpdateError(err.message);
  //     Swal.fire({ icon: "error", title: "Update Failed", text: err.response?.data || err.message });
  //   } finally {
  //     setUpdating(false);
  //   }
  // };

  // eslint-disable-next-line complexity
  const handleDelete = async (regionCode) => {
    const region = regions.find((r) => r.regionCode === regionCode);
    const result = await Swal.fire({
      title: "Confirm Deletion",
      text: `To delete region "${region.regionName}", please type "yes" below:`,
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
        const response = await apiClient.delete("/region/delete", {
          params: { regionCode },
        });
        const successMessage = response.data;
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: successMessage,
          confirmButtonColor: "#2B9843",
        });
        setRegions(regions.filter((r) => r.regionCode !== regionCode));
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: err.response?.data || err.message,
        });
      }
    }
  };

  const handleEdit = async (regionCode) => {
    console.log("function to eddit called");
    try {
      const region = regions.find((r) => r.regionCode === regionCode);
      setEditingRegion(region);
      setUpdateFormData({
        regionName: region.regionName || "",
        regionCode: region.regionCode || "",
      });
      setMode("update");
    } catch (error) {
      console.log("error in updating the region");
      console.log(error);
    }
  };

  const handleView = (region) => {
    setViewRecord(region);
    setMode("view");
  };

  const filteredRegions = regions.filter((region) => {
    const rName = region.regionName ? region.regionName.toLowerCase() : "";
    const rCode = region.regionCode ? region.regionCode.toLowerCase() : "";
    const term = searchTerm.toLowerCase();
    return rName.includes(term) || rCode.includes(term);
  });

  if (mode === "table") {
    return (
      <div className="registered-table">
        <div className="table-header">
          <img
            src="https://images.pexels.com/photos/8943323/pexels-photo-8943323.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Regions"
            className="header-image"
          />
          <div className="header-overlay">
            <h2>Registered Regions</h2>
          </div>
        </div>
        <div className="table-content">
          <div className="table-controls">
            <button
              className="register-btn"
              onClick={() => {
                if (!groupData?.permissions?.createRegion) {
                  Swal.fire({
                    icon: "error",
                    title: "Access Denied",
                    text: "You do not have permission to register a region.",
                  });
                  return;
                }
                setMode("register");
              }}
            >
              Register Region
            </button>
          </div>
          <input
            type="text"
            placeholder="Search regions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <table>
            <thead>
              <tr>
                <th>Region Name</th>
                <th>Region Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegions.map((region) => (
                <tr key={region.id}>
                  <td data-label="Region Name">{region.regionName}</td>
                  <td data-label="Region Code">{region.regionCode}</td>
                  <td data-label="Actions">
                    <div className="dropdown">
                      <button className="dropbtn">action</button>
                      <div className="dropdown-content">
                        <button
                          className="action-btn update-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.updateRegion) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to update a region.",
                              });
                              return;
                            }
                            handleEdit(region.regionCode);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.deleteRegion) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to delete a region.",
                              });
                              return;
                            }
                            handleDelete(region.regionCode);
                          }}
                        >
                          <FaTrash /> Delete
                        </button>
                        <button
                          className="action-btn view-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.readRegion) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to view region details.",
                              });
                              return;
                            }
                            handleView(region);
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
        </div>
      </div>
    );
  }
  if (mode === "register") {
    return (
      <GenericModal onClose={() => setMode("table")}>
        <RegionsRegistration
          onClose={() => setMode("table")}
          onRegistrationSuccess={fetchRegions}
        />
      </GenericModal>
    );
  }
  if (mode === "update" && editingRegion) {
    return (
      <GenericModal onClose={() => setMode("table")}>
        <RegionsUpdate
          record={editingRegion}
          onClose={() => setMode("table")}
          onUpdateSuccess={fetchRegions}
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
        <RegionsView
          record={viewRecord}
          onClose={() => {
            setViewRecord(null);
            setMode("table");
          }}
        />
      </GenericModal>
    );
  }
  if (loading) {
    return <div className="registered-table">Loading regions...</div>;
  }
  if (error) {
    return <div className="registered-table">Error: {error}</div>;
  }
  return null;
};

export default RegionsManagement;
