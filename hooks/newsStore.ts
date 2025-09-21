// hooks/newsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { NewsItem } from "./useNews";

const NEWS_CACHE_KEY = "cached_news";

type NewsStore = {
  articles: NewsItem[];
  setArticles: (news: NewsItem[]) => void;
  getArticleById: (id: string) => NewsItem | undefined;
  loadCachedArticles: () => Promise<void>;
};

export const useNewsStore = create<NewsStore>((set, get) => ({
  articles: [],

  setArticles: (news: NewsItem[]) => {
    set({ articles: news });
    AsyncStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(news)).catch(console.error);
  },

  getArticleById: (id: string) => {
    const { articles } = get();
    
    return articles.find((item) => item.id === id);
  },

  loadCachedArticles: async () => {
    try {
      const cached = await AsyncStorage.getItem(NEWS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        set({ articles: parsed });
      }
    } catch (err) {
      console.error("Failed to load cached news:", err);
    }
  },
}));
