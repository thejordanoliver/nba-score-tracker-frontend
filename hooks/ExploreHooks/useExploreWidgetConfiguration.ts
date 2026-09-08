import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getWidgetTitle,
  widgetAllowsDuplicates,
} from "constants/exploreWidgets";
import type {
  ExploreWidgetConfig,
  ExploreWidgetSize,
  ExploreWidgetType,
} from "types/widgets";
import {
  cleanupLegacyExploreWidgetsKey,
  createExploreWidgetId,
  loadExploreWidgetsForUser,
  saveExploreWidgetsForUser,
  withSequentialOrder,
} from "utils/exploreWidgetStorage";

const applyVisibleOrder = (widgets: ExploreWidgetConfig[]) =>
  widgets.map((widget, index) => ({ ...widget, order: index }));

export function useExploreWidgetConfiguration(userId: number | null) {
  const [widgets, setWidgets] = useState<ExploreWidgetConfig[]>([]);
  const [configurationUserId, setConfigurationUserId] = useState<number | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const loadGenerationRef = useRef(0);

  const currentWidgets = useMemo(
    () => (configurationUserId === userId ? widgets : []),
    [configurationUserId, userId, widgets],
  );
  const currentReady = configurationUserId === userId && ready;

  useEffect(() => {
    const generation = ++loadGenerationRef.current;

    setReady(false);
    setConfigurationUserId(userId);
    setWidgets([]);

    if (!userId) {
      setReady(true);
      return;
    }

    cleanupLegacyExploreWidgetsKey().catch(() => {});

    loadExploreWidgetsForUser(String(userId))
      .then((storedWidgets) => {
        if (generation !== loadGenerationRef.current) return;
        setWidgets(storedWidgets);
      })
      .catch((error: unknown) => {
        if (generation !== loadGenerationRef.current) return;
        console.error("Failed to load Explore widget configuration", error);
        setWidgets([]);
      })
      .finally(() => {
        if (generation === loadGenerationRef.current) {
          setReady(true);
        }
      });
  }, [userId]);

  useEffect(() => {
    if (!ready || !userId || configurationUserId !== userId) return;

    saveExploreWidgetsForUser(String(userId), widgets).catch((error) => {
      console.error("Failed to save Explore widget configuration", error);
    });
  }, [configurationUserId, ready, userId, widgets]);

  const addWidget = useCallback(
    (
      type: ExploreWidgetType,
      title: string,
      size: ExploreWidgetSize,
    ) => {
      setWidgets((previous) => {
        if (
          !widgetAllowsDuplicates(type) &&
          previous.some((widget) => widget.type === type)
        ) {
          return previous;
        }

        const ordered = withSequentialOrder(previous);
        return [
          ...ordered,
          {
            id: createExploreWidgetId(type),
            type,
            title: title || getWidgetTitle(type),
            createdAt: Date.now(),
            size,
            order: ordered.length,
          },
        ];
      });
    },
    [],
  );

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets((previous) =>
      withSequentialOrder(previous.filter((widget) => widget.id !== widgetId)),
    );
  }, []);

  const resizeWidget = useCallback(
    (widgetId: string, size: ExploreWidgetSize) => {
      setWidgets((previous) =>
        previous.map((widget) =>
          widget.id === widgetId ? { ...widget, size } : widget,
        ),
      );
    },
    [],
  );

  const moveWidget = useCallback((widgetId: string, direction: -1 | 1) => {
    setWidgets((previous) => {
      const ordered = withSequentialOrder(previous);
      const currentIndex = ordered.findIndex((widget) => widget.id === widgetId);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ordered.length) {
        return ordered;
      }

      const next = ordered.slice();
      [next[currentIndex], next[nextIndex]] = [
        next[nextIndex],
        next[currentIndex],
      ];

      return applyVisibleOrder(next);
    });
  }, []);

  const reorderWidgets = useCallback((nextWidgets: ExploreWidgetConfig[]) => {
    setWidgets((previous) => {
      const orderedPrevious = withSequentialOrder(previous);
      const widgetsById = new Map(
        orderedPrevious.map((widget) => [widget.id, widget]),
      );
      const seenIds = new Set<string>();
      const nextOrderedWidgets = nextWidgets.flatMap((widget) => {
        if (seenIds.has(widget.id)) return [];

        const existing = widgetsById.get(widget.id);
        if (!existing) return [];

        seenIds.add(widget.id);
        return [existing];
      });
      const missingWidgets = orderedPrevious.filter(
        (widget) => !seenIds.has(widget.id),
      );

      return applyVisibleOrder([...nextOrderedWidgets, ...missingWidgets]);
    });
  }, []);

  return {
    widgets: currentWidgets,
    ready: currentReady,
    addWidget,
    removeWidget,
    resizeWidget,
    moveWidget,
    reorderWidgets,
  };
}
