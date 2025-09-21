import axios from "axios";
import { useEffect, useState } from "react";
import { useNewsStore } from "./newsStore";

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  thumbnail: string;
  content: string;
  publishedAt?: string;
  date?: string;
};

function htmlToPlainText(html: string | null): string {
  if (!html) return "Content not available";
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
}

function formatContent(rawContent: string): string {
  if (!rawContent) return "No content available.";

  let formatted = rawContent
    .replace(/<img[^>]*>/gi, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/image:\s*https?:\/\/\S+/gi, "")
    .replace(/https?:\/\/\S+\.(jpg|jpeg|png|gif)/gi, "")
    .replace(/\[\+\d+\schars\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\.(\s|$)/g, ". ")
    .replace(/,(?=\S)/g, ", ")
    .replace(/\?(?=\S)/g, "? ")
    .replace(/!(?=\S)/g, "! ")
    .replace(/\s{2,}/g, " ");

  const boilerplatePatterns = [
    /…?\s*\[\+\d+\schars\]/g,
    /subscribe\s+now[^\.]*\.?/gi,
    /read\s+more[^\.]*\.?/gi,
    /support\s+our\s+journalism[^\.]*\.?/gi,
    /follow\s+us\s+on\s+[^\.]*\.?/gi,
    /this\s+article\s+originally\s+appeared\s+on[^\.]*\.?/gi,
    /©\s*\d{4}[^\.]*\.?/gi,
    /all\s+rights\s+reserved\.?/gi,
    /advertisement/gi,
    /tap\s+to\s+continue/gi,
    /photo\s+credit[^\.]*\.?/gi,
    /\.\.\.\s*$/,
    /[\u2026…]?\s*\[\+\d+\schars\]/g,
  ];

  for (const pattern of boilerplatePatterns) {
    formatted = formatted.replace(pattern, "");
  }

  formatted = formatted.replace(/(\r\n|\r|\n){2,}/g, "\n\n");

  const paragraphs = formatted
    .split("\n\n")
    .map((p) =>
      p
        .trim()
        .replace(/\s+/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())
    )
    .filter(Boolean);

  return paragraphs.join("\n\n");
}

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setArticles, loadCachedArticles, articles } = useNewsStore.getState();

  // Helper to normalize source name (string or object)
  function getSourceName(source: string | { name: string }): string {
    if (!source) return "Unknown";
    if (typeof source === "string") return source;
    if (typeof source === "object" && "name" in source) return source.name;
    return "Unknown";
  }

  const refreshNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not defined");

      // 1. Fetch Guardian articles first (your backend route)
      const guardianResp = await axios.get(`${API_URL}/api/news/guardian`);

      // 2. Fetch general news if needed (or merge regardless)
      const generalResp = await axios.get(`${API_URL}/api/news`);

      // 3. Combine both results with Guardian articles first
      const combinedArticlesRaw = [
        ...(guardianResp.data.articles || []),
        ...(generalResp.data.articles || []),
      ];

      // 4. Map and format combined articles
      const formatted: NewsItem[] = combinedArticlesRaw.map((article: any, index: number) => {
        const rawContent = article.content || article.description || "";

        const plainContent = htmlToPlainText(rawContent);
        const content = formatContent(plainContent);

        return {
          id: `${article.publishedAt || article.date || "unknown"}-${index}`,
          title: article.title,
          source: getSourceName(article.source),
          url: article.url,
          thumbnail: article.urlToImage || article.thumbnail || "",
          content,
          publishedAt: article.publishedAt || article.date,
          date: article.publishedAt || article.date,
        };
      });

      setArticles(formatted);
      setNews(formatted);
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError("Failed to fetch news.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadCachedArticles();
      const cached = useNewsStore.getState().articles;
      if (cached.length > 0) {
        setNews(cached);
        setLoading(false);
      }
      refreshNews();
    })();
  }, []);

  return { news, loading, error, refreshNews };
}
