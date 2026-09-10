import { Dropdown } from "components/Dropdown";
import { Colors } from "constants/styles";
import { StyleSheet, View } from "react-native";
import HeadingTwo from "./Heading";

type DropdownOption = {
  label: string;
  value: string;
};

type HeadingWithDropdownsProps = {
  title: string;
  dropdowns?: {
    options: DropdownOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
  }[];
  isDark: boolean;
};

export default function HeadingWithDropdowns({
  title,
  dropdowns = [],
  isDark,
}: HeadingWithDropdownsProps) {
  return (
    <View style={styles.container}>
      <HeadingTwo style={styles.heading} isDark={isDark}>
        {title}
      </HeadingTwo>

      {dropdowns.length > 0 && (
        <View style={styles.dropdownRow}>
          {dropdowns.slice(0, 2).map((d, i) => (
            <Dropdown
              key={i}
              options={d.options}
              selectedValue={d.selectedValue}
              onSelect={d.onSelect}
              isDark={isDark}
              style={i === 1 ? { marginLeft: 8 } : undefined}
              absolute={false}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.midTone,
  },
  heading: {
    flexShrink: 1,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
