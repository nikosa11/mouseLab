import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: "my-first-app",
  slug: "my-first-app",
  scheme: "mouseLab",
  plugins: [
    [
      "expo-notifications",
      {
        "icon": "./assets/notification-icon.png",
        "color": "#ffffff",
        "sounds": ["./assets/notification-sound.wav"]
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "9b6e78b1-563a-4587-ab8d-b9aadfbf31df"
    }
  },
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    package: "com.nlitsakis.mouselab",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: ["NOTIFICATIONS"]
  },
  web: {
    favicon: "./assets/icon.png"
  }
};

export default config; 