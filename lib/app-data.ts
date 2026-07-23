export interface Activity {
  id: string;
  type: "run" | "ride" | "workout";
  title: string;
  distance: number; // km
  duration: number; // minutes
  date: string;
  pace?: number; // min/km
  speed?: number; // km/h
  elevation?: number; // meters
  heartRate?: number; // avg bpm
  calories?: number;
}

export interface Template {
  id: string;
  name: string;
  category: "running" | "cycling" | "general";
  preview: string;
  style: "minimal" | "bold" | "gradient" | "outline" | "photo";
  accentColor: string;
}

export interface StatToggles {
  distance: boolean;
  duration: boolean;
  pace: boolean;
  elevation: boolean;
  heartRate: boolean;
  calories: boolean;
}

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "1",
    type: "run",
    title: "Morning Run",
    distance: 5.2,
    duration: 32,
    date: "Today",
    pace: 6.1,
    elevation: 120,
    heartRate: 152,
    calories: 385,
  },
  {
    id: "2",
    type: "run",
    title: "Tempo Run",
    distance: 8.5,
    duration: 52,
    date: "Yesterday",
    pace: 6.1,
    elevation: 240,
    heartRate: 161,
    calories: 620,
  },
  {
    id: "3",
    type: "ride",
    title: "Evening Ride",
    distance: 15.3,
    duration: 45,
    date: "Jul 21",
    speed: 20.4,
    elevation: 180,
    heartRate: 138,
    calories: 480,
  },
  {
    id: "4",
    type: "run",
    title: "Recovery Run",
    distance: 3.2,
    duration: 20,
    date: "Jul 20",
    pace: 6.2,
    elevation: 80,
    heartRate: 132,
    calories: 230,
  },
  {
    id: "5",
    type: "workout",
    title: "Strength Training",
    distance: 0,
    duration: 55,
    date: "Jul 19",
    heartRate: 118,
    calories: 410,
  },
  {
    id: "6",
    type: "ride",
    title: "Long Ride",
    distance: 42.8,
    duration: 128,
    date: "Jul 18",
    speed: 20.1,
    elevation: 560,
    heartRate: 142,
    calories: 1240,
  },
];

export const TEMPLATES: Template[] = [
  { id: "1", name: "Minimalist", category: "running", preview: "📊", style: "minimal", accentColor: "#FFFFFF" },
  { id: "2", name: "Bold Stats", category: "running", preview: "📈", style: "bold", accentColor: "#FF6B35" },
  { id: "3", name: "Map Focus", category: "running", preview: "🗺️", style: "outline", accentColor: "#4A90E2" },
  { id: "4", name: "Elevation", category: "running", preview: "⛰️", style: "gradient", accentColor: "#8B5CF6" },
  { id: "5", name: "Pace Chart", category: "running", preview: "📉", style: "minimal", accentColor: "#22C55E" },
  { id: "6", name: "Time Focus", category: "running", preview: "⏱️", style: "bold", accentColor: "#F59E0B" },
  { id: "7", name: "Cycling Stats", category: "cycling", preview: "🚴", style: "bold", accentColor: "#FF6B35" },
  { id: "8", name: "Power Output", category: "cycling", preview: "⚡", style: "gradient", accentColor: "#EAB308" },
  { id: "9", name: "Distance King", category: "general", preview: "🏆", style: "bold", accentColor: "#FFD700" },
  { id: "10", name: "Clean Slate", category: "general", preview: "✨", style: "minimal", accentColor: "#FFFFFF" },
  { id: "11", name: "Dark Mode", category: "general", preview: "🌙", style: "minimal", accentColor: "#94A3B8" },
  { id: "12", name: "Vibrant", category: "general", preview: "🎨", style: "gradient", accentColor: "#EC4899" },
  { id: "13", name: "Minimal Text", category: "running", preview: "📍", style: "minimal", accentColor: "#FFFFFF" },
  { id: "14", name: "Data Heavy", category: "cycling", preview: "📊", style: "outline", accentColor: "#4A90E2" },
  { id: "15", name: "Photo First", category: "general", preview: "📷", style: "photo", accentColor: "#FFFFFF" },
];

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function formatPace(pace: number): string {
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}
