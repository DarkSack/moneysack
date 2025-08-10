import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env");

if (!process.env.PROJECT_URL || !process.env.API_KEY) {
  throw new Error(
    "Missing required environment variables: PROJECT_URL and API_KEY must be set"
  );
}

const supabaseUrl = process.env.PROJECT_URL as string;
const supabaseKey = process.env.API_KEY as string;

// Configurar Supabase con AsyncStorage para persistencia
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
