export interface ThemeColor {
  headerBg: string;
  headerText: string;
  accentColor: string;
}

export const COLOR_CONFIG: Record<string, ThemeColor> = {
  closed: { headerBg: "#6b7280", headerText: "#ffffff", accentColor: "#d1d5db" },
  low: { headerBg: "#0E9488", headerText: "#ffffff", accentColor: "#0E9488" },
  medium: { headerBg: "#AB8410", headerText: "#ffffff", accentColor: "#947B0E" },
  high: { headerBg: "#940E10", headerText: "#ffffff", accentColor: "#940E10" }
};