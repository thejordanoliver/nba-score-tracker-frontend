// hooks/useCombinedNewsAndHighlights.ts
import * as React from "react";

export function useCombinedNewsAndHighlights(news: any[], highlights: any[]) {
  return React.useMemo(() => {
    const taggedNews = news.map((item) => ({
      ...item,
      itemType: "news" as const,
      publishedAt: item.publishedAt ?? item.date ?? new Date().toISOString(),
    }));

    const taggedHighlights = highlights.map((item) => ({
      ...item,
      itemType: "highlight" as const,
      publishedAt: item.publishedAt ?? new Date().toISOString(),
    }));

    const combined = [...taggedNews, ...taggedHighlights];

    combined.sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    });

    return combined;
  }, [news, highlights]);
}
