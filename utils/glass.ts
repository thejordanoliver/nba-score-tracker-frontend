// utils/glass.ts

import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";

export function supportsLiquidGlass() {
  return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
}