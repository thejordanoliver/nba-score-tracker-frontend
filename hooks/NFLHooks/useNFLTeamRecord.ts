import { useEffect, useState } from "react";
import { getTeamAbbreviation } from "constants/teamsNFL";

type TeamRecord = {
  overall: string | null;
};

export function useNFLTeamRecord(teamId?: string) {
  const [record, setRecord] = useState<TeamRecord>({ overall: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const teamAbbr = getTeamAbbreviation(teamId);
    if (!teamAbbr) {
      console.warn("⚠️ No abbreviation found for teamId:", teamId);
      setRecord({ overall: null });
      return;
    }

    const fetchRecord = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamAbbr.toLowerCase()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch team record");

        const data = await res.json();
        const recordSummary =
          data?.team?.record?.items?.find(
            (r: any) => r.type === "total" || r.name === "overall"
          )?.summary ?? null;

        setRecord({ overall: recordSummary });
      } catch (err: any) {
        console.error("❌ Error fetching team record:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [teamId]);

  return { record, loading, error };
}
