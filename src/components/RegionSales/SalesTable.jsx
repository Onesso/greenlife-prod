import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../../styles/registeredTables.css";
import ProductDetails from "./ProductDetails";
import GenericModal from "../GenericModal";
import { BASE_URL } from "../apiClient";
import apiClient from "../apiClient";
import { usePagination } from "../PaginationContext";
import { useSelector } from "react-redux";

const swalOptions = {
  background: "#ffffff",
  confirmButtonColor: "#2ECC71",
  cancelButtonColor: "#e74c3c",
  color: "#283e56",
};

function SalesTable() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const groupData = useSelector((state) => state.auth.groupData);
  const [salesData, setSalesData] = useState([]);
  const [acceptedSales, setAcceptedSales] = useState([]);
  const [rejectedSales, setRejectedSales] = useState([]);
  const [currentTab, setCurrentTab] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { pages, setPageForTab, rowsPerPage } = usePagination();

  const confirmAction = async (promptText) => {
    const result = await Swal.fire({
      ...swalOptions,
      title: promptText,
      showCancelButton: true,
      confirmButtonText: "Okay",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      return true;
    } else {
      Swal.fire({
        ...swalOptions,
        title: "Action canceled",
        icon: "info",
      });
      return false;
    }
  };

  const fetchAllSales = () => {
    apiClient
      .get("/sales/email/region")
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          setSalesData(data);
        } else {
          return Promise.reject("Invalid data format");
        }
      })
      .catch((error) => {
        console.error("Error fetching all sales data:", error);
      });
  };

  const fetchAcceptedSales = () => {
    apiClient
      .get("/sales/region-approved")
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          setAcceptedSales(data);
        } else {
          return Promise.reject("Invalid data format");
        }
      })
      .catch((error) => {
        console.error("Error fetching accepted sales data:", error);
      });
  };

  const fetchRejectedSales = () => {
    apiClient
      .get("/sales/region-rejected")
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          setRejectedSales(data);
        } else {
          return Promise.reject("Invalid data format");
        }
      })
      .catch((error) => {
        console.error("Error fetching rejected sales data:", error);
      });
  };

  useEffect(() => {
    if (currentTab === "all") {
      fetchAllSales();
    } else if (currentTab === "accepted") {
      fetchAcceptedSales();
    } else if (currentTab === "rejected") {
      fetchRejectedSales();
    }
    setPageForTab(currentTab, 1);
  }, [currentTab, accessToken]);

  const showLoadingAlert = () => {
    Swal.fire({
      ...swalOptions,
      title: "Processing...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  // —— New Download Handler Added Here ——
  const handleDownload = () => {
    let endpoint = "";
    let filename = "";
    switch (currentTab) {
      case "all":
        endpoint = "/sales/download-region-sales";
        filename = "all_sales.xlsx";
        break;
      case "accepted":
        endpoint = "/sales/download-region-approved-sales";
        filename = "approved_sales.xlsx";
        break;
      case "rejected":
        endpoint = "/sales/download-region-rejected-sales";
        filename = "rejected_sales.xlsx";
        break;
      default:
        return;
    }

    fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to download file");
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "Download Failed",
          text: err.message,
        });
      });
  };
  // —— End of Download Handler ——

  const handleAccept = async (saleId) => {
    if (!groupData?.permissions?.acceptSales) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to accept sales.",
      });
      return;
    }
    const sale = salesData.find((s) => s.id === saleId);
    if (!sale) return;
    const confirmed = await confirmAction(
      `Are you sure you want to accept sale for createdBy ${sale.email}?`
    );
    if (!confirmed) return;
    showLoadingAlert();
    try {
      await apiClient.put(`/sales/update?id=${sale.id}&newStatus=Accepted`);
      Swal.close();
      Swal.fire({
        ...swalOptions,
        icon: "success",
        title: "Sale Accepted",
        text: `Sale accepted for createdBy ${sale.email}`,
      });
      fetchAllSales();
      fetchAcceptedSales();
    } catch (error) {
      console.error("Error accepting sale:", error);
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Error",
        text: "Could not accept sale. Please try again.",
        icon: "error",
      });
    }
  };

  const handleReject = async (saleId) => {
    if (!groupData?.permissions?.rejectSales) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to reject sales.",
      });
      return;
    }
    const sale = salesData.find((s) => s.id === saleId);
    if (!sale) return;
    const confirmed = await confirmAction(
      `Are you sure you want to reject sale for ${sale.email}?`
    );
    if (!confirmed) return;
    showLoadingAlert();
    try {
      await apiClient.put(`/sales/update?id=${sale.id}&newStatus=Rejected`);
      Swal.close();
      Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Sale Rejected",
        text: `Sale rejected for createdBy ${sale.email}`,
      });
      fetchAllSales();
      fetchRejectedSales();
    } catch (error) {
      console.error("Error rejecting sale:", error);
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Error",
        text: "Could not reject sale. Please try again.",
        icon: "error",
      });
    }
  };

  const moveAcceptedToRejected = async (saleId) => {
    if (!groupData?.permissions?.rejectSales) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to reject sales.",
      });
      return;
    }
    const sale = acceptedSales.find((s) => s.id === saleId);
    if (!sale) return;
    const confirmed = await confirmAction(
      `Are you sure you want to reject sale for createdBy ${sale.email}?`
    );
    if (!confirmed) return;
    showLoadingAlert();
    try {
      await apiClient.put(`/sales/update?id=${sale.id}&newStatus=Rejected`);
      Swal.close();
      Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Sale Rejected",
        text: `Sale rejected for createdBy ${sale.email}`,
      });
      fetchAcceptedSales();
      fetchRejectedSales();
    } catch (error) {
      console.error("Error updating sale status:", error);
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Error",
        text: "Could not update sale status. Please try again.",
        icon: "error",
      });
    }
  };

  const moveRejectedToAccepted = async (saleId) => {
    if (!groupData?.permissions?.acceptSales) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to accept sales.",
      });
      return;
    }
    const sale = rejectedSales.find((s) => s.id === saleId);
    if (!sale) return;
    const confirmed = await confirmAction(
      `Are you sure you want to accept sale for ${sale.email}?`
    );
    if (!confirmed) return;
    showLoadingAlert();
    try {
      await apiClient.put(`/sales/update?id=${sale.id}&newStatus=Accepted`);
      Swal.close();
      Swal.fire({
        ...swalOptions,
        icon: "success",
        title: "Sale Accepted",
        text: `Sale accepted for createdBy ${sale.email}`,
      });
      fetchAcceptedSales();
      fetchRejectedSales();
    } catch (error) {
      console.error("Error updating sale status:", error);
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Error",
        text: "Could not update sale status. Please try again.",
        icon: "error",
      });
    }
  };

  const handleViewImage = (reciept_image_path) => {
    if (!groupData?.permissions?.viewRecieptImage) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to view receipt images.",
      });
      return;
    }
    const imageUrl = `${BASE_URL}/serve/getImage/${reciept_image_path}`;
    console.log("Image URL:", imageUrl);
    Swal.fire({
      ...swalOptions,
      title: "Receipt Image",
      html: `<img src="${imageUrl}" style="width:100%; height:auto; max-height:80vh;" />`,
      heightAuto: false,
      showConfirmButton: true,
      confirmButtonText: "Close",
    });
  };

  const handleViewProductDetails = async (ref_id) => {
    if (!groupData?.permissions?.readProduct) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You do not have permission to view product details.",
      });
      return;
    }
    Swal.fire({
      ...swalOptions,
      title: "Fetching Product Details...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const response = await apiClient.get(`/sales/sold-products?id=${ref_id}`);
      const data = response.data;
      const productDetails = Array.isArray(data.object) ? data.object : [];
      Swal.close();
      setSelectedProduct(productDetails);
    } catch (error) {
      console.error("Error fetching product details:", error);
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Error",
        text: "Could not fetch product details. Please try again.",
        icon: "error",
      });
    }
  };

  const renderTable = (data, tabName) => {
    const currentPage = pages[tabName] || 1;
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const filteredData = data.filter((sale) => {
      const search = searchTerm.toLowerCase();
      return (
        (sale.first_name || "").toLowerCase().includes(search) ||
        (sale.last_name || "").toLowerCase().includes(search) ||
        (sale.phone_number || "").toLowerCase().includes(search) ||
        (sale.email || "").toLowerCase().includes(search) ||
        (sale.distributor || "").toLowerCase().includes(search) ||
        (sale.region_name || "").toLowerCase().includes(search) ||
        (sale.sub_region || "").toLowerCase().includes(search) ||
        (sale.amount ? sale.amount.toString().toLowerCase() : "").includes(
          search
        ) ||
        (sale.created_date || "").toLowerCase().includes(search) ||
        (sale.initial_commission
          ? sale.initial_commission.toString().toLowerCase()
          : ""
        ).includes(search)
      );
    });
    const paginatedData = filteredData.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    return (
      <div>
        <div className="table-content">
          <table>
            <thead>
              <tr>
                <th>SN</th>
                <th className="first-name-col">Agent name</th>
                <th>Phone number</th>
                <th>Distributor</th>
                <th className="region-name-col">Region</th>
                <th>Sub region</th>
                <th>Amount</th>
                <th>Created Date</th>
                <th>Created Time</th>
                {tabName === "accepted" && <th>Initial commission</th>}
                <th>Status</th>
                <th>Product details</th>
                <th>Receipt image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((sale, index) => (
                  <tr key={`${sale.id}-${index}`}>
                    <td data-label="SN">{index + 1 + indexOfFirstRow}</td>
                    <td className="first-name-col" data-label="Agent Name">
                      {sale.first_name || "N/A"} {sale.last_name || "N/A"}
                    </td>
                    <td data-label="Phone number">
                      {sale.phone_number || "N/A"}
                    </td>
                    <td data-label="Distributor">
                      {sale.distributor || "N/A"}
                    </td>
                    <td className="region-name-col" data-label="Region">
                      {sale.region_name || "N/A"}
                    </td>
                    <td data-label="Sub Region">{sale.sub_region || "N/A"}</td>
                    <td data-label="Amount">{sale.amount || "N/A"}</td>
                    <td data-label="Created Date">
                      {sale.created_date
                        ? sale.created_date.split("T")[0]
                        : "N/A"}
                    </td>
                    <td data-label="Created Time">
                      {sale.created_date
                        ? sale.created_date.split("T")[1].split(".")[0]
                        : "N/A"}
                    </td>
                    {tabName === "accepted" && (
                      <td data-label="Initial Commission">
                        {sale.initial_commission || "N/A"}
                      </td>
                    )}
                    <td data-label="Status">{sale.status || "Pending"}</td>
                    <td data-label="Product Details">
                      <button
                        className="action-btn view-btn"
                        onClick={() => {
                          if (!groupData?.permissions?.readProduct) {
                            Swal.fire({
                              icon: "error",
                              title: "Access Denied",
                              text: "You do not have permission to view product details.",
                            });
                            return;
                          }
                          handleViewProductDetails(sale.ref_id);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                    <td data-label="Receipt Image">
                      <button
                        className="action-btn view-btn"
                        onClick={() => {
                          if (!groupData?.permissions?.viewRecieptImage) {
                            Swal.fire({
                              icon: "error",
                              title: "Access Denied",
                              text: "You do not have permission to view receipt images.",
                            });
                            return;
                          }
                          handleViewImage(sale.reciept_image_path);
                        }}
                      >
                        View
                      </button>
                    </td>
                    <td data-label="Actions">
                      {tabName === "all" && (
                        <>
                          <button
                            className="action-btn view-btn"
                            onClick={() => {
                              if (!groupData?.permissions?.acceptSales) {
                                Swal.fire({
                                  icon: "error",
                                  title: "Access Denied",
                                  text: "You do not have permission to accept sales.",
                                });
                                return;
                              }
                              handleAccept(sale.id);
                            }}
                          >
                            Accept
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => {
                              if (!groupData?.permissions?.rejectSales) {
                                Swal.fire({
                                  icon: "error",
                                  title: "Access Denied",
                                  text: "You do not have permission to reject sales.",
                                });
                                return;
                              }
                              handleReject(sale.id);
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {tabName === "accepted" && (
                        <button
                          className="action-btn delete-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.rejectSales) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to reject sales.",
                              });
                              return;
                            }
                            moveAcceptedToRejected(sale.id);
                          }}
                        >
                          Reject
                        </button>
                      )}
                      {tabName === "rejected" && (
                        <button
                          className="action-btn view-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.acceptSales) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to accept sales.",
                              });
                              return;
                            }
                            moveRejectedToAccepted(sale.id);
                          }}
                        >
                          Accept
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={tabName === "accepted" ? 12 : 10}
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
          style={{ marginTop: "10px", textAlign: "center", overflowX: "auto" }}
        >
          <div
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              padding: "5px",
            }}
          >
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setPageForTab(tabName, page)}
                  style={{
                    margin: "0 5px",
                    padding: "5px 10px",
                    backgroundColor:
                      (pages[tabName] || 1) === page ? "#0a803e" : "#f0f0f0",
                    color: (pages[tabName] || 1) === page ? "#fff" : "#000",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {page}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    let dataToRender;
    if (currentTab === "all") {
      dataToRender = salesData.filter(
        (sale) => sale.status && sale.status.toLowerCase() === "pending"
      );
    } else if (currentTab === "accepted") {
      dataToRender = acceptedSales;
    } else {
      dataToRender = rejectedSales;
    }
    return renderTable(dataToRender, currentTab);
  };

  if (selectedProduct) {
    return (
      <GenericModal onClose={() => setSelectedProduct(null)}>
        <div className="modal-inner-content" style={{ padding: "1rem" }}>
          <ProductDetails
            records={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        </div>
      </GenericModal>
    );
  }

  return (
    <div className="registered-table">
      <div className="table-header">
        <img
          src="https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Sales"
          className="header-image"
        />
        <div className="header-overlay">
          <h2>Sales Records</h2>
        </div>
      </div>
      <div className="table-controls">
        <div
          className="tabs"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <button
              className={`tab-btn ${currentTab === "all" ? "active" : ""}`}
              onClick={() => setCurrentTab("all")}
            >
              New sales
            </button>
            <button
              className={`tab-btn ${currentTab === "accepted" ? "active" : ""}`}
              onClick={() => setCurrentTab("accepted")}
            >
              Accepted sales
            </button>
            <button
              className={`tab-btn ${currentTab === "rejected" ? "active" : ""}`}
              onClick={() => setCurrentTab("rejected")}
            >
              Rejected sales
            </button>
          </div>
          <button
            onClick={handleDownload}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0a803e",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Download
          </button>
        </div>
        <input
          type="text"
          placeholder="Search sales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      {renderContent()}
    </div>
  );
}

export default SalesTable;
