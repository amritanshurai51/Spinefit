import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContentApi, Session, Tip } from '../api/endpoints';

const Ctx = createContext<any>(null);
export const FavouritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<Session[]>([]);
  const [tipItems, setTipItems] = useState<Tip[]>([]);
  useEffect(() => {
    AsyncStorage.multiGet(['favs', 'favTips']).then(([videos, tips]) => {
      if (videos[1]) setItems(JSON.parse(videos[1]));
      if (tips[1]) setTipItems(JSON.parse(tips[1]));
    }).catch(() => {});
  }, []);
  const isFav = (id: string) => items.some(s => s.id === id);
  const toggle = async (s: Session) => {
    const on = !isFav(s.id);
    const next = on ? [s, ...items] : items.filter(i => i.id !== s.id);
    setItems(next); AsyncStorage.setItem('favs', JSON.stringify(next)); // optimistic + cached
    ContentApi.setFavourite(s.id, on);                                 // sync to backend
  };
  const isTipFav = (id: string) => tipItems.some(t => t.id === id);
  const toggleTip = (tip: Tip) => {
    const next = isTipFav(tip.id) ? tipItems.filter(t => t.id !== tip.id) : [tip, ...tipItems];
    setTipItems(next);
    AsyncStorage.setItem('favTips', JSON.stringify(next));
  };
  const clearVideos = () => {
    setItems([]);
    AsyncStorage.removeItem('favs');
    items.forEach(item => ContentApi.setFavourite(item.id, false));
  };
  const clearTips = () => { setTipItems([]); AsyncStorage.removeItem('favTips'); };
  return <Ctx.Provider value={{ items, isFav, toggle, tipItems, isTipFav, toggleTip, clearVideos, clearTips }}>{children}</Ctx.Provider>;
};
export const useFavourites = () => useContext(Ctx);
