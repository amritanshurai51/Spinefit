import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api, Tip } from '../api/endpoints';
import { useAuth } from './AuthContext';

const Ctx = createContext<any>(null);

export const FavouritesProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, profile } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [tipItems, setTipItems] = useState<Tip[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('favTips').then(raw => {
      if (raw) setTipItems(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) {
      setIds([]);
      return;
    }
    if (profile) Api.favourites().then(setIds).catch(() => {});
  }, [token, profile?.uid]);

  const isFav = (id: string) => ids.includes(id);
  const toggle = async (id: string) => {
    const shouldAdd = !isFav(id);
    const previous = ids;
    setIds(shouldAdd ? [id, ...ids] : ids.filter(favouriteId => favouriteId !== id));
    const save = () => (shouldAdd ? Api.addFav(id) : Api.removeFav(id));
    try {
      try {
        await save();
      } catch (error: any) {
        if (error?.code === 'profile_missing') {
          await Api.me();
          await save();
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      setIds(previous);
      Alert.alert('Could not update favourites', error?.detail ?? 'Please try again.');
    }
  };

  const isTipFav = (id: string) => tipItems.some(tip => tip.id === id);
  const toggleTip = (tip: Tip) => {
    const next = isTipFav(tip.id) ? tipItems.filter(item => item.id !== tip.id) : [tip, ...tipItems];
    setTipItems(next);
    AsyncStorage.setItem('favTips', JSON.stringify(next)).catch(() => {});
  };

  const clearVideos = async () => {
    const previous = ids;
    setIds([]);
    try {
      await Promise.all(previous.map(id => Api.removeFav(id)));
    } catch (error: any) {
      setIds(previous);
      Alert.alert('Could not clear favourites', error?.detail ?? 'Please try again.');
    }
  };
  const clearTips = () => {
    setTipItems([]);
    AsyncStorage.removeItem('favTips').catch(() => {});
  };

  return (
    <Ctx.Provider value={{ ids, isFav, toggle, tipItems, isTipFav, toggleTip, clearVideos, clearTips }}>
      {children}
    </Ctx.Provider>
  );
};

export const useFavourites = () => useContext(Ctx);
