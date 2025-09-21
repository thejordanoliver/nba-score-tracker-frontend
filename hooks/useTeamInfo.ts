import axios from "axios";
import { useEffect, useState } from "react";
import { Team } from "types/types";


export function useTeamInfo(teamId?: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

useEffect(() => {
  if (!API_URL) {
    setError("Missing API URL.");
    return;
  }

  if (!teamId) return;

  const controller = new AbortController();

  const fetchTeam = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<Team>(
        `${API_URL}/api/teams/${teamId}`,
        {
          signal: controller.signal,
        }
      );

      setTeam(response.data);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      setError(
        err.response?.data?.error || "Failed to fetch team information."
      );
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  fetchTeam();

  return () => {
    controller.abort();
  };
}, [teamId, API_URL]);


  return { team, loading, error };
}
