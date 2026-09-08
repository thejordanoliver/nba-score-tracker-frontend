import type { AppNotification, NotificationPage } from "@/types/notifications";
import { apiClient } from "@/utils/apiClient";

const NOTIFICATION_REQUEST_TIMEOUT_MS = 15_000;

export async function getNotificationsPage(options: {
  cursor?: string | null;
  limit?: number;
} = {}): Promise<NotificationPage> {
  const response = await apiClient.get<NotificationPage>("/api/notifications", {
    params: {
      cursor: options.cursor || undefined,
      limit: options.limit,
    },
    timeout: NOTIFICATION_REQUEST_TIMEOUT_MS,
  });
  return response.data;
}

export async function getNotificationUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ unreadCount: number }>(
    "/api/notifications/unread-count",
  );
  return response.data.unreadCount;
}

export async function markNotificationRead(id: string) {
  const response = await apiClient.patch<{
    notification: AppNotification;
    unreadCount: number;
  }>(`/api/notifications/${encodeURIComponent(id)}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await apiClient.patch<{
    updatedCount: number;
    readAt: string;
    unreadCount: number;
  }>("/api/notifications/read-all");
  return response.data;
}

export async function markConversationNotificationsRead(conversationId: string) {
  const response = await apiClient.patch<{
    notifications: AppNotification[];
    readAt: string;
    unreadCount: number;
  }>(`/api/notifications/conversations/${encodeURIComponent(conversationId)}/read`);
  return response.data;
}

export async function archiveNotification(id: string) {
  const response = await apiClient.delete<{ id: string; unreadCount: number }>(
    `/api/notifications/${encodeURIComponent(id)}`,
  );
  return response.data;
}
