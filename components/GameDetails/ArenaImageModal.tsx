import React, { useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Modal from "react-native-modal";
import { Fonts } from "constants/fonts";
import { WeatherData } from "hooks/useWeather";
import { Image } from "expo-image";
const screenWidth = Dimensions.get("window").width;

type Props = {
  isVisible: boolean;
  onClose: () => void;
  arenaImage: any;
  arenaName?: string;
  weather: WeatherData | null;
};

const ArenaImageModal: React.FC<Props> = ({
  isVisible,
  onClose,
  arenaImage,
  arenaName,
  weather,
}) => {
  const isDark = useColorScheme() === "dark";

  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  return (
    <Modal
      isVisible={isVisible}
      backdropTransitionOutTiming={0}
      animationIn="fadeIn"
      animationOut="fadeOut"
      backdropOpacity={0}
      onBackdropPress={onClose}
      style={{ margin: 0, justifyContent: "center", alignItems: "center" }}
      useNativeDriver
    >
      <BlurView intensity={100} tint="systemUltraThinMaterial" style={StyleSheet.absoluteFill} />

      <TouchableOpacity onPress={onClose} activeOpacity={1}>
        <Animated.View
          style={{
            borderRadius: 12,
            overflow: "hidden",
            transform: [{ scale }],
            opacity,
            width: screenWidth * 0.9,
            height: 250,
          }}
        >
          <Image
            source={arenaImage}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          <LinearGradient
            colors={["transparent", "rgba(0, 0, 0, 0)"]}
            locations={[0, .8]}
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: "60%",
            }}
          />

          <MaskedView
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: "60%",
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}
            maskElement={
              <LinearGradient
                colors={["transparent", "black"]}
                locations={[0, .8]}
                style={{ flex: 1 }}
              />
            }
          >
            <BlurView
              intensity={70}
              tint={"systemThinMaterial"}
              style={StyleSheet.absoluteFill}
            />
          </MaskedView>

          <View
            style={{
              position: "absolute",
              flexDirection: "row",
              justifyContent: "space-between",
              bottom: 16,
              left: 16,
              right: 16,
              zIndex: 1,
            }}
          >
            {arenaName && (
              <Text style={[styles.arenaTitle, { color: "#fff" }]}>
                {arenaName}
              </Text>
            )}

            {weather && (
              <Text style={[styles.arenaTitle, { color: "#fff" }]}>
                {weather.tempFahrenheit.toFixed(0)}°F
              </Text>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  arenaTitle: {
    fontFamily: Fonts.OSBOLD,
    fontSize: 24,
  },
});

export default ArenaImageModal;
