// hooks/useAccountActions.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "expo-router";

export function useAccountActions() {
  const { deleteAccount } = useAuth();
  const router = useRouter();

  const signOut = async () => {
    try {
      await AsyncStorage.clear();
      router.replace("/login");
    } catch (err) {
      console.warn("Failed to sign out:", err);
    }
  };

  const confirmDeleteAccount = async (password: string) => {
    if (!password.trim()) throw new Error("Password required");
    try {
      await deleteAccount(password);
      router.replace("/settings/deleteaccountsplash");
    } catch (err) {
      throw new Error("Failed to delete account. Check password.");
    }
  };

  return { signOut, confirmDeleteAccount };
}
