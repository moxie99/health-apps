// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.platforms = ['ios', 'android', 'native']

config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-reanimated/plugin': 'react-native-reanimated/plugin',
}
module.exports = config;
