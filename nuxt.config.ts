// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@prisma/nuxt',
    '@pinia/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    maxFileSize: process.env.MAX_FILE_SIZE || '5242880',
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf',
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      companyName: process.env.COMPANY_NAME || 'Your Company'
    }
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
  },
  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
