import type { ImageSourcePropType } from "react-native";

import MLBLogo from "assets/Baseball/MLB_Logos/MLB.png";
import CBLogo from "assets/College_Logos/Conference_Logos/CB.png";
import CBBLogo from "assets/College_Logos/Conference_Logos/CBB.png";
import CFBLogo from "assets/College_Logos/Conference_Logos/CFB.png";
import SBLogo from "assets/College_Logos/Conference_Logos/SB.png";
import WCBBLogo from "assets/College_Logos/Conference_Logos/WCBB.png";
import NFLLogo from "assets/Football/NFL_Logos/NFL.png";
import UFLLogo from "assets/Football/UFL_Logos/UFL.png";
import UFLLightLogo from "assets/Football/UFL_Logos/UFLLight.png";
import NHLLogo from "assets/Hockey/NHL_Logos/NHL.png";
import UFCLogo from "assets/MMA/MMA_Logos/UFC.png";
import UFCLogoLight from "assets/MMA/MMA_Logos/UFCLight.png";
import GLeagueLogo from "assets/NBA/Logos/GLeague.png";
import GLeagueLogoLight from "assets/NBA/Logos/GLeagueLight.png";
import NBALogo from "assets/NBA/Logos/NBA.png";
import F1Logo from "assets/Racing/Logos/f1.png";
import NascarLogo from "assets/Racing/Logos/Nascar.png";
import NascarLightLogo from "assets/Racing/Logos/NascarLight.png";
import BundesligaLogo from "assets/Soccer/Logos/Bundesliga.png";
import BundesligaLightLogo from "assets/Soccer/Logos/BundesligaLight.png";
import EPLLogo from "assets/Soccer/Logos/EPL.png";
import LeaguesCupLogo from "assets/Soccer/Logos/LeaguesCup.png";
import LeaguesCupLogoLight from "assets/Soccer/Logos/LeaguesCupLight.png";
import MLSLogo from "assets/Soccer/Logos/MLS.png";
import UEFAChampionsLogo from "assets/Soccer/Logos/UEFAChampions.png";
import UEFAChampionsLightLogo from "assets/Soccer/Logos/UEFAChampionsLight.png";
import UEFAEuropaLogo from "assets/Soccer/Logos/UEFAEuropa.png";
import UEFAEuropaLightLogo from "assets/Soccer/Logos/UEFAEuropaLight.png";
import WorldCupLogo from "assets/Soccer/Logos/WorldCup.png";
import WorldCupLightLogo from "assets/Soccer/Logos/WorldCupLight.png";
import ATPLogo from "assets/Tennis/Logos/ATP.png";
import WTALogo from "assets/Tennis/Logos/WTA.png";
import WTALogoLight from "assets/Tennis/Logos/WTALight.png";
import WNBALogo from "assets/WNBA/Logos/WNBA.png";
import WNBALogoLight from "assets/WNBA/Logos/WNBALight.png";

import type { LeagueType } from "types/types";

export type LeagueRoute =
  | "/league/basketball"
  | "/league/football"
  | "/league/baseball"
  | "/league/hockey"
  | "/league/mma"
  | "/league/racing"
  | "/league/tennis"
  | "/league/socc";

type LeagueDefinition = {
  id: string;
  label: string;
  color: string;
  secondaryColor?: string;
  logo: ImageSourcePropType;
  logoLight: ImageSourcePropType;
  route: LeagueRoute;
};

export const BROWSEABLE_LEAGUES = [
  "atp",
  "bundesliga",
  "cb",
  "cbb",
  "cfb",
  "champions",
  "epl",
  "europa",
  "f1",
  "fifa",
  "fifaw",
  "gleague",
  "leaguescup",
  "mlb",
  "mls",
  "nascarpremier",
  "nba",
  "nfl",
  "nhl",
  "sb",
  "ufc",
  "ufl",
  "wcbb",
  "wnba",
  "wta",
] as const satisfies readonly LeagueType[];

export type BrowseableLeague = (typeof BROWSEABLE_LEAGUES)[number];

export const LEAGUE_CONFIG = {
  atp: {
    id: "atp",
    label: "ATP Tennis",
    color: "#002865",
    secondaryColor: "#00AFF0",
    logo: ATPLogo,
    logoLight: ATPLogo,
    route: "/league/tennis",
  },

  bundesliga: {
    id: "bundesliga",
    label: "German Bundesliga",
    color: "#D20515",
    secondaryColor: "#000000",
    logo: BundesligaLogo,
    logoLight: BundesligaLightLogo,
    route: "/league/socc",
  },

  cb: {
    id: "cb",
    label: "College Baseball",
    color: "#009CDE",
    secondaryColor: "#000000",
    logo: CBLogo,
    logoLight: CBLogo,
    route: "/league/baseball",
  },

  cbb: {
    id: "cbb",
    label: "M. College Basketball",
    color: "#009CDE",
    secondaryColor: "#000000",
    logo: CBBLogo,
    logoLight: CBBLogo,
    route: "/league/basketball",
  },

  cfb: {
    id: "cfb",
    label: "College Football",
    color: "#009CDE",
    secondaryColor: "#000000",
    logo: CFBLogo,
    logoLight: CFBLogo,
    route: "/league/football",
  },

  champions: {
    id: "champions",
    label: "UEFA Champions League",
    color: "#0E1E5B",
    secondaryColor: "#FFFFFF",
    logo: UEFAChampionsLogo,
    logoLight: UEFAChampionsLightLogo,
    route: "/league/socc",
  },

  epl: {
    id: "epl",
    label: "English Premier League",
    color: "#37003C",
    secondaryColor: "#00FF85",
    logo: EPLLogo,
    logoLight: EPLLogo,
    route: "/league/socc",
  },

  europa: {
    id: "europa",
    label: "UEFA Europa League",
    color: "#F57C00",
    secondaryColor: "#000000",
    logo: UEFAEuropaLogo,
    logoLight: UEFAEuropaLightLogo,
    route: "/league/socc",
  },

  f1: {
    id: "f1",
    label: "F1",
    color: "#E10600",
    secondaryColor: "#15151E",
    logo: F1Logo,
    logoLight: F1Logo,
    route: "/league/racing",
  },

  fifa: {
    id: "fifa",
    label: "FIFA World Cup",
    color: "#326295",
    secondaryColor: "#8A1538",
    logo: WorldCupLogo,
    logoLight: WorldCupLightLogo,
    route: "/league/socc",
  },

  fifaw: {
    id: "fifaw",
    label: "FIFA Women's World Cup",
    color: "#A50064",
    secondaryColor: "#FFB81C",
    logo: WorldCupLogo,
    logoLight: WorldCupLightLogo,
    route: "/league/socc",
  },

  gleague: {
    id: "gleague",
    label: "NBA G League",
    color: "#000000",
    secondaryColor: "#C8102E",
    logo: GLeagueLogo,
    logoLight: GLeagueLogoLight,
    route: "/league/basketball",
  },

  leaguescup: {
    id: "leaguescup",
    label: "Leagues Cup",
    color: "#6A1B9A",
    secondaryColor: "#00C2FF",
    logo: LeaguesCupLogo,
    logoLight: LeaguesCupLogoLight,
    route: "/league/socc",
  },

  mlb: {
    id: "mlb",
    label: "MLB",
    color: "#002D72",
    secondaryColor: "#D50032",
    logo: MLBLogo,
    logoLight: MLBLogo,
    route: "/league/baseball",
  },

  mls: {
    id: "mls",
    label: "MLS",
    color: "#111111",
    secondaryColor: "#E2231A",
    logo: MLSLogo,
    logoLight: MLSLogo,
    route: "/league/socc",
  },

  nascarpremier: {
    id: "nascarpremier",
    label: "NASCAR Premier",
    color: "#007AC2",
    secondaryColor: "#FFD659",
    logo: NascarLogo,
    logoLight: NascarLightLogo,
    route: "/league/racing",
  },

  nba: {
    id: "nba",
    label: "NBA",
    color: "#1D428A",
    secondaryColor: "#C8102E",
    logo: NBALogo,
    logoLight: NBALogo,
    route: "/league/basketball",
  },

  nfl: {
    id: "nfl",
    label: "NFL",
    color: "#013369",
    secondaryColor: "#D50A0A",
    logo: NFLLogo,
    logoLight: NFLLogo,
    route: "/league/football",
  },

  nhl: {
    id: "nhl",
    label: "NHL",
    color: "#000000",
    secondaryColor: "#FFFFFF",
    logo: NHLLogo,
    logoLight: NHLLogo,
    route: "/league/hockey",
  },

  sb: {
    id: "sb",
    label: "College Softball",
    color: "#009CDE",
    secondaryColor: "#000000",
    logo: SBLogo,
    logoLight: SBLogo,
    route: "/league/baseball",
  },

  ufc: {
    id: "ufc",
    label: "UFC",
    color: "#D20A0A",
    secondaryColor: "#000000",
    logo: UFCLogo,
    logoLight: UFCLogoLight,
    route: "/league/mma",
  },

  ufl: {
    id: "ufl",
    label: "UFL",
    color: "#003B71",
    secondaryColor: "#D71920",
    logo: UFLLogo,
    logoLight: UFLLightLogo,
    route: "/league/football",
  },

  wcbb: {
    id: "wcbb",
    label: "W. College Basketball",
    color: "#009CDE",
    secondaryColor: "#000000",
    logo: WCBBLogo,
    logoLight: WCBBLogo,
    route: "/league/basketball",
  },

  wnba: {
    id: "wnba",
    label: "WNBA",
    color: "#FF6B00",
    secondaryColor: "#FFFFFF",
    logo: WNBALogo,
    logoLight: WNBALogoLight,
    route: "/league/basketball",
  },

  wta: {
    id: "wta",
    label: "WTA Tennis",
    color: "#3B1C56",
    secondaryColor: "#C6ED2C",
    logo: WTALogo,
    logoLight: WTALogoLight,
    route: "/league/tennis",
  },
} as const satisfies Record<LeagueType, LeagueDefinition>;
export type FavoriteSportId = (typeof LEAGUE_CONFIG)[BrowseableLeague]["id"];

export const HOME_SCORE_LEAGUES = [
  "nba",
  "nfl",
  "ufl",
  "mlb",
  "nhl",
  "cfb",
  "mls",
  "leaguescup",
  "fifa",
  "europa",
  "champions",
  "epl",
  "bundesliga",
  "cbb",
  "wcbb",
  "wnba",
  "ufc",
  "atp",
  "wta",
] as const satisfies readonly FavoriteSportId[];

export type HomeLeagueId = (typeof HOME_SCORE_LEAGUES)[number];

export const MY_TEAMS_SECTION_ID = "my-teams" as const;
export const MY_TEAMS_SECTION_TITLE = "My Teams";

export const FAVORITE_SPORT_OPTIONS = BROWSEABLE_LEAGUES.map((league) => ({
  league,
  ...LEAGUE_CONFIG[league],
}));

const FAVORITE_SPORT_IDS = new Set<string>(
  FAVORITE_SPORT_OPTIONS.map((option) => option.id),
);

export function isFavoriteSportId(value: unknown): value is FavoriteSportId {
  return typeof value === "string" && FAVORITE_SPORT_IDS.has(value);
}
