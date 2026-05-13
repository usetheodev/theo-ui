/** @type {import("@ladle/react").UserConfig} */
export default {
  stories: "src/**/*.stories.{ts,tsx,js,jsx}",
  defaultStory: "welcome--default",
  appendToHead: `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`,
  addons: {
    theme: {
      enabled: true,
      defaultState: "dark",
    },
    width: {
      enabled: true,
      options: {
        mobile: 375,
        tablet: 768,
        desktop: 1280,
        wide: 1536,
      },
      defaultState: 0,
    },
    a11y: {
      enabled: true,
    },
    source: {
      enabled: true,
      defaultState: false,
    },
    rtl: {
      enabled: false,
    },
  },
};
