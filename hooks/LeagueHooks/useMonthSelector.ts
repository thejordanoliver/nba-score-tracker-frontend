import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScheduleMonthKey, ScheduleMonthOption } from "types/schedule";
import {
  resolveScheduleMonthSelection,
  type ScheduleMonthSelection,
} from "utils/teamSchedule";

type UseTeamMonthSelectorParams = {
  months: ScheduleMonthOption[];
  scheduleIdentity: string;
};

export function useTeamMonthSelector({
  months,
  scheduleIdentity,
}: UseTeamMonthSelectorParams) {
  const [selection, setSelection] = useState<ScheduleMonthSelection>({
    scheduleIdentity,
    selectedMonthKey: null,
  });

  const resolvedSelection = useMemo(
    () =>
      resolveScheduleMonthSelection(selection, scheduleIdentity, months),
    [months, scheduleIdentity, selection],
  );

  useEffect(() => {
    if (
      selection.scheduleIdentity === resolvedSelection.scheduleIdentity &&
      selection.selectedMonthKey === resolvedSelection.selectedMonthKey
    ) {
      return;
    }

    setSelection(resolvedSelection);
  }, [resolvedSelection, selection]);

  const selectMonth = useCallback(
    (selectedMonthKey: ScheduleMonthKey) => {
      if (!months.some((month) => month.key === selectedMonthKey)) return;

      setSelection({
        scheduleIdentity,
        selectedMonthKey,
      });
    },
    [months, scheduleIdentity],
  );

  return {
    selectedMonthKey: resolvedSelection.selectedMonthKey,
    selectMonth,
  };
}
