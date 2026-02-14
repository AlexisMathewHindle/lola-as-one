const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  pwa: {
    name: "LoLA Creative Space - Workshops",
    themeColor: "#D8B061",
    msTileColor: "#000000",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "#D8B061",
    workboxPluginMode: "InjectManifest",
    workboxOptions: {
      swSrc: "./src/service-worker.js", // Path to your custom service worker source
      swDest: "service-worker.js",
    },
  },
  outputDir: process.env.NODE_ENV === "production" ? "dist" : "dist-dev",
  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    },
  },
});
