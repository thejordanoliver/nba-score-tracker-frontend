import { Fonts } from "constants/fonts";
import { WeatherData } from "hooks/useWeather";
import { BlurView } from "expo-blur";
import LottieView from "lottie-react-native";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import ClearDay from "../../assets/Weather/clear-day.json";
import ClearNight from "../../assets/Weather/clear-night.json";
import Cloudy from "../../assets/Weather/cloudy.json";
import RainDay from "../../assets/Weather/rain-day.json";
import RainNight from "../../assets/Weather/rain-night.json";
import Rain from "../../assets/Weather/rain.json";
import HeadingTwo from "../Headings/HeadingTwo";
import TeamLocationSkeleton from "./TeamLocationSkeleton";

type Props = {
  arenaImage?: any;
  arenaName?: string;
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  address: string;
  lighter?: boolean;
};

export const Weather: React.FC<Props> = ({
  weather,
  loading,
  error,
  lighter = false,
}) => {
  const isDark = useColorScheme() === "dark";
  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";

  const getWeatherAnimation = () => {
    if (!weather?.description) return null;
    const desc = weather.description.toLowerCase();

    // Use local time if provided, otherwise fallback to JS Date
    const localHour = weather.localTime
      ? new Date(weather.localTime).getHours()
      : new Date().getHours();

    const isNight = localHour < 6 || localHour >= 18;

    if (desc.includes("rain")) {
      return isNight
        ? ClearNight /* ⬅️ replace with RainNight asset if you have one */
        : Rain;
    }
    if (desc.includes("cloud")) {
      return isNight ? ClearNight /* ⬅️ CloudyNight if available */ : Cloudy;
    }
    if (desc.includes("clear") || desc.includes("sun")) {
      return isNight ? ClearNight : ClearDay;
    }

    return isNight ? ClearNight : ClearDay;
  };

  const titleCase = (str: string) =>
    str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const animation = getWeatherAnimation();

  return (
    <View style={{}}>
      <HeadingTwo lighter={lighter}>Weather</HeadingTwo>

      {loading && !error ? (
        <TeamLocationSkeleton />
      ) : (
        <View style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}>
          {/* Rain background Lottie */}
          {weather?.description.toLowerCase().includes("rain") &&
            (() => {
              const localHour = weather.localTime
                ? new Date(weather.localTime).getHours()
                : new Date().getHours();
              const isNight = localHour < 6 || localHour >= 18;
              const rainAnimation = isNight ? RainNight : RainDay;

              return (
                <LottieView
                  source={rainAnimation}
                  autoPlay
                  loop
                  style={{
                    width: 200,
                    height: 200,
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: [{ translateX: -100 }, { translateY: -100 }],
                    zIndex: 0, // behind the blur
                  }}
                />
              );
            })()}

          <BlurView
            intensity={30}
            tint="systemThinMaterial"
            style={StyleSheet.absoluteFill}
          />

          {/* Main weather Lottie */}
          {animation ? (
            <LottieView
              source={animation}
              autoPlay
              loop
              style={{
                width: 200,
                height: 200,
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: [{ translateX: -100 }, { translateY: -100 }],
                zIndex: 1, // above the rain background
              }}
            />
          ) : (
            <Text style={[styles.subText, { color: textColor }]}>
              Unknown Weather
            </Text>
          )}

          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              zIndex: 2, // above blur + animations
            }}
          >
            {error ? (
              <Text style={[styles.text, { color: textColor }]}>
                Error loading weather: {error}
              </Text>
            ) : weather ? (
              <>
                <Text
                  style={[
                    styles.cityName,
                    { color: textColor, ...styles.textShadow },
                  ]}
                >
                  {weather.cityName}
                </Text>

                <Text
                  style={[
                    styles.temperature,
                    { color: textColor, ...styles.textShadow },
                  ]}
                >
                  {weather?.tempFahrenheit != null
                    ? `${weather.tempFahrenheit.toFixed(0)}°F`
                    : "--"}
                </Text>

                <Text
                  style={[
                    styles.subText,
                    { color: textColor, ...styles.textShadow },
                  ]}
                >
                  {titleCase(weather.main)}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  text: {
    fontFamily: Fonts.OSREGULAR,
    fontSize: 20,
  },
  subText: {
    fontFamily: Fonts.OSREGULAR,
    fontSize: 16,
  },
  temperature: {
    fontFamily: Fonts.OSBOLD,
    fontSize: 28,
    textAlign: "center",
  },
  cityName: {
    fontFamily: Fonts.OSREGULAR,
    fontSize: 28,
    textAlign: "center",
  },
  textShadow: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
});

export default Weather;
