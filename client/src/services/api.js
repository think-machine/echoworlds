import axios from 'axios';

// Determine the base URL for the API
// In development, it points to your local backend server.
// In production, it should point to your deployed backend URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Axios Request Interceptor ---
// This interceptor runs before each request is sent.
apiClient.interceptors.request.use(
  (config) => {
    // Retrieve the token from local storage (or wherever you store it)
    const userToken = localStorage.getItem('userToken'); // Adjust if you store token differently

    // If a token exists, add it to the Authorization header
    if (userToken) {
      config.headers['Authorization'] = `Bearer ${userToken}`;
    }
    return config; // Continue with the request configuration
  },
  (error) => {
    // Handle request configuration errors
    return Promise.reject(error);
  }
);

// --- Axios Response Interceptor --- (Optional: for global error handling)
// This interceptor runs when a response is received.
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error('API Error:', error.response || error.message);

    // Example: Handle 401 Unauthorized (e.g., token expired)
    if (error.response && error.response.status === 401) {
      // Optionally clear user data and redirect to login
      // localStorage.removeItem('userToken');
      // localStorage.removeItem('userInfo');
      // window.location.href = '/login'; // Force redirect
      console.error('Unauthorized access - possibly expired token.');
    }

    // Return the error so that calling code can handle it locally too
    return Promise.reject(error);
  }
);


export default apiClient;

