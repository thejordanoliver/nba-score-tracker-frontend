import { Ionicons } from "@expo/vector-icons";
import type {
  ExploreWidgetConfig,
  ExploreWidgetSize,
  ExploreWidgetType,
} from "types/widgets";

type ExploreWidgetRegistryEntry = {
  title: string;
  description: string;
  badge?: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultSize: ExploreWidgetSize;
  sizes: readonly ExploreWidgetSize[];
  emptyCopy: string;
  allowDuplicates?: boolean;
};

export type ExploreWidgetOption = ExploreWidgetRegistryEntry & {
  type: ExploreWidgetType;
};

export const EXPLORE_WIDGET_SIZES = [
  "small",
  "medium",
  "large",
] as const satisfies readonly ExploreWidgetSize[];

export const EXPLORE_WIDGET_REGISTRY: Record<
  ExploreWidgetType,
  ExploreWidgetRegistryEntry
> = {
  nba_games: {
    title: "NBA Games",
    description: "Track recent and upcoming games for favorite NBA teams.",
    badge: "NBA",
    icon: "basketball-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite NBA teams to see their games here.",
  },
  nfl_games: {
    title: "NFL Games",
    description: "Follow football matchups for your NFL favorites.",
    badge: "NFL",
    icon: "american-football-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite NFL teams to see their games here.",
  },
  mlb_games: {
    title: "MLB Games",
    description: "Keep baseball scores close on Explore.",
    badge: "MLB",
    icon: "baseball-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite MLB teams to see their games here.",
  },
  nhl_games: {
    title: "NHL Games",
    description: "Track hockey game cards from your NHL favorites.",
    badge: "NHL",
    icon: "ice-cream-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite NHL teams to see their games here.",
  },
  wnba_games: {
    title: "WNBA Games",
    description: "Follow WNBA games for selected teams.",
    badge: "WNBA",
    icon: "basketball-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite WNBA teams to see their games here.",
  },
  cbb_games: {
    title: "CBB Games",
    description: "Track men's college basketball team games.",
    badge: "CBB",
    icon: "school-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite CBB teams to see their games here.",
  },
  wcbb_games: {
    title: "WCBB Games",
    description: "Track women's college basketball team games.",
    badge: "WCBB",
    icon: "school-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite WCBB teams to see their games here.",
  },
  cfb_games: {
    title: "CFB Games",
    description: "Follow college football games from favorite teams.",
    badge: "CFB",
    icon: "american-football-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite CFB teams to see their games here.",
  },
  favorite_games: {
    title: "Favorite Games",
    description: "Combine all favorite-team games into one slider.",
    badge: "Games",
    icon: "albums-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite teams to see all of their games in one slider.",
  },
  favorite_teams: {
    title: "Favorite Teams",
    description: "Quick access to your saved teams and leagues.",
    badge: "Teams",
    icon: "star-outline",
    defaultSize: "medium",
    sizes: EXPLORE_WIDGET_SIZES,
    emptyCopy: "Add favorite teams to show shortcuts here.",
  },
  create_post: {
    title: "Create Post",
    description: "Start a new conversation with the Tempo community.",
    badge: "Community",
    icon: "create-outline",
    defaultSize: "small",
    sizes: ["small"],
    emptyCopy: "Create a post and join the conversation.",
  },
};

export const EXPLORE_WIDGET_TYPES = Object.keys(
  EXPLORE_WIDGET_REGISTRY,
) as ExploreWidgetType[];

export const EXPLORE_WIDGET_OPTIONS: ExploreWidgetOption[] =
  EXPLORE_WIDGET_TYPES.map((type) => ({
    type,
    ...EXPLORE_WIDGET_REGISTRY[type],
  }));

export const EXPLORE_WIDGET_EMPTY_COPY: Record<ExploreWidgetType, string> =
  EXPLORE_WIDGET_TYPES.reduce(
    (copy, type) => ({
      ...copy,
      [type]: EXPLORE_WIDGET_REGISTRY[type].emptyCopy,
    }),
    {} as Record<ExploreWidgetType, string>,
  );

export const EXPLORE_GAME_WIDGET_TYPES = [
  "favorite_games",
  "nba_games",
  "nfl_games",
  "mlb_games",
  "nhl_games",
  "wnba_games",
  "cbb_games",
  "wcbb_games",
  "cfb_games",
] as const satisfies readonly ExploreWidgetType[];

export type ExploreGameWidgetType = (typeof EXPLORE_GAME_WIDGET_TYPES)[number];

const widgetTypeSet = new Set<string>(EXPLORE_WIDGET_TYPES);
const widgetSizeSet = new Set<string>(EXPLORE_WIDGET_SIZES);

export function isExploreWidgetType(
  value: unknown,
): value is ExploreWidgetType {
  return typeof value === "string" && widgetTypeSet.has(value);
}

export function isExploreWidgetSize(
  value: unknown,
): value is ExploreWidgetSize {
  return typeof value === "string" && widgetSizeSet.has(value);
}

export function getDefaultWidgetSize(
  type: ExploreWidgetType,
): ExploreWidgetSize {
  return EXPLORE_WIDGET_REGISTRY[type].defaultSize;
}

export function getWidgetOption(type: ExploreWidgetType) {
  return EXPLORE_WIDGET_REGISTRY[type]
    ? ({ type, ...EXPLORE_WIDGET_REGISTRY[type] } satisfies ExploreWidgetOption)
    : undefined;
}

export function widgetAllowsDuplicates(type: ExploreWidgetType) {
  return EXPLORE_WIDGET_REGISTRY[type].allowDuplicates === true;
}

export function getWidgetTitle(type: ExploreWidgetType) {
  return EXPLORE_WIDGET_REGISTRY[type].title;
}

export function getWidgetSizeOptions(type: ExploreWidgetType) {
  return EXPLORE_WIDGET_REGISTRY[type].sizes;
}

export function isGameWidgetType(
  type: ExploreWidgetConfig["type"],
): type is ExploreGameWidgetType {
  return (EXPLORE_GAME_WIDGET_TYPES as readonly string[]).includes(type);
}
