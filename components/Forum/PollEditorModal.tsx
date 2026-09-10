import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  ForumPollDraftOption,
  ForumPollEditorModalProps,
} from "types/forum";

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function makeDefaultOptions() {
  return [
    { id: makeId(), text: "" },
    { id: makeId(), text: "" },
  ];
}

export default function PollEditorModal({
  visible,
  initial,
  onClose,
  onSave,
}: ForumPollEditorModalProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = getStyles(isDark);

  const [question, setQuestion] = useState(initial?.question ?? "");
  const [options, setOptions] = useState<ForumPollDraftOption[]>(
    initial?.options ?? makeDefaultOptions(),
  );
  const [allowsMultiple, setAllowsMultiple] = useState(
    initial?.allowsMultiple ?? false,
  );

  // --- Sync initial data when reopening ---
  useEffect(() => {
    if (!visible) return;
    setQuestion(initial?.question ?? "");
    setOptions(initial?.options ?? makeDefaultOptions());
    setAllowsMultiple(initial?.allowsMultiple ?? false);
  }, [initial?.allowsMultiple, initial?.options, initial?.question, visible]);

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, { id: makeId(), text: "" }]);
  };

  const removeOption = useCallback(
    (id: string) => {
      if (options.length <= MIN_OPTIONS) return;
      setOptions((prev) => prev.filter((o) => o.id !== id));
    },
    [options.length],
  );

  const updateOption = (id: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const isValid =
    question.trim().length > 0 &&
    options.filter((o) => o.text.trim().length > 0).length >= MIN_OPTIONS;

  const handleSave = () => {
    if (!isValid) return;
    onSave({ question: question.trim(), options, allowsMultiple });
  };

  const renderOption = useCallback(
    ({
      item,
      drag,
      isActive,
      getIndex,
    }: RenderItemParams<ForumPollDraftOption>) => {
      const index = (getIndex?.() ?? 0) + 1;
      return (
        <View
          style={[styles.optionRow, isActive && { borderColor: "#007AFF" }]}
        >
          <TouchableOpacity
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              drag();
            }}
            delayLongPress={150}
            hitSlop={8}
          >
            <Ionicons
              name="reorder-two-outline"
              size={22}
              color={Colors.lightGray}
              style={{ marginRight: 8 }}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.optionInput}
            placeholder={`Option ${index}`}
            placeholderTextColor={Colors.lightGray}
            value={item.text}
            onChangeText={(t) => updateOption(item.id, t)}
            maxLength={80}
          />

          {options.length > MIN_OPTIONS && (
            <TouchableOpacity onPress={() => removeOption(item.id)} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={22}
                color={Colors.lightGray}
              />
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [options, removeOption, styles],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.container}>
        <View style={styles.wrapper}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? Colors.white : Colors.black}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Create Poll</Text>

            <TouchableOpacity
              style={styles.headerBtn}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={[styles.save, !isValid && { opacity: 0.4 }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.pollContentContainer}
          >
            {/* QUESTION */}
            <Text style={styles.sectionTitle}>Question</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.questionInput}
                placeholder="Ask a question…"
                placeholderTextColor={Colors.lightGray}
                value={question}
                onChangeText={setQuestion}
                maxLength={120}
              />
            </View>

            {/* OPTIONS */}
            <Text style={styles.sectionTitle}>
              Options ({options.length}/{MAX_OPTIONS})
            </Text>

            <DraggableFlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={renderOption}
              onDragEnd={({ data }) => setOptions(data)}
              onDragBegin={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              }
              scrollEnabled={false}
              activationDistance={10}
            />

            {options.length < MAX_OPTIONS && (
              <TouchableOpacity onPress={addOption} style={styles.addOptionBtn}>
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={isDark ? Colors.white : Colors.black}
                />
                <Text style={styles.addOptionText}>Add Option</Text>
              </TouchableOpacity>
            )}

            {/* MULTIPLE CHOICE TOGGLE */}
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.toggleCard}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.toggleLabel}>Allow Multiple Choices</Text>
                <Text style={styles.toggleSubLabel}>
                  Users can select more than one option
                </Text>
              </View>
              <Switch
                value={allowsMultiple}
                onValueChange={setAllowsMultiple}
                trackColor={{ true: "#007AFF" }}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      backgroundColor: isDark ? Colors.black : Colors.white,
      overflow: "hidden",
    },
    wrapper: {
      flex: 1,
      padding: 12,
    },
    pollContentContainer: { paddingBottom: 40 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: 20,
    },
    headerBtn: { padding: 8 },
    headerTitle: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },
    save: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },
    sectionTitle: {
      marginTop: 12,
      marginBottom: 8,
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },
    inputCard: {
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: isDark ? Colors.white : Colors.black,
      borderRadius: 10,
    },
    questionInput: {
      paddingVertical: 10,
      fontFamily: Fonts.REGULAR,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: isDark ? Colors.white : Colors.black,
      borderRadius: 10,
    },
    optionInput: {
      flex: 1,
      paddingVertical: 10,
      fontFamily: Fonts.REGULAR,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    addOptionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
      paddingVertical: 10,
    },
    addOptionText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    toggleCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? Colors.white : Colors.black,
      borderRadius: 10,
    },
    toggleLabel: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    toggleSubLabel: {
      marginTop: 2,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: Colors.lightGray,
    },
  });
}
