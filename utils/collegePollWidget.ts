import type {
  ExploreCollegePollLeague,
  ExploreCollegePollType,
} from "types/widgets";

export type CollegePollOption = {
  label: string;
  shortLabel: string;
  value: ExploreCollegePollType;
};

const CFB_POLL_OPTIONS: readonly CollegePollOption[] = [
  { label: "AP Poll", shortLabel: "AP", value: "ap" },
  { label: "Coaches Poll", shortLabel: "Coaches", value: "coaches" },
  { label: "CFP Rankings", shortLabel: "CFP", value: "cfp" },
  { label: "FCS Coaches Poll", shortLabel: "FCS", value: "fcs" },
];

const CBB_POLL_OPTIONS: readonly CollegePollOption[] = [
  { label: "AP Poll", shortLabel: "AP", value: "ap" },
  { label: "Coaches Poll", shortLabel: "Coaches", value: "coaches" },
];

export function getCollegePollOptions(
  league: ExploreCollegePollLeague,
): readonly CollegePollOption[] {
  return league === "cfb" ? CFB_POLL_OPTIONS : CBB_POLL_OPTIONS;
}

export function isCollegePollTypeAvailable(
  league: ExploreCollegePollLeague,
  pollType: ExploreCollegePollType,
) {
  return getCollegePollOptions(league).some(
    (option) => option.value === pollType,
  );
}

export function normalizeCollegePollType(
  league: ExploreCollegePollLeague,
  pollType: ExploreCollegePollType | undefined,
): ExploreCollegePollType {
  return pollType && isCollegePollTypeAvailable(league, pollType)
    ? pollType
    : "ap";
}

export function getCollegePollLabel(
  league: ExploreCollegePollLeague,
  pollType: ExploreCollegePollType,
) {
  return (
    getCollegePollOptions(league).find((option) => option.value === pollType)
      ?.label ?? "AP Poll"
  );
}

export function getCollegePollPreviewLimit(height: number, compact = false) {
  const reservedHeight = compact ? 82 : 108;
  return Math.max(3, Math.min(10, Math.floor((height - reservedHeight) / 30)));
}
