import { AppState } from "react-native";
import { io, type Socket } from "socket.io-client";
import type {
  LiveGameSubscriptionInput,
  LiveScoreboardSubscriptionInput,
  LiveSubscriptionInput,
  LiveSubscriptionKind,
  LiveSubscriptionReady,
  LiveUpdateEnvelope,
} from "types/liveSports";
import { getAccessToken } from "utils/apiClient";
import { getSocketNamespaceUrl } from "utils/apiConfig";

type SportsLiveServerEvents = {
  "sports:game:update": (payload: LiveUpdateEnvelope) => void;
  "sports:scoreboard:update": (payload: LiveUpdateEnvelope) => void;
  "sports:subscription:ready": (payload: LiveSubscriptionReady) => void;
  "sports:error": (payload: LiveSubscriptionReady) => void;
};

type SportsLiveClientEvents = {
  "sports:game:subscribe": (
    payload: LiveGameSubscriptionInput,
    callback?: (response: LiveSubscriptionReady) => void,
  ) => void;
  "sports:game:unsubscribe": (
    payload: LiveGameSubscriptionInput,
    callback?: (response: LiveSubscriptionReady) => void,
  ) => void;
  "sports:scoreboard:subscribe": (
    payload: LiveScoreboardSubscriptionInput,
    callback?: (response: LiveSubscriptionReady) => void,
  ) => void;
  "sports:scoreboard:unsubscribe": (
    payload: LiveScoreboardSubscriptionInput,
    callback?: (response: LiveSubscriptionReady) => void,
  ) => void;
};

type SportsLiveSocket = Socket<SportsLiveServerEvents, SportsLiveClientEvents>;

type UntypedSportsLiveSocket = Socket & {
  emit: (event: string, ...args: any[]) => SportsLiveSocket;
};

type SubscriptionListener<TPayload = unknown> = (
  payload: LiveUpdateEnvelope<TPayload>,
) => void;

type SubscriptionRecord = {
  localKey: string;
  serverKey: string | null;
  kind: LiveSubscriptionKind;
  payload: LiveSubscriptionInput;
  listeners: Set<SubscriptionListener>;
};

let sportsLiveSocket: SportsLiveSocket | null = null;
let appStateListenerRegistered = false;
const subscriptionsByLocalKey = new Map<string, SubscriptionRecord>();
const localKeyByServerKey = new Map<string, string>();

const SOCKET_NAMESPACE = "/sports-live";
const namespaceUrl = getSocketNamespaceUrl(SOCKET_NAMESPACE);

const FEED_ALIASES: Record<string, string> = {
  eventlist: "eventList",
  "event-list": "eventList",
  events: "eventList",
  nbatournament: "nbaPlayoffs",
  "nba-playoffs": "nbaPlayoffs",
  nbaplayoffs: "nbaPlayoffs",
  playoff: "nbaPlayoffs",
  playoffs: "nbaPlayoffs",
  scoreboard: "scoreboard",
  teamlatest: "teamLatest",
  "team-latest": "teamLatest",
  teamschedule: "teamSchedule",
  "team-schedule": "teamSchedule",
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (!value || typeof value !== "object") {
    return JSON.stringify(value);
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function normalizeScalar(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object" || typeof value === "function") {
    return undefined;
  }

  const normalized = String(value).trim();

  return normalized || undefined;
}

function normalizeLowerToken(value: unknown): string | undefined {
  return normalizeScalar(value)?.toLowerCase();
}

function normalizeDateToken(value: unknown): string | undefined {
  const normalized = normalizeScalar(value);

  if (!normalized) return undefined;

  const compact = normalized.replace(/\D/g, "");

  return /^\d{8}$/.test(compact) || /^\d{4}$/.test(compact)
    ? compact
    : normalized;
}

function getTodayESPNDate(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function normalizeLocalFeed(sport: string | undefined, value: unknown): string {
  const defaultFeed =
    sport === "mma" || sport === "racing" ? "eventList" : "scoreboard";
  const raw = normalizeScalar(value);
  const feed = raw
    ? (FEED_ALIASES[raw] ?? FEED_ALIASES[raw.toLowerCase()] ?? raw)
    : defaultFeed;

  return (sport === "mma" || sport === "racing") && feed === "scoreboard"
    ? "eventList"
    : feed;
}

function addCanonicalParam(
  params: Record<string, string>,
  key: string,
  value: unknown,
  normalizer: (value: unknown) => string | undefined = normalizeScalar,
) {
  const normalized = normalizer(value);

  if (normalized) {
    params[key] = normalized;
  }
}

function canonicalizeGamePayload(
  payload: LiveSubscriptionInput,
): Record<string, unknown> {
  const input = payload as Partial<LiveGameSubscriptionInput>;

  return {
    gameId: normalizeScalar(input.gameId),
    league: normalizeLowerToken(input.league),
    sport: normalizeLowerToken(input.sport),
  };
}

function canonicalizeScoreboardPayload(
  payload: LiveSubscriptionInput,
): Record<string, unknown> {
  const input = payload as Partial<LiveScoreboardSubscriptionInput>;
  const sport = normalizeLowerToken(input.sport);
  const feed = normalizeLocalFeed(sport, input.feed);
  const params: Record<string, string> = {};

  if (feed === "teamSchedule" || feed === "teamLatest") {
    addCanonicalParam(params, "teamId", input.teamId);
    addCanonicalParam(params, "season", input.season);
  } else if (feed === "nbaPlayoffs") {
    addCanonicalParam(
      params,
      "dates",
      input.dates ?? input.date,
      normalizeDateToken,
    );
    addCanonicalParam(params, "limit", input.limit);
    addCanonicalParam(params, "season", input.season);
  } else {
    if (
      sport === "football" &&
      input.week !== undefined &&
      input.week !== null
    ) {
      addCanonicalParam(
        params,
        "conference",
        input.conferenceId ?? input.groupId ?? input.groups,
      );
      addCanonicalParam(params, "season", input.season);
      addCanonicalParam(
        params,
        "seasonType",
        input.seasonType ?? input.seasontype,
      );
      addCanonicalParam(params, "week", input.week);
    } else {
      addCanonicalParam(
        params,
        "date",
        input.date ?? input.dates ?? getTodayESPNDate(),
        normalizeDateToken,
      );
    }

    addCanonicalParam(params, "limit", input.limit);
  }

  return {
    feed,
    league: normalizeLowerToken(input.league),
    params,
    sport,
  };
}

function getLocalSubscriptionKey(
  kind: LiveSubscriptionKind,
  payload: LiveSubscriptionInput,
) {
  const canonicalPayload =
    kind === "game"
      ? canonicalizeGamePayload(payload)
      : canonicalizeScoreboardPayload(payload);

  return `${kind}:${stableStringify(canonicalPayload)}`;
}

export function getSportsLiveSubscriptionLocalKey(
  kind: LiveSubscriptionKind,
  payload: LiveSubscriptionInput,
) {
  return getLocalSubscriptionKey(kind, payload);
}

function emitSubscribe(record: SubscriptionRecord) {
  const socket = getSportsLiveSocket();

  if (!socket) return;

  const eventName =
    record.kind === "game"
      ? "sports:game:subscribe"
      : "sports:scoreboard:subscribe";

  (socket as UntypedSportsLiveSocket).emit(
    eventName,
    record.payload,
    (response: LiveSubscriptionReady) => {
      if (!response?.ok || !response.subscriptionKey) {
        return;
      }

      record.serverKey = response.subscriptionKey;
      localKeyByServerKey.set(response.subscriptionKey, record.localKey);
    },
  );
}

function emitUnsubscribe(record: SubscriptionRecord) {
  const socket = sportsLiveSocket;

  if (!socket) return;

  const eventName =
    record.kind === "game"
      ? "sports:game:unsubscribe"
      : "sports:scoreboard:unsubscribe";

  (socket as UntypedSportsLiveSocket).emit(eventName, record.payload);
}

function handleUpdate<TPayload>(envelope: LiveUpdateEnvelope<TPayload>) {
  const localKey = localKeyByServerKey.get(envelope.subscriptionKey);

  if (!localKey) return;

  const record = subscriptionsByLocalKey.get(localKey);

  if (!record) return;

  record.listeners.forEach((listener) => {
    listener(envelope);
  });
}

function attachSocketHandlers(socket: SportsLiveSocket) {
  socket.on("sports:game:update", handleUpdate);
  socket.on("sports:scoreboard:update", handleUpdate);
  socket.on("connect", () => {
    subscriptionsByLocalKey.forEach((record) => {
      emitSubscribe(record);
    });
  });

  if (__DEV__) {
    socket.on("connect_error", (error) => {
      console.warn("[SportsLiveSocket] Connection failed", {
        message: error.message,
        namespace: namespaceUrl,
      });
    });
  }
}

function ensureAppStateHandling() {
  if (appStateListenerRegistered) return;

  appStateListenerRegistered = true;

  AppState.addEventListener("change", (state) => {
    if (!sportsLiveSocket) return;

    if (state === "active") {
      sportsLiveSocket.connect();
      return;
    }

    if (state === "background" || state === "inactive") {
      sportsLiveSocket.disconnect();
    }
  });
}

export function getSportsLiveSocket(): SportsLiveSocket | null {
  if (!namespaceUrl) return null;

  if (sportsLiveSocket) {
    if (!sportsLiveSocket.connected) {
      sportsLiveSocket.connect();
    }

    return sportsLiveSocket;
  }

  sportsLiveSocket = io(namespaceUrl, {
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    auth: async (callback) => {
      const token = await getAccessToken();

      callback(token ? { token } : {});
    },
  }) as SportsLiveSocket;

  attachSocketHandlers(sportsLiveSocket);
  ensureAppStateHandling();

  return sportsLiveSocket;
}

export function subscribeSportsLive<TPayload = unknown>({
  kind,
  payload,
  listener,
}: {
  kind: LiveSubscriptionKind;
  payload: LiveSubscriptionInput;
  listener: SubscriptionListener<TPayload>;
}) {
  const localKey = getLocalSubscriptionKey(kind, payload);
  let record = subscriptionsByLocalKey.get(localKey);

  if (!record) {
    record = {
      localKey,
      serverKey: null,
      kind,
      payload,
      listeners: new Set(),
    };
    record.listeners.add(listener as SubscriptionListener);
    subscriptionsByLocalKey.set(localKey, record);
    emitSubscribe(record);
  } else {
    record.listeners.add(listener as SubscriptionListener);
  }
  getSportsLiveSocket();

  return () => {
    const activeRecord = subscriptionsByLocalKey.get(localKey);

    if (!activeRecord) return;

    activeRecord.listeners.delete(listener as SubscriptionListener);

    if (activeRecord.listeners.size > 0) return;

    subscriptionsByLocalKey.delete(localKey);

    if (activeRecord.serverKey) {
      localKeyByServerKey.delete(activeRecord.serverKey);
    }

    emitUnsubscribe(activeRecord);

    if (subscriptionsByLocalKey.size === 0) {
      sportsLiveSocket?.disconnect();
    }
  };
}

export function disconnectSportsLiveSocket() {
  sportsLiveSocket?.disconnect();
  sportsLiveSocket = null;
  subscriptionsByLocalKey.clear();
  localKeyByServerKey.clear();
}
