import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaTrash, FaEye } from "react-icons/fa";
import GenericModal from "../GenericModal";
import GroupRegistration from "./GroupRegistration";
import GroupRoleManagement from "./GroupRoleManagement";
import GroupView from "./GroupView";
import { useSelector } from "react-redux";
import apiClient from "../apiClient";
import "../../styles/registeredTables.css";
import "../../styles/roles.css";

const GroupTable = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState("table");
  const [managingRoles, setManagingRoles] = useState(null);
  const [roleFormData, setRoleFormData] = useState({});
  const [viewRecord, setViewRecord] = useState(null);

  const fetchGroups = async () => {
    try {
      const { data } = await apiClient.get("/group/all");
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      Swal.fire("Error", err.response?.data || err.message, "error");
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [accessToken]);

  const handleDelete = async (id) => {
    const group = groups.find((g) => g.id === id);
    Swal.fire({
      title: "Confirm Deletion",
      text: `To delete group "${group.groupName}", please type "yes":`,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Type yes to confirm",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#2B9843",
      preConfirm: (inputValue) => {
        if (inputValue !== "yes") {
          Swal.showValidationMessage('Type "yes" to confirm.');
        }
        return inputValue;
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value === "yes") {
        try {
          const { data: responseText } = await apiClient.delete(
            `/group/delete?id=${id}`
          );
          Swal.fire("Deleted!", responseText, "success");
          setGroups(groups.filter((g) => g.id !== id));
        } catch (err) {
          Swal.fire("Error", err.response?.data || err.message, "error");
        }
      }
    });
  };

  const handleManageRoles = (group) => {
    setManagingRoles(group);
    const { ...roles } = group;
    setRoleFormData({ ...roles });
    setMode("roles");
  };

  const handleView = (group) => {
    setViewRecord(group);
    setMode("view");
  };

  const filteredGroups = groups.filter((group) => {
    const name = (group.groupName || "").toLowerCase();
    const id = (group.groupId || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || id.includes(term);
  });

  if (mode === "table") {
    return (
      <div className="registered-table">
        <div className="table-header" style={{ position: "relative" }}>
          <img
            src="https://images.pexels.com/photos/3184634/pexels-photo-3184634.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Groups"
            className="header-image"
          />
          <div className="header-overlay">
            <h2>Registered Groups</h2>
          </div>
        </div>
        <div className="table-content">
          <div className="table-controls">
            <button
              className="register-btn"
              onClick={() => setMode("register")}
            >
              Register Group
            </button>
          </div>
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <table>
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Group Id</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <tr key={group.id || group.groupId}>
                  <td data-label="Group Name">{group.groupName}</td>
                  <td data-label="Group Id">{group.groupId}</td>
                  <td data-label="Actions">
                    <div className="dropdown">
                      <button className="dropbtn">action</button>
                      <div className="dropdown-content">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleView(group)}
                        >
                          <FaEye /> View
                        </button>
                        <button
                          className="action-btn roles-btn"
                          onClick={() => handleManageRoles(group)}
                        >
                          Manage Roles
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(group.id)}
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
        </div>
      </div>
    );
  }

  if (mode === "register") {
    return (
      <GenericModal onClose={() => setMode("table")}>
        <GroupRegistration
          onClose={() => setMode("table")}
          onRegistrationSuccess={fetchGroups}
        />
      </GenericModal>
    );
  }

  if (mode === "roles" && managingRoles) {
    return (
      <GenericModal onClose={() => setMode("table")}>
        <GroupRoleManagement
          group={managingRoles}
          onClose={() => setMode("table")}
          onUpdateSuccess={fetchGroups}
          initialRoles={roleFormData}
        />
      </GenericModal>
    );
  }

  if (mode === "view" && viewRecord) {
    return (
      <GenericModal onClose={() => setMode("table")}>
        <GroupView group={viewRecord} onClose={() => setMode("table")} />
      </GenericModal>
    );
  }

  return null;
};

export default GroupTable;
