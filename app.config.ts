import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: "my-first-app",
  slug: "my-first-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "mouselab",
  extra: {
    eas: {
      projectId: "9b6e78b1-563a-4587-ab8d-b9aadfbf31df"
    }
  },
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.nlitsakis.mouselab"
  },
  android: {
    package: "com.nlitsakis.mouselab",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: ["NOTIFICATIONS"]
  },
  plugins: [
    [
      "expo-notifications"
    ]
  ]
};

export default config;