import type { LucideIcon } from "lucide-react";

export type RoutePath = "/today" | "/weather" | "/explore" | "/travel" | "/saved";

export type Severity = "good" | "minor" | "warning" | "severe";
export type Tone = "green" | "amber" | "red";

export type SeverityState =
  | { severity: "good"; tone: "green" }
  | { severity: "minor"; tone: "amber" }
  | { severity: "warning"; tone: "amber" }
  | { severity: "severe"; tone: "red" };

export interface CityOption {
  name: string;
  tagline: string;
}

export type PulseId = "transport" | "roads" | "weather" | "air";
export type PulseTarget = "travel" | "weather";
export type PulseIconKey =
  | "bus"
  | "car"
  | "rain"
  | "leaf"
  | "music"
  | "calendar"
  | "compass"
  | "trees"
  | "train"
  | "tram"
  | "route"
  | "sun"
  | "umbrella";

export type CityPulseItem = SeverityState & {
  id: PulseId;
  label: string;
  status: string;
  detail: string;
  detailTitle: string;
  detailBody: string;
  icon: PulseIconKey;
  target: PulseTarget;
};

export type StopKind = "train" | "bus";
export type WeatherIconKey = "rain" | "sun";
export type FocusTarget = "travel" | "weather";
export type TravelMode = "transport" | "roads" | "air";
export type TravelSummaryTab = "Nearby" | "Buses" | "Trains" | "Roads";
export type TravelPageTab = "Nearby" | "Bus" | "Train" | "Road";
export type ExploreMode = "Events" | "Places";

export type TransportStop = SeverityState & {
  id: string;
  name: string;
  area: string;
  walk: string;
  next: string;
  kind: StopKind;
};

export type TransportDeparture = SeverityState & {
  id: string;
  destination: string;
  platform: string;
  time: string;
};

export type TravelUpdate = SeverityState & {
  title: string;
  detail: string;
};

export type RoadRow = SeverityState & {
  name: string;
  status: string;
  note: string;
};

export type TravelRow = SeverityState & {
  id: string;
  icon: LucideIcon;
  badge?: string;
  title: string;
  meta: string;
  secondary?: string;
  value: string;
  summary: string;
  departure: string;
  note: string;
};

export interface TravelRowsByMode {
  nearby: TravelRow[];
  buses: TravelRow[];
  trains: TravelRow[];
  roads: TravelRow[];
  air: TravelRow[];
}

export interface HourlyForecastHour {
  id: string;
  label: string;
  temp: number;
  feelsLike: number;
  rain: number;
  icon: WeatherIconKey;
  note: string;
  condition: string;
  wind: string;
}

export interface WeatherSnapshot {
  temp: number;
  condition: string;
  feelsLike: number;
  summary: string;
  dryWindow: string;
  dryAdvice: string;
}

export interface DailyForecastDay {
  day: string;
  date: string;
  condition: string;
  high: number;
  low: number;
  rain: number;
  range: number;
}

interface SavedItemBase {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface EventItem extends SavedItemBase {
  type: "event";
  date: string;
  time: string;
  venue: string;
  distance: string;
  ticketInfo: string;
  availability: string;
  category?: never;
  hours?: never;
  neighbourhood?: never;
}

export interface PlaceItem extends SavedItemBase {
  type: "place";
  category: string;
  hours: string;
  neighbourhood: string;
  date?: never;
  time?: never;
  venue?: never;
  distance?: never;
  ticketInfo?: never;
  availability?: never;
}

export type SavedItem = EventItem | PlaceItem;
export type DrawerItem = SavedItem | null;
export type SavedState = SavedItem["id"][];
