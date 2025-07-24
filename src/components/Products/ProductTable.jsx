import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import GenericModal from "../GenericModal";
import ProductRegistration from "./ProductRegistration";
import ProductUpdate from "./ProductUpdate";
import ProductView from "./ProductView";
import CategoriesTable from "../Category/CategoryTable";
import { useSelector } from "react-redux";
import apiClient from "../apiClient";
import "../../styles/registeredTables.css";
import { usePagination } from "../PaginationContext";

function ProductTable() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const groupData = useSelector((state) => state.auth.groupData);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [categoriesMode, setCategoriesMode] = useState(false);

  const { pages, setPageForTab, rowsPerPage } = usePagination();
  const currentPage = pages.all || 1;

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get("/product/all");
      setProducts(data);
    } catch (err) {
      Swal.fire("Error", err.response?.data || err.message, "error");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [accessToken]);

  // Reset page to 1 when search term changes.
  useEffect(() => {
    setPageForTab("all", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const filteredProducts = products.filter((product) =>
    (product.productDescription || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDelete = async (product) => {
    Swal.fire({
      title: "Are you sure?",
      text: `To confirm deletion of "${product.productDescription}", please type "yes" below:`,
      input: "text",
      inputPlaceholder: "Type yes to confirm",
      showCancelButton: true,
      confirmButtonText: "Delete",
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
          const { data: responseText } = await apiClient.delete(
            `/product/delete?id=${product.id}`
          );
          Swal.fire("Deleted!", responseText, "success");
          setProducts(products.filter((p) => p.id !== product.id));
        } catch (err) {
          Swal.fire("Error", err.response?.data || err.message, "error");
        }
      }
    });
  };

  const handleView = (product) => {
    setViewRecord(product);
  };

  const handleEdit = (product) => {
    setEditingRecord(product);
  };

  if (registerMode) {
    return (
      <GenericModal onClose={() => setRegisterMode(false)}>
        <ProductRegistration
          onClose={() => setRegisterMode(false)}
          onRegistrationSuccess={fetchProducts}
        />
      </GenericModal>
    );
  }

  if (editingRecord) {
    return (
      <GenericModal onClose={() => setEditingRecord(null)}>
        <ProductUpdate
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onUpdateSuccess={fetchProducts}
        />
      </GenericModal>
    );
  }

  if (viewRecord) {
    return (
      <GenericModal onClose={() => setViewRecord(null)}>
        <ProductView record={viewRecord} onClose={() => setViewRecord(null)} />
      </GenericModal>
    );
  }

  if (categoriesMode) {
    return (
      <GenericModal
        onClose={() => setCategoriesMode(false)}
        showBackButton={false}
      >
        <CategoriesTable
          onClose={() => setCategoriesMode(false)}
          onBack={() => setCategoriesMode(false)}
        />
      </GenericModal>
    );
  }

  return (
    <div className="registered-table">
      <div className="table-header">
        <img
          src="https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Products"
          className="header-image"
        />
        <div className="header-overlay">
          <h2>Registered Products</h2>
        </div>
      </div>
      <div className="table-content">
        <div className="table-controls">
          <button
            className="modal-close-btn"
            onClick={() => setCategoriesMode(true)}
            style={{ margin: "1rem" }}
          >
            View Categories
          </button>
          <button
            className="register-btn"
            onClick={() => {
              if (!groupData?.permissions?.createProduct) {
                Swal.fire({
                  icon: "error",
                  title: "Access Denied",
                  text: "You do not have permission to register a product.",
                });
                return;
              }
              setRegisterMode(true);
            }}
          >
            Register Product
          </button>
        </div>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <table>
          <thead>
            <tr>
              <th>SN</th>
              <th>Product Description</th>
              <th>Category</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product, index) => (
                <tr key={product.id}>
                  <td data-label="SN">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>
                  <td data-label="Product Description">
                    {product.productDescription}
                  </td>
                  <td data-label="Category">{product.category}</td>
                  <td data-label="Price">{product.price}</td>
                  <td data-label="Unit">{product.unit}</td>
                  <td data-label="Actions">
                    <div className="dropdown">
                      <button className="dropbtn">action</button>
                      <div className="dropdown-content">
                        <button
                          className="action-btn update-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.updateProduct) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to update a product.",
                              });
                              return;
                            }
                            handleEdit(product);
                          }}
                        >
                          Update
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.deleteProduct) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to delete a product.",
                              });
                              return;
                            }
                            handleDelete(product);
                          }}
                        >
                          Delete
                        </button>
                        <button
                          className="action-btn view-btn"
                          onClick={() => {
                            if (!groupData?.permissions?.readProduct) {
                              Swal.fire({
                                icon: "error",
                                title: "Access Denied",
                                text: "You do not have permission to view a product.",
                              });
                              return;
                            }
                            handleView(product);
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
                <td colSpan="5" className="no-data">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filteredProducts.length >= rowsPerPage && (
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

export default ProductTable;
