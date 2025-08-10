import { User } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import supabase from "../lib/supabase";
import notificationService from "../services/NotificationService";

// Tipos para las notificaciones
export interface NotificationData {
  [key: string]: any;
}

export interface NotificationContent {
  title: string;
  body: string;
  data?: NotificationData;
}

export interface NotificationRequest {
  identifier: string;
  content: NotificationContent;
  trigger: any;
}

export interface ReceivedNotification {
  date: number;
  request: NotificationRequest;
}

export interface NotificationResponse {
  notification: ReceivedNotification;
  actionIdentifier: string;
  userText?: string;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
  result?: any;
  results?: any[];
  notifications?: any[];
  history?: NotificationHistory[];
  tokens?: string[];
  notificationId?: string;
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  data: NotificationData | null;
  target_tokens: string[];
  sent_count: number;
  failed_count: number;
  sent_by: string | null;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_info: {
    brand?: string;
    manufacturer?: string;
    modelName?: string;
    osName?: string;
    osVersion?: string;
    platformApiLevel?: number;
  } | null;
  platform: "ios" | "android" | "web";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interface principal del hook
export interface UseNotificationsReturn {
  // Estado
  isInitialized: boolean;
  token: string | null;
  lastNotification: ReceivedNotification | null;
  lastResponse: NotificationResponse | null;
  user: User | null;

  // Funciones básicas
  sendLocalNotification: (
    title: string,
    body: string,
    data?: NotificationData
  ) => Promise<NotificationResult>;
  sendPushNotification: (
    targetToken: string,
    title: string,
    body: string,
    data?: NotificationData
  ) => Promise<NotificationResult>;
  scheduleNotification: (
    title: string,
    body: string,
    seconds: number,
    data?: NotificationData
  ) => Promise<NotificationResult>;
  cancelScheduledNotification: (
    notificationId: string
  ) => Promise<NotificationResult>;
  getAllScheduledNotifications: () => Promise<NotificationResult>;
  clearAllNotifications: () => Promise<NotificationResult>;
  getStoredToken: () => Promise<string | null>;

  // Funciones específicas de Supabase
  sendNotificationToUsers: (
    userIds: string[],
    title: string,
    body: string,
    data?: NotificationData
  ) => Promise<NotificationResult>;
  sendBroadcastNotification: (
    title: string,
    body: string,
    data?: NotificationData
  ) => Promise<NotificationResult>;
  getNotificationHistory: (limit?: number) => Promise<NotificationResult>;
  getUserTokens: (userIds: string[]) => Promise<NotificationResult>;
  getAllActiveTokens: () => Promise<NotificationResult>;
  deactivateCurrentToken: () => Promise<NotificationResult>;

  // Servicios para casos avanzados
  notificationService: typeof notificationService;
  supabase: typeof supabase;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] =
    useState<ReceivedNotification | null>(null);
  const [lastResponse, setLastResponse] = useState<NotificationResponse | null>(
    null
  );
  const [user, setUser] = useState<User | null>(null);

  // Inicializar notificaciones
  useEffect(() => {
    const initNotifications = async (): Promise<void> => {
      try {
        // Obtener usuario actual
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);

        const success = await notificationService.initialize();
        if (success) {
          const currentToken = notificationService.getToken();
          setToken(currentToken);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };

    initNotifications();

    // Configurar callbacks
    notificationService.setOnNotificationReceived(
      (notification: Notifications.Notification) => {
        setLastNotification(notification as ReceivedNotification);
      }
    );

    notificationService.setOnNotificationResponse(
      (response: Notifications.NotificationResponse) => {
        setLastResponse(response as NotificationResponse);
      }
    );

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") {
        // Re-guardar token cuando el usuario se loguea
        notificationService.saveTokenToSupabase();
      } else if (event === "SIGNED_OUT") {
        // Desactivar token cuando el usuario se desloguea
        notificationService.deactivateCurrentToken();
      }
    });

    // Cleanup al desmontar
    return () => {
      notificationService.cleanup();
      subscription?.unsubscribe();
    };
  }, []);

  // Funciones básicas
  const sendLocalNotification = useCallback(
    async (
      title: string,
      body: string,
      data: NotificationData = {}
    ): Promise<NotificationResult> => {
      try {
        await notificationService.sendLocalNotification(title, body, data);
        return { success: true };
      } catch (error) {
        console.error("Error sending local notification:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  const sendPushNotification = useCallback(
    async (
      targetToken: string,
      title: string,
      body: string,
      data: NotificationData = {}
    ): Promise<NotificationResult> => {
      try {
        const result = await notificationService.sendPushNotification(
          targetToken,
          title,
          body,
          data
        );
        return { success: true, result };
      } catch (error) {
        console.error("Error sending push notification:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Funciones específicas de Supabase
  const sendNotificationToUsers = useCallback(
    async (
      userIds: string[],
      title: string,
      body: string,
      data: NotificationData = {}
    ): Promise<NotificationResult> => {
      try {
        if (!user) {
          throw new Error(
            "User must be logged in to send notifications to users"
          );
        }

        const results = await notificationService.sendNotificationToUsers(
          userIds,
          title,
          body,
          data
        );
        return { success: true, results };
      } catch (error) {
        console.error("Error sending notification to users:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [user]
  );

  const sendBroadcastNotification = useCallback(
    async (
      title: string,
      body: string,
      data: NotificationData = {}
    ): Promise<NotificationResult> => {
      try {
        if (!user) {
          throw new Error(
            "User must be logged in to send broadcast notifications"
          );
        }

        const results = await notificationService.sendBroadcastNotification(
          title,
          body,
          data
        );
        return { success: true, results };
      } catch (error) {
        console.error("Error sending broadcast notification:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [user]
  );

  const getNotificationHistory = useCallback(
    async (limit: number = 50): Promise<NotificationResult> => {
      try {
        const history = await notificationService.getNotificationHistory(limit);
        return { success: true, history };
      } catch (error) {
        console.error("Error getting notification history:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          history: [],
        };
      }
    },
    []
  );

  const getUserTokens = useCallback(
    async (userIds: string[]): Promise<NotificationResult> => {
      try {
        const tokens = await notificationService.getUserTokens(userIds);
        return { success: true, tokens };
      } catch (error) {
        console.error("Error getting user tokens:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          tokens: [],
        };
      }
    },
    []
  );

  const getAllActiveTokens =
    useCallback(async (): Promise<NotificationResult> => {
      try {
        const tokens = await notificationService.getAllActiveTokens();
        return { success: true, tokens };
      } catch (error) {
        console.error("Error getting all tokens:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          tokens: [],
        };
      }
    }, []);

  // Funciones de programación
  const scheduleNotification = useCallback(
    async (
      title: string,
      body: string,
      seconds: number,
      data: NotificationData = {}
    ): Promise<NotificationResult> => {
      try {
        const notificationId = await notificationService.scheduleNotification(
          title,
          body,
          seconds,
          data
        );
        return { success: true, notificationId };
      } catch (error) {
        console.error("Error scheduling notification:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  const cancelScheduledNotification = useCallback(
    async (notificationId: string): Promise<NotificationResult> => {
      try {
        await notificationService.cancelScheduledNotification(notificationId);
        return { success: true };
      } catch (error) {
        console.error("Error cancelling notification:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  const getAllScheduledNotifications =
    useCallback(async (): Promise<NotificationResult> => {
      try {
        const notifications =
          await notificationService.getAllScheduledNotifications();
        return { success: true, notifications };
      } catch (error) {
        console.error("Error getting scheduled notifications:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          notifications: [],
        };
      }
    }, []);

  const clearAllNotifications =
    useCallback(async (): Promise<NotificationResult> => {
      try {
        await notificationService.clearAllNotifications();
        return { success: true };
      } catch (error) {
        console.error("Error clearing notifications:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }, []);

  const getStoredToken = useCallback(async (): Promise<string | null> => {
    try {
      const storedToken = await notificationService.getStoredToken();
      return storedToken;
    } catch (error) {
      console.error("Error getting stored token:", error);
      return null;
    }
  }, []);

  const deactivateCurrentToken =
    useCallback(async (): Promise<NotificationResult> => {
      try {
        await notificationService.deactivateCurrentToken();
        return { success: true };
      } catch (error) {
        console.error("Error deactivating token:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }, []);

  return {
    // Estado
    isInitialized,
    token,
    lastNotification,
    lastResponse,
    user,

    // Funciones básicas
    sendLocalNotification,
    sendPushNotification,
    scheduleNotification,
    cancelScheduledNotification,
    getAllScheduledNotifications,
    clearAllNotifications,
    getStoredToken,

    // Funciones específicas de Supabase
    sendNotificationToUsers,
    sendBroadcastNotification,
    getNotificationHistory,
    getUserTokens,
    getAllActiveTokens,
    deactivateCurrentToken,

    // Servicio completo para casos avanzados
    notificationService,
    // Cliente de Supabase para operaciones adicionales
    supabase,
  };
};
