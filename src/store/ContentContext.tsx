import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Api, HomeFeed, HomeVideo } from '../api/endpoints';
import { useAuth } from './AuthContext';

const Ctx = createContext<any>(null);

export const ContentProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, profile } = useAuth();
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const feedRef = useRef<HomeFeed | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextFeed = await Api.home();
      feedRef.current = nextFeed;
      setFeed(nextFeed);
    } catch (loadError: any) {
      setError(loadError?.detail ?? 'Could not load videos');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) refresh();
    else {
      setFeed(null);
      feedRef.current = null;
    }
  }, [token, refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      const currentFeed = feedRef.current;
      const expired = currentFeed ? Date.now() / 1000 > currentFeed.thumbnails_expire_at : false;
      if (state === 'active' && token && (expired || !currentFeed)) refresh();
      else if (state === 'active' && token) refresh();
    });
    return () => subscription.remove();
  }, [token, refresh]);

  const videos: HomeVideo[] = React.useMemo(() => {
    const map = new Map<string, HomeVideo>();
    feed?.categories.forEach(category => category.videos.forEach(video => map.set(video.video_id, video)));
    return Array.from(map.values()).sort((a, b) => (b.released_at > a.released_at ? 1 : -1));
  }, [feed]);
  const byId = (id: string) => videos.find(video => video.video_id === id);

  return (
    <Ctx.Provider value={{ feed, videos, byId, loading, error, refresh, ready: !!profile }}>
      {children}
    </Ctx.Provider>
  );
};

export const useContent = () => useContext(Ctx);
