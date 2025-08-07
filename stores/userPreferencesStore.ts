import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Tipos más específicos para mejor type safety
export type Currency = "MXN" | "USD" | "EUR";
export type Language = "es" | "en";

interface Preferences {
  darkMode: boolean;
  currency: Currency;
  language: Language;
  notificationsEnabled: boolean;
  autoBackup: boolean;
  biometricAuth: boolean;
}

interface UserPreferencesStore {
  preferences: Preferences;
  isLoading: boolean;
  setPreferences: (prefs: Partial<Preferences>) => void;
  resetPreferences: () => void;
  toggleDarkMode: () => void;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
}

// Valores por defecto
const defaultPreferences: Preferences = {
  darkMode: false,
  currency: "MXN",
  language: "es",
  notificationsEnabled: true,
  biometricAuth: false,
  autoBackup: true,
};

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set, _get) => ({
      preferences: defaultPreferences,
      isLoading: false,

      setPreferences: (prefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        }));
      },

      resetPreferences: () => {
        set({ preferences: defaultPreferences });
      },

      toggleDarkMode: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            darkMode: !state.preferences.darkMode,
          },
        }));
      },

      setCurrency: (currency) => {
        set((state) => ({
          preferences: { ...state.preferences, currency },
        }));
      },

      setLanguage: (language) => {
        set((state) => ({
          preferences: { ...state.preferences, language },
        }));
      },
    }),
    {
      name: "user-preferences",
      storage: createJSONStorage(() => AsyncStorage),

      // Configuraciones adicionales para mejor manejo
      partialize: (state) => ({
        preferences: state.preferences,
      }), // Solo persiste las preferencias, no isLoading

      // Manejo de versiones para migraciones futuras
      version: 1,

      // Función para migrar datos si cambias la estructura
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migración de versión 0 a 1
          return {
            ...persistedState,
            preferences: {
              ...defaultPreferences,
              ...persistedState.preferences,
            },
          };
        }
        return persistedState;
      },

      // Manejo de errores de persistencia
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Error al cargar preferencias:", error);
          // Podrías establecer valores por defecto aquí
        } else {
          console.log("Preferencias cargadas exitosamente");
        }
      },
    }
  )
);

// Hook personalizado para acceso fácil a preferencias específicas
export const useDarkMode = () => {
  const darkMode = useUserPreferencesStore(
    (state) => state.preferences.darkMode
  );
  const toggleDarkMode = useUserPreferencesStore(
    (state) => state.toggleDarkMode
  );
  return { darkMode, toggleDarkMode };
};

export const useCurrency = () => {
  const currency = useUserPreferencesStore(
    (state) => state.preferences.currency
  );
  const setCurrency = useUserPreferencesStore((state) => state.setCurrency);
  return { currency, setCurrency };
};

export const useLanguage = () => {
  const language = useUserPreferencesStore(
    (state) => state.preferences.language
  );
  const setLanguage = useUserPreferencesStore((state) => state.setLanguage);
  return { language, setLanguage };
};
