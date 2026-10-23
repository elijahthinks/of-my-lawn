import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.elijahthinks.offmylawn",
  appName: "Off My Lawn",
  webDir: "dist",
  ios: {
    contentInset: "never",
    backgroundColor: "#cfe0d8",
  },
};

export default config;
