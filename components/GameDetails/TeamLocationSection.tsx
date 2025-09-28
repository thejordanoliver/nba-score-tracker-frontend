import { Fonts } from "constants/fonts";
import { WeatherData } from "hooks/useWeather";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import HeadingTwo from "../Headings/HeadingTwo";
import TeamLocationSkeleton from "./TeamLocationSkeleton";

type Props = {
  arenaImage?: any;
  arenaName?: string;
  location?: string;
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  address: string;
  arenaCapacity: string;
  lighter?: boolean; // <-- new prop
};

const TeamLocationSection: React.FC<Props> = ({
  arenaImage,
  arenaName,
  location,
  address,
  arenaCapacity,
  weather,
  loading,
  error,
  lighter = false, // default false
}) => {
  const isDark = useColorScheme() === "dark";
  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";

  const openInMaps = async () => {
    if (!address) return;
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${encodedAddress}`,
      android: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    });

    if (!url) return;

    Alert.alert(
      "Open in Maps?",
      `Do you want to open this location in your Maps app?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open",
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                await Linking.openURL(url);
              } else {
                console.warn("Maps app is not available.");
              }
            } catch (err) {
              console.error("Failed to open maps:", err);
            }
          },
        },
      ]
    );
  };

  const titleCase = (str: string) =>
    str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");


  return (
    <View style={{ marginTop: 20 }}>
      <HeadingTwo style={{ marginBottom: 12 }} lighter={lighter}>Location</HeadingTwo>

      {loading && !error ? (
        <TeamLocationSkeleton />
      ) : (
        <View style={styles.container}>
          <Image
            source={arenaImage}
            style={styles.arenaImage}
            resizeMode="cover"
          />

          <View style={styles.textContainer}>
            {location && (
              <Text style={[styles.arenaTitle, { color: textColor }]}>
                {arenaName}
              </Text>
            )}
          </View>

          <View style={styles.addressContainer}>
            <Ionicons name="location" size={20} color={textColor} />
            {location && (
              <TouchableOpacity onPress={openInMaps}>
                <Text
                  style={[
                    styles.subText,
                    {
                      color: textColor,
                      marginLeft: 8,
                    },
                  ]}
                >
                  {address}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.addressContainer}>
            <Ionicons name="person" size={20} color={textColor} />
            {location && (
              <Text
                style={[styles.subText, { color: textColor, marginLeft: 8 }]}
              >
                Capacity: {arenaCapacity || "N/A"}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  arenaImage: { width: "100%", height: 200, borderRadius: 8 },
  text: {
    fontFamily: Fonts.OSREGULAR,
    fontSize: 20,
  },
  subText: {
    fontFamily: Fonts.OSREGULAR,
    fontSize: 16,
    opacity: 0.5,
  },
  arenaTitle: {
    fontFamily: Fonts.OSBOLD,
    fontSize: 24,
    paddingTop: 8,
  },
  icon: {
    width: 54,
    height: 54,
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    width: 380,
  },
});

export default TeamLocationSection;
