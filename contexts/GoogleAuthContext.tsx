import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { User, UserSettings } from '../types';
import { GUEST_AVATARS } from '../utils';
import { DEFAULT_GLOBAL_API_REQUEST_LIMIT } from '../constants';

const DEFAULT_USER_SETTINGS: UserSettings = {
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Europe/London',
    country: 'GB',
    currency: 'USD',
    globalApiRequestLimit: DEFAULT_GLOBAL_API_REQUEST_LIMIT,
    generatedDocsTimeframe: 30,
    notificationSettings: {
        eventStart: true,
        taskDueDate: true,
        reminder: true,
    },
};
interface AuthContextType {
  user: User | null;
  isInitialized: boolean;
  updateUser: (data: Partial<Omit<User, 'id' | 'email'>>) => void;
}

const GoogleAuthContext = createContext<AuthContextType>({
  user: null,
  isInitialized: false,
  updateUser: () => {},
});

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const updateUser = (data: Partial<Omit<User, 'id' | 'email'>>) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = {
            ...prevUser,
            ...data,
            settings: {
                ...(prevUser.settings || DEFAULT_USER_SETTINGS),
                ...data.settings,
                 notificationSettings: {
                    ...(prevUser.settings?.notificationSettings || DEFAULT_USER_SETTINGS.notificationSettings),
                    ...(data.settings?.notificationSettings || {}),
                }
            }
        };
        localStorage.setItem(`user_${updatedUser.id}`, JSON.stringify(updatedUser));
        return updatedUser;
    });
  };

  const loginAsGuest = useCallback(() => {
    const savedGuest = localStorage.getItem('user_guest');
    if (savedGuest) {
      setUser(JSON.parse(savedGuest));
    } else {
      const guestUser: User = {
        id: 'guest',
        name: 'Guest User',
        email: '',
        picture: GUEST_AVATARS[0],
        settings: DEFAULT_USER_SETTINGS,
      };
      localStorage.setItem('user_guest', JSON.stringify(guestUser));
      setUser(guestUser);
    }
  }, []);


  useEffect(() => {
    loginAsGuest();
    setIsInitialized(true);
  }, [loginAsGuest]);

  return (
    <GoogleAuthContext.Provider value={{ user, isInitialized, updateUser }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useAuth = () => useContext(GoogleAuthContext);