const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withFixAndroidDex(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = fixBuildGradle(config.modResults.contents);
    }
    return config;
  });
};

function fixBuildGradle(content) {
  // Aggiungiamo una regola per escludere l'SDK Amazon da RevenueCat
  const exclusionRule = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force 'com.amazon.device:amazon-appstore-sdk:3.0.4' // Forza una versione se necessario, o escludi
        }
        exclude group: 'com.amazon.device', module: 'amazon-appstore-sdk'
    }
}
`;

  if (!content.includes("exclude group: 'com.amazon.device'")) {
    return content + exclusionRule;
  }
  return content;
}
