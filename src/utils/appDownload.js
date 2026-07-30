import { trackEvent } from './analytics';

export const PLAY_STORE_USER_URL = 'https://play.google.com/store/apps/details?id=com.gaonconnect.user';
export const PLAY_STORE_DRIVER_URL = 'https://play.google.com/store/apps/details?id=com.gaonconnect.driver';

export const openUserApp = () => {
  trackEvent('app_download_click', { app: 'user' });
  window.open(PLAY_STORE_USER_URL, '_blank', 'noopener,noreferrer');
};

export const openDriverApp = () => {
  trackEvent('app_download_click', { app: 'driver' });
  window.open(PLAY_STORE_DRIVER_URL, '_blank', 'noopener,noreferrer');
};
