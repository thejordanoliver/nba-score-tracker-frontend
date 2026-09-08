export type ScheduleMonthKey = string;

export type ScheduleMonthOption = {
  key: ScheduleMonthKey;
  label: string;
  count: number;
};

export type ScheduleMonthGroup<TGame> = {
  key: string;
  label: string;
  year: number | null;
  month: number | null;
  games: TGame[];
};
