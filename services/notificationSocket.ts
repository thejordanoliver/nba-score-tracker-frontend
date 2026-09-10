import type { BadgeEarnedSocketPayload } from "@/types/badges";
import type { AppNotification } from "@/types/notifications";
import { getSocketNamespaceUrl } from "@/utils/apiConfig";
import { io, type Socket } from "socket.io-client";

const SOCKET_NAMESPACE = "/notifications";
const SOCKET_URL = getSocketNamespaceUrl(SOCKET_NAMESPACE);

type NotificationServerEvents = {
  "badge:earned": (payload: BadgeEarnedSocketPayload) => void;
  "notification:new": (payload: AppNotification) => void;
  "notification:read": (payload: AppNotification) => void;
  "notification:archived": (payload: { id: string }) => void;
  "notification:unread-count": (payload: { unreadCount: number }) => void;
  "notifications:ready": (payload: { userId: number }) => void;
};

type NotificationClientEvents = {
  "notifications:join": (
    payload?: Record<string, never>,
    callback?: (response: { ok: boolean; userId?: number }) => void,
  ) => void;
};

export type NotificationSocket = Socket<
  NotificationServerEvents,
  NotificationClientEvents
>;

let notificationSocket: NotificationSocket | null = null;
let activeToken: string | null = null;

export const getNotificationSocket = (
  token?: string | null,
): NotificationSocket | null => {
  if (!token || !SOCKET_URL) {
    return null;
  }

  if (notificationSocket && activeToken === token) {
    return notificationSocket;
  }

  notificationSocket?.disconnect();

  activeToken = token;

  notificationSocket = io(SOCKET_URL, {
    auth: {
      token,
    },
    // Expo Go can reject a direct WebSocket handshake on local networks even
    // when ordinary HTTP requests work. Start with polling, then upgrade to
    // WebSocket, and allow Engine.IO to try the next transport on failure.
    transports: ["polling", "websocket"],
    tryAllTransports: true,
    // The root realtime bridge attaches every listener before starting the
    // connection, so startup events cannot race listener registration.
    autoConnect: false,
    reconnection: true,
  });

  return notificationSocket;
};

export const disconnectNotificationSocket = (token?: string | null) => {
  if (token && activeToken !== token) {
    return;
  }

  notificationSocket?.disconnect();
  notificationSocket = null;
  activeToken = null;
};
