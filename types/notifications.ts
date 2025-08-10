import { User } from '@supabase/supabase-js';

// Tipos básicos de notificaciones
export interface NotificationData {
  [key: string]: any;
}

export interface NotificationContent {
  title: string;
  body: string;
  data?: NotificationData;
  sound?: string;
  badge?: number;
}

export interface NotificationTrigger {
  seconds?: number;
  date?: Date;
  repeats?: boolean;
  channelId?: string;
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

// Tipos de respuesta del servicio
export interface NotificationResult {
  success: boolean;
  error?: string;
  result?: any;
  results?: any[];
  notifications?: NotificationRequest[];
  history?: NotificationHistory[];
  tokens?: string[];
  notificationId?: string;
  data?: any;
}

// Tipos de dispositivo
export interface DeviceInfo {
  brand?: string | null;
  manufacturer?: string | null;
  modelName?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  platformApiLevel?: number | null;
}

// Tipos de base de datos (Supabase)
export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_info: DeviceInfo | null;
  platform: 'ios' | 'android' | 'web';
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

// Tipos para la API de Expo Push
export interface ExpoPushMessage {
  to: string | string[];
  sound?: 'default' | null;
  title?: string;
  subtitle?: string;
  body?: string;
  data?: NotificationData;
  ttl?: number;
  expiration?: number;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  channelId?: string;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

// Tipos de callbacks
export type NotificationReceivedCallback = (notification: ReceivedNotification) => void;
export type NotificationResponseCallback = (response: NotificationResponse) => void;

// Tipos para estadísticas
export interface TokenStatsByPlatform {
  ios: number;
  android: number;
  web: number;
}

export interface NotificationStats {
  totalSent: number;
  totalFailed: number;
  successRate: number;
  activeTokens: number;
  byPlatform: TokenStatsByPlatform;
}

// Tipos para configuración de notificaciones
export interface NotificationConfig {
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  alert: boolean;
}

export interface NotificationChannel {
  id: string;
  name: string;
  importance: 'min' | 'low' | 'default' | 'high' | 'max';
  sound?: string;
  vibrationPattern?: number[];
  lightColor?: string;
  showBadge?: boolean;
}

// Tipos para filtros y queries
export interface NotificationHistoryFilter {
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: 'sent' | 'failed' | 'all';
  platform?: 'ios' | 'android' | 'web' | 'all';
  limit?: number;
  offset?: number;
}

export interface TokenFilter {
  platform?: 'ios' | 'android' | 'web';
  isActive?: boolean;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Tipos para operaciones batch
export interface BatchNotificationRequest {
  userIds?: string[];
  tokens?: string[];
  title: string;
  body: string;
  data?: NotificationData;
  scheduleFor?: Date;
  priority?: 'default' | 'normal' | 'high';
}

export interface BatchNotificationResult {
  totalTargets: number;
  successCount: number;
  failedCount: number;
  results: ExpoPushTicket[];
  errors: string[];
}

// Tipos para plantillas de notificaciones
export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  data?: NotificationData;
  variables?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'date';
}

// Tipos para programación avanzada de notificaciones
export interface ScheduleOptions {
  type: 'immediate' | 'delay' | 'exact_time' | 'recurring';
  delay?: number; // segundos
  exactTime?: Date;
  recurring?: {
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
    count?: number;
    until?: Date;
  };
}

export interface ScheduledNotificationJob {
  id: string;
  title: string;
  body: string;
  data?: NotificationData;
  targets: string[];
  schedule: ScheduleOptions;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_by: string;
  created_at: string;
  scheduled_for: string;
  executed_at?: string;
}

// Tipos para métricas y analytics
export interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  deliveryRate: number;
  openRate: number;
  byPlatform: {
    ios: { sent: number; delivered: number; opened: number };
    android: { sent: number; delivered: number; opened: number };
    web: { sent: number; delivered: number; opened: number };
  };
  byTimeframe: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

// Tipos para el estado del hook
export interface NotificationState {
  isInitialized: boolean;
  token: string | null;
  lastNotification: ReceivedNotification | null;
  lastResponse: NotificationResponse | null;
  user: User | null;
  permissions: {
    granted: boolean;
    canAlert: boolean;
    canBadge: boolean;
    canSound: boolean;
  };
  config: NotificationConfig;
}

// Tipos para acciones del hook
export interface NotificationActions {
  // Básicas
  sendLocal: (title: string, body: string, data?: NotificationData) => Promise<NotificationResult>;
  sendPush: (token: string, title: string, body: string, data?: NotificationData) => Promise<NotificationResult>;
  
  // Avanzadas
  sendToUsers: (userIds: string[], title: string, body: string, data?: NotificationData) => Promise<NotificationResult>;
  sendBroadcast: (title: string, body: string, data?: NotificationData) => Promise<NotificationResult>;
  sendBatch: (request: BatchNotificationRequest) => Promise<BatchNotificationResult>;
  
  // Programación
  schedule: (title: string, body: string, schedule: ScheduleOptions, data?: NotificationData) => Promise<NotificationResult>;
  cancelScheduled: (id: string) => Promise<NotificationResult>;
  getScheduled: () => Promise<NotificationResult>;
  
  // Gestión
  updateConfig: (config: Partial<NotificationConfig>) => Promise<NotificationResult>;
  requestPermissions: () => Promise<boolean>;
  deactivateToken: () => Promise<NotificationResult>;
  
  // Consultas
  getHistory: (filter?: NotificationHistoryFilter) => Promise<NotificationResult>;
  getMetrics: (timeframe?: 'day' | 'week' | 'month') => Promise<NotificationMetrics>;
  getTokenStats: () => Promise<TokenStatsByPlatform>;
  
  // Limpieza
  clearAll: () => Promise<NotificationResult>;
  cleanup: (daysOld?: number) => Promise<number>;
}

// Tipo principal del hook
export interface UseNotificationsReturn extends NotificationState, NotificationActions {
  // Servicios para casos avanzados
  notificationService: any;
  supabase: any;
}

// Tipos para errores personalizados
export class NotificationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

export interface NotificationErrorDetails {
  code: string;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
}

// Tipos para eventos del sistema
export interface NotificationEvent {
  type: 'received' | 'opened' | 'dismissed' | 'action' | 'error';
  notification?: ReceivedNotification;
  response?: NotificationResponse;
  error?: NotificationError;
  timestamp: number;
}

export type NotificationEventCallback = (event: NotificationEvent) => void;

// Tipos para configuración del provider
export interface NotificationProviderConfig {
  enableAnalytics?: boolean;
  enableHistory?: boolean;
  maxHistorySize?: number;
  autoCleanup?: boolean;
  cleanupInterval?: number; // días
  defaultChannel?: NotificationChannel;
  channels?: NotificationChannel[];
}

// Tipos para middleware de notificaciones
export interface NotificationMiddleware {
  beforeSend?: (notification: ExpoPushMessage) => Promise<ExpoPushMessage | null>;
  afterSend?: (notification: ExpoPushMessage, result: ExpoPushTicket[]) => Promise<void>;
  onError?: (error: NotificationError, context: any) => Promise<void>;
}

// Constantes de tipos
export const NOTIFICATION_TYPES = {
  LOCAL: 'local',
  PUSH: 'push',
  SCHEDULED: 'scheduled',
  BROADCAST: 'broadcast',
  TARGETED: 'targeted',
} as const;

export const NOTIFICATION_PRIORITIES = {
  DEFAULT: 'default',
  NORMAL: 'normal',
  HIGH: 'high',
} as const;

export const PLATFORMS = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type NotificationPriority = typeof NOTIFICATION_PRIORITIES[keyof typeof NOTIFICATION_PRIORITIES];
export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS];