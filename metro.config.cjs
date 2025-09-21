// metro.config.cjs
const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Exclude .web.js overrides
  config.resolver.resolverMainFields = ["react-native", "browser", "main"];

 


  return config;
})();
