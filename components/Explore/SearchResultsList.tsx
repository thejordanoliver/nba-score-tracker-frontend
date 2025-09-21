import { FlatList, Text, ActivityIndicator, useColorScheme } from "react-native";
import ResultItemRow from "./ResultItemRow";
import HeadingThree from "components/Headings/HeadingThree";
import { styles } from "styles/Explore.styles";
import type { ResultItem } from "types/types";

type Props = {
  data: ResultItem[];
  loading: boolean;
  error: string | null;
  onSelect: (item: ResultItem) => void;
  onDelete?: (item: ResultItem) => void;
  query: string;
};

export default function SearchResultsList({ data, loading, error, onSelect, onDelete, query }: Props) {
  const isDark = useColorScheme() === "dark";

  if (loading) return <ActivityIndicator size="large" color={isDark ? "white" : "black"} />;

  if (error) return <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{error}</Text>;

  if (!loading && data.length === 0 && query.length > 0)
    return <Text style={[styles.emptyText, isDark && styles.textDark]}>No results found.</Text>;

  return (
    <>
      {query.length === 0 && data.length > 0 && <HeadingThree>Recents</HeadingThree>}
      <FlatList
        data={data}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => <ResultItemRow item={item} onSelect={onSelect} onDelete={onDelete} query={query} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </>
  );
}
