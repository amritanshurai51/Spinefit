import { api } from './client';

export type Session = {
  id: string; title: string; level: string; durationMin: number;
  thumbnail: string; videoUrl: string; category: string; description?: string;
};
export type Tip = { id: string; title: string; summary: string; image: string; readMin: number; tag: string; ago: string };
export type Plan = { id: string; name: string; price: string; period: string; features: string[] };

// NOTE: adjust paths / response shapes once the backend team shares the API contract.
export const AuthApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }).then(r => r.data as { token: string; user: any }),
  register: (name: string, email: string, password: string) => api.post('/auth/register', { name, email, password }).then(r => r.data as { token: string; user: any }),
  forgot: (email: string) => api.post('/auth/forgot-password', { email }).then(r => r.data),
};

const MOCK_SESSIONS: Session[] = [
  { id: '1', title: 'Tennis Elbow Relief', level: 'Level - Beginner', durationMin: 12, category: 'Neck & shoulder' },
  { id: '2', title: 'Circular Pendulum', level: 'Level - Beginner', durationMin: 10, category: 'Back pain' },
  { id: '3', title: 'Leg Relief', level: 'Posture - All Level', durationMin: 10, category: 'Back pain' },
  { id: '4', title: 'Spine Posture', level: 'Level - Beginner', durationMin: 10, category: 'Posture' },
  { id: '5', title: 'Ankle Mobility', level: 'Posture - All Level', durationMin: 10, category: 'Strength' },
  { id: '6', title: 'Posture Correction', level: 'Level - Beginner', durationMin: 10, category: 'Posture' },
].map(session => ({
  ...session,
  thumbnail: `https://picsum.photos/seed/spinefit${session.id}/400/260`,
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  description: 'A short guided routine to build mobility and relieve everyday tension.',
}));
const MOCK_TIPS: Tip[] = [1, 2].map(i => ({
  id: String(i), title: 'Why Your Desk Job is Hurting Your Spine ?', tag: 'Posture', readMin: 4, ago: '3d ago',
  summary: 'Small daily habits at your workstation compound over years. Here is what our Specialists want you to change first.',
  image: `https://picsum.photos/seed/tip${i}/600/360`,
}));
const MOCK_PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: '₹0', period: 'forever', features: ['Limited sessions', 'Wellness tips'] },
  { id: 'monthly', name: 'Pro Monthly', price: '₹299', period: '/month', features: ['All sessions', 'Tracker & reminders', 'Favourites sync'] },
  { id: 'yearly', name: 'Pro Yearly', price: '₹1,999', period: '/year', features: ['Everything in Pro', 'Save 45%', 'Priority specialist tips'] },
];
// Falls back to mock data while the backend isn't ready.
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> { try { return await fn(); } catch { return fallback; } }

export const ContentApi = {
  sessions: (p: { q?: string; category?: string; days?: number }) =>
    safe(() => api.get('/sessions', { params: p }).then(r => r.data as Session[]), MOCK_SESSIONS.filter(s =>
      (!p.category || p.category === 'All' || s.category === p.category) &&
      (!p.q || s.title.toLowerCase().includes(p.q.toLowerCase())))),
  session: (id: string) => safe(() => api.get(`/sessions/${id}`).then(r => r.data as Session), MOCK_SESSIONS.find(s => s.id === id)!),
  tips: () => safe(() => api.get('/tips').then(r => r.data as Tip[]), MOCK_TIPS),
  plans: () => safe(() => api.get('/plans').then(r => r.data as Plan[]), MOCK_PLANS),
  setFavourite: (id: string, on: boolean) => safe(() => (on ? api.post(`/favourites/${id}`) : api.delete(`/favourites/${id}`)).then(() => true), true),
};
