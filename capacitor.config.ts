import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medcenter.his',
  appName: 'MedCenter HIS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
