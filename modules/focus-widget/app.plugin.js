const { withAndroidManifest, withStaticPlugin } = require('@expo/config-plugins');

/**
 * Plugin per registrare il widget nel sistema Android durante il prebuild.
 */
module.exports = function withFocusWidget(config) {
  return withAndroidManifest(config, async (config) => {
    // Il modulo nativo verrà autolinkato automaticamente da Expo Modules.
    // Qui potremmo aggiungere logica extra se servisse modificare l'AndroidManifest
    // ma la dichiarazione che abbiamo messo nel src/main del modulo dovrebbe già essere inclusa.
    return config;
  });
};
