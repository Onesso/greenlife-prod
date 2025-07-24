import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import "../../styles/registeredTables.css";
import { BASE_URL } from "../apiClient";
import { useSelector } from "react-redux";
import GenericModal from "../GenericModal";
import SalesDetailsTable from "../Sales/SalesDetailsTable";
import BatchDetails from "./BatchSales";
import apiClient from "../apiClient";
import { usePagination } from "../PaginationContext";

const swalOptions = {
  background: "#ffffff",
  confirmButtonColor: "#2ECC71",
  cancelButtonColor: "#e74c3c",
  color: "#283e56",
};

const confirmAction = async (promptText) => {
  const result = await Swal.fire({
    ...swalOptions,
    title: promptText,
    showCancelButton: true,
    confirmButtonText: "Okay",
    cancelButtonText: "Cancel",
  });
  if (result.isConfirmed) return true;
  Swal.fire({ ...swalOptions, title: "Action canceled", icon: "info" });
  return false;
};

const confirmPay = async (promptText) => {
  const { value } = await Swal.fire({
    ...swalOptions,
    title: promptText,
    input: "text",
    inputPlaceholder: 'Type "yes" to confirm',
    showCancelButton: true,
    inputValidator: (v) => (v ? null : "You need to type yes to confirm!"),
  });
  if (value?.toLowerCase() === "yes") return true;
  Swal.fire({ ...swalOptions, title: "Action canceled", icon: "info" });
  return false;
};

const handleViewImage = (reciept_image_path, groupData) => {
  if (!groupData?.permissions?.viewRecieptImage) {
    Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: "You do not have permission to view receipt images.",
    });
    return;
  }
  const imageUrl = `${BASE_URL}/serve/getImage/${reciept_image_path}`;
  Swal.fire({
    ...swalOptions,
    title: "Receipt Image",
    html: `<img src="${imageUrl}" style="width:100%; height:auto; max-height:80vh;" />`,
    heightAuto: false,
    confirmButtonText: "Close",
  });
};

function CommissionsTable() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const groupData = useSelector((state) => state.auth.groupData);

  const [approval1Data, setApproval1Data] = useState([]);
  const [approval2Data, setApproval2Data] = useState([]);
  const [initialData, setInitialData] = useState([]);
  const [currentTab, setCurrentTab] = useState("approval1");

  const [showSalesDetails, setShowSalesDetails] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [batchSalesData, setBatchSalesData] = useState(null);

  const { pages, setPageForTab, rowsPerPage } = usePagination();
  const pagesContainerRef = useRef(null);

  const showLoadingAlert = () => {
    Swal.fire({
      ...swalOptions,
      title: "Processing...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  };

  const fetchApproval1 = () => {
    apiClient
      .get("/sales/approved")
      .then((res) => Array.isArray(res.data) && setApproval1Data(res.data))
      .catch(console.error);
  };

  const fetchApproval2 = () => {
    apiClient
      .get("/sales/v1/batch")
      .then(
        (res) =>
          Array.isArray(res.data.object) && setApproval2Data(res.data.object)
      )
      .catch(console.error);
  };

  const fetchInitial = () => {
    apiClient
      .get("/sales/closed-batches")
      .then(
        (res) =>
          Array.isArray(res.data.object) && setInitialData(res.data.object)
      )
      .catch(console.error);
  };

  useEffect(() => {
    if (currentTab === "approval1") fetchApproval1();
    else if (currentTab === "approval2") fetchApproval2();
    else if (currentTab === "initial") fetchInitial();
    setPageForTab(currentTab, 1);
  }, [currentTab, accessToken]);

  const handleApproval1 = async (id) => {
    if (!groupData?.permissions?.approve1) {
      Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to confirm commission.",
      });
      return;
    }
    const sale = approval1Data.find((s) => s.id === id);
    if (
      !(await confirmAction(
        `Confirm commission for ${sale?.first_name || "this sale"}?`
      ))
    )
      return;
    showLoadingAlert();
    try {
      await apiClient.put("/sales/v1/confirmation", null, {
        params: { id, newStatus: "Confirmed" },
      });
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Success",
        text: "Sale confirmed!",
        icon: "success",
      });
      fetchApproval1();
    } catch (err) {
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Error",
        text: err.message,
        icon: "error",
      });
    }
  };

  const handleApproval2 = async (id) => {
    if (!groupData?.permissions?.approve2) {
      Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to approve commission.",
      });
      return;
    }
    const sale = approval2Data.find((s) => s.id === id);
    if (
      !(await confirmAction(
        `Approve commission for ${sale?.first_name || "this sale"}?`
      ))
    )
      return;
    showLoadingAlert();
    try {
      await apiClient.put("/sales/approve", null, {
        params: { id, newStatus: "Approved" },
      });
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Success",
        text: "Sale approved!",
        icon: "success",
      });
      fetchApproval2();
    } catch (err) {
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Error",
        text: err.message,
        icon: "error",
      });
    }
  };

  const handleViewDetails = (agentId) => {
    if (!groupData?.permissions?.readCommission) {
      Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to view commission details.",
      });
      return;
    }
    setSelectedAgentId(agentId);
    setShowSalesDetails(true);
  };

  const handleViewBatch = async (refNo) => {
    showLoadingAlert();
    try {
      const { data } = await apiClient.get("/sales/get-batch", {
        params: { refNo },
      });
      Swal.close();
      if (data.successful) {
        setBatchSalesData(data.object);
        setShowBatchDetails(true);
      } else throw new Error(data.message || "Failed to fetch batch details");
    } catch (err) {
      Swal.close();
      Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Error",
        text: err.message,
      });
    }
  };

  const handleCloseBatch = async (refNo) => {
    if (!(await confirmAction(`Close batch ${refNo}?`))) return;
    showLoadingAlert();
    try {
      await apiClient.put("/sales/close", null, { params: { refNo } });
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Success",
        text: "Batch closed!",
        icon: "success",
      });
      fetchApproval2();
    } catch (err) {
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Error",
        text: err.message,
        icon: "error",
      });
    }
  };

  const handlePayBatch = async (refNo) => {
    if (!groupData?.permissions?.pay) {
      Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to pay commission.",
      });
      return;
    }
    if (!(await confirmPay(`Pay commission for batch ${refNo}?`))) return;
    try {
      await apiClient.post("/sales/generate-csv", { refNo });
      Swal.fire({
        title: "Success!",
        text: `Batch paid for Ref No: ${refNo}`,
        icon: "success",
      });
      fetchApproval2();
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: `Failed to pay batch ${refNo}`,
        icon: "error",
      });
    }
  };

  if (showSalesDetails)
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

  if (showBatchDetails)
    return (
      <GenericModal
        onClose={() => setShowBatchDetails(false)}
        showBackButton={false}
      >
        <BatchDetails
          batchSales={batchSalesData}
          onBack={() => setShowBatchDetails(false)}
        />
      </GenericModal>
    );

  const renderTable = (data, tabName) => {
    const currentPage = pages[tabName] || 1;
    const startIdx = (currentPage - 1) * rowsPerPage;
    const paginated = data.slice(startIdx, startIdx + rowsPerPage);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    return (
      <>
        <div className="table-content">
          <table>
            <thead>
              <tr>
                <th>SN</th>
                {tabName === "approval1" ? (
                  <>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Initial Commission</th>
                    {/* <th>Final Commission</th> */}
                    <th>Sub-region</th>
                    <th>Region</th>
                    <th>Distributor</th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </>
                ) : (
                  <>
                    <th>State</th>
                    <th>Ref No</th>
                    <th>No of Sales</th>
                    <th>Commission</th>
                    <th>Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((item, idx) => {
                  const batchState = item.state || item.posting_state;
                  return (
                    <tr key={`${item.ref_no || item.id}-${idx}`}>
                      <td data-label="SN">{startIdx + idx + 1}</td>

                      {tabName === "approval1" && (
                        <>
                          <td data-label="Name">
                            {item.first_name} {item.last_name}
                          </td>
                          <td data-label="Email">{item.email}</td>
                          <td data-label="Phone">{item.phone_number}</td>
                          <td data-label="Amount">{item.amount}</td>
                          <td data-label="Initial Commission">
                            {item.initial_commission}
                          </td>
                          {/* <td data-label="Final Commission">{item.final_commission}</td> */}
                          <td data-label="Sub-region">{item.sub_region}</td>
                          <td data-label="Region">{item.region_name}</td>
                          <td data-label="Distributor">{item.distributor}</td>
                          <td data-label="Receipt">
                            <button
                              className="action-btn view-btn"
                              onClick={() =>
                                handleViewImage(
                                  item.reciept_image_path,
                                  groupData
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                          <td data-label="Actions">
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleApproval1(item.id)}
                            >
                              Confirm
                            </button>
                          </td>
                        </>
                      )}

                      {tabName === "approval2" && (
                        <>
                          <td data-label="State">{batchState || "N/A"}</td>
                          <td data-label="Ref No">{item.ref_no || "N/A"}</td>
                          <td data-label="No of Sales">
                            {item.totalsales || "N/A"}
                          </td>
                          <td data-label="Commission">
                            {item.totalcommission || "N/A"}
                          </td>
                          <td data-label="Actions">
                            {batchState === "Opened" ? (
                              <>
                                <button
                                  className="action-btn close-btn"
                                  onClick={() => handleCloseBatch(item.ref_no)}
                                >
                                  Close Batch
                                </button>
                                <button
                                  className="action-btn view-btn"
                                  onClick={() => handleViewBatch(item.ref_no)}
                                >
                                  View
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="action-btn pay-btn"
                                  onClick={() => handlePayBatch(item.ref_no)}
                                >
                                  Pay
                                </button>
                                <button
                                  className="action-btn view-btn"
                                  onClick={() => handleViewBatch(item.ref_no)}
                                >
                                  View
                                </button>
                              </>
                            )}
                          </td>
                        </>
                      )}

                      {tabName === "initial" && (
                        <>
                          <td data-label="State">{batchState || "N/A"}</td>
                          <td data-label="Ref No">{item.ref_no || "N/A"}</td>
                          <td data-label="No of Sales">
                            {item.totalsales || "N/A"}
                          </td>
                          <td data-label="Commission">
                            {item.totalcommission || "N/A"}
                          </td>
                          <td data-label="Actions">
                            <button
                              className="action-btn view-btn"
                              onClick={() => handlePayBatch(item.ref_no)}
                            >
                              Pay
                            </button>
                            <button
                              className="action-btn view-btn"
                              onClick={() => handleViewBatch(item.ref_no)}
                            >
                              View
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={tabName === "approval1" ? 12 : 6}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: "10px",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() =>
              pagesContainerRef.current?.scrollBy({
                left: -50,
                behavior: "smooth",
              })
            }
            style={{
              margin: "0 5px",
              padding: "5px 10px",
              border: "none",
              cursor: "pointer",
            }}
          >
            &#x25C0;
          </button>
          <div
            ref={pagesContainerRef}
            style={{ overflowX: "auto", whiteSpace: "nowrap", width: "300px" }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPageForTab(tabName, p)}
                style={{
                  margin: "0 5px",
                  padding: "5px 10px",
                  backgroundColor:
                    (pages[tabName] || 1) === p ? "#0a803e" : "#f0f0f0",
                  color: (pages[tabName] || 1) === p ? "#fff" : "#000",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              pagesContainerRef.current?.scrollBy({
                left: 50,
                behavior: "smooth",
              })
            }
            style={{
              margin: "0 5px",
              padding: "5px 10px",
              border: "none",
              cursor: "pointer",
            }}
          >
            &#x25B6;
          </button>
        </div>
      </>
    );
  };

  const renderControls = () => (
    <div className="table-controls">
      <div
        className="tabs"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <button
            className={`tab-btn ${currentTab === "approval1" ? "active" : ""}`}
            onClick={() => setCurrentTab("approval1")}
          >
            Confirmation
          </button>
          <button
            className={`tab-btn ${currentTab === "approval2" ? "active" : ""}`}
            onClick={() => setCurrentTab("approval2")}
          >
            Approval
          </button>
          {/* <button className={`tab-btn ${currentTab === 'initial' ? 'active' : ''}`} onClick={() => setCurrentTab('initial')}>Payment</button> */}
        </div>
      </div>
    </div>
  );

  return (
    <div className="registered-table">
      <div className="table-header">
        <img
          src="https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Commissions"
          className="header-image"
        />
        <div className="header-overlay">
          <h2>
            {currentTab === "initial" ? "Agent Details" : "Commissions Records"}
          </h2>
        </div>
      </div>
      {renderControls()}
      {currentTab === "approval1"
        ? renderTable(approval1Data, "approval1")
        : currentTab === "approval2"
        ? renderTable(approval2Data, "approval2")
        : renderTable(initialData, "initial")}
    </div>
  );
}

export default CommissionsTable;
