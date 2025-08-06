import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../../styles/registeredTables.css";
import { useSelector } from "react-redux";
import ProductDetails from "../Sales/ProductDetails";
import GenericModal from "../GenericModal";
import { BASE_URL } from "../apiClient";
import apiClient from "../apiClient";
import { FaArrowLeft } from "react-icons/fa";
import { usePagination } from "../PaginationContext";

const swalOptions = {
  background: "#ffffff",
  confirmButtonColor: "#2ECC71",
  cancelButtonColor: "#e74c3c",
  color: "#283e56",
};

function BatchDetails({ agentId, onBack, batchSales }) {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const groupData = useSelector((state) => state.auth.groupData);
  const [agent, setAgent] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { pages, setPageForTab, rowsPerPage } = usePagination();
  const currentPage = pages.salesDetails || 1;

  useEffect(() => {
    // If we're passed batchSales, use it and skip the API fetch
    if (batchSales) {
      setSales(batchSales);
      return;
    }

    // otherwise, fetch by agentId
    const fetchSalesDetails = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/sales/fetch", {
          params: { salesPersonId: agentId },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (Array.isArray(data)) {
          setSales(data);
          if (data.length > 0) {
            setAgent({
              first_name: data[0].first_name,
              last_name: data[0].last_name,
              phone_number: data[0].phone_number,
              email: data[0].email,
              distributor: data[0].distributor,
              region: data[0].region_name || data[0].region,
              sub_region: data[0].sub_region,
            });
          }
        } else {
          setAgent(data.agent);
          setSales(data.sales);
        }
      } catch (error) {
        Swal.fire({
          ...swalOptions,
          title: "Error fetching sales details",
          text: error.message,
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchSalesDetails();
    }
  }, [agentId, accessToken, batchSales]);

  const handleViewProductDetails = async (ref_id) => {
    if (!groupData?.permissions?.readProduct) {
      Swal.fire({
        ...swalOptions,
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
      const { data } = await apiClient.get("/sales/sold-products", {
        params: { id: ref_id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!data) throw new Error("Network error");
      const productDetails = Array.isArray(data.object) ? data.object : [];
      Swal.close();
      setSelectedProduct(productDetails);
    } catch (error) {
      Swal.close();
      Swal.fire({
        ...swalOptions,
        title: "Error",
        text: "Could not fetch product details. Please try again.",
        icon: "error",
      });
    }
  };

  const handleViewImage = (reciept_image_path) => {
    if (!groupData?.permissions?.viewRecieptImage) {
      Swal.fire({
        ...swalOptions,
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
      showConfirmButton: true,
      confirmButtonText: "Close",
    });
  };

  if (loading) {
    return <div>Loading sales details...</div>;
  }

  if (selectedProduct) {
    return (
      <GenericModal
        onClose={() => setSelectedProduct(null)}
        showBackButton={true}
      >
        <div className="modal-inner-content" style={{ padding: "1rem" }}>
          <ProductDetails
            records={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        </div>
      </GenericModal>
    );
  }

  const filteredSales = sales.filter((sale) => {
    const search = searchTerm.toLowerCase();
    return (
      (sale.first_name || "").toLowerCase().includes(search) ||
      (sale.last_name || "").toLowerCase().includes(search) ||
      (sale.phone_number || "").toLowerCase().includes(search) ||
      (sale.distributor || "").toLowerCase().includes(search) ||
      (sale.region_name || "").toLowerCase().includes(search) ||
      (sale.sub_region || "").toLowerCase().includes(search) ||
      (sale.initial_commission
        ? sale.initial_commission.toString().toLowerCase()
        : ""
      ).includes(search) ||
      (sale.posting_date || "").toLowerCase().includes(search) ||
      (sale.posting_state || "").toLowerCase().includes(search) ||
      (sale.csv_state || "").toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredSales.length / rowsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="registered-table">
      <div className="table-header">
        <img
          src="https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Batch Details"
          className="header-image"
        />
        <div className="header-overlay">
          <h2>{batchSales ? "Batch Details" : "Sales Details"}</h2>
        </div>
      </div>
      <button
        className="modal-close-btn"
        onClick={onBack}
        style={{ margin: "1rem" }}
      >
        <FaArrowLeft className="icon" /> Back
      </button>
      <div style={{ margin: "0 1rem" }}>
        <input
          type="text"
          placeholder="Search sales..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPageForTab("salesDetails", 1);
          }}
          className="search-input"
        />
      </div>
      <div className="table-content">
        <table className="registered-table" style={{ margin: "-20px 0" }}>
          <thead>
            <tr>
              <th>SN</th>
              <th>First Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Posting Date</th>
              <th>Posting Time</th>
              <th>State</th>
              <th>Initial Commission</th>
              <th>CSV State</th>
              <th>Receipt Image</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSales.length > 0 ? (
              paginatedSales.map((sale, index) => (
                <tr key={sale.id}>
                  <td data-label="SN">
                    {index + 1 + (currentPage - 1) * rowsPerPage}
                  </td>
                  <td data-label="First Name">{sale.first_name || "N/A"}</td>
                  <td data-label="Email">{sale.email || "N/A"}</td>
                  <td data-label="Phone Number">
                    {sale.phone_number || "N/A"}
                  </td>
                  <td data-label="Posting Date">
                    {sale.posting_date.split("T")[0]}
                  </td>
                  <td data-label="Posting Time">
                    {sale.posting_date.split("T")[1].split(".")[0]}
                  </td>
                  <td data-label="State">
                    {sale.posting_state || sale.state || "N/A"}
                  </td>
                  <td data-label="Commission">{sale.initial_commission}</td>
                  <td data-label="CSV State">{sale.csv_state}</td>
                  <td data-label="Receipt Image">
                    <button
                      className="action-btn view-btn no-print screen-only"
                      onClick={() => handleViewImage(sale.reciept_image_path)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="10"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No batch records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            {Array.from({ length: totalPages }, (_, page) => (
              <button
                key={page + 1}
                onClick={() => setPageForTab("salesDetails", page + 1)}
                style={{
                  margin: "0 5px",
                  padding: "5px 10px",
                  backgroundColor:
                    currentPage === page + 1 ? "#0a803e" : "#f0f0f0",
                  color: currentPage === page + 1 ? "#fff" : "#000",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {page + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BatchDetails;
