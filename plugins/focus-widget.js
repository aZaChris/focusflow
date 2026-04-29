const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Plugin per registrare il widget nel sistema Android.
 */
const withFocusWidget = (config) => {
  return withAndroidManifest(config, async (config) => {
    // Qui andrebbe la logica per aggiungere i metadati se non fossero già nel modulo
    // Per ora lo lasciamo come "ancora" per assicurarci che il modulo venga visto.
    return config;
  });
};

module.exports = withFocusWidget;
