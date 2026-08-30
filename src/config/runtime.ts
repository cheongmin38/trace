/** Runtime switches are explicit so production builds never silently receive demo records. */
export type RuntimeMode = 'development' | 'preview' | 'production';

const explicitMode = process.env.EXPO_PUBLIC_DATA_MODE;
const productionBuild = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

export const runtimeMode: RuntimeMode = explicitMode === 'production'
  ? 'production'
  : explicitMode === 'preview'
    ? 'preview'
    : productionBuild ? 'production' : 'development';

export const demoDataEnabled = runtimeMode !== 'production' && process.env.EXPO_PUBLIC_ENABLE_DEMO_DATA !== 'false';
export const isProduction = runtimeMode === 'production';
