import { CustomHeader } from "@/components/CustomHeader";
import OfferList from "@/components/League/Recruiting/OfferLists";
import PredictionRing from "@/components/League/Recruiting/PredictionRing";
import RecruitHeader from "@/components/League/Recruiting/RecruitHeader";
import { getCBBTeam, getCBBTeamLogo } from "@/constants/teamsCBB";
import { useRecruit } from "@/hooks/RecruitHooks/useRecruit";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { Colors, globalStyles } from "constants/styles";
import { getCFBTeam, getCFBTeamLogo } from "constants/teamsCFB";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { playerScreenStyles } from "styles/PlayerStyles/PlayerScreenStyles";

export default function RecruitDetailScreen() {
  const { id, teamId, league } = useLocalSearchParams<{
    id?: string;
    teamId: string;
    league: any;
  }>();
  const recruitId = Number(id);
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = playerScreenStyles;
  const global = globalStyles(isDark);
  const navigation = useNavigation();
  const { data: player, loading, error } = useRecruit(recruitId, league);
  const team = league === "cfb" ? getCFBTeam(teamId) : getCBBTeam(teamId);
  const teamCode = team?.code;
  const teamColor = team?.color ?? Colors.midTone;
  const teamLogo =
    league === "cfb"
      ? getCFBTeamLogo(teamId, isDark)
      : getCBBTeamLogo(teamId, isDark);

  const predictionPercentage = useMemo(() => {
    const rawPercentage = player?.prediction_percentage;

    if (!rawPercentage) {
      return 0;
    }

    const parsedPercentage = Number(rawPercentage.replaceAll("%", "").trim());

    return Number.isFinite(parsedPercentage) ? parsedPercentage : 0;
  }, [player?.prediction_percentage]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => {
        if (loading && !player) {
          return null;
        }

        return (
          <CustomHeader
            logo={teamLogo}
            teamColor={teamColor}
            onBack={() => router.back()}
            teamCode={teamCode}
            isPlayerScreen
            league={league}
          />
        );
      },
    });
  }, [
    loading,
    navigation,
    player,
    router,
    teamColor,
    teamCode,
    teamLogo,
    league,
  ]);

  if (loading && !player) {
    return (
      <View style={global.emptyContainer}>
        <CustomActivityIndicator />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>Recruit not found</Text>
      </View>
    );
  }

  const predictionTeamName =
    player.predicted_team_name ??
    player.predicted_schools?.[0]?.team_name ??
    null;

  const predictionTeamId =
    player.predicted_team_id ??
    player.predicted_schools?.[0]?.team_id ??
    player.committed_team_id ??
    null;

  const shouldShowPrediction =
    player.has_prediction &&
    Boolean(predictionTeamName) &&
    Boolean(predictionTeamId);

  return (
    <ScrollView contentContainerStyle={styles.contentContainerStyle}>
      <RecruitHeader player={player} isDark={isDark} />

      {shouldShowPrediction && predictionTeamId && (
        <PredictionRing
          prediction={predictionTeamName}
          predictedSchools={player.predicted_schools}
          teamId={predictionTeamId}
          percentage={predictionPercentage}
          delay={500}
          duration={1400}
          size={200}
          isDark={isDark}
        />
      )}

      <OfferList recruit={player} isDark={isDark} />
    </ScrollView>
  );
}
