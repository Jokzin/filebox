// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    // Private keys are only available on the server
    localStoragePath: process.env.LOCAL_STORAGE_PATH,

    // Public keys are available on both client and server
    public: {
      storageType: process.env.STORAGE_TYPE,
    }
  }
})
