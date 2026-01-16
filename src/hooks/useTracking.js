import { useState, useEffect } from 'react';
import { SAMPLE_PROVIDERS } from '../utils/constants';

export const useProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProviders(SAMPLE_PROVIDERS);
      setLoading(false);
    }, 500);
  }, []);

  const getAvailableProviders = () => {
    return providers.filter(p => p.status === 'available');
  };

  const updateProviderStatus = (providerId, status) => {
    setProviders(prev =>
      prev.map(p =>
        p.id === providerId ? { ...p, status } : p
      )
    );
  };

  return {
    providers,
    loading,
    getAvailableProviders,
    updateProviderStatus
  };
};