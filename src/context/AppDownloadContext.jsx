import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import AppDownloadModal from '../components/AppDownloadModal';
import { trackEvent } from '../utils/analytics';

// Every page has a "Download app" button in the navbar, footer and hero, and
// all of them used to jump straight to the customer app. The chooser lives
// here so one dialog instance serves the whole site.
const AppDownloadContext = createContext(null);

export const useAppDownload = () => {
  const context = useContext(AppDownloadContext);
  if (!context) {
    throw new Error('useAppDownload must be used within an AppDownloadProvider');
  }
  return context;
};

export const AppDownloadProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  const openAppDownload = useCallback(() => {
    trackEvent('app_download_prompt');
    setOpen(true);
  }, []);

  const closeAppDownload = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openAppDownload, closeAppDownload }),
    [openAppDownload, closeAppDownload],
  );

  return (
    <AppDownloadContext.Provider value={value}>
      {children}
      <AppDownloadModal open={open} onClose={closeAppDownload} />
    </AppDownloadContext.Provider>
  );
};
