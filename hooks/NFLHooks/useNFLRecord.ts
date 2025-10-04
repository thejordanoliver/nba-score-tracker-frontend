// hooks/useNFLStandings.ts
import { useEffect, useState } from "react";
import axios from "axios";

type TeamRecord = {
  id: number;
  code: string;   // 👈 added
  name: string;
  logo: string;
  conference: string;
  division: string;
  position: number;
  won: number;
  lost: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  homeRecord: string;
  roadRecord: string;
  conferenceRecord: string;
  divisionRecord: string;
  streak: string;
};


const BASE_URL = process.env.EXPO_PUBLIC_API_URL;



export function useNFLStandings(season = "2025", league = "1") {
  const [standings, setStandings] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStandings() {
      try {
        setLoading(true);
        const res = await axios.get(
          `${BASE_URL}/api/nfl/standingsNFL`,
          {
            params: { season, league },
          }
        );

        if (!isMounted) return;

      const data: TeamRecord[] = res.data.response.map((item: any) => ({
  id: item.team.id,
  code: item.team.code,   // 👈 add this line
  name: item.team.name,
  logo: item.team.logo,
  conference: item.conference,
  division: item.division,
  position: item.position,
  won: item.won,
  lost: item.lost,
  ties: item.ties,
  pointsFor: item.points.for,
  pointsAgainst: item.points.against,
  pointDifference: item.points.difference,
  homeRecord: item.records.home,
  roadRecord: item.records.road,
  conferenceRecord: item.records.conference,
  divisionRecord: item.records.division,
  streak: item.streak,
}));


        setStandings(data);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Error fetching NFL standings:", err.message);
        setError(err.message || "Failed to fetch standings");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStandings();

    return () => {
      isMounted = false;
    };
  }, [season, league]);

  return { standings, loading, error };
}
