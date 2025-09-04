import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GuestModeContextType {
  isGuestMode: boolean;
  setGuestMode: (enabled: boolean) => void;
  guestPetName: string;
  setGuestPetName: (name: string) => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export const useGuestMode = () => {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
};

interface GuestModeProviderProps {
  children: ReactNode;
}

export const GuestModeProvider = ({ children }: GuestModeProviderProps) => {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestPetName, setGuestPetName] = useState('Demo Pet');

  const setGuestMode = (enabled: boolean) => {
    setIsGuestMode(enabled);
    if (enabled && !guestPetName) {
      setGuestPetName('Demo Pet');
    }
  };

  const value: GuestModeContextType = {
    isGuestMode,
    setGuestMode,
    guestPetName,
    setGuestPetName
  };

  return (
    <GuestModeContext.Provider value={value}>
      {children}
    </GuestModeContext.Provider>
  );
};