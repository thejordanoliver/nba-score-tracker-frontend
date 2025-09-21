import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import {
  Appearance,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
  Text,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import Modal from "react-native-modal";
import { Fonts } from "../constants/fonts";
import dayjs from "dayjs";

LocaleConfig.locales["custom"] = {
  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],
  monthNamesShort: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ],
  dayNames: [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ],
  dayNamesShort: ["S", "M", "T", "W", "T", "F", "S"],
  today: "Today",
};

LocaleConfig.defaultLocale = "custom";

type CalendarDay = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  markedDates: { [key: string]: any };
};

export default function CalendarModal({
  visible,
  onClose,
  onSelectDate,
  markedDates,
}: Props) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === "dark");
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [calendarKey, setCalendarKey] = useState(0); // force re-render to update `initialDate`

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === "dark");
    });
    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (visible) {
      setCalendarKey(prev => prev + 1); // re-render calendar on modal open
    }
  }, [visible]);

  const goToToday = () => {
    const today = dayjs().format("YYYY-MM-DD");
    setSelectedDate(today);
    setCalendarKey(prev => prev + 1); // force re-render with today
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      backdropOpacity={0.5}
      style={styles.modal}
      useNativeDriver={true}
    >
      <BlurView
        intensity={100}
        tint={isDark ? "dark" : "light"}
        style={styles.blurContainer}
      >
        <View style={styles.calendarWrapper}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons
              name="close"
              size={28}
              color={isDark ? "#fff" : "#1d1d1d"}
            />
          </TouchableOpacity>

          {/* Today Button */}
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Ionicons
              name="calendar"
              size={18}
              color={isDark ? "#fff" : "#1d1d1d"}
              style={{ marginRight: 6 }}
            />
            <Text style={{ color: isDark ? "#fff" : "#1d1d1d", fontFamily: Fonts.OSBOLD }}>
              Today
            </Text>
          </TouchableOpacity>

          {/* Calendar */}
         <Calendar
  key={calendarKey}
  current={selectedDate}
  markedDates={{
    ...markedDates,
    [selectedDate]: {
      customStyles: {
        container: {
          backgroundColor: "transparent",
        },
        text: {
          color: "green",
          fontFamily: Fonts.OSBOLD,
        },
      },
    },
  }}
  markingType="custom"
  onDayPress={(day: CalendarDay) => {
    setSelectedDate(day.dateString);
    onSelectDate(day.dateString);
    onClose();
  }}
  enableSwipeMonths={true}
  disableMonthChange={false}
  theme={{
    backgroundColor: "transparent",
    calendarBackground: "transparent",
    textSectionTitleColor: isDark ? "white" : "#444",
    todayTextColor: isDark ? "#ff7675" : "red",
    dayTextColor: isDark ? "#fff" : "#1d1d1d",
    textDisabledColor: isDark ? "#555" : "#ccc",
    dotColor: isDark ? "#fff" : "#1d1d1d",
    selectedDotColor: isDark ? "#1d1d1d" : "#fff",
    monthTextColor: isDark ? "#fff" : "#1d1d1d",
    arrowColor: isDark ? "#fff" : "#1d1d1d",
    textDayFontFamily: Fonts.OSBOLD,
    textMonthFontFamily: Fonts.OSBOLD,
    textDayHeaderFontFamily: Fonts.OSBOLD,
    textMonthFontSize: 24,
    textDayFontSize: 20,
    textDayHeaderFontSize: 18,
  }}
/>

        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  blurContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    paddingTop: 100,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  calendarWrapper: {
    borderRadius: 20,
    padding: 20,
    width: "100%",
    height: 500,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
    padding: 5,
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(120,120,120,0.15)",
  },
});
