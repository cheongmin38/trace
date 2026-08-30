/** Runtime switches are explicit so production builds never silently receive demo records. */
export type RuntimeMode = 'development' | 'preview' | 'production';

export const runtimeMode: RuntimeMode = process.env.EXPO_PUBLIC_DATA_MODE === 'production'
  ? 'production'
  : process.env.EXPO_PUBLIC_DATA_MODE === 'preview'
    ? 'preview'
    : 'development';

export const demoDataEnabled = runtimeMode !== 'production' && process.env.EXPO_PUBLIC_ENABLE_DEMO_DATA !== 'false';
export const isProduction = runtimeMode === 'production';
