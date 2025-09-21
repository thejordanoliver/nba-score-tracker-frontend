import { useState, useEffect } from "react";
import axios from "axios";
import { Team } from "types/types";


  const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true);
        const response = await axios.get<Team[]>(`${API_URL}/api/teams`); // updated URL here
        setTeams(response.data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  return { teams, loading, error };
}
