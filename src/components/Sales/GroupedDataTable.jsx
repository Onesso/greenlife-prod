import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../../styles/registeredTables.css";
import SalesDetailsTable from "../Commissions/SalesDetailsTable";
import GenericModal from "../GenericModal";
import apiClient from "../apiClient";
import { usePagination } from "../PaginationContext";
import { useSelector } from "react-redux";

const swalOptions = {
  background: "#ffffff",
  confirmButtonColor: "#2ECC71",
  cancelButtonColor: "#e74c3c",
  color: "#283e56",
};

const GroupedDataTable = () => {
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSalesDetails, setShowSalesDetails] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { pages, setPageForTab, rowsPerPage } = usePagination();
  const currentPage = pages.all || 1;
  const groupData = useSelector((state) => state.auth.groupData);

  const fetchGroupedData = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/sales/region-aggregated");
      if (Array.isArray(data)) {
        setGroupedData(data);
      } else {
        console.error("Unexpected distributors format:", data);
        setGroupedData([]);
      }
    } catch (error) {
      Swal.fire({
        ...swalOptions,
        title: "Error fetching data",
        text: error.message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  console.log("the value stored: ", groupedData);

  useEffect(() => {
    fetchGroupedData();
  }, []);

  const handleViewDetails = (agentId) => {
    if (!groupData?.permissions?.viewDetails) {
      Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to view sales details.",
      });
      return;
    }
    setSelectedAgentId(agentId);
    setShowSalesDetails(true);
  };

  if (loading) {
    return <div>Loading agent sales data...</div>;
  }

  if (showSalesDetails) {
    return (
      <GenericModal
        onClose={() => setShowSalesDetails(false)}
        showBackButton={false}
      >
        <SalesDetailsTable
          agentId={selectedAgentId}
          onBack={() => setShowSalesDetails(false)}
        />
      </GenericModal>
    );
  }

  if (!groupedData.length) {
    return <div>No agent sales data available.</div>;
  }

  // const filteredData = groupedData.filter((item) => {
  //   const { agent } = item;
  //   console.log("the values of agent: ", agent);
  //   const search = searchTerm.toLowerCase();
  //   return (
  //     agent &&
  //     ((agent.phoneNumber || "").toLowerCase().includes(search) ||
  //       (agent.agentName || "").toLowerCase().includes(search) ||
  //       (agent.email || "").toLowerCase().includes(search) ||
  //       (agent.finalCommission
  //         ? agent.finalCommission.toString().toLowerCase()
  //         : ""
  //       ).includes(search))
  //   );
  // });

  const filteredData = groupedData.filter((agent) => {
    const search = searchTerm.toLowerCase();
    return (
      (agent.phoneNumber || "").toLowerCase().includes(search) ||
      (agent.agentName || "").toLowerCase().includes(search) ||
      (agent.email || "").toLowerCase().includes(search) ||
      (agent.finalCommission
        ? agent.finalCommission.toString().toLowerCase()
        : ""
      ).includes(search)
    );
  });

  console.log("the filtered data is: ", filteredData);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="registered-table">
      <div id="printable-area">
        <div className="table-header">
          <img
            src="https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Agent Sales"
            className="header-image"
          />
          <div className="header-overlay">
            <h2>Agent Details</h2>
          </div>
        </div>
        <div style={{ margin: "20px 0", textAlign: "right" }}></div>
        <div style={{ margin: "0 1rem" }}>
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageForTab("all", 1);
            }}
            className="search-input"
          />
        </div>
        <div className="table-content">
          <table>
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Total Commission</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((agent, index) => (
                <tr key={`${agent.email}-${index}`}>
                  <td data-label="Agent Name">{agent.agentName}</td>
                  <td data-label="Phone Number">{agent.phoneNumber}</td>
                  <td data-label="Email">{agent.email}</td>
                  <td data-label="Total Commission">{agent.finalCommission}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length > rowsPerPage && (
            <div
              style={{
                marginTop: "10px",
                textAlign: "center",
                overflowX: "auto",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  padding: "5px",
                }}
              >
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
                      borderRadius: "4px",
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupedDataTable;
