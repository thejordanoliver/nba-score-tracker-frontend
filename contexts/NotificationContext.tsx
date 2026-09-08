import NotificationSettingsModal from "@/components/Notifications/NotificationSettingsModal";
import {
  archiveNotification,
  getNotificationsPage,
  markAllNotificationsRead,
  markConversationNotificationsRead as markConversationNotificationsReadApi,
  markNotificationRead,
} from "@/services/notificationsApi";
import {
  deleteGameNotificationSubscription,
  deleteTeamNotificationSubscription,
  getGameNotificationSubscriptions,
  getTeamNotificationSubscriptions,
  saveGameNotificationSubscription,
  saveTeamNotificationSubscription,
} from "@/services/notificationSubscriptionsApi";
import type {
  AppNotification,
  GameNotificationSubscription,
  NotificationTeamSport,
  TeamNotificationSubscription,
} from "@/types/notifications";
import type { NotificationEventSettings } from "@/utils/notification-settings";
import {
  DEFAULT_NOTIFICATION_EVENT_SETTINGS,
  hasEnabledNotificationSetting,
  mergeNotificationSettings,
  notificationSettingsFromSubscription,
} from "@/utils/notification-settings";
import {
  isNotificationForSession,
  mergeNotifications,
  reconcileHydratedUnreadCount,
} from "@/utils/notificationState";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const PAGE_SIZE = 30;
const BANNER_DURATION_MS = 5000;

export type Notification = {
  id: string;
  message: string;
  teamLogo?: string | number;
  notification?: AppNotification;
};

type MergeOptions = { showBanner?: boolean };

type NotificationSettingsTarget =
  | {
      scope: "team";
      sport: NotificationTeamSport;
      league: string;
      teamId: string;
    }
  | {
      scope: "game";
      sport: NotificationTeamSport;
      league: string;
      gameId: string;
      homeTeamId?: string;
      awayTeamId?: string;
    };

type NotificationContextType = {
  centerNotifications: AppNotification[];
  unreadNotificationCount: number;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  initializeNotifications: (
    userId?: number | string | null,
  ) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  mergeRealtimeNotification: (
    notification: AppNotification,
    options?: MergeOptions,
  ) => void;
  applyRealtimeRead: (notification: AppNotification) => void;
  applyRealtimeArchive: (id: string) => void;
  applyRealtimeUnreadCount: (unreadCount: number) => void;
  markCenterNotificationRead: (id: string) => Promise<void>;
  markConversationNotificationsRead: (conversationId: string) => Promise<void>;
  markAllCenterNotificationsRead: () => Promise<void>;
  removeCenterNotification: (id: string) => Promise<void>;
  clearCenterNotifications: () => void;
  teamSubscriptions: TeamNotificationSubscription[];
  gameSubscriptions: GameNotificationSubscription[];
  toggleTeamNotifications: (
    sport: NotificationTeamSport,
    league: string,
    teamId: string | number,
  ) => Promise<void>;
  isTeamNotified: (
    sport: NotificationTeamSport,
    league: string,
    teamId: string | number,
  ) => boolean;
  toggleGameNotifications: (
    sport: NotificationTeamSport,
    league: string,
    gameId: string | number,
  ) => Promise<void>;
  isGameNotified: (
    sport: NotificationTeamSport,
    league: string,
    gameId: string | number,
    homeTeamId?: string | number,
    awayTeamId?: string | number,
  ) => boolean;
  openGameNotificationSettings: (
    sport: NotificationTeamSport,
    league: string,
    gameId: string | number,
    homeTeamId?: string | number,
    awayTeamId?: string | number,
  ) => void;
  isGameNotificationPending: (
    sport: NotificationTeamSport,
    league: string,
    gameId: string | number,
  ) => boolean;
  toggleNotifications: (league: string, teamId: string | number) => Promise<void>;
  isNotified: (league: string, teamId: string | number) => boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const NotificationBannerContext = createContext<{
  notifications: Notification[];
  onDismiss: (id: string) => void;
} | null>(null);

const inferSport = (leagueInput: string): NotificationTeamSport => {
  const league = leagueInput.toLowerCase();
  if (["nba", "wnba", "cbb", "wcbb", "gleague"].includes(league))
    return "basketball";
  if (["nfl", "cfb", "ufl"].includes(league)) return "football";
  if (
    ["mlb", "cb", "sb", "college-baseball", "college-softball"].includes(league)
  )
    return "baseball";
  if (league === "nhl") return "hockey";
  return "soccer";
};

const subscriptionKey = (
  sport: NotificationTeamSport,
  league: string,
  teamId: string | number,
) => `${sport}:${league.toLowerCase()}:${String(teamId)}`;

const gameSubscriptionKey = (
  sport: NotificationTeamSport,
  league: string,
  gameId: string | number,
) => `${sport}:${league.toLowerCase()}:${String(gameId)}`;

const notificationSyncVersion = (notification: AppNotification) =>
  `${notification.updatedAt}|${notification.readAt ?? ""}|${notification.archivedAt ?? ""}`;

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [centerNotifications, setCenterNotifications] = useState<
    AppNotification[]
  >([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamSubscriptions, setTeamSubscriptions] = useState<
    TeamNotificationSubscription[]
  >([]);
  const [gameSubscriptions, setGameSubscriptions] = useState<
    GameNotificationSubscription[]
  >([]);
  const [pendingGameSubscriptionKeys, setPendingGameSubscriptionKeys] =
    useState<Set<string>>(new Set());
  const [notificationSettingsTarget, setNotificationSettingsTarget] =
    useState<NotificationSettingsTarget | null>(null);
  const [notificationSettingsSaving, setNotificationSettingsSaving] =
    useState(false);

  const userIdRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const centerNotificationsRef = useRef<AppNotification[]>([]);
  const unreadCountRef = useRef(0);
  const pendingGameSubscriptionKeysRef = useRef(new Set<string>());
  const refreshRequestIdRef = useRef(0);
  const bannerTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  useEffect(() => {
    centerNotificationsRef.current = centerNotifications;
  }, [centerNotifications]);

  const updateCenterNotifications = useCallback(
    (
      value:
        | AppNotification[]
        | ((current: AppNotification[]) => AppNotification[]),
    ) => {
      const next =
        typeof value === "function"
          ? value(centerNotificationsRef.current)
          : value;
      centerNotificationsRef.current = next;
      setCenterNotifications(next);
    },
    [],
  );

  const updateUnreadCount = useCallback(
    (value: number | ((current: number) => number)) => {
      const next =
        typeof value === "function" ? value(unreadCountRef.current) : value;
      unreadCountRef.current = next;
      setUnreadNotificationCount(next);
    },
    [],
  );

  const onDismiss = useCallback((id: string) => {
    const timer = bannerTimersRef.current.get(id);
    if (timer) clearTimeout(timer);
    bannerTimersRef.current.delete(id);
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const showNotification = useCallback(
    (notification: Notification) => {
      if (!notification.id) return;
      setNotifications((current) =>
        current.some((item) => item.id === notification.id)
          ? current
          : [...current, notification],
      );
      const existing = bannerTimersRef.current.get(notification.id);
      if (existing) clearTimeout(existing);
      bannerTimersRef.current.set(
        notification.id,
        setTimeout(() => onDismiss(notification.id), BANNER_DURATION_MS),
      );
    },
    [onDismiss],
  );

  const clearCenterNotifications = useCallback(() => {
    generationRef.current += 1;
    refreshRequestIdRef.current += 1;
    userIdRef.current = null;
    bannerTimersRef.current.forEach(clearTimeout);
    bannerTimersRef.current.clear();
    setNotifications([]);
    updateCenterNotifications([]);
    updateUnreadCount(0);
    setNextCursor(null);
    setHasMore(false);
    setTeamSubscriptions([]);
    setGameSubscriptions([]);
    pendingGameSubscriptionKeysRef.current.clear();
    setPendingGameSubscriptionKeys(new Set());
    setNotificationSettingsTarget(null);
    setNotificationSettingsSaving(false);
    setError(null);
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, [updateCenterNotifications, updateUnreadCount]);

  useEffect(
    () => () => {
      bannerTimersRef.current.forEach(clearTimeout);
      bannerTimersRef.current.clear();
    },
    [],
  );

  const initializeNotifications = useCallback(
    async (userIdInput?: number | string | null) => {
      const userId = Number(userIdInput);
      const generation = ++generationRef.current;
      refreshRequestIdRef.current += 1;
      setRefreshing(false);

      if (!Number.isInteger(userId) || userId <= 0) {
        clearCenterNotifications();
        return false;
      }

      const isAccountChange = userIdRef.current !== userId;
      userIdRef.current = userId;
      if (isAccountChange) {
        setNotifications([]);
        updateCenterNotifications([]);
        updateUnreadCount(0);
        setNextCursor(null);
        setHasMore(false);
        setTeamSubscriptions([]);
        setGameSubscriptions([]);
        pendingGameSubscriptionKeysRef.current.clear();
        setPendingGameSubscriptionKeys(new Set());
      }
      setError(null);
      setLoading(isAccountChange);
      const requestStartVersions = new Map(
        centerNotificationsRef.current.map((notification) => [
          notification.id,
          notificationSyncVersion(notification),
        ]),
      );
      const requestStartIds = new Set(requestStartVersions.keys());

      try {
        const [page, subscriptions, gameSubscriptionResults] =
          await Promise.all([
            getNotificationsPage({ limit: PAGE_SIZE }),
            getTeamNotificationSubscriptions(),
            getGameNotificationSubscriptions(),
          ]);
        if (
          generationRef.current !== generation ||
          userIdRef.current !== userId
        ) {
          return false;
        }
        const current = centerNotificationsRef.current;
        const concurrentChanges = current.filter(
          (notification) =>
            !requestStartVersions.has(notification.id) ||
            requestStartVersions.get(notification.id) !==
              notificationSyncVersion(notification),
        );
        const hydrated = mergeNotifications(
          page.notifications,
          concurrentChanges,
        );
        updateCenterNotifications(hydrated);
        updateUnreadCount(
          reconcileHydratedUnreadCount({
            authoritativeCount: page.unreadCount,
            requestStartIds,
            hydratedPage: page.notifications,
            currentNotifications: current,
          }),
        );
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
        setTeamSubscriptions(subscriptions);
        setGameSubscriptions(gameSubscriptionResults);
        return true;
      } catch (caught) {
        if (generationRef.current === generation) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Failed to load notifications",
          );
        }
        return false;
      } finally {
        if (generationRef.current === generation) setLoading(false);
      }
    },
    [clearCenterNotifications, updateCenterNotifications, updateUnreadCount],
  );

  const refreshNotifications = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    const refreshRequestId = ++refreshRequestIdRef.current;
    const generation = generationRef.current;
    const requestStartVersions = new Map(
      centerNotificationsRef.current.map((notification) => [
        notification.id,
        notificationSyncVersion(notification),
      ]),
    );
    const requestStartIds = new Set(requestStartVersions.keys());
    setRefreshing(true);
    setError(null);
    try {
      const [page, subscriptions, gameSubscriptionResults] = await Promise.all([
        getNotificationsPage({ limit: PAGE_SIZE }),
        getTeamNotificationSubscriptions(),
        getGameNotificationSubscriptions(),
      ]);
      if (generationRef.current !== generation || userIdRef.current !== userId)
        return;
      const current = centerNotificationsRef.current;
      const concurrentChanges = current.filter(
        (notification) =>
          !requestStartVersions.has(notification.id) ||
          requestStartVersions.get(notification.id) !==
            notificationSyncVersion(notification),
      );
      const merged = mergeNotifications(page.notifications, concurrentChanges);
      updateCenterNotifications(merged);
      updateUnreadCount(
        reconcileHydratedUnreadCount({
          authoritativeCount: page.unreadCount,
          requestStartIds,
          hydratedPage: page.notifications,
          currentNotifications: current,
        }),
      );
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      setTeamSubscriptions(subscriptions);
      setGameSubscriptions(gameSubscriptionResults);
    } catch (caught) {
      if (generationRef.current === generation) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to refresh notifications",
        );
      }
    } finally {
      if (refreshRequestIdRef.current === refreshRequestId) {
        setRefreshing(false);
      }
    }
  }, [updateCenterNotifications, updateUnreadCount]);

  const loadMoreNotifications = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId || !nextCursor || !hasMore || loadingMore) return;
    const generation = generationRef.current;
    setLoadingMore(true);
    try {
      const page = await getNotificationsPage({
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });
      if (generationRef.current !== generation || userIdRef.current !== userId)
        return;
      const merged = mergeNotifications(
        centerNotificationsRef.current,
        page.notifications,
      );
      updateCenterNotifications(merged);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (caught) {
      if (generationRef.current === generation) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to load more notifications",
        );
      }
    } finally {
      if (generationRef.current === generation) setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor, updateCenterNotifications]);

  const mergeRealtimeNotification = useCallback(
    (notification: AppNotification, options: MergeOptions = {}) => {
      if (!isNotificationForSession(notification, userIdRef.current)) return;

      const existing = centerNotificationsRef.current.some(
        (item) => item.id === notification.id,
      );
      const merged = mergeNotifications(centerNotificationsRef.current, [
        notification,
      ]);
      updateCenterNotifications(merged);
      if (!existing && !notification.readAt) {
        updateUnreadCount((count) => count + 1);
      }
      if (!existing && options.showBanner !== false) {
        showNotification({
          id: `notification:${notification.id}`,
          message: notification.body,
          notification,
        });
      }
    },
    [showNotification, updateCenterNotifications, updateUnreadCount],
  );

  const applyRealtimeRead = useCallback(
    (notification: AppNotification) => {
      if (notification.recipientUserId !== userIdRef.current) return;
      updateCenterNotifications((current) =>
        mergeNotifications(current, [notification]),
      );
    },
    [updateCenterNotifications],
  );

  const applyRealtimeArchive = useCallback(
    (id: string) => {
      updateCenterNotifications((current) =>
        current.filter((item) => item.id !== id),
      );
    },
    [updateCenterNotifications],
  );

  const applyRealtimeUnreadCount = useCallback(
    (count: number) => {
      if (Number.isFinite(count) && count >= 0) updateUnreadCount(count);
    },
    [updateUnreadCount],
  );

  const markCenterNotificationRead = useCallback(
    async (id: string) => {
      const readAt = new Date().toISOString();
      updateCenterNotifications((current) =>
        current.map((item) =>
          item.id === id && !item.readAt ? { ...item, readAt } : item,
        ),
      );
      try {
        const result = await markNotificationRead(id);
        updateCenterNotifications((current) =>
          mergeNotifications(current, [result.notification]),
        );
        updateUnreadCount(result.unreadCount);
      } catch {
        await refreshNotifications();
      }
    },
    [refreshNotifications, updateCenterNotifications, updateUnreadCount],
  );

  const markConversationNotificationsRead = useCallback(
    async (conversationId: string) => {
      const normalizedId = String(conversationId ?? "").trim();
      if (!normalizedId) return;
      const readAt = new Date().toISOString();
      updateCenterNotifications((current) =>
        current.map((item) =>
          item.type === "message" &&
          item.data.conversationId === normalizedId &&
          !item.readAt
            ? { ...item, readAt }
            : item,
        ),
      );
      try {
        const result = await markConversationNotificationsReadApi(normalizedId);
        updateUnreadCount(result.unreadCount);
      } catch {
        await refreshNotifications();
      }
    },
    [refreshNotifications, updateCenterNotifications, updateUnreadCount],
  );

  const markAllCenterNotificationsRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    updateCenterNotifications((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
    );
    updateUnreadCount(0);
    try {
      const result = await markAllNotificationsRead();
      updateUnreadCount(result.unreadCount);
    } catch {
      await refreshNotifications();
    }
  }, [refreshNotifications, updateCenterNotifications, updateUnreadCount]);

  const removeCenterNotification = useCallback(
    async (id: string) => {
      updateCenterNotifications((current) =>
        current.filter((item) => item.id !== id),
      );
      try {
        const result = await archiveNotification(id);
        updateUnreadCount(result.unreadCount);
      } catch {
        await refreshNotifications();
      }
    },
    [refreshNotifications, updateCenterNotifications, updateUnreadCount],
  );

  const isTeamNotified = useCallback(
    (sport: NotificationTeamSport, league: string, teamId: string | number) =>
      teamSubscriptions.some(
        (subscription) =>
          subscriptionKey(
            subscription.sport,
            subscription.league,
            subscription.teamId,
          ) === subscriptionKey(sport, league, teamId),
      ),
    [teamSubscriptions],
  );

  const toggleTeamNotifications = useCallback(
    async (
      sport: NotificationTeamSport,
      league: string,
      teamId: string | number,
    ) => {
      const key = subscriptionKey(sport, league, teamId);
      const existing = teamSubscriptions.find(
        (subscription) =>
          subscriptionKey(
            subscription.sport,
            subscription.league,
            subscription.teamId,
          ) === key,
      );
      if (existing) {
        setTeamSubscriptions((current) =>
          current.filter(
            (subscription) =>
              subscriptionKey(
                subscription.sport,
                subscription.league,
                subscription.teamId,
              ) !== key,
          ),
        );
        try {
          await deleteTeamNotificationSubscription(sport, league, teamId);
        } catch (caught) {
          setTeamSubscriptions((current) => [...current, existing]);
          setError(
            caught instanceof Error
              ? caught.message
              : "Failed to update team alerts",
          );
        }
        return;
      }

      const optimistic: TeamNotificationSubscription = {
        sport,
        league,
        teamId: String(teamId),
        gameStartEnabled: true,
        touchdownEnabled: true,
        quarterEndEnabled: true,
        halftimeEnabled: true,
        closeGameEnabled: true,
        finalScoreEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTeamSubscriptions((current) => [...current, optimistic]);
      try {
        const saved = await saveTeamNotificationSubscription(
          sport,
          league,
          teamId,
        );
        setTeamSubscriptions((current) => [
          ...current.filter(
            (subscription) =>
              subscriptionKey(
                subscription.sport,
                subscription.league,
                subscription.teamId,
              ) !== key,
          ),
          saved,
        ]);
      } catch (caught) {
        setTeamSubscriptions((current) =>
          current.filter(
            (subscription) =>
              subscriptionKey(
                subscription.sport,
                subscription.league,
                subscription.teamId,
              ) !== key,
          ),
        );
        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to update team alerts",
        );
      }
    },
    [teamSubscriptions],
  );

  const isGameNotified = useCallback(
    (
      sport: NotificationTeamSport,
      league: string,
      gameId: string | number,
      homeTeamId?: string | number,
      awayTeamId?: string | number,
    ) => {
      const key = gameSubscriptionKey(sport, league, gameId);
      const gameOverride = gameSubscriptions.find(
        (subscription) =>
          gameSubscriptionKey(
            subscription.sport,
            subscription.league,
            subscription.gameId,
          ) === key,
      );
      if (gameOverride) {
        return hasEnabledNotificationSetting(
          notificationSettingsFromSubscription(gameOverride),
        );
      }

      const teamIds = new Set(
        [homeTeamId, awayTeamId].filter((teamId) => teamId != null).map(String),
      );
      const inherited = mergeNotificationSettings(
        teamSubscriptions
          .filter(
            (subscription) =>
              subscription.sport === sport &&
              subscription.league.toLowerCase() === league.toLowerCase() &&
              teamIds.has(String(subscription.teamId)),
          )
          .map(notificationSettingsFromSubscription),
      );
      return hasEnabledNotificationSetting(inherited);
    },
    [gameSubscriptions, teamSubscriptions],
  );

  const openGameNotificationSettings = useCallback(
    (
      sport: NotificationTeamSport,
      league: string,
      gameId: string | number,
      homeTeamId?: string | number,
      awayTeamId?: string | number,
    ) => {
      setNotificationSettingsTarget({
        scope: "game",
        sport,
        league: league.toLowerCase(),
        gameId: String(gameId),
        homeTeamId: homeTeamId == null ? undefined : String(homeTeamId),
        awayTeamId: awayTeamId == null ? undefined : String(awayTeamId),
      });
    },
    [],
  );

  const isGameNotificationPending = useCallback(
    (sport: NotificationTeamSport, league: string, gameId: string | number) =>
      pendingGameSubscriptionKeys.has(
        gameSubscriptionKey(sport, league, gameId),
      ),
    [pendingGameSubscriptionKeys],
  );

  const toggleGameNotifications = useCallback(
    async (
      sport: NotificationTeamSport,
      league: string,
      gameId: string | number,
    ) => {
      const key = gameSubscriptionKey(sport, league, gameId);
      if (pendingGameSubscriptionKeysRef.current.has(key)) return;

      const generation = generationRef.current;
      const userId = userIdRef.current;
      const isCurrentSession = () =>
        generationRef.current === generation && userIdRef.current === userId;

      const existing = gameSubscriptions.find(
        (subscription) =>
          gameSubscriptionKey(
            subscription.sport,
            subscription.league,
            subscription.gameId,
          ) === key,
      );

      pendingGameSubscriptionKeysRef.current.add(key);
      setPendingGameSubscriptionKeys(
        new Set(pendingGameSubscriptionKeysRef.current),
      );

      if (existing) {
        setGameSubscriptions((current) =>
          current.filter(
            (subscription) =>
              gameSubscriptionKey(
                subscription.sport,
                subscription.league,
                subscription.gameId,
              ) !== key,
          ),
        );
        try {
          await deleteGameNotificationSubscription(sport, league, gameId);
        } catch (caught) {
          if (!isCurrentSession()) return;
          setGameSubscriptions((current) =>
            current.some(
              (subscription) =>
                gameSubscriptionKey(
                  subscription.sport,
                  subscription.league,
                  subscription.gameId,
                ) === key,
            )
              ? current
              : [...current, existing],
          );
          setError(
            caught instanceof Error
              ? caught.message
              : "Failed to update game alerts",
          );
        } finally {
          if (isCurrentSession()) {
            pendingGameSubscriptionKeysRef.current.delete(key);
            setPendingGameSubscriptionKeys(
              new Set(pendingGameSubscriptionKeysRef.current),
            );
          }
        }
        return;
      }

      const now = new Date().toISOString();
      const optimistic: GameNotificationSubscription = {
        sport,
        league: league.toLowerCase(),
        gameId: String(gameId),
        gameStartEnabled: true,
        touchdownEnabled: true,
        quarterEndEnabled: true,
        halftimeEnabled: true,
        closeGameEnabled: true,
        finalScoreEnabled: true,
        createdAt: now,
        updatedAt: now,
      };
      setGameSubscriptions((current) => [...current, optimistic]);

      try {
        const saved = await saveGameNotificationSubscription(
          sport,
          league,
          gameId,
        );
        if (!isCurrentSession()) return;
        setGameSubscriptions((current) => [
          ...current.filter(
            (subscription) =>
              gameSubscriptionKey(
                subscription.sport,
                subscription.league,
                subscription.gameId,
              ) !== key,
          ),
          saved,
        ]);
      } catch (caught) {
        if (!isCurrentSession()) return;
        setGameSubscriptions((current) =>
          current.filter(
            (subscription) =>
              gameSubscriptionKey(
                subscription.sport,
                subscription.league,
                subscription.gameId,
              ) !== key,
          ),
        );
        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to update game alerts",
        );
      } finally {
        if (isCurrentSession()) {
          pendingGameSubscriptionKeysRef.current.delete(key);
          setPendingGameSubscriptionKeys(
            new Set(pendingGameSubscriptionKeysRef.current),
          );
        }
      }
    },
    [gameSubscriptions],
  );

  const toggleNotifications = useCallback(
    async (league: string, teamId: string | number) => {
      setNotificationSettingsTarget({
        scope: "team",
        sport: inferSport(league),
        league: league.toLowerCase(),
        teamId: String(teamId),
      });
    },
    [],
  );
  const isNotified = useCallback(
    (league: string, teamId: string | number) =>
      isTeamNotified(inferSport(league), league, teamId),
    [isTeamNotified],
  );

  const value = useMemo<NotificationContextType>(
    () => ({
      centerNotifications,
      unreadNotificationCount,
      loading,
      refreshing,
      loadingMore,
      hasMore,
      error,
      initializeNotifications,
      refreshNotifications,
      loadMoreNotifications,
      mergeRealtimeNotification,
      applyRealtimeRead,
      applyRealtimeArchive,
      applyRealtimeUnreadCount,
      markCenterNotificationRead,
      markConversationNotificationsRead,
      markAllCenterNotificationsRead,
      removeCenterNotification,
      clearCenterNotifications,
      teamSubscriptions,
      gameSubscriptions,
      toggleTeamNotifications,
      isTeamNotified,
      toggleGameNotifications,
      isGameNotified,
      openGameNotificationSettings,
      isGameNotificationPending,
      toggleNotifications,
      isNotified,
    }),
    [
      applyRealtimeArchive,
      applyRealtimeRead,
      applyRealtimeUnreadCount,
      centerNotifications,
      clearCenterNotifications,
      error,
      hasMore,
      gameSubscriptions,
      initializeNotifications,
      isGameNotificationPending,
      isGameNotified,
      isNotified,
      isTeamNotified,
      loadMoreNotifications,
      loading,
      loadingMore,
      markAllCenterNotificationsRead,
      markCenterNotificationRead,
      markConversationNotificationsRead,
      mergeRealtimeNotification,
      refreshing,
      refreshNotifications,
      removeCenterNotification,
      openGameNotificationSettings,
      teamSubscriptions,
      toggleGameNotifications,
      toggleNotifications,
      toggleTeamNotifications,
      unreadNotificationCount,
    ],
  );

  const bannerValue = useMemo(
    () => ({ notifications, onDismiss }),
    [notifications, onDismiss],
  );

  const activeTeamSubscription = useMemo(() => {
    if (notificationSettingsTarget?.scope !== "team") return null;
    const target = notificationSettingsTarget;
    return (
      teamSubscriptions.find(
        (subscription) =>
          subscriptionKey(
            subscription.sport,
            subscription.league,
            subscription.teamId,
          ) === subscriptionKey(target.sport, target.league, target.teamId),
      ) ?? null
    );
  }, [notificationSettingsTarget, teamSubscriptions]);

  const activeGameSubscription = useMemo(() => {
    if (notificationSettingsTarget?.scope !== "game") return null;
    const target = notificationSettingsTarget;
    return (
      gameSubscriptions.find(
        (subscription) =>
          gameSubscriptionKey(
            subscription.sport,
            subscription.league,
            subscription.gameId,
          ) === gameSubscriptionKey(target.sport, target.league, target.gameId),
      ) ?? null
    );
  }, [gameSubscriptions, notificationSettingsTarget]);

  const inheritedGameSettings = useMemo(() => {
    if (notificationSettingsTarget?.scope !== "game") return null;
    const target = notificationSettingsTarget;
    const teamIds = new Set(
      [target.homeTeamId, target.awayTeamId].filter(
        (teamId): teamId is string => Boolean(teamId),
      ),
    );
    return mergeNotificationSettings(
      teamSubscriptions
        .filter(
          (subscription) =>
            subscription.sport === target.sport &&
            subscription.league.toLowerCase() === target.league &&
            teamIds.has(String(subscription.teamId)),
        )
        .map(notificationSettingsFromSubscription),
    );
  }, [notificationSettingsTarget, teamSubscriptions]);

  const activeSheetSettings = useMemo(
    () =>
      activeTeamSubscription
        ? notificationSettingsFromSubscription(activeTeamSubscription)
        : activeGameSubscription
          ? notificationSettingsFromSubscription(activeGameSubscription)
          : (inheritedGameSettings ?? DEFAULT_NOTIFICATION_EVENT_SETTINGS),
    [activeGameSubscription, activeTeamSubscription, inheritedGameSettings],
  );

  const activeSheetEnabled =
    notificationSettingsTarget?.scope === "team"
      ? Boolean(activeTeamSubscription)
      : hasEnabledNotificationSetting(
          activeGameSubscription
            ? notificationSettingsFromSubscription(activeGameSubscription)
            : inheritedGameSettings,
        );

  const closeNotificationSettings = useCallback(() => {
    if (!notificationSettingsSaving) setNotificationSettingsTarget(null);
  }, [notificationSettingsSaving]);

  const saveActiveNotificationSettings = useCallback(
    async (settings: NotificationEventSettings, enabled: boolean) => {
      const target = notificationSettingsTarget;
      if (!target || notificationSettingsSaving) return;
      setNotificationSettingsSaving(true);
      setError(null);
      try {
        if (target.scope === "team") {
          const key = subscriptionKey(
            target.sport,
            target.league,
            target.teamId,
          );
          if (!enabled) {
            await deleteTeamNotificationSubscription(
              target.sport,
              target.league,
              target.teamId,
            );
            setTeamSubscriptions((current) =>
              current.filter(
                (subscription) =>
                  subscriptionKey(
                    subscription.sport,
                    subscription.league,
                    subscription.teamId,
                  ) !== key,
              ),
            );
          } else {
            const saved = await saveTeamNotificationSubscription(
              target.sport,
              target.league,
              target.teamId,
              settings,
            );
            setTeamSubscriptions((current) => [
              ...current.filter(
                (subscription) =>
                  subscriptionKey(
                    subscription.sport,
                    subscription.league,
                    subscription.teamId,
                  ) !== key,
              ),
              saved,
            ]);
          }
        } else {
          const key = gameSubscriptionKey(
            target.sport,
            target.league,
            target.gameId,
          );
          const saved = await saveGameNotificationSubscription(
            target.sport,
            target.league,
            target.gameId,
            settings,
          );
          setGameSubscriptions((current) => [
            ...current.filter(
              (subscription) =>
                gameSubscriptionKey(
                  subscription.sport,
                  subscription.league,
                  subscription.gameId,
                ) !== key,
            ),
            saved,
          ]);
        }
        setNotificationSettingsTarget(null);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to save notification preferences",
        );
        throw caught;
      } finally {
        setNotificationSettingsSaving(false);
      }
    },
    [notificationSettingsSaving, notificationSettingsTarget],
  );

  const useTeamNotificationDefaults = useCallback(async () => {
    const target = notificationSettingsTarget;
    if (
      target?.scope !== "game" ||
      !activeGameSubscription ||
      notificationSettingsSaving
    ) {
      return;
    }
    setNotificationSettingsSaving(true);
    setError(null);
    try {
      await deleteGameNotificationSubscription(
        target.sport,
        target.league,
        target.gameId,
      );
      const key = gameSubscriptionKey(
        target.sport,
        target.league,
        target.gameId,
      );
      setGameSubscriptions((current) =>
        current.filter(
          (subscription) =>
            gameSubscriptionKey(
              subscription.sport,
              subscription.league,
              subscription.gameId,
            ) !== key,
        ),
      );
      setNotificationSettingsTarget(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to restore team notification settings",
      );
      throw caught;
    } finally {
      setNotificationSettingsSaving(false);
    }
  }, [
    activeGameSubscription,
    notificationSettingsSaving,
    notificationSettingsTarget,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      <NotificationBannerContext.Provider value={bannerValue}>
        {children}
        {notificationSettingsTarget ? (
          <NotificationSettingsModal
            key={
              notificationSettingsTarget.scope === "team"
                ? `team:${notificationSettingsTarget.sport}:${notificationSettingsTarget.league}:${notificationSettingsTarget.teamId}`
                : `game:${notificationSettingsTarget.sport}:${notificationSettingsTarget.league}:${notificationSettingsTarget.gameId}`
            }
            visible
            scope={notificationSettingsTarget.scope}
            sport={notificationSettingsTarget.sport}
            league={notificationSettingsTarget.league}
            enabled={activeSheetEnabled}
            settings={activeSheetSettings}
            hasGameOverride={Boolean(activeGameSubscription)}
            isSaving={notificationSettingsSaving}
            onClose={closeNotificationSettings}
            onSave={saveActiveNotificationSettings}
            onUseTeamDefaults={useTeamNotificationDefaults}
          />
        ) : null}
      </NotificationBannerContext.Provider>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return context;
}

export function useNotificationBanners() {
  const context = useContext(NotificationBannerContext);
  if (!context) {
    throw new Error(
      "useNotificationBanners must be used within NotificationProvider",
    );
  }
  return context;
}
