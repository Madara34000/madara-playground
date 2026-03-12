export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/i18n",
    "@pinia/nuxt",
  ],

  i18n: {
    locales: [
      { code: "fr", name: "Français", file: "fr.json" },
      { code: "en", name: "English", file: "en.json" },
    ],
    defaultLocale: "fr",
    langDir: "./",
    strategy: "no_prefix",
  },

  tailwindcss: {
    cssPath: "~/assets/css/tailwind.css",
  },

  runtimeConfig: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
    higgsFieldApiKey: process.env.HIGGSFIELD_API_KEY || "",
    bananaApiKey: process.env.BANANA_API_KEY || "",
    jwtSecret: process.env.JWT_SECRET || "madara-playground-secret-change-me",
    public: {
      appName: "Madara Playground",
    },
  },

  app: {
    head: {
      title: "Madara Playground",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" },
      ],
    },
  },
});
