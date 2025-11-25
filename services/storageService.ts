import { AppData, TodoList, Category, Task } from '../types';

const STORAGE_KEY = 'gravel_grinder_data';
const SYNC_ID_KEY = 'gravel_grinder_sync_id';
const API_BASE = 'https://jsonblob.com/api/jsonBlob';

// Helper to migrate legacy data if new format doesn't exist
const migrateLegacyData = (): AppData | null => {
  const listsStr = localStorage.getItem('lists');
  const catStr = localStorage.getItem('categories');
  const taskStr = localStorage.getItem('tasks');

  if (listsStr && catStr && taskStr) {
    try {
      return {
        lists: JSON.parse(listsStr),
        categories: JSON.parse(catStr),
        tasks: JSON.parse(taskStr),
        updatedAt: Date.now()
      };
    } catch (e) {
      console.error("Migration failed", e);
    }
  }
  return null;
};

export const loadLocal = (defaultLists: TodoList[], defaultCategories: Category[]): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Local load failed", e);
    }
  }

  // Try migration
  const migrated = migrateLegacyData();
  if (migrated) return migrated;

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

export const getSyncId = () => localStorage.getItem(SYNC_ID_KEY);
export const setSyncId = (id: string) => localStorage.setItem(SYNC_ID_KEY, id);
export const clearSyncId = () => localStorage.removeItem(SYNC_ID_KEY);

export const createCloudStore = async (data: AppData): Promise<string> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) throw new Error('Cloud creation failed');
  
  const location = response.headers.get('Location');
  if (!location) throw new Error('No location header received');
  
  const id = location.split('/').pop();
  if (!id) throw new Error('Invalid ID extracted');
  
  return id;
};

export const fetchCloudStore = async (id: string): Promise<AppData> => {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) throw new Error('Fetch failed');
  return await response.json();
};

export const updateCloudStore = async (id: string, data: AppData) => {
  await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};
