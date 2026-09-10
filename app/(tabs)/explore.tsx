import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { View } from "react-native";
import { CustomHeader } from "../../components/CustomHeader";
import AddWidgetModal from "../../components/Explore/AddWidgetModal";
import ExploreWidgetDashboard from "../../components/Explore/ExploreWidgetDashboard";
import SearchResultsList from "../../components/Explore/SearchResultsList";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useExplore } from "../../hooks/ExploreHooks/useExplore";
import { useExploreSearchState } from "../../hooks/ExploreHooks/useExploreSearchState";
import { useExploreWidgets } from "../../hooks/ExploreHooks/useExploreWidgets";
import { exploreStyles } from "../../styles/ExploreStyles/ExploreStyles";
import type { ResultItem } from "../../types/explore";
import { getExploreRouteForResult } from "../../utils/exploreNavigation";

export default function ExplorePage() {
  const [widgetModalVisible, setWidgetModalVisible] = useState(false);
  const [widgetsEditing, setWidgetsEditing] = useState(false);

  const navigation = useNavigation();
  const router = useRouter();

  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = exploreStyles(isDark);

  const {
    query,
    setQuery,
    results,
    recentSearches,
    loading,
    error,
    isSearching,
    setSearchScope,
    setExpandedSearch,
    canExpandResults,
    saveToRecentSearches,
    deleteRecentSearch,
  } = useExplore();

  const {
    widgets,
    widgetsReady,
    games: widgetGames,
    loading: widgetsLoading,
    refreshing: widgetsRefreshing,
    error: widgetsError,
    addWidget,
    removeWidget,
    resizeWidget,
    setStandingsLeague,
    setCollegePollSelection,
    moveWidget,
    reorderWidgets,
    ensureWidgetData,
    refreshWidgetData,
  } = useExploreWidgets();

  useFocusEffect(
    useCallback(() => {
      void ensureWidgetData();
    }, [ensureWidgetData]),
  );

  const {
    searchVisible,
    selectedTab,
    selectedScope,
    showAll,
    tabs,
    searchResultsData,
    toggleSearch,
    handleChangeText,
    handleTabPress,
    handleSeeAll,
  } = useExploreSearchState({
    query,
    setQuery,
    results,
    recentSearches,
  });

  useEffect(() => {
    setSearchScope(selectedScope);
  }, [selectedScope, setSearchScope]);

  useEffect(() => {
    setExpandedSearch(showAll);
  }, [setExpandedSearch, showAll]);

  const handleSelectItem = useCallback(
    (item: ResultItem) => {
      saveToRecentSearches(item);
      router.push(getExploreRouteForResult(item) as any);
    },
    [router, saveToRecentSearches],
  );

  const openWidgetModal = useCallback(() => {
    setWidgetModalVisible(true);
  }, []);

  const closeWidgetModal = useCallback(() => {
    setWidgetModalVisible(false);
  }, []);

  const toggleWidgetEditing = useCallback(() => {
    setWidgetsEditing((current) => !current);
  }, []);

  const beginWidgetEditing = useCallback(() => {
    setWidgetsEditing(true);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName="Explore"
          title="Explore"
          onSearchToggle={toggleSearch}
          onAddWidget={searchVisible ? undefined : openWidgetModal}
          onToggleWidgetEditing={
            searchVisible || widgets.length === 0
              ? undefined
              : toggleWidgetEditing
          }
          isWidgetEditing={widgetsEditing}
        />
      ),
    });
  }, [
    navigation,
    openWidgetModal,
    searchVisible,
    toggleSearch,
    toggleWidgetEditing,
    widgets.length,
    widgetsEditing,
  ]);

  return (
    <View style={styles.container}>
      {!searchVisible ? (
        <ExploreWidgetDashboard
          isDark={isDark}
          selectedWidgets={widgets}
          widgetsReady={widgetsReady}
          games={widgetGames}
          loading={widgetsLoading}
          refreshing={widgetsRefreshing}
          error={widgetsError}
          onRefresh={refreshWidgetData}
          onAddWidget={openWidgetModal}
          onRemoveWidget={removeWidget}
          onResizeWidget={resizeWidget}
          onSetStandingsLeague={setStandingsLeague}
          onSetCollegePollSelection={setCollegePollSelection}
          onMoveWidget={moveWidget}
          onReorderWidgets={reorderWidgets}
          isEditing={widgetsEditing}
          onBeginEditing={beginWidgetEditing}
        />
      ) : (
        <SearchResultsList
          data={searchResultsData}
          loading={loading}
          error={error}
          onSelect={handleSelectItem}
          onDelete={deleteRecentSearch}
          query={query}
          onSeeAll={handleSeeAll}
          showAll={showAll}
          canExpandResults={canExpandResults}
          isSearching={isSearching}
          selectedTab={selectedTab}
          tabs={tabs}
          handleChangeText={handleChangeText}
          handleTabPress={handleTabPress}
          searchVisible={searchVisible}
        />
      )}

      <AddWidgetModal
        visible={widgetModalVisible}
        isDark={isDark}
        selectedWidgets={widgets}
        onClose={closeWidgetModal}
        onAddWidget={addWidget}
      />
    </View>
  );
}
