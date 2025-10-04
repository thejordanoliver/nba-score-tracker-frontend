// hooks/useNFLStandings.ts
import axios from "axios";
import { useEffect, useState } from "react";

export type NFLTeamRankings = {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  conference: string;
  division: string;
  vsDiv: string;
  vsConf: string;
  home: string;
  road: string;
  wins: string;
  losses: string;
  ties: string;
  winPct: string;
  pointsFor: string;
  pointsAgainst: string;
  streak: string;
  seed: string | null;
  
};

export type NFLStandingsResponse = {
  fullViewLink: string | null;
  teams: NFLTeamRankings[];
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const useNFLStandings = () => {
  const [standings, setStandings] = useState<NFLTeamRankings[]>([]);
  const [fullViewLink, setFullViewLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = async () => {
    // console.log("Fetching NFL standings...");
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/api/standingsNFL`);

      // console.log("Raw API response:", data);

      // Handle direct array
      const teamsArray = Array.isArray(data) ? data : data.teams || [];

      if (teamsArray.length > 0) {
        // console.log("Number of teams fetched:", teamsArray.length);
        setStandings(teamsArray);
      } else {
        console.warn("No teams found in API response");
        setStandings([]);
      }

      setFullViewLink(data.fullViewLink || null);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch NFL standings:", err);
      setError(err.message || "Something went wrong");
      setStandings([]);
    } finally {
      setLoading(false);
      // console.log("Finished fetching NFL standings. Loading:", false);
    }
  };

  
  useEffect(() => {
    fetchStandings();
  }, []);

  return { standings, fullViewLink, loading, error, refetch: fetchStandings };
};
