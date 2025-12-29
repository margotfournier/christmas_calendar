
import { DayData } from './types';

export const COLORS = {
  HE_BLUE: '#004F9F',
  HE_YELLOW: '#FFD100',
  SOFT_BLUE: '#F0F9FF',
  ICE_WHITE: 'rgba(255, 255, 255, 0.8)',
  TEXT_DARK: '#1d1d1f',
  TEXT_SECONDARY: '#86868b'
};

const NOTION_AI_TIPS = [
  "Lancement : principes de base et rassurer sur la sécurité",
  "Enterprise search",
  "Research mode",
  "AI Meeting notes",
  "Exemple - Research mode sur une feature produit",
  "Ask AI dans un paragraphe",
  "Notion agent",
  "Bloc d’IA",
  "Research mode example - PRD",
  "Databases: Create & Query",
  "Databases: Update & pratique",
  "Personnaliser son Agent Notion",
  "Comment choisir le bon modèle?",
  "Notion Agent UC 1: ranger des pages",
  "Personnalisation Notion Agent 1",
  "Raccourci clavier de l’IA de Notion",
  "Notion Agent UC 2: Générer des Epics produit",
  "Lecture de documents (connecteurs, pdf, image)",
  "Traduire une page",
  "Personnalisation Notion Agent 2",
  "Wrap up: les outils IA chez HE"
];

// TARGET_YEAR and TARGET_MONTH are now provided via `public/days.yml`.
// Defaults are handled in `App.tsx` if the YAML is not present.

export const CALENDAR_DAYS: DayData[] = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  title: NOTION_AI_TIPS[i] || "Notion AI Tip",
  description: "Advanced AI techniques for the modern HomeExchanger.",
  notionUrl: "",
  isUnlocked: false,
  type: 'tip'
}));

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Les métadonnées musicales et les URLs par weekday ont été retirées.
// Utilisez `public/days.yml` pour mapper chaque jour (id) -> { title, url }.

export const isWeekendOrHoliday = (year: number, month: number, day: number) => {
  // Le 1er Janvier est un jour férié
  if (day === 1 && month === 0) return true;
  
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay(); 
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 Sun, 6 Sat
};
