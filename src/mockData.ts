import type {
  CityOption,
  CityPulseItem,
  DailyForecastDay,
  EventItem,
  HourlyForecastHour,
  PlaceItem,
  RoadRow,
  TransportDeparture,
  TransportStop,
  TravelUpdate,
} from "./types";

const asset = (name: string): string => `${import.meta.env.BASE_URL}assets/${name}`;

export const cityOptions: CityOption[] = [
  { name: "Bristol", tagline: "Harbour and hills" },
  { name: "Bath", tagline: "Compact city centre" },
  { name: "London", tagline: "Dense rail and Tube links" },
  { name: "Manchester", tagline: "Busy tram network" },
  { name: "Edinburgh", tagline: "Old town and coast" },
  { name: "Cardiff", tagline: "Compact centre and bay" },
  { name: "Brighton", tagline: "Seafront and station axis" },
];

export const pulseItems: CityPulseItem[] = [
  {
    id: "transport",
    label: "Public transport",
    status: "Minor delays",
    detail: "70 & 72 affected near Gloucester Road",
    detailTitle: "Buses are moving, but Gloucester Road is slower than usual.",
    detailBody: "Routes 70 and 72 are seeing short holds around Zetland Road. Temple Meads departures are otherwise steady.",
    severity: "minor",
    tone: "amber",
    icon: "bus",
    target: "travel",
  },
  {
    id: "roads",
    label: "Roads",
    status: "Slow in places",
    detail: "A38 and central bus lanes busiest",
    detailTitle: "Expect slower driving through the centre.",
    detailBody: "The A38 southbound and bus lanes near The Bearpit are the main pinch points this afternoon.",
    severity: "warning",
    tone: "amber",
    icon: "car",
    target: "travel",
  },
  {
    id: "weather",
    label: "Weather",
    status: "Showers easing",
    detail: "Drier spell from 16:30",
    detailTitle: "Rain fades later in the afternoon.",
    detailBody: "Light rain hangs around until mid-afternoon. The clearest window is likely between 16:30 and 18:00.",
    severity: "good",
    tone: "green",
    icon: "rain",
    target: "weather",
  },
  {
    id: "air",
    label: "Air quality",
    status: "Good",
    detail: "Low pollution across Bristol",
    detailTitle: "Air quality is good across most central neighbourhoods.",
    detailBody: "No unusual pollution alerts. Conditions are comfortable for walking, cycling and outdoor plans.",
    severity: "good",
    tone: "green",
    icon: "leaf",
    target: "weather",
  },
];

export const stops: TransportStop[] = [
  { id: "temple-meads", name: "Temple Meads Station", area: "Redcliffe", walk: "8 min", next: "3 min", kind: "train", severity: "good", tone: "green" },
  { id: "temple-gate", name: "Temple Gate", area: "City centre", walk: "6 min", next: "1 min", kind: "bus", severity: "good", tone: "green" },
  { id: "redcliffe", name: "Redcliffe Way", area: "Harbourside", walk: "7 min", next: "4 min", kind: "bus", severity: "minor", tone: "amber" },
  { id: "stokes", name: "Stokes Croft", area: "North centre", walk: "12 min", next: "6 min", kind: "bus", severity: "minor", tone: "amber" },
  { id: "queen", name: "Queen Square", area: "Old city", walk: "9 min", next: "8 min", kind: "bus", severity: "good", tone: "green" },
];

export const trainDepartures: TransportDeparture[] = [
  { id: "bath", destination: "Bath Spa", platform: "Platform 4", time: "14:18", severity: "good", tone: "green" },
  { id: "cardiff", destination: "Cardiff Central", platform: "Platform 7", time: "14:27", severity: "good", tone: "green" },
  { id: "weston", destination: "Weston-super-Mare", platform: "Platform 2", time: "14:40", severity: "minor", tone: "amber" },
  { id: "london", destination: "London Paddington", platform: "Platform 9", time: "14:46", severity: "good", tone: "green" },
];

export const roadRows: RoadRow[] = [
  { name: "City centre", status: "Busy", note: "Broadmead and Baldwin Street moving slowly", severity: "warning", tone: "amber" },
  { name: "A38", status: "Slow", note: "Delays towards Gloucester Road", severity: "warning", tone: "amber" },
  { name: "M32", status: "Clear", note: "No major queues into Bristol", severity: "good", tone: "green" },
];

export const hourlyForecast: HourlyForecastHour[] = [
  { id: "now", label: "Now", temp: 14, feelsLike: 12, rain: 40, icon: "rain", note: "Light rain is still around central Bristol.", condition: "Light rain", wind: "11 mph SW" },
  { id: "14", label: "14:00", temp: 14, feelsLike: 12, rain: 50, icon: "rain", note: "Showers continue, especially north of the centre.", condition: "Steady showers", wind: "12 mph SW" },
  { id: "15", label: "15:00", temp: 15, feelsLike: 13, rain: 30, icon: "rain", note: "Rain begins to break up.", condition: "Rain easing", wind: "10 mph W" },
  { id: "16", label: "16:00", temp: 15, feelsLike: 14, rain: 20, icon: "sun", note: "Cloud thins with a better dry spell building.", condition: "Cloudy breaks", wind: "9 mph W" },
  { id: "17", label: "17:00", temp: 16, feelsLike: 15, rain: 10, icon: "sun", note: "Best dry window starts around this time.", condition: "Dry spell", wind: "8 mph W" },
  { id: "18", label: "18:00", temp: 15, feelsLike: 15, rain: 10, icon: "sun", note: "Dryer and brighter, but pavements may still be wet.", condition: "Brighter skies", wind: "7 mph W" },
  { id: "19", label: "19:00", temp: 14, feelsLike: 13, rain: 20, icon: "rain", note: "A few showers may return after early evening.", condition: "Chance of showers", wind: "8 mph W" },
];

export const dailyForecast: DailyForecastDay[] = [
  { day: "Today", date: "30 Jun", condition: "Light rain", high: 16, low: 9, rain: 40, range: 72 },
  { day: "Wed", date: "1 Jul", condition: "Sunny intervals", high: 17, low: 9, rain: 10, range: 82 },
  { day: "Thu", date: "2 Jul", condition: "Cloudy", high: 16, low: 10, rain: 20, range: 66 },
  { day: "Fri", date: "3 Jul", condition: "Showers", high: 15, low: 8, rain: 60, range: 58 },
  { day: "Sat", date: "4 Jul", condition: "Dry spells", high: 18, low: 11, rain: 20, range: 88 },
];

export const events: EventItem[] = [
  {
    id: "balloon-fiesta",
    type: "event",
    title: "Bristol International Balloon Fiesta",
    date: "Tonight",
    time: "18:00-21:30",
    venue: "Ashton Court Estate",
    distance: "3.2 miles",
    ticketInfo: "Tickets from £12",
    availability: "Good availability",
    description: "Evening launches, food stalls and a calm view back across the city when the weather allows.",
    image: asset("balloon-fiesta.png"),
  },
  {
    id: "strange-brew",
    type: "event",
    title: "Strange Brew live set",
    date: "Tonight",
    time: "19:30-23:00",
    venue: "Stokes Croft",
    distance: "1.1 miles",
    ticketInfo: "Tickets from £9",
    availability: "Limited tickets",
    description: "A compact evening gig with local support and late trains still within reach from the centre.",
    image: asset("strange-brew.png"),
  },
  {
    id: "watershed",
    type: "event",
    title: "Watershed screening",
    date: "20:15",
    time: "20:15-22:10",
    venue: "Harbourside",
    distance: "0.8 miles",
    ticketInfo: "Tickets from £11",
    availability: "Seats available",
    description: "Independent film screening by the water, close to bus stops and late food around Canons Road.",
    image: asset("watershed.png"),
  },
  {
    id: "market-night",
    type: "event",
    title: "St Nick's evening market",
    date: "Today",
    time: "17:00-20:30",
    venue: "Old City",
    distance: "0.6 miles",
    ticketInfo: "Free entry",
    availability: "Open access",
    description: "Covered food stalls and independent traders in the old market lanes.",
    image: asset("market-night.png"),
  },
];

export const places: PlaceItem[] = [
  {
    id: "arnolfini",
    type: "place",
    title: "Arnolfini",
    category: "Gallery",
    hours: "Open until 18:00",
    neighbourhood: "Harbourside",
    description: "Waterside gallery, bookshop and cafe with easy access from the centre.",
    image: asset("arnolfini.png"),
  },
  {
    id: "cabot-tower",
    type: "place",
    title: "Cabot Tower",
    category: "Viewpoint",
    hours: "Park open",
    neighbourhood: "Brandon Hill",
    description: "A short climb for one of the best views over Bristol and the harbour.",
    image: asset("cabot-tower.png"),
  },
  {
    id: "st-nicks",
    type: "place",
    title: "St Nick's Market",
    category: "Food",
    hours: "Open until 17:30",
    neighbourhood: "Old City",
    description: "Covered market with quick lunch options and independent traders.",
    image: asset("st-nicks.png"),
  },
  {
    id: "spike-island",
    type: "place",
    title: "Spike Island",
    category: "Culture",
    hours: "Open until 17:00",
    neighbourhood: "Southville",
    description: "Contemporary art space close to the harbour path and local cafes.",
    image: asset("spike-island.png"),
  },
  {
    id: "clifton-bridge",
    type: "place",
    title: "Clifton Suspension Bridge",
    category: "Landmark",
    hours: "Open",
    neighbourhood: "Clifton",
    description: "A classic Bristol landmark with open views across the Avon Gorge.",
    image: asset("clifton-bridge.png"),
  },
];

export const travelUpdates: TravelUpdate[] = [
  { title: "Minor bus delays", detail: "Short holds on Gloucester Road after utility works.", severity: "minor", tone: "amber" },
  { title: "Rail services steady", detail: "Temple Meads departures are broadly on time.", severity: "good", tone: "green" },
  { title: "M32 clear", detail: "No major queues reported on the main approach.", severity: "good", tone: "green" },
];
