import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createRoot } from "react-dom/client";
import { Command as CommandPrimitive } from "cmdk";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  BookmarkCheck,
  Bus,
  CalendarDays,
  Car,
  ChevronDown,
  ChevronRight,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  ExternalLink,
  Leaf,
  MapPin,
  Menu,
  Music,
  Route,
  Star,
  Sun,
  Train,
  TramFront,
  Trees,
  TriangleAlert,
  Umbrella,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  cityOptions,
  dailyForecast,
  events,
  hourlyForecast,
  places,
  pulseItems,
  stops,
  trainDepartures,
  travelUpdates,
} from "./mockData";
import type {
  CityOption,
  CityPulseItem,
  DrawerItem,
  EventItem,
  ExploreMode,
  HourlyForecastHour,
  PlaceItem,
  PulseIconKey,
  PulseId,
  RoutePath,
  SavedItem,
  SavedState,
  Severity,
  Tone,
  TransportDeparture,
  TransportStop,
  TravelPageTab,
  TravelRow,
  TravelRowsByMode,
  TravelSummaryTab,
  WeatherSnapshot,
} from "./types";
import "./styles.css";

const MOTION_EASE = [0.22, 1, 0.36, 1] as const;
const MOTION_QUICK = { duration: 0.2, ease: MOTION_EASE };
const MOTION_SWAP = { duration: 0.18, ease: MOTION_EASE };
const SHEET_TRANSITION = { duration: 0.22, ease: MOTION_EASE };

const navItems: Array<{ label: string; path: RoutePath }> = [
  { label: "Today", path: "/today" },
  { label: "Weather", path: "/weather" },
  { label: "Explore", path: "/explore" },
  { label: "Travel", path: "/travel" },
  { label: "Saved", path: "/saved" },
];

const TODAY_TRAVEL_TABS: readonly TravelSummaryTab[] = ["Nearby", "Buses", "Trains", "Roads"];
const TRAVEL_PAGE_TABS: readonly TravelPageTab[] = ["Nearby", "Bus", "Train", "Road"];
const EXPLORE_TABS: readonly ExploreMode[] = ["Events", "Places"];
const RECENT_CITY_NAMES = ["Bristol", "Bath", "London"] as const;
const POPULAR_CITY_NAMES = ["Manchester", "Edinburgh", "Cardiff", "Brighton"] as const;
const WEATHER_HIGHLIGHT_HOUR = "now";

function getSeverityLabel(severity: Severity): string {
  switch (severity) {
    case "good":
      return "On time";
    case "minor":
      return "Minor delays";
    case "warning":
      return "Watch";
    case "severe":
      return "Severe";
  }
}

const iconMap: Record<PulseIconKey, LucideIcon> = {
  bus: Bus,
  car: Car,
  rain: CloudRain,
  leaf: Leaf,
  music: Music,
  calendar: CalendarDays,
  compass: Compass,
  trees: Trees,
  train: Train,
  tram: TramFront,
  route: Route,
  sun: Sun,
  umbrella: Umbrella,
};

const travelRows: TravelRowsByMode = {
  nearby: [
    {
      id: "near-temple-meads",
      icon: Train,
      title: "Temple Meads Station",
      meta: "Train services",
      secondary: "Paddington 10:42 on time; Cardiff 10:48 +4",
      nextService: "London Paddington 14:30",
      followingService: "Cardiff Central 14:42 +4",
      statusLabel: "Mostly on time",
      value: "Platform 9",
      severity: "good",
      tone: "green",
      summary: "Station concourse is clear and the main board is broadly on time.",
      departure: "Paddington 10:42 is on time from platform 9.",
      note: "Cardiff 10:48 is running around 4 minutes late from platform 7.",
    },
    {
      id: "near-temple-gate",
      icon: Bus,
      title: "Temple Gate",
      meta: "Routes 70, 72, M1",
      secondary: "70 to Horfield 1 min; 72 to Temple Meads 6 min",
      nextService: "70 to Horfield · 1 min",
      followingService: "72 to Temple Meads · 6 min",
      statusLabel: "Minor delays",
      value: "1 min",
      severity: "minor",
      tone: "amber",
      summary: "This is the quickest boarding point for the northbound corridor.",
      departure: "Route 70 to Horfield is due in 1 minute.",
      note: "Route 72 to Temple Meads follows in 6 minutes with minor bunching possible.",
    },
    {
      id: "near-redcliffe",
      icon: Bus,
      title: "Redcliffe Way",
      meta: "Routes 8, 70, 72",
      secondary: "8 to Temple Meads 4 min; 70 to UWE 11 min",
      nextService: "8 to Temple Meads · 4 min",
      followingService: "70 to UWE · 11 min",
      statusLabel: "Running normally",
      value: "4 min",
      severity: "minor",
      tone: "amber",
      summary: "Useful fallback when Temple Gate is busy or delayed.",
      departure: "Route 8 to Temple Meads is due in 4 minutes.",
      note: "Route 70 to UWE follows in 11 minutes and may be held near Zetland Road.",
    },
  ],
  buses: [
    {
      id: "bus-70",
      icon: Bus,
      badge: "70",
      title: "UWE Frenchay",
      secondary: "Temple Gate 6 min; Stokes Croft 13 min",
      meta: "Minor delay · Gloucester Road",
      nextService: "14:12",
      followingService: "14:19",
      statusLabel: "Minor delays",
      value: "6 min",
      severity: "minor",
      tone: "amber",
      summary: "Minor delay northbound after roadworks.",
      departure: "Next departure: 14:12",
      note: "Expect slower running between Temple Gate and Stokes Croft.",
    },
    {
      id: "bus-72",
      icon: Bus,
      badge: "72",
      title: "Temple Meads",
      secondary: "Broadmead 9 min; Temple Meads 16 min",
      meta: "Short holds · Zetland Road",
      nextService: "14:15",
      followingService: "14:24",
      statusLabel: "Minor delays",
      value: "9 min",
      severity: "minor",
      tone: "amber",
      summary: "Service is running, but slower than usual.",
      departure: "Next departure: 14:15",
      note: "Current disruption is clearing gradually.",
    },
    {
      id: "bus-8",
      icon: Bus,
      badge: "8",
      title: "Clifton",
      secondary: "Centre 4 min; Clifton Down 18 min",
      meta: "Normal service",
      nextService: "14:09",
      followingService: "14:18",
      statusLabel: "On time",
      value: "4 min",
      severity: "good",
      tone: "green",
      summary: "No major disruption reported.",
      departure: "Next departure: 14:09",
      note: "Useful alternative for moving west through the centre.",
    },
    {
      id: "bus-m1",
      icon: Bus,
      badge: "M1",
      title: "Cribbs Causeway",
      secondary: "Temple Gate 7 min; City Centre 12 min",
      meta: "Normal service",
      nextService: "14:13",
      followingService: "14:25",
      statusLabel: "On time",
      value: "7 min",
      severity: "good",
      tone: "green",
      summary: "Metrobus is close to timetable.",
      departure: "Next departure: 14:13",
      note: "Board at Temple Gate for the quickest option.",
    },
    {
      id: "bus-2",
      icon: Bus,
      badge: "2",
      title: "Stockwood",
      meta: "South Bristol corridor",
      secondary: "Broad Quay 5 min; Stockwood 24 min",
      nextService: "14:10",
      followingService: "14:22",
      statusLabel: "On time",
      value: "5 min",
      severity: "good",
      tone: "green",
      summary: "A steady southbound option through the centre.",
      departure: "Next departure: 14:10",
      note: "Running close to timetable with no major reported holds.",
    },
  ],
  trains: [
    {
      id: "train-bath",
      icon: Train,
      title: "Bath Spa",
      meta: "Temple Meads platform 4",
      secondary: "10:18 stopping service; doors in 7 min",
      nextService: "14:18",
      followingService: "Platform 4",
      statusLabel: "On time",
      value: "14:18",
      severity: "good",
      tone: "green",
      summary: "Reported on time.",
      departure: "Boarding in 7 min",
      note: "Fast service with no current platform change.",
    },
    {
      id: "train-cardiff",
      icon: Train,
      title: "Cardiff Central",
      meta: "Temple Meads platform 7",
      secondary: "10:27 fast service; +4 expected",
      nextService: "14:27",
      followingService: "Platform 7",
      statusLabel: "4 min late",
      value: "14:27",
      severity: "minor",
      tone: "amber",
      summary: "A short delay is showing on the board.",
      departure: "Boarding in 16 min",
      note: "Current estimate is around 4 minutes down leaving Bristol.",
    },
    {
      id: "train-weston",
      icon: Train,
      title: "Weston-super-Mare",
      meta: "Temple Meads platform 2",
      secondary: "10:40 local service; boarding shortly",
      nextService: "14:40",
      followingService: "Platform 2",
      statusLabel: "Minor delay",
      value: "14:40",
      severity: "minor",
      tone: "amber",
      summary: "Minor delay possible.",
      departure: "Boarding in 29 min",
      note: "Allow a few extra minutes for platform access.",
    },
    {
      id: "train-paddington",
      icon: Train,
      title: "London Paddington",
      meta: "Temple Meads platform 9",
      secondary: "10:46 intercity; on time",
      nextService: "14:46",
      followingService: "Platform 9",
      statusLabel: "On time",
      value: "14:46",
      severity: "good",
      tone: "green",
      summary: "Intercity departure is on the board and loading normally.",
      departure: "Boarding in 35 min",
      note: "Good fallback for long-distance eastbound travel this hour.",
    },
  ],
  roads: [
    {
      id: "road-a38",
      icon: Car,
      title: "A38",
      meta: "Gloucester Road slow northbound",
      secondary: "Long Ashton to Stokes Croft running 8 min slow",
      nextService: "Impact: citybound queues",
      followingService: "Delay: 6-8 min",
      statusLabel: "Busy",
      value: "Busy",
      severity: "warning",
      tone: "amber",
      summary: "Expect slower movement around Zetland Road.",
      departure: "Average delay: 6-8 min",
      note: "Busiest stretch is between Stokes Croft and The Arches.",
    },
    {
      id: "road-centre",
      icon: Route,
      title: "Central bus lanes",
      meta: "Busiest through Broadmead",
      secondary: "Bus priority still moving but cars are bunching",
      nextService: "Impact: central corridor",
      followingService: "Delay: 4 min",
      statusLabel: "Slow",
      value: "Slow",
      severity: "warning",
      tone: "amber",
      summary: "Traffic is moving, but slowly.",
      departure: "Average delay: 4 min",
      note: "Taxi and bus priority lanes are still usable.",
    },
    {
      id: "road-m32",
      icon: Car,
      title: "M32",
      meta: "Main approach clear",
      secondary: "Approach traffic normal; no incident signals",
      nextService: "Impact: no closures",
      followingService: "Approach time normal",
      statusLabel: "Clear",
      value: "Clear",
      severity: "good",
      tone: "green",
      summary: "No major queues reported into the city.",
      departure: "Approach time is normal",
      note: "No collision or closure currently reported.",
    },
    {
      id: "road-redcliffe",
      icon: Car,
      title: "Redcliffe Hill",
      meta: "Harbourside and station approach",
      secondary: "Intermittent queueing at the bridge junction",
      nextService: "Impact: bridge junction queues",
      followingService: "Delay: 3-5 min",
      statusLabel: "Watch",
      value: "Watch",
      severity: "minor",
      tone: "amber",
      summary: "Approach traffic is moving, but bunching near the bridge lights.",
      departure: "Average delay: 3-5 min",
      note: "Use Temple Way if you are cutting across the station side of town.",
    },
  ],
  air: [
    {
      id: "air-centre",
      icon: Leaf,
      title: "Central Bristol",
      meta: "Low pollution, comfortable walking",
      value: "Good",
      severity: "good",
      tone: "green",
      summary: "No unusual air quality alerts.",
      departure: "AQI 28",
      note: "Comfortable conditions for walking through the centre.",
    },
    {
      id: "air-harbour",
      icon: Leaf,
      title: "Harbourside",
      meta: "Breezy after showers",
      value: "Good",
      severity: "good",
      tone: "green",
      summary: "Good conditions for short outdoor plans.",
      departure: "AQI 24",
      note: "Light breeze is keeping the waterfront clear.",
    },
    {
      id: "air-cycle",
      icon: Leaf,
      title: "Cycling note",
      meta: "Wet roads, clean air",
      value: "Fine",
      severity: "good",
      tone: "green",
      summary: "Visibility is good; watch wet surfaces.",
      departure: "AQI 26",
      note: "Best for a ride once the 16:30 dry spell arrives.",
    },
  ],
};

const cityVariants: Record<string, CityVariant> = {
  Bristol: {
    currentWeather: {
      temp: 14,
      condition: "Light rain",
      feelsLike: 12,
      summary: "Light rain easing later across central Bristol.",
      dryWindow: "Best dry window: 16:30-18:00",
      dryAdvice: "Good timing for a walk or cycle across town.",
    },
    disruption: {
      headline: "Buses are moving, but Gloucester Road is slower than usual.",
      metadata: "70, 72 and Temple Gate affected",
      routes: ["70", "72"],
      nearbyStop: "Temple Gate",
      operationalDetail: "Short holds are building around Zetland Road, but Temple Meads departures are otherwise steady.",
      updated: "Last updated 4 min ago",
    },
    nearbyRows: travelRows.nearby,
    roadsRows: travelRows.roads,
    airRows: travelRows.air,
    pulseOverrides: {},
    hourlyTempShift: 0,
  },
  Bath: {
    currentWeather: {
      temp: 15,
      condition: "Light showers",
      feelsLike: 13,
      summary: "Showers are passing through Bath, with a calmer spell later.",
      dryWindow: "Best dry window: 17:00-18:30",
      dryAdvice: "Drier conditions should settle around the station and abbey quarter.",
    },
    disruption: {
      headline: "Bus and rail links are moving, but Dorchester Street is a little slower than usual.",
      metadata: "D1, U1 and Bath Spa forecourt affected",
      routes: ["D1", "U1"],
      nearbyStop: "Bath Spa",
      operationalDetail: "Short bus holds are building on Dorchester Street while rail departures remain broadly on time.",
      updated: "Last updated 4 min ago",
    },
    nearbyRows: [
      { id: "bath-spa", icon: Train, title: "Bath Spa Station", meta: "Rail services", value: "2 min", severity: "good", tone: "green", summary: "The concourse is moving normally through the afternoon.", departure: "Next departure: Bristol Temple Meads at 14:24", note: "Fast local rail links are holding time." },
      { id: "bath-dorchester", icon: Bus, title: "Dorchester Street", meta: "Routes D1, U1, 39", value: "1 min", severity: "minor", tone: "amber", summary: "Main stop for buses along the station frontage.", departure: "Next departure: U1 in 2 min", note: "Expect short holds towards Manvers Street." },
      { id: "bath-broad", icon: Bus, title: "Broad Street", meta: "Routes 3, 6, 19", value: "5 min", severity: "good", tone: "green", summary: "Useful fallback stop for the north side of the centre.", departure: "Next departure: Route 6 in 6 min", note: "Queues are lighter away from the station frontage." },
    ],
    roadsRows: [
      { id: "bath-a36", icon: Car, title: "A36", meta: "Wells Road moving steadily", value: "Busy", severity: "minor", tone: "amber", summary: "Expect a slower run around the station approach.", departure: "Average delay: 5 min", note: "Most delay is at Dorchester Street junctions." },
      { id: "bath-centre", icon: Route, title: "City centre", meta: "Bus priority streets active", value: "Slow", severity: "warning", tone: "amber", summary: "Movement is steady but compact through the core.", departure: "Average delay: 4 min", note: "Avoid short car hops around the abbey quarter." },
      { id: "bath-a46", icon: Car, title: "A46", meta: "Northern approach clear", value: "Clear", severity: "good", tone: "green", summary: "No major congestion reported on the main northern approach.", departure: "Approach time is normal", note: "Traffic improves quickly beyond London Road." },
    ],
    airRows: [
      { id: "bath-air-centre", icon: Leaf, title: "Central Bath", meta: "AQI 24, comfortable walking", value: "Good", severity: "good", tone: "green", summary: "Clean conditions across the compact centre.", departure: "Pollen: low", note: "Good conditions for a short walk between the station and abbey." },
      { id: "bath-air-river", icon: Droplets, title: "River corridor", meta: "Fresh after showers", value: "Good", severity: "good", tone: "green", summary: "Rain has kept particulates down near the river.", departure: "Pollen: low", note: "Pavements may still be slick along the towpath." },
      { id: "bath-air-note", icon: Leaf, title: "Local note", meta: "Lower traffic side streets", value: "Fine", severity: "good", tone: "green", summary: "Air feels clearer away from the station frontage.", departure: "AQI 22", note: "Best for walking via Manvers Street and North Parade." },
    ],
    pulseOverrides: {
      transport: {
        status: "Minor delays",
        detail: "Dorchester Street busiest near Bath Spa",
        detailTitle: "Bus access is slightly slower around Bath Spa.",
        detailBody: "D1 and U1 are seeing short holds on the station frontage, while rail departures remain usable.",
      },
      roads: {
        status: "Slow in places",
        detail: "A36 and city-centre streets busiest",
        detailTitle: "Central Bath is moving, but compact roads are filling up.",
        detailBody: "The station approach and abbey-quarter streets are seeing the heaviest load this afternoon.",
      },
    },
    hourlyTempShift: 1,
  },
  London: {
    currentWeather: {
      temp: 18,
      condition: "Cloudy breaks",
      feelsLike: 17,
      summary: "Showers are fragmenting across central London.",
      dryWindow: "Best dry window: 17:30-19:00",
      dryAdvice: "A steadier dry spell should open across the inner core early evening.",
    },
    disruption: {
      headline: "Most central services are moving, but Euston Road is slower than usual.",
      metadata: "205, 214 and Euston Station affected",
      routes: ["205", "214"],
      nearbyStop: "Euston Station",
      operationalDetail: "Road delays are affecting bus reliability around Euston, while Underground services are broadly steady.",
      updated: "Last updated 4 min ago",
    },
    nearbyRows: [
      { id: "ldn-euston", icon: Train, title: "Euston Station", meta: "Rail and Underground", value: "3 min", severity: "good", tone: "green", summary: "Mainline and Tube entrances are operating normally.", departure: "Next departure: Milton Keynes Central at 14:21", note: "Victoria and Northern line access remains straightforward." },
      { id: "ldn-kingsx", icon: Train, title: "King's Cross St Pancras", meta: "National rail and Tube", value: "7 min", severity: "good", tone: "green", summary: "A reliable fallback interchange nearby.", departure: "Next departure: Cambridge at 14:28", note: "Concourse is busy but moving cleanly." },
      { id: "ldn-euston-bus", icon: Bus, title: "Euston Bus Station", meta: "Routes 205, 214, 253", value: "2 min", severity: "minor", tone: "amber", summary: "Key bus services are still boarding normally.", departure: "Next departure: Route 205 in 4 min", note: "Road delays are building towards Euston Road." },
    ],
    roadsRows: [
      { id: "ldn-euston-road", icon: Car, title: "Euston Road", meta: "Westbound traffic bunching", value: "Busy", severity: "warning", tone: "amber", summary: "Expect a slower run around the station frontage.", departure: "Average delay: 8 min", note: "Buses are being held at multiple junctions." },
      { id: "ldn-inner-ring", icon: Route, title: "Inner Ring Road", meta: "Paddington to King's Cross slower", value: "Slow", severity: "warning", tone: "amber", summary: "Traffic is flowing but under pressure through the inner core.", departure: "Average delay: 6 min", note: "Use rail where possible for short east-west trips." },
      { id: "ldn-north", icon: Car, title: "A1 approach", meta: "Northern approach steady", value: "Clear", severity: "good", tone: "green", summary: "No major incident reported on the core northern approach.", departure: "Approach time is normal", note: "Queues thicken only closer to Euston." },
    ],
    airRows: [
      { id: "ldn-air-centre", icon: Leaf, title: "Central London", meta: "AQI 36, workable outdoors", value: "Fair", severity: "minor", tone: "amber", summary: "Air is usable, but busier streets feel heavier.", departure: "Pollen: medium", note: "Side streets are more comfortable than the ring road edges." },
      { id: "ldn-air-river", icon: Leaf, title: "River corridor", meta: "Breezier along the Thames", value: "Good", severity: "good", tone: "green", summary: "Air improves closer to the waterfront.", departure: "AQI 30", note: "A better option for a longer walk later." },
      { id: "ldn-air-note", icon: Droplets, title: "Local note", meta: "Showers have helped clear particulates", value: "Good", severity: "good", tone: "green", summary: "Recent rain has improved conditions slightly.", departure: "Pollen: medium", note: "Best outdoor comfort should come after 17:30." },
    ],
    pulseOverrides: {
      transport: {
        status: "Slow in places",
        detail: "Euston Road affecting central buses",
        detailTitle: "Road pressure is feeding into central bus timings.",
        detailBody: "Services remain usable, but surface transport is less reliable around Euston this afternoon.",
      },
    },
    hourlyTempShift: 4,
  },
  Manchester: {
    currentWeather: {
      temp: 16,
      condition: "Light showers",
      feelsLike: 14,
      summary: "Showers are drifting through central Manchester.",
      dryWindow: "Best dry window: 17:15-18:45",
      dryAdvice: "The clearest period should open across the centre after the next shower band.",
    },
    disruption: {
      headline: "Trams and buses are moving, but Portland Street is slower than usual.",
      metadata: "V1, 192 and Piccadilly Gardens affected",
      routes: ["V1", "192"],
      nearbyStop: "Piccadilly Gardens",
      operationalDetail: "Surface routes are seeing short holds on the core corridor, while Metrolink remains steady.",
      updated: "Last updated 4 min ago",
    },
    nearbyRows: [
      { id: "man-piccadilly", icon: Train, title: "Manchester Piccadilly", meta: "Rail and Metrolink", value: "4 min", severity: "good", tone: "green", summary: "Mainline and tram interchange is operating normally.", departure: "Next departure: Leeds at 14:26", note: "Concourse is busy but moving cleanly." },
      { id: "man-gardens", icon: TramFront, title: "Piccadilly Gardens", meta: "Trams and city buses", value: "2 min", severity: "minor", tone: "amber", summary: "Core city stop for the busiest local connections.", departure: "Next departure: Metrolink to Altrincham in 3 min", note: "Bus boarding is slightly slower on Portland Street." },
      { id: "man-shudehill", icon: Bus, title: "Shudehill", meta: "Routes 8, 17, 41", value: "6 min", severity: "good", tone: "green", summary: "Useful fallback interchange to the north of the core.", departure: "Next departure: Route 17 in 5 min", note: "Queues are lighter than around Piccadilly Gardens." },
    ],
    roadsRows: travelRows.roads,
    airRows: travelRows.air,
    pulseOverrides: {
      transport: {
        status: "Minor delays",
        detail: "Portland Street slowing surface routes",
        detailTitle: "Surface transport is a little slower through the city core.",
        detailBody: "Trams remain steady, but buses are seeing short holds around Piccadilly Gardens.",
      },
    },
    hourlyTempShift: 2,
  },
  Edinburgh: {
    currentWeather: {
      temp: 13,
      condition: "Cloudy",
      feelsLike: 11,
      summary: "Cloud cover is holding over central Edinburgh with a drier spell later.",
      dryWindow: "Best dry window: 16:45-18:15",
      dryAdvice: "A steadier dry period should open through the old town and Princes Street corridor.",
    },
    disruption: {
      headline: "Most services are moving, but Princes Street is slower than usual.",
      metadata: "Routes 11, 16 and Waverley approaches affected",
      routes: ["11", "16"],
      nearbyStop: "Waverley Bridge",
      operationalDetail: "The main corridor is bunching slightly while rail services remain broadly reliable.",
      updated: "Last updated 4 min ago",
    },
    nearbyRows: [
      { id: "edi-waverley", icon: Train, title: "Waverley Station", meta: "Rail services", value: "3 min", severity: "good", tone: "green", summary: "Main rail access is operating normally.", departure: "Next departure: Glasgow Queen Street at 14:20", note: "Platforms are accessible without major crowding." },
      { id: "edi-bridge", icon: Bus, title: "Waverley Bridge", meta: "Routes 11, 16, 26", value: "1 min", severity: "minor", tone: "amber", summary: "Core stop for city centre bus movements.", departure: "Next departure: Route 26 in 4 min", note: "Short holds are building on Princes Street." },
      { id: "edi-standrews", icon: TramFront, title: "St Andrew Square", meta: "Tram and bus links", value: "5 min", severity: "good", tone: "green", summary: "A reliable fallback stop east of the core.", departure: "Next departure: Tram to Airport in 6 min", note: "Useful alternative when Princes Street is busy." },
    ],
    roadsRows: travelRows.roads,
    airRows: travelRows.air,
    pulseOverrides: {
      roads: {
        status: "Slow in places",
        detail: "Princes Street and centre approaches busiest",
        detailTitle: "The central corridor is moving, but slowly in places.",
        detailBody: "Most pressure is on Princes Street and the approaches around Waverley Bridge.",
      },
    },
    hourlyTempShift: -1,
  },
  Cardiff: {
    currentWeather: {
      temp: 15,
      condition: "Showers easing",
      feelsLike: 13,
      summary: "Rain is easing across central Cardiff this afternoon.",
      dryWindow: "Best dry window: 16:30-18:00",
      dryAdvice: "The city centre should feel drier through the late afternoon.",
    },
    disruption: {
      headline: "Bus and rail links are moving, but Newport Road is slower than usual.",
      metadata: "Routes 30, 44 and Queen Street affected",
      routes: ["30", "44"],
      nearbyStop: "Queen Street",
      operationalDetail: "Surface routes are seeing short delays on Newport Road while rail services remain steady.",
      updated: "Last updated 4 min ago",
    },
    nearbyRows: [
      { id: "cdf-central", icon: Train, title: "Cardiff Central", meta: "Rail services", value: "4 min", severity: "good", tone: "green", summary: "Mainline services are broadly steady.", departure: "Next departure: Swansea at 14:29", note: "Station circulation is moving normally." },
      { id: "cdf-queen", icon: Train, title: "Queen Street", meta: "Valleys and local rail", value: "3 min", severity: "good", tone: "green", summary: "Useful city-centre rail fallback.", departure: "Next departure: Caerphilly at 14:23", note: "Good option for short local rail hops." },
      { id: "cdf-newport", icon: Bus, title: "Newport Road", meta: "Routes 30, 44, 45", value: "2 min", severity: "minor", tone: "amber", summary: "Key bus corridor into the eastern side of the centre.", departure: "Next departure: Route 44 in 5 min", note: "Traffic holds are slowing arrivals slightly." },
    ],
    roadsRows: travelRows.roads,
    airRows: travelRows.air,
    pulseOverrides: {
      transport: {
        status: "Minor delays",
        detail: "Newport Road affecting city buses",
        detailTitle: "Bus timings are a little slower through the eastern corridor.",
        detailBody: "Rail services remain useful, but city buses are bunching along Newport Road.",
      },
    },
    hourlyTempShift: 1,
  },
  Brighton: {
    currentWeather: {
      temp: 17,
      condition: "Bright intervals",
      feelsLike: 16,
      summary: "Showers are clearing and brighter breaks are pushing across Brighton.",
      dryWindow: "Best dry window: 17:00-19:00",
      dryAdvice: "The seafront and station corridor should both feel drier into early evening.",
    },
    disruption: {
      headline: "Most local links are moving, but London Road is slower than usual.",
      metadata: "Routes 5, 7 and Brighton Station affected",
      routes: ["5", "7"],
      nearbyStop: "Brighton Station",
      operationalDetail: "Local buses are slowing on London Road while rail services remain broadly steady.",
      updated: "Last updated 4 min ago",
    },
    nearbyRows: [
      { id: "btn-station", icon: Train, title: "Brighton Station", meta: "Rail services", value: "3 min", severity: "good", tone: "green", summary: "Station access is moving normally.", departure: "Next departure: London Victoria at 14:25", note: "Fastest option for northbound travel." },
      { id: "btn-clocktower", icon: Bus, title: "Clock Tower", meta: "Routes 5, 7, 12", value: "2 min", severity: "minor", tone: "amber", summary: "Main stop for the city-centre corridor.", departure: "Next departure: Route 7 in 3 min", note: "Expect slightly slower arrivals on London Road." },
      { id: "btn-seafront", icon: Bus, title: "Old Steine", meta: "Seafront bus links", value: "6 min", severity: "good", tone: "green", summary: "Useful interchange for the eastern seafront.", departure: "Next departure: Route 12 in 5 min", note: "Conditions are calmer once you are clear of the station area." },
    ],
    roadsRows: travelRows.roads,
    airRows: travelRows.air,
    pulseOverrides: {
      weather: {
        status: "Brighter spells",
        detail: "Dryer windows opening by the seafront",
        detailTitle: "Brighter breaks are building across Brighton.",
        detailBody: "The rain band is clearing east, leaving better outdoor conditions later this afternoon.",
      },
    },
    hourlyTempShift: 3,
  },
};

const commandCityLookup = new Map(cityOptions.map((cityOption) => [cityOption.name.toLowerCase(), cityOption]));

function getCityVariant(cityName: string): CityVariant {
  return cityVariants[cityName] ?? cityVariants.Bristol;
}

function buildCityDashboardData(city: CityOption): CityDashboardData {
  const variant = getCityVariant(city.name);
  const pulseData = pulseItems.map((pulseItem) => ({
    ...pulseItem,
    ...(variant.pulseOverrides[pulseItem.id] ?? {}),
  }));
  const hourlyData = hourlyForecast.map((hour) => ({
    ...hour,
    temp: hour.temp + variant.hourlyTempShift,
    feelsLike: hour.feelsLike + variant.hourlyTempShift,
  }));

  return {
    currentWeather: variant.currentWeather,
    pulseItems: pulseData,
    travelRows: {
      nearby: variant.nearbyRows,
      buses: travelRows.buses,
      trains: travelRows.trains,
      roads: variant.roadsRows,
      air: variant.airRows,
    },
    disruption: variant.disruption,
    hourlyForecast: hourlyData,
  };
}

type NavigateHandler = (path: RoutePath) => void;
type ToggleSavedHandler = (item: SavedItem) => void;

interface DisruptionState {
  headline: string;
  metadata: string;
  routes: [string, string];
  nearbyStop: string;
  operationalDetail: string;
  updated: string;
}

interface CityDashboardData {
  currentWeather: WeatherSnapshot;
  pulseItems: CityPulseItem[];
  travelRows: TravelRowsByMode;
  disruption: DisruptionState;
  hourlyForecast: HourlyForecastHour[];
}

function getRoutePathFromPulseTarget(target: PulseTarget): RoutePath {
  return target === "weather" ? "/weather" : "/travel";
}

function getCityBriefingSummary(snapshot: WeatherSnapshot, disruption: DisruptionState, pulseItems: CityPulseItem[]): string {
  const roadsPulse = pulseItems.find((item) => item.id === "roads");
  const disruptionAreaMatch = disruption.headline.match(/but (.+?) is slower than usual/i);
  const disruptionArea = disruptionAreaMatch?.[1] ?? "the main corridor";
  const dryWindowTime = snapshot.dryWindow.match(/(\d{1,2}:\d{2})/)?.[1] ?? "later";
  const weatherLine = /showers|rain/i.test(snapshot.condition)
    ? `Showers ease after ${dryWindowTime}`
    : snapshot.summary.replace(/\.$/, "");
  const roadsLine = roadsPulse?.status === "Slow in places"
    ? "city-centre traffic is slower than usual"
    : (roadsPulse?.detail ?? "traffic is moving normally").replace(/\.$/, "").toLowerCase();

  return `Minor delays on routes ${disruption.routes[0]} and ${disruption.routes[1]} around ${disruptionArea}. ${weatherLine}; ${roadsLine}.`;
}

function getWeatherPracticalLine(snapshot: WeatherSnapshot): string {
  const dryWindowTime = snapshot.dryWindow.match(/(\d{1,2}:\d{2})/)?.[1] ?? "later";
  return `Rain easing after ${dryWindowTime}. Light layer recommended.`;
}

interface CityVariant {
  currentWeather: WeatherSnapshot;
  disruption: DisruptionState;
  nearbyRows: TravelRowsByMode["nearby"];
  roadsRows: TravelRowsByMode["roads"];
  airRows: TravelRowsByMode["air"];
  pulseOverrides: Partial<Record<PulseId, Pick<CityPulseItem, "status" | "detail" | "detailTitle" | "detailBody">>>;
  hourlyTempShift: number;
}

function getRoute(): RoutePath {
  const hashPath = window.location.hash.replace(/^#/, "");
  if (!hashPath) return "/today";
  return navItems.some((item) => item.path === hashPath) ? (hashPath as RoutePath) : "/today";
}

function useLocalStorageState<T>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const [route, setRoute] = useState(getRoute);
  const [city, setCity] = useLocalStorageState<CityOption>("citynow-city", cityOptions[0]!);
  const [savedIds, setSavedIds] = useLocalStorageState<SavedState>("citynow-saved", []);
  const [drawerItem, setDrawerItem] = useState<DrawerItem>(null);
  const [cityCommandOpen, setCityCommandOpen] = useState(false);

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute());
    if (!window.location.hash) {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}#/today`);
    }
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const navigate: NavigateHandler = (path) => {
    window.location.hash = path;
    setRoute(path);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const toggleSaved: ToggleSavedHandler = (item) => {
    setSavedIds((ids) =>
      ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id],
    );
  };

  const savedItems = useMemo<SavedItem[]>(() => {
    const allItems = [...events, ...places];
    return allItems.filter((item) => savedIds.includes(item.id));
  }, [savedIds]);
  const dashboardData = useMemo(() => buildCityDashboardData(city), [city]);

  const handleCitySelect = (cityName: string) => {
    const nextCity = commandCityLookup.get(cityName.toLowerCase());
    if (!nextCity) return;
    setCity(nextCity);
    setCityCommandOpen(false);
  };

  return (
    <Tooltip.Provider delayDuration={80}>
      <MotionConfig reducedMotion="user">
        <LayoutGroup id="citynow-shell">
          <div className="page-shell citynow-shell">
            <div className="app-surface">
              <TopNav
                route={route}
                city={city}
                onCityCommandOpen={() => setCityCommandOpen(true)}
                onNavigate={navigate}
              />
              <main className="route-frame">
                {route === "/today" && (
                  <TodayPage
                    city={city}
                    dashboardData={dashboardData}
                    onNavigate={navigate}
                    savedIds={savedIds}
                    onToggleSaved={toggleSaved}
                    onOpenDrawer={(item) => setDrawerItem(item)}
                  />
                )}
                {route === "/weather" && <WeatherPage city={city} forecastHours={dashboardData.hourlyForecast} snapshot={dashboardData.currentWeather} />}
                {route === "/explore" && (
                  <ExplorePage
                    city={city}
                    savedIds={savedIds}
                    onToggleSaved={toggleSaved}
                    onOpenDrawer={(item) => setDrawerItem(item)}
                  />
                )}
                {route === "/travel" && <TravelPage city={city} />}
                {route === "/saved" && (
                  <SavedPage
                    savedItems={savedItems}
                    savedIds={savedIds}
                    onToggleSaved={toggleSaved}
                    onNavigate={navigate}
                    onOpenDrawer={(item) => setDrawerItem(item)}
                  />
                )}
              </main>
            </div>
            <CityCommandDialog
              city={city}
              open={cityCommandOpen}
              onOpenChange={setCityCommandOpen}
              onSelectCity={handleCitySelect}
            />
            <DetailDrawer
              item={drawerItem}
              cityName={city.name}
              saved={drawerItem ? savedIds.includes(drawerItem.id) : false}
              onToggleSaved={toggleSaved}
              onClose={() => setDrawerItem(null)}
            />
          </div>
        </LayoutGroup>
      </MotionConfig>
    </Tooltip.Provider>
  );
}

interface TopNavProps {
  route: RoutePath;
  city: CityOption;
  onCityCommandOpen: () => void;
  onNavigate: NavigateHandler;
}

function TopNav({ route, city, onCityCommandOpen, onNavigate }: TopNavProps) {
  return (
    <header className="top-nav">
      <button className="brand" onClick={() => onNavigate("/today")} aria-label="CityNow home">
        <span className="brand-mark" aria-hidden="true">
          <span />
        </span>
        <span>CityNow</span>
      </button>
      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-link ${route === item.path ? "active" : ""}`}
            onClick={() => onNavigate(item.path)}
          >
            {item.label}
            {route === item.path ? (
              <motion.span className="nav-active-indicator" layoutId="citynow-nav-indicator" transition={MOTION_SWAP} />
            ) : null}
          </button>
        ))}
      </nav>
      <div className="nav-actions">
        <button className="city-button" onClick={onCityCommandOpen} aria-label="Open city search">
          <MapPin size={14} />
          <span>{city.name}, UK</span>
          <ChevronDown size={14} />
        </button>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={15} />
        </button>
        <button className="icon-button mobile-menu" aria-label="Menu">
          <Menu size={16} />
        </button>
      </div>
    </header>
  );
}

interface CityCommandDialogProps {
  city: CityOption;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCity: (cityName: string) => void;
}

function CityCommandDialog({ city, open, onOpenChange, onSelectCity }: CityCommandDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="command-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={MOTION_SWAP}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="command-content"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={MOTION_SWAP}
              >
                <Dialog.Title className="sr-only">Search a city</Dialog.Title>
                <CommandPrimitive label="City search" className="command-root">
                  <div className="command-input-shell">
                    <MapPin size={15} />
                    <CommandPrimitive.Input className="command-input" placeholder="Search a city..." />
                  </div>
                  <CommandPrimitive.List className="command-list">
                    <CommandPrimitive.Empty className="command-empty">No city found.</CommandPrimitive.Empty>
                    <CommandPrimitive.Group heading="Recent cities" className="command-group">
                      {RECENT_CITY_NAMES.map((cityName) => (
                        <CommandPrimitive.Item
                          key={cityName}
                          value={cityName}
                          className="command-item"
                          onSelect={onSelectCity}
                        >
                          <span>{cityName}</span>
                          <small>{commandCityLookup.get(cityName.toLowerCase())?.tagline}</small>
                          {city.name === cityName ? <span className="command-current">Current</span> : null}
                        </CommandPrimitive.Item>
                      ))}
                    </CommandPrimitive.Group>
                    <CommandPrimitive.Group heading="Popular cities" className="command-group">
                      {POPULAR_CITY_NAMES.map((cityName) => (
                        <CommandPrimitive.Item
                          key={cityName}
                          value={cityName}
                          className="command-item"
                          onSelect={onSelectCity}
                        >
                          <span>{cityName}</span>
                          <small>{commandCityLookup.get(cityName.toLowerCase())?.tagline}</small>
                          {city.name === cityName ? <span className="command-current">Current</span> : null}
                        </CommandPrimitive.Item>
                      ))}
                    </CommandPrimitive.Group>
                  </CommandPrimitive.List>
                </CommandPrimitive>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

interface TodayPageProps {
  city: CityOption;
  dashboardData: CityDashboardData;
  onNavigate: NavigateHandler;
  savedIds: SavedState;
  onToggleSaved: ToggleSavedHandler;
  onOpenDrawer: (item: SavedItem) => void;
}

function TodayPage({ city, dashboardData, onNavigate, savedIds, onToggleSaved, onOpenDrawer }: TodayPageProps) {
  const [travelTab, setTravelTab] = useState<TravelSummaryTab>("Nearby");
  const travelRef = useRef<HTMLElement | null>(null);
  const weatherRef = useRef<HTMLElement | null>(null);
  const featured = events[0]!;
  const otherEvents = events.slice(1, 4);
  const cityBriefingSummary = getCityBriefingSummary(
    dashboardData.currentWeather,
    dashboardData.disruption,
    dashboardData.pulseItems,
  );
  const airPulse = dashboardData.pulseItems.find((item) => item.id === "air");

  return (
    <div className="page-content today-page">
      <section className="today-context-row">
        <div>
          <h1>{getGreeting()}, {city.name}</h1>
          <p className="today-brief-summary">{cityBriefingSummary}</p>
        </div>
        <CurrentWeatherCard weather={dashboardData.currentWeather} onClick={() => onNavigate("/weather")} />
      </section>

      <section className="today-pulse-section">
        <div className="today-section-kicker">
          <span>City pulse</span>
          <small>Live operating picture</small>
        </div>
        <LayoutGroup id="city-pulse">
          <div className="pulse-grid">
            {dashboardData.pulseItems.map((item) => (
              <PulseStatusCard
                key={item.id}
                item={item}
                onClick={() => onNavigate(getRoutePathFromPulseTarget(item.target))}
              />
            ))}
          </div>
        </LayoutGroup>
        <DisruptionAlert disruption={dashboardData.disruption} onNavigate={onNavigate} />
      </section>

      <section className="today-live-city" aria-label="Live city information">
        <TravelSummary
          ref={travelRef}
          activeTab={travelTab}
          onTabChange={setTravelTab}
          travelRows={dashboardData.travelRows}
          disruption={dashboardData.disruption}
          onNavigate={onNavigate}
          embedded
        />
        <WeatherSummary
          ref={weatherRef}
          snapshot={dashboardData.currentWeather}
          hours={dashboardData.hourlyForecast}
          airQualityNote={airPulse ? `${airPulse.label} ${airPulse.status.toLowerCase()} across ${city.name}.` : null}
          onNavigate={onNavigate}
          embedded
        />
      </section>

      <section className="today-tonight" aria-label={`Tonight in ${city.name}`}>
        <div className="today-section-kicker">
          <span>Tonight</span>
          <small>Events, places and days out</small>
        </div>
        <div className="today-tonight-grid">
          <FeaturedEvent
            event={featured}
            saved={savedIds.includes(featured.id)}
            onToggleSaved={onToggleSaved}
            onOpenDrawer={onOpenDrawer}
            embedded
          />
          <div className="side-list tonight-list">
            <div className="section-title-row">
              <h2>Tonight in {city.name}</h2>
              <button className="text-link" onClick={() => onNavigate("/explore")}>
                Open Explore
              </button>
            </div>
            {otherEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                saved={savedIds.includes(event.id)}
                onToggleSaved={onToggleSaved}
                onOpenDrawer={onOpenDrawer}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="day-footer">
        <span><Sun size={15} /> Sunrise 04:56</span>
        <span><CloudSun size={15} /> Sunset 21:23</span>
        <span><Train size={15} /> Last train to Bath 23:41 <small>Demo data</small></span>
      </footer>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface CurrentWeatherCardProps {
  weather: WeatherSnapshot;
  onClick: () => void;
}

function CurrentWeatherCard({ weather, onClick }: CurrentWeatherCardProps) {
  const WeatherIcon = /rain|shower/i.test(weather.condition) ? CloudRain : CloudSun;

  return (
    <button className="weather-mini" onClick={onClick}>
      <WeatherIcon className="weather-cloud" size={42} />
      <span className="weather-temp">{weather.temp}°</span>
      <span className="weather-meta">{weather.condition}</span>
      <span className="weather-feels">Feels like {weather.feelsLike}°</span>
    </button>
  );
}

interface PulseStatusCardProps {
  item: CityPulseItem;
  onClick: () => void;
}

function PulseStatusCard({ item, onClick }: PulseStatusCardProps) {
  const Icon = iconMap[item.icon];
  return (
    <motion.button
      className={`pulse-card ${item.tone}`}
      onClick={onClick}
      whileHover={{ y: -1 }}
      transition={MOTION_QUICK}
    >
      <span className="pulse-card-content pulse-icon"><Icon size={22} /></span>
      <span className="pulse-card-content pulse-label">{item.label}</span>
      <strong className="pulse-card-content">{item.status}</strong>
      <span className="pulse-card-content">{item.detail}</span>
    </motion.button>
  );
}

interface DisruptionAlertProps {
  disruption: DisruptionState;
  onNavigate: NavigateHandler;
}

function DisruptionAlert({ disruption, onNavigate }: DisruptionAlertProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div className="disruption-wrap" layout transition={MOTION_QUICK}>
      <div className="disruption-alert-row">
        <motion.button
          className="disruption-alert"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          whileHover={{ y: -1 }}
          transition={MOTION_QUICK}
        >
          <TriangleAlert size={17} />
          <span>
            <strong>{disruption.headline}</strong>
            <small>{disruption.metadata} · {disruption.updated} · Click for details</small>
          </span>
          <ChevronDown className="alert-chevron" size={16} />
        </motion.button>
        <button className="text-link alert-link" onClick={() => onNavigate("/travel")}>
          See travel
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="disruption-details"
            className="disruption-details"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={MOTION_SWAP}
          >
            <span><strong>{disruption.routes[0]}</strong> Route affected by local congestion</span>
            <span><strong>{disruption.routes[1]}</strong> Short holds through the local corridor</span>
            <span><strong>Nearby stop</strong> {disruption.nearbyStop}</span>
            <small>{disruption.operationalDetail} · {disruption.updated}</small>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

interface TravelSummaryProps {
  activeTab: TravelSummaryTab;
  onTabChange: Dispatch<SetStateAction<TravelSummaryTab>>;
  travelRows: TravelRowsByMode;
  disruption: DisruptionState;
  onNavigate: NavigateHandler;
  embedded?: boolean;
}

const TravelSummary = React.forwardRef<HTMLElement, TravelSummaryProps>(function TravelSummary(
  { activeTab, onTabChange, travelRows, disruption, onNavigate, embedded = false },
  ref,
) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    setExpandedRow(null);
  }, [activeTab]);

  const activeRows: TravelRow[] =
    activeTab === "Buses" ? travelRows.buses :
    activeTab === "Trains" ? travelRows.trains :
    activeTab === "Roads" ? travelRows.roads :
    travelRows.nearby;
  const visibleRows = activeTab === "Buses" ? activeRows.slice(0, 4) : activeRows;
  const roadSnapshot = travelRows.roads[0];
  const sentence =
    activeTab === "Buses"
      ? "Live bus conditions with next arrivals and service state."
      : activeTab === "Trains"
        ? "Rail departures with on-time and delay state."
        : activeTab === "Roads"
          ? "Road conditions across the main city approaches."
          : "Most services are running. Bus delays are building around Gloucester Road and city-centre traffic is slightly slower than usual.";

  return (
    <motion.section
      ref={ref}
      className={`${embedded ? "" : "panel "}travel-summary ${embedded ? "embedded" : ""}`.trim()}
      tabIndex={-1}
      layout
      transition={MOTION_QUICK}
    >
      <div className="section-title-row">
        <h2>Getting around</h2>
        <button className="text-link" onClick={() => onNavigate("/travel")}>
          Open Travel
        </button>
      </div>
      <p className="status-sentence">{sentence}</p>
      {activeTab === "Nearby" ? (
        <div className="travel-overview-lines" aria-label="Travel overview">
          <div className="travel-overview-line">
            <Bus size={16} className="tone-amber" />
            <span>
              <strong>Public transport</strong>
              <small>{disruption.metadata}. {disruption.headline}</small>
            </span>
          </div>
          {roadSnapshot ? (
            <div className="travel-overview-line">
              <Car size={16} className={`tone-${roadSnapshot.tone}`} />
              <span>
                <strong>Roads</strong>
                <small>{roadSnapshot.title}: {roadSnapshot.secondary ?? roadSnapshot.note}</small>
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
      <SegmentedTabs
        tabs={TODAY_TRAVEL_TABS}
        active={activeTab}
        onChange={onTabChange}
      />
      <motion.div className="travel-tab-panel" layout>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${mode}-${activeTab}`}
            className="travel-rows travel-rows-list"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={MOTION_SWAP}
            layout
          >
            {visibleRows.map((row) => {
              const expanded = expandedRow === row.id;
              return (
                <motion.div
                  key={row.id}
                  className={`travel-row-shell ${expanded ? "expanded" : ""}`}
                  layout
                  transition={MOTION_QUICK}
                >
                  <motion.button
                    className={`travel-row-detail ${expanded ? "expanded" : ""}`}
                    onClick={() => setExpandedRow((value) => (value === row.id ? null : row.id))}
                    aria-expanded={expanded}
                    whileHover={{ y: -1 }}
                    transition={MOTION_QUICK}
                  >
                    <row.icon size={18} className={`tone-${row.tone}`} />
                    <span className="travel-row-copy">
                      <strong>{row.badge ? <span className="travel-badge">{row.badge}</span> : null}{row.title}</strong>
                      <small>{row.meta}</small>
                    </span>
                    <span className="travel-row-service">
                      <strong>{row.nextService ?? row.departure}</strong>
                      <small>{row.followingService ?? row.secondary ?? row.note}</small>
                    </span>
                    <em className={`travel-row-status ${row.tone}`}>
                      <strong>{row.value}</strong>
                      <small>{row.statusLabel ?? getSeverityLabel(row.severity)}</small>
                    </em>
                    <ChevronRight size={16} className="travel-row-chevron" />
                  </motion.button>
                  <AnimatePresence initial={false}>
                    {expanded ? (
                      <motion.div
                        key={`${row.id}-details`}
                        className="travel-row-expanded"
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 3 }}
                        transition={MOTION_SWAP}
                      >
                        <p>{row.summary}</p>
                        <span>{row.departure}</span>
                        <small>{row.note}</small>
                        <button className="text-link inline-link" onClick={() => onNavigate("/travel")}>
                          View full travel
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            {mode === "transport" && activeTab === "Buses" ? (
              <div className="travel-list-footer">
                <button className="text-link inline-link" onClick={() => onNavigate("/travel")}>
                  View all bus services
                </button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
});

interface WeatherSummaryProps {
  snapshot: WeatherSnapshot;
  hours: HourlyForecastHour[];
  airQualityNote: string | null;
  onNavigate: NavigateHandler;
  embedded?: boolean;
}

const WeatherSummary = React.forwardRef<HTMLElement, WeatherSummaryProps>(function WeatherSummary(
  { snapshot, hours, airQualityNote, onNavigate, embedded = false },
  ref,
) {
  const [selectedHour, setSelectedHour] = useState<HourlyForecastHour>(hours[0] ?? hourlyForecast[0]!);

  useEffect(() => {
    setSelectedHour(hours.find((hour) => hour.id === WEATHER_HIGHLIGHT_HOUR) ?? hours[0] ?? hourlyForecast[0]!);
  }, [hours]);

  return (
    <motion.section
      ref={ref}
      className={`${embedded ? "" : "panel "}weather-summary ${embedded ? "embedded" : ""}`.trim()}
      tabIndex={-1}
      layout
      transition={MOTION_QUICK}
    >
      <div className="section-title-row">
        <h2>Weather now</h2>
        <button className="text-link" onClick={() => onNavigate("/weather")}>
          View forecast
        </button>
      </div>
      <div className="weather-hero-line">
        {selectedHour.icon === "sun" ? <CloudSun size={48} /> : <CloudRain size={48} />}
        <div>
          <strong>{selectedHour.temp}°</strong>
          <span>{selectedHour.note}</span>
        </div>
      </div>
      <p className="weather-practical-line">{getWeatherPracticalLine(snapshot)}</p>
      <ForecastStrip
        hours={hours.slice(0, 6)}
        compact
        continuous
        selected={selectedHour.id}
        onSelect={setSelectedHour}
      />
      <div className="callout coral weather-advice">
        <Umbrella size={18} />
        <div>
          <strong>{snapshot.dryWindow}</strong>
          <span>{selectedHour.id === WEATHER_HIGHLIGHT_HOUR ? snapshot.dryAdvice : `${selectedHour.condition} with ${selectedHour.rain}% rain risk and feels like ${selectedHour.feelsLike}°.`}</span>
        </div>
      </div>
      {airQualityNote ? <p className="weather-support-line">{airQualityNote}</p> : null}
    </motion.section>
  );
});

interface WeatherPageProps {
  city: CityOption;
  forecastHours: HourlyForecastHour[];
  snapshot: WeatherSnapshot;
}

function WeatherPage({ city, forecastHours, snapshot }: WeatherPageProps) {
  const [selectedHour, setSelectedHour] = useState<HourlyForecastHour>(forecastHours[0] ?? hourlyForecast[0]!);

  useEffect(() => {
    setSelectedHour(forecastHours[0] ?? hourlyForecast[0]!);
  }, [forecastHours]);

  return (
    <div className="page-content fade-in">
      <section className="intro-grid">
        <div>
          <h1>{city.name} weather</h1>
          <p>Plan around the useful bits, not just the temperature.</p>
        </div>
        <CurrentWeatherCard weather={snapshot} onClick={() => {}} />
      </section>
      <section className="panel weather-page-panel">
        <ForecastStrip
          hours={forecastHours}
          selected={selectedHour.id}
          onSelect={setSelectedHour}
        />
      </section>
      <section className="forecast-grid">
        <div className="panel daily-panel">
          <h2>Daily forecast</h2>
          {dailyForecast.map((day) => (
            <div className="daily-row" key={day.day}>
              <span>{day.day}<small>{day.date}</small></span>
              <span><CloudRain size={17} /> {day.condition}</span>
              <strong>{day.high}°</strong>
              <div className="temp-line"><i style={{ width: `${day.range}%` }} /></div>
              <span>{day.low}°</span>
              <small>{day.rain}%</small>
            </div>
          ))}
        </div>
        <div className="weather-side">
          <div className="mini-stat-row">
            <MiniStat icon={Sun} label="UV index" value="Moderate" sub="4" tone="amber" />
            <MiniStat icon={Leaf} label="Pollen" value="Low" sub="clear" tone="green" />
            <MiniStat icon={Sun} label="Sunrise" value="04:56" sub="today" tone="amber" />
            <MiniStat icon={CloudSun} label="Sunset" value="21:23" sub="today" tone="amber" />
          </div>
          <div className="callout large">
            <CloudRain size={24} />
            <div>
              <strong>{selectedHour.note}</strong>
              <span>Selected hour: {selectedHour.label}. Best walking window stays 16:30-18:00.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface ExplorePageProps {
  city: CityOption;
  savedIds: SavedState;
  onToggleSaved: ToggleSavedHandler;
  onOpenDrawer: (item: SavedItem) => void;
}

function ExplorePage({ city, savedIds, onToggleSaved, onOpenDrawer }: ExplorePageProps) {
  const [mode, setMode] = useState<ExploreMode>("Events");
  const featured: SavedItem[] = mode === "Events" ? events.slice(0, 3) : places.slice(0, 3);

  return (
    <div className="page-content fade-in">
      <section className="page-heading">
        <h1>Explore {city.name}</h1>
        <p>Events, neighbourhoods and practical places worth knowing.</p>
      </section>
      <SegmentedTabs tabs={EXPLORE_TABS} active={mode} onChange={setMode} />
      <section className="explore-card-grid">
        {featured.map((item) => (
          <VisualCard
            key={item.id}
            item={item}
            saved={savedIds.includes(item.id)}
            onToggleSaved={onToggleSaved}
            onOpenDrawer={onOpenDrawer}
          />
        ))}
      </section>
      <section className="category-row">
        <Category icon={CalendarDays} label="Tonight" count="7 events" />
        <Category icon={Star} label="Free" count="5 picks" />
        <Category icon={Music} label="Music" count="12 events" />
        <Category icon={Compass} label="Food & drink" count="9 places" />
        <Category icon={Trees} label="Outdoors" count="6 ideas" />
      </section>
      <section className="popular-section">
        <div className="section-title-row">
          <h2>Popular places</h2>
          <button className="text-link" onClick={() => setMode("Places")}>
            See places
          </button>
        </div>
        <div className="place-strip">
          {places.map((place) => (
            <button key={place.id} className="place-card" onClick={() => onOpenDrawer(place)}>
              <img src={place.image} alt="" />
              <span>{place.title}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

interface TravelPageProps {
  city: CityOption;
}

function TravelPage({ city }: TravelPageProps) {
  const [tab, setTab] = useState<TravelPageTab>("Nearby");
  const [selectedStop, setSelectedStop] = useState<TransportStop>(stops[1]!);

  return (
    <div className="page-content fade-in">
      <section className="page-heading travel-heading">
        <div>
          <h1>Travel in {city.name}</h1>
          <p>Live local transport, road and disruption status.</p>
        </div>
        <span className="micro-label">Demo transport data</span>
      </section>
      <SegmentedTabs tabs={TRAVEL_PAGE_TABS} active={tab} onChange={setTab} />
      <section className="travel-layout">
        <div className="panel stop-list">
          <div className="section-title-row">
            <h2>Nearby stops</h2>
            <button className="text-link">Refresh</button>
          </div>
          {stops.map((stop) => (
            <button
              key={stop.id}
              className={`stop-button ${selectedStop.id === stop.id ? "active" : ""}`}
              onClick={() => setSelectedStop(stop)}
            >
              {stop.kind === "train" ? <Train size={19} /> : <Bus size={19} />}
              <span>
                <strong>{stop.name}</strong>
                <small>{stop.walk} walk · {stop.area}</small>
              </span>
              <em className={stop.tone}>{stop.next}</em>
            </button>
          ))}
        </div>
        <TravelMap selectedStop={selectedStop} />
        <div className="panel departures-card">
          <h2>{selectedStop.name}</h2>
          <p>{selectedStop.area} · {selectedStop.walk} walk</p>
          <span className="micro-label">Mock next departures</span>
          {trainDepartures.map((departure) => (
            <InfoRow
              key={departure.id}
              icon={selectedStop.kind === "train" ? Train : Bus}
              title={departure.destination}
              meta={departure.platform}
              value={departure.time}
              tone={departure.tone}
            />
          ))}
        </div>
      </section>
      <section className="panel updates-panel">
        <div className="section-title-row">
          <h2>Travel updates</h2>
          <button className="text-link">View all updates</button>
        </div>
        <div className="updates-grid">
          {travelUpdates.map((update) => (
            <div key={update.title} className={`update-item ${update.tone}`}>
              <span />
              <strong>{update.title}</strong>
              <p>{update.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

interface SavedPageProps {
  savedItems: SavedItem[];
  savedIds: SavedState;
  onToggleSaved: ToggleSavedHandler;
  onNavigate: NavigateHandler;
  onOpenDrawer: (item: SavedItem) => void;
}

function SavedPage({ savedItems, savedIds, onToggleSaved, onNavigate, onOpenDrawer }: SavedPageProps) {
  const savedEvents = savedItems.filter((item) => item.type === "event");
  const savedPlaces = savedItems.filter((item) => item.type === "place");

  return (
    <div className="page-content fade-in">
      <section className="page-heading">
        <h1>Saved</h1>
        <p>Events and places you have kept for later.</p>
      </section>
      {savedItems.length === 0 ? (
        <div className="panel empty-state">
          <Bookmark size={26} />
          <strong>No saved items yet</strong>
          <p>Keep an event or place from Explore and it will appear here.</p>
          <PrimaryButton onClick={() => onNavigate("/explore")}>Open Explore</PrimaryButton>
        </div>
      ) : (
        <div className="saved-grid">
          <SavedGroup
            title="Events"
            items={savedEvents}
            savedIds={savedIds}
            onToggleSaved={onToggleSaved}
            onOpenDrawer={onOpenDrawer}
          />
          <SavedGroup
            title="Places"
            items={savedPlaces}
            savedIds={savedIds}
            onToggleSaved={onToggleSaved}
            onOpenDrawer={onOpenDrawer}
          />
        </div>
      )}
    </div>
  );
}

interface SavedGroupProps {
  title: string;
  items: SavedItem[];
  savedIds: SavedState;
  onToggleSaved: ToggleSavedHandler;
  onOpenDrawer: (item: SavedItem) => void;
}

function SavedGroup({ title, items, savedIds, onToggleSaved, onOpenDrawer }: SavedGroupProps) {
  return (
    <section className="panel side-list">
      <h2>{title}</h2>
      {items.length === 0 ? <p className="muted-copy">Nothing saved in this group.</p> : null}
      {items.map((item) => (
        <EventRow
          key={item.id}
          event={item}
          saved={savedIds.includes(item.id)}
          onToggleSaved={onToggleSaved}
          onOpenDrawer={onOpenDrawer}
        />
      ))}
    </section>
  );
}

interface FeaturedEventProps {
  event: EventItem;
  saved: boolean;
  onToggleSaved: ToggleSavedHandler;
  onOpenDrawer: (item: SavedItem) => void;
  embedded?: boolean;
}

function FeaturedEvent({ event, saved, onToggleSaved, onOpenDrawer, embedded = false }: FeaturedEventProps) {
  return (
    <article className={`${embedded ? "" : "panel "}featured-event ${embedded ? "embedded" : ""}`.trim()}>
      <motion.button
        className="featured-media-hit"
        onClick={() => onOpenDrawer(event)}
        aria-label={`Open ${event.title}`}
      >
        <motion.img layoutId={`drawer-image-${event.id}`} src={event.image} alt="" />
      </motion.button>
      <div className="featured-copy">
        <span className="event-meta">{event.date}</span>
        <motion.button className="featured-title-hit" onClick={() => onOpenDrawer(event)}>
          <h2>{event.title}</h2>
        </motion.button>
        <p className="featured-description">{event.description}</p>
        <p><MapPin size={14} /> {event.venue} · {event.distance}</p>
        <p><CalendarDays size={14} /> {event.time}</p>
        <div className="featured-meta-stack">
          <span>{event.ticketInfo}</span>
          <span>{event.availability}</span>
        </div>
        <div className="button-row">
          <PrimaryButton onClick={() => onOpenDrawer(event)}>View details</PrimaryButton>
          <SaveButton item={event} saved={saved} onToggleSaved={onToggleSaved} />
        </div>
      </div>
    </article>
  );
}

interface EventRowProps {
  event: SavedItem;
  saved: boolean;
  onToggleSaved: ToggleSavedHandler;
  onOpenDrawer: (item: SavedItem) => void;
}

function EventRow({ event, saved, onToggleSaved, onOpenDrawer }: EventRowProps) {
  return (
    <div className="event-row">
      <motion.button
        className="event-row-main"
        onClick={() => onOpenDrawer(event)}
        whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
        transition={MOTION_QUICK}
      >
        <motion.img layoutId={`drawer-image-${event.id}`} src={event.image} alt="" />
        <span className="event-row-copy">
          <strong>{event.title}</strong>
          {event.type === "event" ? (
            <>
              <b>{event.time}</b>
              <small>{event.venue}</small>
            </>
          ) : (
            <>
              <b>{event.category}</b>
              <small>{event.neighbourhood}</small>
            </>
          )}
        </span>
      </motion.button>
      <SaveButton item={event} saved={saved} onToggleSaved={onToggleSaved} />
    </div>
  );
}

interface VisualCardProps {
  item: SavedItem;
  saved: boolean;
  onToggleSaved: ToggleSavedHandler;
  onOpenDrawer: (item: SavedItem) => void;
}

function VisualCard({ item, saved, onToggleSaved, onOpenDrawer }: VisualCardProps) {
  return (
    <article className="visual-card">
      <img src={item.image} alt="" />
      <div>
        <span className="event-meta">{item.date || item.category}</span>
        <h2>{item.title}</h2>
        <p><MapPin size={14} /> {item.venue || item.neighbourhood}</p>
        <p><CalendarDays size={14} /> {item.time || item.hours}</p>
      </div>
      <button className="card-hit" onClick={() => onOpenDrawer(item)} aria-label={`Open ${item.title}`} />
      <SaveButton item={item} saved={saved} onToggleSaved={onToggleSaved} />
    </article>
  );
}

interface PrimaryButtonProps {
  children: ReactNode;
  onClick: () => void;
}

function PrimaryButton({ children, onClick }: PrimaryButtonProps) {
  return (
    <motion.button className="primary-button" onClick={onClick} whileTap={{ scale: 0.98 }} transition={MOTION_QUICK}>
      {children}
    </motion.button>
  );
}

interface SaveButtonProps {
  item: SavedItem;
  saved: boolean;
  onToggleSaved: ToggleSavedHandler;
}

function SaveButton({ item, saved, onToggleSaved }: SaveButtonProps) {
  return (
    <button
      className={`save-button ${saved ? "saved" : ""}`}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onToggleSaved(item);
      }}
      aria-label={saved ? `Unsave ${item.title}` : `Save ${item.title}`}
    >
      {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
    </button>
  );
}

interface DetailDrawerProps {
  item: DrawerItem;
  cityName: string;
  saved: boolean;
  onToggleSaved: ToggleSavedHandler;
  onClose: () => void;
}

function DetailDrawer({ item, cityName, saved, onToggleSaved, onClose }: DetailDrawerProps) {
  return (
    <Dialog.Root open={Boolean(item)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AnimatePresence>
        {item ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SHEET_TRANSITION}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.aside
                className="detail-drawer"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={SHEET_TRANSITION}
              >
                <div className="drawer-topbar">
                  <Dialog.Title className="sr-only">{item.title}</Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="drawer-close" aria-label="Close details">
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>
                <motion.img layoutId={`drawer-image-${item.id}`} src={item.image} alt="" />
                <span className="event-meta">{item.type === "event" ? item.date : item.category}</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <div className="drawer-facts">
                  <span><MapPin size={15} /> {item.type === "event" ? item.venue : item.neighbourhood}</span>
                  <span><CalendarDays size={15} /> {item.type === "event" ? item.time : item.hours}</span>
                  <span><Compass size={15} /> {item.type === "event" ? `${item.distance} from central ${cityName}` : `${item.neighbourhood} neighbourhood`}</span>
                </div>
                <div className="drawer-ticket-placeholder">
                  <strong>{item.type === "event" ? item.ticketInfo : "Visit info"}</strong>
                  <span>{item.type === "event" ? item.availability : "Website placeholder until live venue links are connected."}</span>
                </div>
                <div className="button-row">
                  <PrimaryButton onClick={() => {}}>
                    <ArrowUpRight size={15} /> Tickets / website
                  </PrimaryButton>
                  <SaveButton item={item} saved={saved} onToggleSaved={onToggleSaved} />
                </div>
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

interface SegmentedTabsProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
}

function SegmentedTabs<T extends string>({ tabs, active, onChange }: SegmentedTabsProps<T>) {
  return (
    <div className="segmented-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={active === tab}
          className={active === tab ? "active" : ""}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

interface ForecastStripProps {
  hours: HourlyForecastHour[];
  compact?: boolean;
  continuous?: boolean;
  selected?: string;
  onSelect?: (hour: HourlyForecastHour) => void;
}

function ForecastStrip({
  hours,
  compact = false,
  continuous = false,
  selected,
  onSelect,
}: ForecastStripProps) {
  return (
    <div className={`forecast-strip ${compact ? "compact" : ""} ${continuous ? "continuous" : ""}`}>
      {hours.map((hour) => (
        <Tooltip.Root key={hour.id}>
          <Tooltip.Trigger asChild>
            <button
              className={`${selected === hour.id ? "selected" : ""} ${hour.id === WEATHER_HIGHLIGHT_HOUR ? "current" : ""}`.trim()}
              onClick={() => onSelect?.(hour)}
            >
              <span>{hour.label}</span>
              {hour.icon === "sun" ? <CloudSun size={23} /> : <CloudRain size={23} />}
              <strong>{hour.temp}°</strong>
              <small>{hour.rain}%</small>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="hour-tooltip" sideOffset={8}>
              <strong>{hour.condition}</strong>
              <span>{hour.rain}% rain</span>
              <span>{hour.wind}</span>
              <span>Feels like {hour.feelsLike}°</span>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      ))}
    </div>
  );
}

interface InfoRowProps {
  icon: LucideIcon;
  title: string;
  meta: string;
  value: string;
  tone: Tone;
}

function InfoRow({ icon: Icon, title, meta, value, tone }: InfoRowProps) {
  return (
    <div className="info-row">
      <Icon size={19} className={`tone-${tone}`} />
      <span>
        <strong>{title}</strong>
        <small>{meta}</small>
      </span>
      <em className={tone}>{value}</em>
    </div>
  );
}

interface MiniStatProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  tone: Tone;
}

function MiniStat({ icon: Icon, label, value, sub, tone }: MiniStatProps) {
  return (
    <div className="mini-stat">
      <Icon size={18} className={`tone-${tone}`} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

interface CategoryProps {
  icon: LucideIcon;
  label: string;
  count: string;
}

function Category({ icon: Icon, label, count }: CategoryProps) {
  return (
    <button className="category">
      <Icon size={18} />
      <span>{label}</span>
      <small>{count}</small>
    </button>
  );
}

interface TravelMapProps {
  selectedStop: TransportStop;
}

function TravelMap({ selectedStop }: TravelMapProps) {
  return (
    <div className="map-panel panel" aria-label="Static local network map">
      <div className="map-grid" />
      <svg viewBox="0 0 640 420" aria-hidden="true">
        <path d="M84 315 C180 238 229 250 302 178 S437 107 561 78" />
        <path d="M122 88 C220 138 273 178 318 244 S443 312 545 330" />
        <path d="M252 372 C256 278 312 236 390 196 S483 148 566 184" />
      </svg>
      {stops.map((stop, index) => (
        <button
          key={stop.id}
          className={`map-marker marker-${index + 1} ${selectedStop.id === stop.id ? "active" : ""}`}
        >
          <MapPin size={18} />
          <span>{stop.name}</span>
        </button>
      ))}
      <span className="map-label harbour">Harbourside</span>
      <span className="map-label old">Old Market</span>
      <span className="map-label temple">Temple Meads</span>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
