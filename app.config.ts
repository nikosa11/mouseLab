import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: "Mouse Lab",
  slug: "my-first-app",
  version: "1.0.7",
  orientation: "portrait",
  icon: "./assets/images/mouseimage.jpg",
  userInterfaceStyle: "light",
  scheme: "mouselab",
  extra: {
    eas: {
      projectId: "9b6e78b1-563a-4587-ab8d-b9aadfbf31df"
    }
  },
  cli: {
    appVersionSource: "remote"
  },
  splash: {
    image: "./assets/images/mouseimage.jpg",
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
      foregroundImage: "./assets/images/mouseimage.jpg",
      backgroundColor: "#ffffff"
    },
    permissions: [
      "NOTIFICATIONS",
      "WAKE_LOCK"
    ]
  },
  notification: {
    icon: "./assets/images/mouseimage.jpg",
    color: "#ffffff",
    androidMode: "default",
    androidCollapsedTitle: "Mouse Lab",
    iosDisplayInForeground: true,
  },
  plugins: [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/mouseimage.jpg",
        "color": "#ffffff"
      }
    ]
  ],
};

export default config;