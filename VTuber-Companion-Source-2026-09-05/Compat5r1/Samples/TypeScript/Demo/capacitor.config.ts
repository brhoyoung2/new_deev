import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vtuber.companion',
  appName: 'VTuber Companion',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
