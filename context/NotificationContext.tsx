import React, { createContext, ReactNode, useContext } from "react";
import {
    useNotifications,
    UseNotificationsReturn,
} from "../hooks/useNotifications";

// Crear el contexto con el tipo correcto
const NotificationContext = createContext<UseNotificationsReturn | undefined>(
  undefined
);

// Props del provider
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const notificationData = useNotifications();

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personalizado para usar el contexto con validación de tipos
export const useNotificationContext = (): UseNotificationsReturn => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  }

  return context;
};
