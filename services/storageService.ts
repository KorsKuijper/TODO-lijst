import { AppData, TodoList, Category } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'gravel_grinder_data';
const DB_ROW_ID = 1;

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

export const fetchCloudData = async (): Promise<{ success: boolean, data: AppData | null }> => {
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', DB_ROW_ID)
      .single();

    if (error) {
      // If error is PGRST116, it means row doesn't exist yet (not an error per se, just empty DB)
      if (error.code === 'PGRST116') {
         return { success: true, data: null };
      }
      console.error("Supabase fetch error:", error);
      return { success: false, data: null };
    }

    if (data && data.data && Object.keys(data.data).length > 0) {
      return { success: true, data: data.data as AppData };
    }
    
    // Connection successful, but data is empty/null
    return { success: true, data: null };
  } catch (e) {
    console.error("Error fetching cloud data", e);
    return { success: false, data: null };
  }
};

export const saveToCloud = async (data: AppData): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('app_state')
      .upsert({ id: DB_ROW_ID, data: data, updated_at: new Date().toISOString() });

    if (error) {
      console.error("Supabase save error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error saving to cloud", e);
    return false;
  }
};

export const subscribeToChanges = (onUpdate: (data: AppData) => void) => {
  const channel = supabase
    .channel('app_state_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_state',
        filter: `id=eq.${DB_ROW_ID}`
      },
      (payload) => {
        if (payload.new && payload.new.data) {
          onUpdate(payload.new.data as AppData);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};