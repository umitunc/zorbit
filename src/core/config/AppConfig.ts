export const AppConfig = {
  APP_ID: 'com.truncgil.zorbit.game',
  APP_NAME: 'Zorbit',
  WEB_ORIGIN: 'https://zorbit.truncgil.com',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'https://zorbit.truncgil.com/api',
  VERSION: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0',
  VERSION_CODE: typeof __APP_VERSION_CODE__ !== 'undefined' ? __APP_VERSION_CODE__ : 1,
} as const;

