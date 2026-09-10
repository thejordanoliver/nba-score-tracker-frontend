import HeadingTwo from "components/Headings/HeadingTwo";
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { WeatherData } from "hooks/useWeather";
import LottieView from "lottie-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ClearDay from "../../../../assets/Weather/clear-day.json";
import ClearNight from "../../../../assets/Weather/clear-night.json";
import Cloudy from "../../../../assets/Weather/cloudy.json";
import RainDay from "../../../../assets/Weather/rain-day.json";
import RainNight from "../../../../assets/Weather/rain-night.json";
import Rain from "../../../../assets/Weather/rain.json";
import TeamLocationSkeleton from "../../../Skeletons/GameDetails/GameLocationSkeleton";

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
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const textColor = lighter
    ? Colors.white
    : isDark
      ? Colors.white
      : Colors.black;

  if (
    !weather ||
    !weather.description ||
    weather.description === "Unknown" ||
    weather.main === "Unknown" ||
    weather.cityName === "Unknown"
  ) {
    return null;
  }

  const getWeatherAnimation = () => {
    if (!weather?.description) return null;
    const desc = weather.description.toLowerCase();

    // Use local time if provided, otherwise fallback to JS Date
    const localHour = weather.localTime
      ? new Date(weather.localTime).getHours()
      : new Date().getHours();

    const isNight = localHour < 6 || localHour >= 18;

    if (desc.includes("rain")) {
      return isNight ? ClearNight /* fallback */ : Rain;
    }
    if (desc.includes("cloud")) {
      return isNight ? ClearNight : Cloudy;
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
    <View>
      <HeadingTwo isDark={isDark}>Weather</HeadingTwo>

      {loading && !error ? (
        <TeamLocationSkeleton />
      ) : (
        <View style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}>
          {/* Rain background animation */}
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
                    ...StyleSheet.absoluteFill,
                    zIndex: 0,
                  }}
                  resizeMode="cover"
                />
              );
            })()}

          {/* Main weather animation */}
          {animation && (
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
                zIndex: 1,
              }}
            />
          )}

          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              zIndex: 2,
            }}
          >
            {error ? (
              <Text style={[styles.text, { color: textColor }]}>
                Error loading weather: {error}
              </Text>
            ) : (
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
                  {titleCase(weather.main ?? "")}
                </Text>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  text: {
    fontFamily: Fonts.REGULAR,
    fontSize: 20,
  },
  subText: {
    fontFamily: Fonts.REGULAR,
    fontSize: 16,
  },
  temperature: {
    fontFamily: Fonts.BOLD,
    fontSize: 28,
    textAlign: "center",
  },
  cityName: {
    fontFamily: Fonts.REGULAR,
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
