import axios from "axios"
import {
    clearAccessToken,
    getAccessToken,
    setAccessToken
} from "./tokenStore"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
})

const EXCLUDED_FROM_REFRESH = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh-token",
];

function isExcluded(url = '') {
    return EXCLUDED_FROM_REFRESH.some((path) => {
        return url.includes(path)
    })
}

api.interceptors.request.use((config) => {
    const accessToken = getAccessToken()

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config;
})
let isRefreshing = false
let refreshQue = [];

const notifySessionExpired = () => {
    window.dispatchEvent(new CustomEvent("auth:session-expired"))
}

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {

        if (!error.response) {
            console.log("Network Error:", error.message)
            return Promise.reject(error)
        }

        const originalRequest = error.config;
        const status = error.response?.status

        if (originalRequest && status === 401 && !isExcluded(originalRequest.url) && !originalRequest._retry) {
            return Promise.reject(error)
        };
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQue.push(resolve, reject, originalRequest)
            })
        }

        originalRequest._retry = true;
        isRefreshing = true;
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
                {},
                { withCredentials: true }
            );

            const newAccessToken = response.data.accessToken || response.data?.data?.accessToken;

            setAccessToken(newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
            refreshQue.forEach(({ resolve, originalRequest: req }) => {
                req.headers.Authorization = `Bearer ${newAccessToken}`;
                resolve(api(req))
            })
            refreshQue = [];

            return api(originalRequest);
        } catch (refreshError) {
            refreshQue.forEach(({ reject }) => reject(refreshError));
            refreshQue = [];
            clearAccessToken();
            notifySessionExpired();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
)

export default api;