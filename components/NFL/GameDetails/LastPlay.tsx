import HeadingTwo from "components/Headings/HeadingTwo";
import { Fonts } from "constants/fonts";
import { Athlete, PlayObject } from "hooks/NFLHooks/useNFLGamePossession";
import { useEffect, useState } from "react";
import { Image, LayoutChangeEvent, Text, View } from "react-native";

type LastPlayProps = {
  lastPlay?: string | PlayObject;
  isDark?: boolean;
};

export default function LastPlay({ lastPlay, isDark = true }: LastPlayProps) {
  const [currentPlay, setCurrentPlay] = useState(lastPlay);
  const [containerWidth, setContainerWidth] = useState(0);

  const textColor = isDark ? "#fff" : "#1d1d1d";

  const onLayout = (e: LayoutChangeEvent) =>
    setContainerWidth(e.nativeEvent.layout.width);

  useEffect(() => {
    setCurrentPlay(lastPlay);
  }, [lastPlay]);

  const getTextColor = (text?: string) => {
    if (text === "Two-minute warning") return "red";
    return isDark ? "#fff" : "#1d1d1d";
  };

  if (!currentPlay) return null;

  if (typeof currentPlay === "string") {
    return (
      <View style={{marginVertical: 12,}} onLayout={onLayout}>
        <Text
          style={{
            fontFamily: Fonts.OSREGULAR,
            fontSize: 14,
            color: textColor,
          }}
        >
          {currentPlay}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginVertical: 12, flexGrow: 1 }} onLayout={onLayout}>
      <HeadingTwo>Play By Play</HeadingTwo>

      {currentPlay.athletesInvolved?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {currentPlay.athletesInvolved.map((athlete: Athlete) => (
            <View
              key={athlete.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              {athlete.headshot && (
                <Image
                  source={{ uri: athlete.headshot }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 100,
                    marginRight: 6,
                    backgroundColor: isDark ? "#888" : "#ccc",
                  }}
                />
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  marginRight: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.OSREGULAR,
                    fontSize: 16,
                    color: isDark ? "#fff" : "#1d1d1d",
                  }}
                >
                  {athlete.fullName}
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.OSREGULAR,
                    fontSize: 14,
                    color: isDark ? "#aaa" : "#555",
                    marginLeft: 4,
                  }}
                >
                  {athlete.position || ""}
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.OSREGULAR,
                    fontSize: 14,
                    color: isDark ? "#aaa" : "#555",
                    marginLeft: 2,
                  }}
                >
                 { `#${athlete.jersey || ""}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Text
        style={{
          fontFamily: Fonts.OSREGULAR,
          fontSize: 14,
          color: getTextColor(currentPlay.text),
          marginTop: 12,
        }}
      >
        {currentPlay.text}
      </Text>

      {currentPlay.drive?.description && (
        <Text
          style={{
            fontFamily: Fonts.OSREGULAR,
            fontSize: 12,
            color: textColor,
            opacity: 0.7,
            marginTop: 4,
          }}
        >
          Drive: {currentPlay.drive.description}
          {currentPlay.drive.timeElapsed?.displayValue
            ? ` (${currentPlay.drive.timeElapsed.displayValue})`
            : ""}
        </Text>
      )}
    </View>
  );
}
