import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import supabase from "../lib/supabase";

// Tipos para las notificaciones
export interface NotificationData {
  [key: string]: any;
}

export interface NotificationContent {
  title: string;
  body: string;
  data?: NotificationData;
  sound?: string;
}

export interface NotificationTrigger {
  seconds?: number;
  date?: Date;
  repeats?: boolean;
}

export interface NotificationRequest {
  identifier: string;
  content: NotificationContent;
  trigger: NotificationTrigger | null;
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

export interface DeviceInfo {
  brand?: string | null;
  manufacturer?: string | null;
  modelName?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  platformApiLevel?: number | null;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_info: DeviceInfo | null;
  platform: "ios" | "android" | "web";
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

// Tipos para respuestas de Expo Push API
export interface ExpoPushMessage {
  to: string | string[];
  sound?: "default" | null;
  title?: string;
  subtitle?: string;
  body?: string;
  data?: NotificationData;
  ttl?: number;
  expiration?: number;
  priority?: "default" | "normal" | "high";
  badge?: number;
  channelId?: string;
}

export interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?:
      | "DeviceNotRegistered"
      | "InvalidCredentials"
      | "MessageTooBig"
      | "MessageRateExceeded";
  };
}

export interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
  details?: {
    error?: string;
  };
}

// Tipos de callbacks
export type NotificationReceivedCallback = (
  notification: Notifications.Notification
) => void;
export type NotificationResponseCallback = (
  response: Notifications.NotificationResponse
) => void;

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  // Callbacks opcionales
  public onNotificationReceived?: NotificationReceivedCallback;
  public onNotificationResponse?: NotificationResponseCallback;

  constructor() {
    // Configuración de cómo se muestran las notificaciones
    Notifications.setNotificationHandler({
      handleNotification:
        async (): Promise<Notifications.NotificationBehavior> => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
    });
  }

  // Inicializar el servicio de notificaciones
  public async initialize(): Promise<boolean> {
    try {
      await this.registerForPushNotificationsAsync();
      await this.setupNotificationListeners();
      await this.saveTokenToSupabase();
      return true;
    } catch (error) {
      console.error("Error initializing notifications:", error);
      return false;
    }
  }

  // Registrar para notificaciones push
  private async registerForPushNotificationsAsync(): Promise<
    string | undefined
  > {
    let token: Notifications.ExpoPushToken | undefined;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        throw new Error("Failed to get push token for push notification!");
      }

      // Obtener el token
      token = await Notifications.getExpoPushTokenAsync({
        projectId:
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId,
      });

      this.expoPushToken = token.data;

      // Guardar token localmente
      await AsyncStorage.setItem("expoPushToken", token.data);

      console.log("Expo Push Token:", token.data);
    } else {
      console.log("Must use physical device for Push Notifications");
    }

    return token?.data;
  }

  // Guardar token en Supabase
  public async saveTokenToSupabase(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !this.expoPushToken) {
        console.log("No user logged in or no token available");
        return;
      }

      const deviceInfo: DeviceInfo = {
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platformApiLevel: Device.platformApiLevel,
      };

      // Verificar si el token ya existe
      const { data: existingToken } = await supabase
        .from("push_tokens")
        .select("id")
        .eq("token", this.expoPushToken)
        .single();

      if (existingToken) {
        // Actualizar token existente
        const { error } = await supabase
          .from("push_tokens")
          .update({
            user_id: user.id,
            device_info: deviceInfo,
            platform: Platform.OS as "ios" | "android" | "web",
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingToken.id);

        if (error) throw error;
        console.log("Token updated in Supabase");
      } else {
        // Insertar nuevo token
        const { error } = await supabase.from("push_tokens").insert({
          user_id: user.id,
          token: this.expoPushToken,
          device_info: deviceInfo,
          platform: Platform.OS as "ios" | "android" | "web",
        });

        if (error) throw error;
        console.log("Token saved to Supabase");
      }
    } catch (error) {
      console.error("Error saving token to Supabase:", error);
    }
  }

  // Obtener tokens de usuarios específicos
  public async getUserTokens(userIds: string[]): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("push_tokens")
        .select("token")
        .in("user_id", userIds)
        .eq("is_active", true);

      if (error) throw error;
      return data?.map((item: { token: string }) => item.token) ?? [];
    } catch (error) {
      console.error("Error getting user tokens:", error);
      return [];
    }
  }

  // Obtener todos los tokens activos
  public async getAllActiveTokens(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("is_active", true);

      if (error) throw error;
      return data?.map((item: { token: string }) => item.token) ?? [];
    } catch (error) {
      console.error("Error getting all tokens:", error);
      return [];
    }
  }

  // Configurar listeners para notificaciones
  private async setupNotificationListeners(): Promise<void> {
    // Listener para notificaciones recibidas mientras la app está abierta
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        console.log("Notification received:", notification);
        this.onNotificationReceived?.(notification);
      }
    );

    // Listener para cuando el usuario toca una notificación
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          console.log("Notification response:", response);
          this.onNotificationResponse?.(response);
        }
      );
  }

  // Enviar notificación local
  public async sendLocalNotification(
    title: string,
    body: string,
    data: NotificationData = {}
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending local notification:", error);
      throw error;
    }
  }

  // Enviar notificación push a un token específico
  public async sendPushNotification(
    targetToken: string,
    title: string,
    body: string,
    data: NotificationData = {}
  ): Promise<ExpoPushTicket[]> {
    const message: ExpoPushMessage = {
      to: targetToken,
      sound: "default",
      title,
      body,
      data,
      priority: "high",
    };

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ExpoPushTicket[] = await response.json();
      console.log("Push notification sent:", result);

      // Guardar en historial de Supabase
      await this.saveNotificationHistory(
        title,
        body,
        data,
        [targetToken],
        result
      );

      return result;
    } catch (error) {
      console.error("Error sending push notification:", error);
      await this.saveNotificationHistory(
        title,
        body,
        data,
        [targetToken],
        null,
        error as Error
      );
      throw error;
    }
  }

  // Enviar notificación a usuarios específicos
  public async sendNotificationToUsers(
    userIds: string[],
    title: string,
    body: string,
    data: NotificationData = {}
  ): Promise<ExpoPushTicket[]> {
    try {
      const tokens = await this.getUserTokens(userIds);
      if (tokens.length === 0) {
        throw new Error("No active tokens found for specified users");
      }

      const results = await this.sendBulkNotifications(
        tokens,
        title,
        body,
        data
      );
      return results;
    } catch (error) {
      console.error("Error sending notification to users:", error);
      throw error;
    }
  }

  // Enviar notificación masiva a todos los usuarios
  public async sendBroadcastNotification(
    title: string,
    body: string,
    data: NotificationData = {}
  ): Promise<ExpoPushTicket[]> {
    try {
      const tokens = await this.getAllActiveTokens();
      if (tokens.length === 0) {
        throw new Error("No active tokens found");
      }

      const results = await this.sendBulkNotifications(
        tokens,
        title,
        body,
        data
      );
      return results;
    } catch (error) {
      console.error("Error sending broadcast notification:", error);
      throw error;
    }
  }

  // Enviar notificación a múltiples tokens
  public async sendBulkNotifications(
    tokens: string[],
    title: string,
    body: string,
    data: NotificationData = {}
  ): Promise<ExpoPushTicket[]> {
    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
      priority: "high",
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results: ExpoPushTicket[] = await response.json();
      console.log("Bulk notifications sent:", results);

      // Calcular estadísticas
      const successCount = results.filter((r) => r.status === "ok").length;
      const failedCount = results.length - successCount;

      // Guardar en historial
      await this.saveNotificationHistory(
        title,
        body,
        data,
        tokens,
        results,
        undefined,
        successCount,
        failedCount
      );

      return results;
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      await this.saveNotificationHistory(
        title,
        body,
        data,
        tokens,
        null,
        error as Error,
        0,
        tokens.length
      );
      throw error;
    }
  }

  // Guardar historial de notificaciones en Supabase
  private async saveNotificationHistory(
    title: string,
    body: string,
    data: NotificationData,
    tokens: string[],
    result?: ExpoPushTicket[] | null,
    error?: Error,
    sentCount?: number,
    failedCount?: number
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const historyData = {
        title,
        body,
        data,
        target_tokens: tokens,
        sent_count: sentCount ?? (result && !error ? 1 : 0),
        failed_count: failedCount ?? (error ? 1 : 0),
        sent_by: user?.id,
      };

      const { error: insertError } = await supabase
        .from("notification_history")
        .insert(historyData);

      if (insertError) {
        console.error("Error saving notification history:", insertError);
      }
    } catch (error) {
      console.error("Error in saveNotificationHistory:", error);
    }
  }

  // Obtener historial de notificaciones
  public async getNotificationHistory(
    limit: number = 50
  ): Promise<NotificationHistory[]> {
    try {
      const { data, error } = await supabase
        .from("notification_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      console.error("Error getting notification history:", error);
      return [];
    }
  }

  // Programar notificación para más tarde
  public async scheduleNotification(
    title: string,
    body: string,
    seconds: number,
    data: NotificationData = {}
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: null,
      });

      console.log("Notification scheduled:", notificationId);
      return notificationId;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      throw error;
    }
  }

  // Desactivar token del usuario actual
  public async deactivateCurrentToken(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !this.expoPushToken) return;

      const { error } = await supabase
        .from("push_tokens")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("token", this.expoPushToken);

      if (error) throw error;
      console.log("Token deactivated");
    } catch (error) {
      console.error("Error deactivating token:", error);
    }
  }

  // Cancelar notificación programada
  public async cancelScheduledNotification(
    notificationId: string
  ): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log("Notification cancelled:", notificationId);
    } catch (error) {
      console.error("Error cancelling notification:", error);
      throw error;
    }
  }

  // Obtener todas las notificaciones programadas
  public async getAllScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error("Error getting scheduled notifications:", error);
      return [];
    }
  }

  // Limpiar todas las notificaciones
  public async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (Platform.OS === "android") {
        await Notifications.dismissAllNotificationsAsync();
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }

  // Configurar callbacks para eventos
  public setOnNotificationReceived(
    callback: NotificationReceivedCallback
  ): void {
    this.onNotificationReceived = callback;
  }

  public setOnNotificationResponse(
    callback: NotificationResponseCallback
  ): void {
    this.onNotificationResponse = callback;
  }

  // Limpiar listeners
  public cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Obtener el token actual
  public getToken(): string | null {
    return this.expoPushToken;
  }

  // Obtener token guardado localmente
  public async getStoredToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem("expoPushToken");
      return token;
    } catch (error) {
      console.error("Error getting stored token:", error);
      return null;
    }
  }

  // Obtener información del dispositivo
  public getDeviceInfo(): DeviceInfo {
    return {
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platformApiLevel: Device.platformApiLevel,
    };
  }

  // Verificar si las notificaciones están habilitadas
  public async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error checking notification permissions:", error);
      return false;
    }
  }

  // Solicitar permisos de notificación
  public async requestNotificationPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  // Obtener estadísticas de tokens por plataforma
  public async getTokenStatsByPlatform(): Promise<{
    ios: number;
    android: number;
    web: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("push_tokens")
        .select("platform")
        .eq("is_active", true);

      if (error) throw error;

      const stats = { ios: 0, android: 0, web: 0 };
      data?.forEach((token: { platform: "ios" | "android" | "web" }) => {
        stats[token.platform] = (stats[token.platform] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error("Error getting token stats:", error);
      return { ios: 0, android: 0, web: 0 };
    }
  }

  // Limpiar tokens inactivos
  public async cleanupInactiveTokens(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from("push_tokens")
        .delete()
        .eq("is_active", false)
        .lt("updated_at", cutoffDate.toISOString())
        .select("id");

      if (error) throw error;

      const deletedCount = data?.length ?? 0;
      console.log(`Cleaned up ${deletedCount} inactive tokens`);
      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up inactive tokens:", error);
      return 0;
    }
  }
}

// Crear instancia singleton
const notificationService = new NotificationService();

export default notificationService;
