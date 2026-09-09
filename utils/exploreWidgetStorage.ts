import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDefaultWidgetSize,
  getWidgetTitle,
  isExploreStandingsLeague,
  isExploreWidgetSize,
  isExploreWidgetType,
  widgetAllowsDuplicates,
} from "constants/exploreWidgets";
import type { ExploreWidgetConfig } from "types/widgets";

export const EXPLORE_WIDGETS_KEY_PREFIX = "exploreWidgets";
export const EXPLORE_WIDGETS_LEGACY_KEY = EXPLORE_WIDGETS_KEY_PREFIX;
export const EXPLORE_WIDGETS_SCHEMA_VERSION = 1;

type StoredExploreWidgetsPayload = {
  version?: number;
  widgets?: unknown;
};

export const getExploreWidgetsKey = (userId: string | number) =>
  `${EXPLORE_WIDGETS_KEY_PREFIX}:${userId}`;

function safeParseJson(value: string | null): unknown {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const withSequentialOrder = (widgets: ExploreWidgetConfig[]) =>
  widgets
    .slice()
    .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)
    .map((widget, index) => ({ ...widget, order: index }));

export function createExploreWidgetId(type: ExploreWidgetConfig["type"]) {
  const randomUuid =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${type}:${randomUuid}`;
}

export function normalizeStoredWidgets(value: unknown): ExploreWidgetConfig[] {
  let rawWidgets: unknown[] = [];

  if (Array.isArray(value)) {
    rawWidgets = value;
  } else if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as StoredExploreWidgetsPayload).widgets)
  ) {
    rawWidgets = (value as { widgets: unknown[] }).widgets;
  }

  const seenSingleInstanceTypes = new Set<ExploreWidgetConfig["type"]>();

  const normalized = rawWidgets
    .filter(
      (widget): widget is Partial<ExploreWidgetConfig> =>
        Boolean(widget) &&
        typeof widget === "object" &&
        isExploreWidgetType((widget as ExploreWidgetConfig).type),
    )
    .map((widget) => {
      const type = widget.type as ExploreWidgetConfig["type"];
      const createdAt =
        typeof widget.createdAt === "number" ? widget.createdAt : Date.now();

      return {
        id:
          typeof widget.id === "string" && widget.id
            ? widget.id
            : createExploreWidgetId(type),
        type,
        title:
          typeof widget.title === "string" && widget.title
            ? widget.title
            : getWidgetTitle(type),
        createdAt,
        size: isExploreWidgetSize(widget.size)
          ? widget.size
          : getDefaultWidgetSize(type),
        order:
          typeof widget.order === "number"
            ? widget.order
            : Number.MAX_SAFE_INTEGER,
        standingsLeague:
          type === "standings" &&
          isExploreStandingsLeague(widget.standingsLeague)
            ? widget.standingsLeague
            : type === "standings"
              ? "nba"
              : undefined,
      };
    })
    .filter((widget) => {
      if (widgetAllowsDuplicates(widget.type)) {
        return true;
      }

      if (seenSingleInstanceTypes.has(widget.type)) {
        return false;
      }

      seenSingleInstanceTypes.add(widget.type);
      return true;
    });

  return withSequentialOrder(normalized);
}

export function serializeExploreWidgets(widgets: ExploreWidgetConfig[]) {
  return JSON.stringify({
    version: EXPLORE_WIDGETS_SCHEMA_VERSION,
    widgets: withSequentialOrder(widgets),
  });
}

export async function loadExploreWidgetsForUser(userId: string) {
  const storedWidgets = await AsyncStorage.getItem(getExploreWidgetsKey(userId));
  return normalizeStoredWidgets(safeParseJson(storedWidgets));
}

export async function saveExploreWidgetsForUser(
  userId: string,
  widgets: ExploreWidgetConfig[],
) {
  await AsyncStorage.setItem(
    getExploreWidgetsKey(userId),
    serializeExploreWidgets(widgets),
  );
}

export async function cleanupLegacyExploreWidgetsKey() {
  await AsyncStorage.removeItem(EXPLORE_WIDGETS_LEGACY_KEY);
}
