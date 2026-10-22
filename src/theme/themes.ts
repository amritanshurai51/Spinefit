export type Theme = {
  dark: boolean; gradient: [string, string]; text: string; subtext: string; primary: string;
  accent: string; card: string; cardText: string; chip: string; chipActive: string; chipActiveText: string;
  input: string; border: string; tabBar: string; tabActive: string; tabInactive: string;
};
export const lightTheme: Theme = {
  dark: false, gradient: ['#F1C6F5', '#FDF3FE'], text: '#14306B', subtext: '#1B2560', primary: '#14306B',
  accent: '#E879F9', card: '#14306B', cardText: '#FFFFFF', chip: '#E9D3F3', chipActive: '#14306B',
  chipActiveText: '#FFFFFF', input: '#FFFFFF', border: '#14306B', tabBar: '#0E1B4D', tabActive: '#F0A9F5', tabInactive: '#FFFFFF',
};
export const darkTheme: Theme = {
  dark: true, gradient: ['#0A0F2C', '#1A1646'], text: '#F4F1FF', subtext: '#A9B2D6', primary: '#E879F9',
  accent: '#E879F9', card: '#17235C', cardText: '#FFFFFF', chip: '#222B63', chipActive: '#E879F9',
  chipActiveText: '#0A0F2C', input: '#141C4D', border: '#3A4690', tabBar: '#070B20', tabActive: '#F0A9F5', tabInactive: '#C7CCE8',
};
