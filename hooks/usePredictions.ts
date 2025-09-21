import { useState, useEffect } from "react";
import axios from "axios";

type PredictionResponse = {
  home_team_id: number;
  away_team_id: number;
  homeWinProbability: number;
  awayWinProbability: number;
};

export function useGamePrediction(
  home_team_id: number,
  away_team_id: number,
  season: string | number
) {
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

useEffect(() => {
  async function fetchPrediction() {
    setLoading(true);
    setError(null);

  
    try {
    const response = await axios.post(`${BASE_URL}/api/predict-game`, {
  home_team_id,
  away_team_id,
  season,
});
setData(response.data);
setError(null);  // clear any previous error since success


      setData(response.data);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Unknown error";
      console.error("Prediction API error:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  if (home_team_id && away_team_id && season) {
    fetchPrediction();
  }
}, [home_team_id, away_team_id, season, BASE_URL]);

  return { data, loading, error };
}
