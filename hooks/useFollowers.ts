import { useEffect, useState } from "react";

export type User = {
  id: number | string;
  username: string;
  profile_image: string;
  full_name: string; // ✅ add this
  banner_image: string; // ✅ add this
  bio?: string | null;
  favorites?: string[];
  followers_count?: number;
  isFollowing: boolean;
};


export function useFollowers(
  currentUserId: string,
  targetUserId: string,
  type: "followers" | "following"
) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUserId) {
      console.log("[useFollowers] No targetUserId provided, skipping fetch");
      return;
    }

    console.log(`[useFollowers] Fetching ${type} for user:`, targetUserId);

    setLoading(true);
    setError(null);

    fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/follows/${Number(targetUserId)}/${type}`)
      .then((res) => {
        console.log(`[useFollowers] Response status: ${res.status}`);
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data: User[]) => {
        console.log("[useFollowers] Fetched users:", data);
        setUsers(data);
      })
      .catch((err) => {
        console.error("[useFollowers] Error fetching users:", err);
        setError(err.message || "Error fetching users");
      })
      .finally(() => {
        console.log("[useFollowers] Fetch completed");
        setLoading(false);
      });
  }, [targetUserId, type]);

const toggleFollow = async (followeeId: string) => {
  if (followeeId === currentUserId) {
    console.warn("[useFollowers] Attempted to follow self, ignoring.");
    return;
  }

  console.log("[useFollowers] Toggling follow for:", followeeId);

  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/follows/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followerId: currentUserId,
        followeeId: Number(followeeId),
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to toggle follow");
    }

    const data = await res.json();

   setUsers((prevUsers) =>
  prevUsers.map((user) =>
    user.id.toString() === followeeId.toString() ? { ...user, isFollowing: data.isFollowing } : user
  )
);

  } catch (err) {
    console.error("[useFollowers] Toggle follow failed:", err);
  }
};


  return { users, loading, error, toggleFollow };
}
