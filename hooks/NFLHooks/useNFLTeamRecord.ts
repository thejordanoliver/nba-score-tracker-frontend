import { useEffect, useState } from "react";
import { getTeamAbbreviation } from "constants/teamsNFL";

type TeamRecord = {
  overall: string | null;
};

export function useNFLTeamRecord(teamId?: string) {
  const [record, setRecord] = useState<TeamRecord>({ overall: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    const teamAbbr = getTeamAbbreviation(teamId);
    if (!teamAbbr) {
      // No record if unknown team
      setRecord({ overall: null });
      return;
    }

    const fetchRecord = async () => {
      try {
        setLoading(true);

        const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamAbbr.toLowerCase()}`;
        const res = await fetch(url);
        if (!res.ok) {
          setRecord({ overall: null }); // fail silently
          return;
        }

        const data = await res.json();
        const recordSummary =
          data?.team?.record?.items?.find(
            (r: any) => r.type === "total" || r.name === "overall"
          )?.summary ?? null;

        setRecord({ overall: recordSummary });
      } catch {
        setRecord({ overall: null }); // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [teamId]);

  return { record, loading };
}
