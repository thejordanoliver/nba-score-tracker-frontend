import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect, useState } from "react";
import { useHighlights } from "./useHighlights";

type Highlight = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  views: number;
  channelName: string;
  duration: number;
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Decode HTML entities in video titles
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const ACRONYMS = new Set([
  // Leagues
  "NBA", "WNBA", "G League", "FIBA", "USA", "NCAA",

  // Awards
  "MVP", "DPOY", "ROY", "MIP", "6MOY", "FMVP", "ASG", "HOF", "COY", "SMOY", "EOTY",

  // Stats / Terms
  "3PT", "FG", "FT", "FTA", "FT%", "FG%", "TP", "TO", "AST", "REB", "PTS", "BLK", "STL", "MIN", "EFF", "PER", "TS%", "eFG%",
  "TRB", "ORB", "DRB", "AST%", "USG%", "WS", "VORP", "BPM", "DBPM", "OBPM",

  // Positions
  "PG", "SG", "SF", "PF", "C", "G", "F", "BIG", "GUARD", "FORWARD", "CENTER",

  // Common player initials & short names
  "AD", "KD", "CP3", "LBJ", "AI", "MJ", "JR", "Jr.", "RJ", "MPJ", "MJP", "JB", "JT", "BI", "ZL", "JP", "GSJ", "JJJ", "TT", "DW", "DR", "DM", "HM", "VC", "KM", "KAT", "KP", "OG", "GTJ", "WEMBY",
  "BKN", "WIGGS", "LOONEY", "DRAY", "KLAY", "BRON", "DAME", "BOOK", "ZION", "MELO", "MOBLEY", "BANE", "MURRAY", "FOX", "SABONIS", "SCOOT", "CAM", "BAM", "TYRESE", "KUZ", "REAVES", "DLO",

  // WNBA Players
  "AJA", "SAB", "SABRINA", "PAIGE", "CAITLIN", "ALIYAH", "KLS", "BRITTNEY", "BRI", "NNEKA", "SYD", "GRINER", "STEWIE", "JEWELL", "SKY", "AT", "NAF", "CP", "EDD", "KATIE", "KLS",

  // Nicknames / Brands
  "GOAT", "ISO", "AND1", "HOF", "BIG3", "AAU", "2K", "NBA2K", "SLAM", "OT", "B2B", "FTW", "W", "L", "RIP", "BUST", "BUCKETS", "CLUTCH", "COLD", "BANGER", "DIME", "COOKED",

  // NBA Arenas / Venues
  "MSG", "STAPLES", "CHASE", "KIA", "BALL", "FEDEX", "GARDEN", "SMOOTHIE", "TD", "BARCLAYS", "WELLS", "ROCKET", "STATEFARM", "UNITED", "KASEYA", "AMWAY", "MODA",

  // Broadcasters
  "TNT", "ESPN", "NBA TV", "ABC", "FOX", "FS1", "CBS", "NBATV", "BLEACHER", "HOUSEOFHIGHLIGHTS",

  // NBA Teams
  "ATL", "BOS", "BKN", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM",
  "MIA", "MIL", "MIN", "NOP", "NYK", "OKC", "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS",

  // WNBA Teams
  "NYL", "LV", "CHI", "CON", "PHX", "IND", "ATL", "MIN", "DAL", "SEA", "LA", "WAS",

  // G League Teams
  "IGNITE", "CAPITANS", "SKYFORCE", "BLUE", "CRUISE", "WOLVES", "BULLS", "BREEZE", "STARS", "VIPERS", "WARRIORS", "87ERS", "HUSTLE", "SWARM", "KNICKS", "NETS", "MAD ANTS", "LEGENDS", "CAVS", "SPURS"
]);


const PROPER_NOUNS = new Set([
  "Lakers", "Celtics", "Warriors", "Nuggets", "Clippers", "Suns", "Kings", "Grizzlies", "Spurs", "Mavericks",
  "Timberwolves", "Rockets", "Pelicans", "Thunder", "Jazz", "Bucks", "Heat", "Knicks", "Sixers", "76ers",
  "Cavaliers", "Bulls", "Pistons", "Pacers", "Hawks", "Hornets", "Magic", "Wizards", "Raptors", "Nets",
  "Los Angeles", "Boston", "Golden State", "Denver", "Phoenix", "Sacramento", "Memphis", "San Antonio", "Dallas",
  "Minnesota", "Houston", "New Orleans", "Oklahoma City", "Utah", "Milwaukee", "Miami", "New York",
  "Philadelphia", "Cleveland", "Chicago", "Detroit", "Indiana", "Atlanta", "Charlotte", "Orlando",
  "Washington", "Toronto", "Brooklyn",
  // Add more names if needed
]);

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function toSentenceCasePreserveAcronyms(str: string): string {
  const cleaned = str.toLowerCase().replace(/\s+/g, " ").trim();

  const words = cleaned.split(" ").map((word, i, arr) => {
    const upper = word.toUpperCase();
    if (ACRONYMS.has(upper)) return upper;

    const twoWord = i < arr.length - 1 ? `${capitalize(word)} ${capitalize(arr[i + 1])}` : "";
    if (PROPER_NOUNS.has(twoWord)) {
      arr[i + 1] = ""; // Skip the next word
      return twoWord;
    }

    const cap = capitalize(word);
    return PROPER_NOUNS.has(cap) ? cap : i === 0 ? cap : word;
  });

  return words.filter(Boolean).join(" ");
}

export function useTeamHighlights(teamName: string, maxResults = 30) {
  // Guard for empty teamName
  const query = teamName ? `${teamName} highlights` : "NBA highlights";

  return useHighlights(query, maxResults);
}