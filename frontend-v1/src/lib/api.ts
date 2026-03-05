import axios from 'axios';
import { API_URL } from '../config';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiry or basic errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
                    if (res.status === 200) {
                        const { accessToken, user } = res.data;
                        localStorage.setItem('accessToken', accessToken);
                        localStorage.setItem('user', JSON.stringify(user));

                        // Update the failed request config
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshErr) {
                // Refresh failed, clear token and arguably trigger logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                // You might want to trigger a window.location.href = '/auth' here if strictly required
            }
        }

        return Promise.reject(error);
    }
);
