import axios from "axios";
import { useEffect, useState } from "react";
import sanitizeHtml from "sanitize-html";

export type NewsArticle = {
  id: string;
  title: string;
  source: string;
  author: string | null;
  description: string | null;
  url: string;
  thumbnail: string;
  publishedAt: string;
  content: string;
};

interface BackendArticle {
  source: { name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: BackendArticle[];
}

// Convert sanitized HTML to plain text
function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
}

// Sanitize and clean HTML content with sanitize-html
function sanitizeContent(rawContent: string | null): string {
  if (!rawContent) return "No content available.";

  const clean = sanitizeHtml(rawContent, {
    allowedTags: [
      "p",
      "br",
      "b",
      "i",
      "em",
      "strong",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
    ],
    allowedAttributes: {
      a: ["href", "name", "target"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    textFilter: (text) => {
      // Remove boilerplate phrases and unwanted text
      return text
        .replace(/\[\+\d+\schars\]/g, "")
        .replace(/subscribe\s+now[^\.]*\.?/gi, "")
        .replace(/advertisement/gi, "")
        .replace(/read\s+more[^\.]*\.?/gi, "")
        .replace(/support\s+our\s+journalism[^\.]*\.?/gi, "")
        .replace(/follow\s+us\s+on\s+[^\.]*\.?/gi, "")
        .replace(/this\s+article\s+originally\s+appeared\s+on[^\.]*\.?/gi, "")
        .replace(/©\s*\d{4}[^\.]*\.?/gi, "")
        .replace(/all\s+rights\s+reserved\.?/gi, "")
        .replace(/tap\s+to\s+continue/gi, "")
        .replace(/photo\s+credit[^\.]*\.?/gi, "")
        .replace(/\.\.\.\s*$/, "");
    },
  });

  return htmlToPlainText(clean);
}

export function useTeamNews(teamName: string) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const refreshNews = async () => {
    if (!teamName) {
      setArticles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<NewsApiResponse>(
        `${API_URL}/api/news/${encodeURIComponent(teamName)}`
      );

      const backendArticles = response.data.articles || [];

      const mapped: NewsArticle[] = backendArticles.map((article, index) => {
        const sanitizedContent = sanitizeContent(article.content);

        return {
          id: `${article.publishedAt}-${index}`,
          title: article.title,
          source: article.source.name,
          author: article.author,
          description: article.description,
          url: article.url,
          thumbnail: article.urlToImage ?? "",
          publishedAt: article.publishedAt,
          content: sanitizedContent,
        };
      });

      setArticles(mapped);
    } catch (err: any) {
      console.error("Failed to fetch team news:", err?.message || err);
      setError("Unable to load team news. Please try again later.");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshNews();
  }, [teamName]);

  return {
    articles,
    loading,
    error,
    refreshNews,
  };
}
