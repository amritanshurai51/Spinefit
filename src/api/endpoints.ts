import { api } from './client';

export type Profile = { uid: string; name: string | null; email: string | null; is_admin: boolean };
export type HomeVideo = {
  video_id: string;
  title: string;
  description: string;
  released_at: string;
  metadata?: { categories?: string[]; age_rating?: string };
  is_favourite: boolean;
  duration: number;
  thumbnail_url: string | null;
  thumbnail_blurhash?: string | null;
  resolutions?: string[];
};
export type Category = { name: string; videos: HomeVideo[] };
export type HomeFeed = { categories: Category[]; thumbnails_expire_at: number };
export type PlayInfo = HomeVideo & { hls_url: string; embed_url?: string; expires_at: number };

export type WaterDay = { day: string; water_ml: number };
export type WaterHistory = { from: string; to: string; days: WaterDay[] };

/** YYYY-MM-DD in the phone's local timezone (the water API requires local dates). */
export function localDateString(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const Api = {
  me: () => api<Profile>('GET', '/auth/me'),
  setName: (name: string) => api<Profile>('PATCH', '/auth/me', { name }),
  deleteMe: () => api('DELETE', '/auth/me'),
  home: () => api<HomeFeed>('GET', '/videos/home'),
  video: (id: string) => api<PlayInfo>('GET', `/videos/${id}`),
  favourites: () => api<string[]>('GET', '/favourites'),
  addFav: (video_id: string) => api('POST', '/favourites', { video_id }),
  removeFav: (id: string) => api('DELETE', `/favourites/${id}`),
  waterHistory: (today = localDateString()) => api<WaterHistory>('GET', `/water-intake?today=${today}`),
  saveWater: (day: string, water_ml: number, today = localDateString()) =>
    api<WaterDay & { message: string }>('POST', `/water-intake?today=${today}`, { day, water_ml }),
};

// The backend has no tips or plan endpoints, so these remain local app data.
export type Tip = { id: string; title: string; summary: string; image: string; readMin: number; tag: string; ago: string };
export type Plan = { id: string; name: string; price: string; period: string; features: string[] };

const TIPS: Tip[] = [1, 2].map(i => ({
  id: String(i),
  title: 'Why Your Desk Job is Hurting Your Spine ?',
  tag: 'Posture',
  readMin: 4,
  ago: '3d ago',
  summary: 'Small daily habits at your workstation compound over years. Here is what our Specialists want you to change first.',
  image: `https://picsum.photos/seed/tip${i}/600/360`,
}));

const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: '₹0', period: 'forever', features: ['Limited sessions', 'Wellness tips'] },
  { id: 'monthly', name: 'Pro Monthly', price: '₹299', period: '/month', features: ['All sessions', 'Tracker & reminders', 'Favourites sync'] },
  { id: 'yearly', name: 'Pro Yearly', price: '₹1,999', period: '/year', features: ['Everything in Pro', 'Save 45%', 'Priority specialist tips'] },
];

export const ContentApi = {
  tips: async () => TIPS,
  plans: async () => PLANS,
};
