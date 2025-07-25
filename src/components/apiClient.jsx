import axios from "axios";
import Swal from "sweetalert2";
import { store } from "./store/store";
import { clearAuth } from "./store/authSlice";

export const BASE_URL = "https://jituze.greenlife.co.ke/rest/";

const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    if (
      !config.url.includes("/registration/login") &&
      !config.url.includes("/region-manager/login")
    ) {
      const token = store.getState().auth.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isAlertShown = false;

// Response interceptor: Handle expired tokens for all endpoints except login.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip handling for login endpoints.
    if (
      originalRequest.url.includes("/registration/login") ||
      originalRequest.url.includes("/region-manager/login")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      store.dispatch(clearAuth());

      if (!isAlertShown) {
        isAlertShown = true;
        Swal.fire({
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          icon: "warning",
          confirmButtonText: "Ok",
        }).then((result) => {
          if (result.isConfirmed) {
            // window.location.href = '/';
          }
          isAlertShown = false;
        });
      }

      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
