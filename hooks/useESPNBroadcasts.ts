// hooks/useESPNBroadcasts.ts
import axios from "axios";
import { useEffect, useState } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export function useESPNBroadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/espn/broadcasts`) // update to your API base
      .then((res) => setBroadcasts(res.data.broadcasts))
      .catch((err) => console.error("Failed to fetch broadcasts", err))
      .finally(() => setLoading(false));
  }, []);

  return { broadcasts, loading };
}
