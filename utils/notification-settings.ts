import type {
  GameNotificationSettings,
  GameNotificationSubscription,
  TeamNotificationSettings,
  TeamNotificationSubscription,
} from "@/types/notifications";

export type NotificationEventSettings = TeamNotificationSettings;

export const DEFAULT_NOTIFICATION_EVENT_SETTINGS: NotificationEventSettings = {
  gameStartEnabled: true,
  touchdownEnabled: true,
  quarterEndEnabled: true,
  halftimeEnabled: true,
  closeGameEnabled: true,
  finalScoreEnabled: true,
};

export const DISABLED_NOTIFICATION_EVENT_SETTINGS: NotificationEventSettings = {
  gameStartEnabled: false,
  touchdownEnabled: false,
  quarterEndEnabled: false,
  halftimeEnabled: false,
  closeGameEnabled: false,
  finalScoreEnabled: false,
};

export function notificationSettingsFromSubscription(
  subscription:
    | TeamNotificationSubscription
    | GameNotificationSubscription,
): NotificationEventSettings {
  return {
    gameStartEnabled: subscription.gameStartEnabled,
    touchdownEnabled: subscription.touchdownEnabled,
    quarterEndEnabled: subscription.quarterEndEnabled,
    halftimeEnabled: subscription.halftimeEnabled,
    closeGameEnabled: subscription.closeGameEnabled,
    finalScoreEnabled: subscription.finalScoreEnabled,
  };
}

export function mergeNotificationSettings(
  settings: (TeamNotificationSettings | GameNotificationSettings)[],
): NotificationEventSettings | null {
  if (!settings.length) return null;

  return settings.reduce<NotificationEventSettings>(
    (merged, current) => ({
      gameStartEnabled: merged.gameStartEnabled || current.gameStartEnabled,
      touchdownEnabled: merged.touchdownEnabled || current.touchdownEnabled,
      quarterEndEnabled: merged.quarterEndEnabled || current.quarterEndEnabled,
      halftimeEnabled: merged.halftimeEnabled || current.halftimeEnabled,
      closeGameEnabled: merged.closeGameEnabled || current.closeGameEnabled,
      finalScoreEnabled: merged.finalScoreEnabled || current.finalScoreEnabled,
    }),
    DISABLED_NOTIFICATION_EVENT_SETTINGS,
  );
}

export function hasEnabledNotificationSetting(
  settings: NotificationEventSettings | null,
) {
  return Boolean(settings && Object.values(settings).some(Boolean));
}
