import { createClient } from '@supabase/supabase-js';

// Specific credentials provided for this application
const SUPABASE_URL = 'https://fmvcvzwbvyrhqysqxibr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdmN2endidnlyaHF5c3F4aWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDA0NTEsImV4cCI6MjA3OTY3NjQ1MX0.QySZXHopro1CYNfWAuy6kdqnB_l7xi9uN8RFZXj1XvU';

// Robust helper to get env vars if they exist (overrides hardcoded if present)
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  return null;
};

// Use Env vars if available, otherwise use the provided hardcoded values
const finalUrl = getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || SUPABASE_URL;
const finalKey = getEnv('VITE_SUPABASE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_KEY') || SUPABASE_KEY;

if (!finalUrl || !finalKey) {
  console.warn("Supabase configuration missing.");
}

export const supabase = createClient(finalUrl, finalKey);