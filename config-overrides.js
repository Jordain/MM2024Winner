const path = require('path');

module.exports = function override(config) {
  // Find the rule that uses source-map-loader
  const sourceMapLoader = config.module.rules.find(
    (rule) => rule.enforce === 'pre' && rule.use && rule.use[0].loader && rule.use[0].loader.includes('source-map-loader')
  );

  // If the source-map-loader is found, we can exclude mediapipe from being processed
  if (sourceMapLoader) {
    sourceMapLoader.exclude = [
      ...(sourceMapLoader.exclude || []),
      /node_modules[\\/]@react-three[\\/]drei[\\/]node_modules[\\/]@mediapipe[\\/]tasks-vision/,
    ];
  }

  return config;
};
