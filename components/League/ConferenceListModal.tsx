import {
  cbbConferences,
  getCBBConferenceLogo,
  getCBBConferenceSelectionName,
} from "@/constants/cbbConferences";
import {
  cfbConferences,
  getCFBConferenceLogo,
  getCFBConferenceSelectionName,
} from "@/constants/cfbConferences";
import {
  getWCBBConferenceLogo,
  getWCBBConferenceSelectionName,
  wcbbConferences,
} from "@/constants/wcbbConferences";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import CBBLogo from "assets/College_Logos/Conference_Logos/CBB.png";
import CFBLogo from "assets/College_Logos/Conference_Logos/CFB.png";
import WCBBLogo from "assets/College_Logos/Conference_Logos/WCBB.png";
import { Colors } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { Image } from "expo-image";
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import type { ImageSourcePropType } from "react-native";
import { Pressable, Text, View } from "react-native";
import { ConferenceListModalStyles } from "styles/ModalsStyles/ConferenceListModalStyles";
import { snapPoints } from "utils/modalUtils";

export type ConferenceListModalRef = {
  present: () => void;
  close: () => void;
};

type ConferenceLeague = "cfb" | "cbb" | "wcbb";

type ConferenceOption = {
  label: string;
  value: number | string;
  logo?: ImageSourcePropType | string | null;
};

type Props = {
  selectedConference: number | string | null;
  onSelect: (conference: number | string | null) => void;
  onOpen?: () => void;
  onClose?: () => void;
  league: ConferenceLeague;
};

type FBSConference = (typeof cfbConferences)[number] & {
  groupId: number;
};

type CBBConference = (typeof cbbConferences)[number] & {
  groupId: number;
};
type WCBBConference = (typeof wcbbConferences)[number] & {
  groupId: number;
};

function isFBSConferenceOption(
  conference: (typeof cfbConferences)[number],
): conference is FBSConference {
  return (
    conference.groupId !== null &&
    (conference.groupId === 80 ||
      conference.parentGroupId === 80 ||
      conference.groupId === 35)
  );
}
function isCBBConferenceOption(
  conference: (typeof cbbConferences)[number],
): conference is CBBConference {
  return conference.groupId !== null;
}

function isWCBBConferenceOption(
  conference: (typeof wcbbConferences)[number],
): conference is WCBBConference {
  return conference.groupId !== null;
}

const ConferenceListModal = forwardRef<ConferenceListModalRef, Props>(
  function ConferenceListModal(
    { selectedConference, onSelect, onOpen, onClose, league },
    ref,
  ) {
    const { resolvedColorScheme } = usePreferences();

    const isDark = resolvedColorScheme === "dark";
    const styles = ConferenceListModalStyles(isDark);

    const modalRef = useRef<BottomSheetModal>(null);

    const isCFB = league === "cfb";
    const isCBB = league === "cbb";
    const isWCBB = league === "wcbb";

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      close: () => modalRef.current?.close(),
    }));

    const defaultLeagueLogo = useMemo(() => {
      if (isCFB) {
        return CFBLogo;
      }

      if (isWCBB) {
        return WCBBLogo;
      }

      return CBBLogo;
    }, [isCFB, isWCBB]);

    const conferences = useMemo<ConferenceOption[]>(() => {
      if (isCFB) {
        return [
          {
            label: "Top 25",
            value: "top25",
            logo: defaultLeagueLogo,
          },

          ...cfbConferences.filter(isFBSConferenceOption).map((conference) => ({
            label:
              getCFBConferenceSelectionName(conference.groupId) ||
              conference.shortName ||
              conference.name,
            value: conference.groupId,
            logo: getCFBConferenceLogo(conference.groupId, isDark),
          })),
        ];
      }

      if (isCBB) {
        return [
          {
            label: "Top 25",
            value: "top25",
            logo: defaultLeagueLogo,
          },

          ...cbbConferences.filter(isCBBConferenceOption).map((conference) => ({
            label:
              getCBBConferenceSelectionName(conference.groupId) ||
              conference.shortName ||
              conference.name,
            value: conference.groupId,
            logo: getCBBConferenceLogo(conference.groupId, isDark),
          })),
        ];
      }
      if (isWCBB) {
        return [
          {
            label: "Top 25",
            value: "top25",
            logo: defaultLeagueLogo,
          },

          ...wcbbConferences
            .filter(isWCBBConferenceOption)
            .map((conference) => ({
              label:
                getWCBBConferenceSelectionName(conference.groupId) ||
                conference.shortName ||
                conference.name,
              value: conference.groupId,
              logo: getWCBBConferenceLogo(conference.groupId, isDark),
            })),
        ];
      }

      return [];
    }, [defaultLeagueLogo, isCBB, isCFB, isDark, isWCBB]);

    const fallbackIcon = isCFB
      ? "american-football-outline"
      : "basketball-outline";

    return (
      <BottomSheetModal
        ref={modalRef}
        index={2}
        enableDynamicSizing={false}
        snapPoints={snapPoints}
        onChange={(index) => {
          if (index >= 0) {
            onOpen?.();
          } else {
            onClose?.();
          }
        }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={1}
            disappearsOnIndex={-1}
          />
        )}
        backgroundStyle={styles.backgroundStyle}
        handleStyle={styles.handle}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Conferences</Text>
          </View>
          <BottomSheetScrollView
            contentContainerStyle={styles.contentContainerStyle}
          >
            {conferences.map((conference) => {
              const isSelected = selectedConference === conference.value;

              return (
                <View
                  key={`${conference.label}-${conference.value}`}
                  style={styles.buttonContainer}
                >
                  <Pressable
                    onPress={() => {
                      onSelect(conference.value);
                      modalRef.current?.close();
                    }}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <View style={styles.buttonWrapper}>
                      {conference.logo ? (
                        <Image
                          source={conference.logo}
                          style={styles.logo}
                          contentFit="contain"
                        />
                      ) : (
                        <View style={styles.logoPlaceholder}>
                          <Ionicons
                            name={
                              conference.value === "top25"
                                ? "star"
                                : fallbackIcon
                            }
                            size={18}
                            color={isDark ? Colors.white : Colors.black}
                          />
                        </View>
                      )}

                      <Text style={styles.buttonText}>{conference.label}</Text>
                    </View>

                    <Ionicons
                      name={isSelected ? "checkmark" : "chevron-forward"}
                      size={20}
                      color={isDark ? Colors.white : Colors.black}
                    />
                  </Pressable>
                </View>
              );
            })}
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    );
  },
);

export default ConferenceListModal;
