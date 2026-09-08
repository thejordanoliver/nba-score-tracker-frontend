import type {
  GameNotificationSettings,
  GameNotificationSubscription,
  NotificationTeamSport,
  TeamNotificationSettings,
  TeamNotificationSubscription,
} from "@/types/notifications";
import { apiClient } from "@/utils/apiClient";

const NOTIFICATION_REQUEST_TIMEOUT_MS = 15_000;

const subscriptionPath = (
  sport: NotificationTeamSport,
  league: string,
  teamId: string | number,
) =>
  `/api/notification-subscriptions/teams/${encodeURIComponent(sport)}/${encodeURIComponent(league)}/${encodeURIComponent(String(teamId))}`;

const gameSubscriptionPath = (
  sport: NotificationTeamSport,
  league: string,
  gameId: string | number,
) =>
  `/api/notification-subscriptions/games/${encodeURIComponent(sport)}/${encodeURIComponent(league)}/${encodeURIComponent(String(gameId))}`;

export async function getTeamNotificationSubscriptions() {
  const response = await apiClient.get<{
    subscriptions: TeamNotificationSubscription[];
  }>("/api/notification-subscriptions/teams", {
    timeout: NOTIFICATION_REQUEST_TIMEOUT_MS,
  });
  return response.data.subscriptions;
}

export async function saveTeamNotificationSubscription(
  sport: NotificationTeamSport,
  league: string,
  teamId: string | number,
  settings?: Partial<TeamNotificationSettings>,
) {
  const response = await apiClient.put<{
    subscription: TeamNotificationSubscription;
  }>(subscriptionPath(sport, league, teamId), settings ?? {});
  return response.data.subscription;
}

export async function deleteTeamNotificationSubscription(
  sport: NotificationTeamSport,
  league: string,
  teamId: string | number,
) {
  await apiClient.delete(subscriptionPath(sport, league, teamId));
}

export async function getGameNotificationSubscriptions() {
  const response = await apiClient.get<{
    subscriptions: GameNotificationSubscription[];
  }>("/api/notification-subscriptions/games", {
    timeout: NOTIFICATION_REQUEST_TIMEOUT_MS,
  });
  return response.data.subscriptions;
}

export async function saveGameNotificationSubscription(
  sport: NotificationTeamSport,
  league: string,
  gameId: string | number,
  settings?: Partial<GameNotificationSettings>,
) {
  const response = await apiClient.put<{
    subscription: GameNotificationSubscription;
  }>(gameSubscriptionPath(sport, league, gameId), settings ?? {});
  return response.data.subscription;
}

export async function deleteGameNotificationSubscription(
  sport: NotificationTeamSport,
  league: string,
  gameId: string | number,
) {
  await apiClient.delete(gameSubscriptionPath(sport, league, gameId));
}
