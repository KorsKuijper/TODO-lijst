import { AppData, TodoList, Category } from '../types';

const STORAGE_KEY = 'gravel_grinder_data';
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
      // Ensure basic structure exists
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

  // Defaults
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
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) throw new Error('Cloud creation failed');
  
  const location = response.headers.get('Location');
  if (!location) throw new Error('No location header received');
  
  const id = location.split('/').pop();
  if (!id) throw new Error('Invalid ID extracted');
  
  return id;
};

export const fetchCloudStore = async (id: string): Promise<AppData | null> => {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
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
    const response = await fetch(`${API_BASE}/${id}`, {
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