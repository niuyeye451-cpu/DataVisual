import React, { createContext, useContext, useState, useCallback } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [defaultModel, setDefaultModel] = useState('mlp_rf');
  const [threshold, setThreshold] = useState(300);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  return (
    <SettingsContext.Provider
      value={{ defaultModel, setDefaultModel, threshold, setThreshold, lastRefresh, refresh }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
