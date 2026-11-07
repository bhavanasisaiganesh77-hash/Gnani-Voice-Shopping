import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Customer API and staff login API
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the correct role token to each staff API.
function attachToken(tokenKey: string) {
  return (config: any) => {
    const token = localStorage.getItem(tokenKey);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  };
}

// Shopkeeper API
export const shopkeeperApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

shopkeeperApi.interceptors.request.use(
  attachToken("shopkeeper_token")
);

// Worker API
export const workerApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

workerApi.interceptors.request.use(
  attachToken("worker_token")
);

// Shelf Stocker API
export const shelfStockerApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

shelfStockerApi.interceptors.request.use(
  attachToken("shelf_stocker_token")
);

// Inventory Manager API
export const inventoryManagerApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

inventoryManagerApi.interceptors.request.use(
  attachToken("inventory_manager_token")
);