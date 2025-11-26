import { AppData, TodoList, Category } from '../types';

const STORAGE_KEY = 'gravel_grinder_data';
// We use a CORS proxy to allow the client-side app to talk to JsonBlob
// directly without being blocked by browser security policies on custom domains.
const PROXY_URL = 'https://corsproxy.io/?';
const API_BASE = 'https://jsonblob.com/api/jsonBlob';

// Helper to get ID from URL
export const getCloudIdFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
};

// Helper to set ID to URL without reloading
export const setCloudIdToUrl = (id: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set('id', id);
  window.history.pushState({}, '', url.toString());
};

export const loadLocal = (defaultLists: TodoList[], defaultCategories: Category[]): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        lists: parsed.lists || defaultLists,
        categories: parsed.categories || defaultCategories,
        tasks: parsed.tasks || [],
        updatedAt: parsed.updatedAt || Date.now()
      };
    } catch (e) {
      console.error("Local load failed", e);
    }
  }

  return {
    lists: defaultLists,
    categories: defaultCategories,
    tasks: [],
    updatedAt: Date.now()
  };
};

export const saveLocal = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const createCloudStore = async (data: AppData): Promise<string> => {
  // We use the proxy to ensure the POST request isn't blocked by CORS
  const targetUrl = PROXY_URL + encodeURIComponent(API_BASE);
  
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
      const text = await response.text();
      throw new Error(`Cloud creation failed: ${response.status} ${text}`);
  }
  
  // The Location header contains the URL to the new blob
  // Access-Control-Expose-Headers might be needed, but usually proxies forward standard headers
  const location = response.headers.get('Location') || response.headers.get('x-jsonblob-location');
  
  if (!location) throw new Error('No location header received from storage service');
  
  const id = location.split('/').pop();
  if (!id) throw new Error('Invalid ID extracted');
  
  return id;
};

export const fetchCloudStore = async (id: string): Promise<AppData | null> => {
  try {
    // We use the proxy for fetching as well to be safe
    const targetUrl = PROXY_URL + encodeURIComponent(`${API_BASE}/${id}`);
    
    const response = await fetch(targetUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.error("Error fetching cloud data", e);
    return null;
  }
};

export const updateCloudStore = async (id: string, data: AppData): Promise<boolean> => {
  try {
    const targetUrl = PROXY_URL + encodeURIComponent(`${API_BASE}/${id}`);
    
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (e) {
    console.error("Error updating cloud data", e);
    return false;
  }
};