import axios from "axios";

/**
 * Shared cookie-authenticated Axios client for the versioned backend API.
 *
 * Credentials are included on requests; response failures preserve the
 * server-provided message or expose a useful network/request error.
 *
 * @type {import("axios").AxiosInstance}
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message
            || (error.request ? "Unable to reach the server. Check your connection and try again." : error.message);
        error.message = message;
        return Promise.reject(error);
    },
);

export default api;
