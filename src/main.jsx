import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  Bus,
  CalendarDays,
  Car,
  ChevronDown,
  CloudRain,
  CloudSun,
  Compass,
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
import {
  cityOptions,
  dailyForecast,
  events,
  hourlyForecast,
  places,
  pulseItems,
  roadRows,
  stops,
  trainDepartures,
  travelUpdates,
} from "./mockData.js";
import "./styles.css";

const navItems = [
  { label: "Today", path: "/today" },
  { label: "Weather", path: "/weather" },
  { label: "Explore", path: "/explore" },
  { label: "Travel", path: "/travel" },
  { label: "Saved", path: "/saved" },
];

const iconMap = {
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

function getRoute() {
  const hashPath = window.location.hash.replace(/^#/, "");
  if (!hashPath) return "/today";
  return navItems.some((item) => item.path === hashPath) ? hashPath : "/today";
}

function useLocalStorageState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
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
  const [city, setCity] = useLocalStorageState("citynow-city", cityOptions[0]);
  const [savedIds, setSavedIds] = useLocalStorageState("citynow-saved", []);
  const [drawerItem, setDrawerItem] = useState(null);

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute());
    if (!window.location.hash) {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}#/today`);
    }
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
    setRoute(path);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const toggleSaved = (item) => {
    setSavedIds((ids) =>
      ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id],
    );
  };

  const savedItems = useMemo(() => {
    const allItems = [...events, ...places];
    return allItems.filter((item) => savedIds.includes(item.id));
  }, [savedIds]);

  return (
    <div className="page-shell">
      <div className="app-surface">
        <TopNav
          route={route}
          city={city}
          onCityChange={setCity}
          onNavigate={navigate}
        />
        <main className="route-frame">
          {route === "/today" && (
            <TodayPage
              city={city}
              onNavigate={navigate}
              savedIds={savedIds}
              onToggleSaved={toggleSaved}
              onOpenDrawer={setDrawerItem}
            />
          )}
          {route === "/weather" && <WeatherPage city={city} />}
          {route === "/explore" && (
            <ExplorePage
              city={city}
              savedIds={savedIds}
              onToggleSaved={toggleSaved}
              onOpenDrawer={setDrawerItem}
            />
          )}
          {route === "/travel" && <TravelPage city={city} />}
          {route === "/saved" && (
            <SavedPage
              savedItems={savedItems}
              savedIds={savedIds}
              onToggleSaved={toggleSaved}
              onNavigate={navigate}
              onOpenDrawer={setDrawerItem}
            />
          )}
        </main>
      </div>
      <DetailDrawer
        item={drawerItem}
        saved={drawerItem ? savedIds.includes(drawerItem.id) : false}
        onToggleSaved={toggleSaved}
        onClose={() => setDrawerItem(null)}
      />
    </div>
  );
}

function TopNav({ route, city, onCityChange, onNavigate }) {
  const [open, setOpen] = useState(false);

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
          </button>
        ))}
      </nav>
      <div className="nav-actions">
        <div className="city-menu">
          <button className="city-button" onClick={() => setOpen((value) => !value)}>
            <MapPin size={14} />
            <span>{city.name}, UK</span>
            <ChevronDown size={14} />
          </button>
          {open && (
            <div className="city-dropdown">
              {cityOptions.map((option) => (
                <button
                  key={option.name}
                  className={option.name === city.name ? "selected" : ""}
                  onClick={() => {
                    onCityChange(option);
                    setOpen(false);
                  }}
                >
                  <span>{option.name}</span>
                  <small>{option.tagline}</small>
                </button>
              ))}
            </div>
          )}
        </div>
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

function TodayPage({ city, onNavigate, savedIds, onToggleSaved, onOpenDrawer }) {
  const [selectedPulse, setSelectedPulse] = useState(pulseItems[0].id);
  const [travelTab, setTravelTab] = useState("Nearby");
  const [travelMode, setTravelMode] = useState("transport");
  const [focusTarget, setFocusTarget] = useState(null);
  const travelRef = useRef(null);
  const weatherRef = useRef(null);
  const featured = events[0];
  const otherEvents = events.slice(1, 4);

  const focusModule = (target) => {
    setFocusTarget(target);
    const ref = target === "weather" ? weatherRef : travelRef;
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      ref.current?.focus({ preventScroll: true });
    }, 20);
    window.setTimeout(() => setFocusTarget(null), 900);
  };

  const handlePulseSelect = (item) => {
    setSelectedPulse(item.id);
    if (item.id === "transport") {
      setTravelMode("transport");
      setTravelTab("Nearby");
      focusModule("travel");
    }
    if (item.id === "roads") {
      setTravelMode("roads");
      focusModule("travel");
    }
    if (item.id === "weather") {
      focusModule("weather");
    }
    if (item.id === "air") {
      setTravelMode("air");
      focusModule("travel");
    }
  };

  return (
    <div className="page-content fade-in">
      <section className="intro-grid">
        <div>
          <h1>{getGreeting()}, {city.name}</h1>
          <p>A useful read on the city before you head out.</p>
        </div>
        <CurrentWeatherCard onClick={() => onNavigate("/weather")} />
      </section>

      <section className="section-block">
        <h2>City pulse</h2>
        <div className="pulse-grid">
          {pulseItems.map((item) => (
            <PulseStatusCard
              key={item.id}
              item={item}
              selected={selectedPulse === item.id}
              onClick={() => handlePulseSelect(item)}
            />
          ))}
        </div>
        <DisruptionAlert onNavigate={onNavigate} />
      </section>

      <section className="today-main-grid">
        <TravelSummary
          ref={travelRef}
          mode={travelMode}
          highlighted={focusTarget === "travel"}
          activeTab={travelTab}
          onTabChange={setTravelTab}
          onNavigate={onNavigate}
        />
        <WeatherSummary
          ref={weatherRef}
          highlighted={focusTarget === "weather"}
          onNavigate={onNavigate}
        />
      </section>

      <section className="tonight-grid">
        <FeaturedEvent
          event={featured}
          saved={savedIds.includes(featured.id)}
          onToggleSaved={onToggleSaved}
          onOpenDrawer={onOpenDrawer}
        />
        <div className="side-list panel">
          <div className="section-title-row">
            <h2>Tonight in Bristol</h2>
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

function CurrentWeatherCard({ onClick }) {
  return (
    <button className="weather-mini" onClick={onClick}>
      <CloudRain className="weather-cloud" size={42} />
      <span className="weather-temp">14°</span>
      <span className="weather-meta">Light rain</span>
      <span className="weather-feels">Feels like 12°</span>
    </button>
  );
}

function PulseStatusCard({ item, selected, onClick }) {
  const Icon = iconMap[item.icon];
  return (
    <button
      className={`pulse-card ${item.tone} ${selected ? "selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="pulse-icon"><Icon size={22} /></span>
      <span className="pulse-label">{item.label}</span>
      <strong>{item.status}</strong>
      <span>{item.detail}</span>
    </button>
  );
}

function DisruptionAlert({ onNavigate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="disruption-wrap">
      <button
        className="disruption-alert"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <TriangleAlert size={17} />
        <span>
          <strong>Buses are moving, but Gloucester Road is slower than usual.</strong>
          <small>70, 72 and Temple Gate affected · Last updated 4 min ago · Click for details</small>
        </span>
        <b className="alert-detail-pill">Details</b>
        <em
          onClick={(event) => {
            event.stopPropagation();
            onNavigate("/travel");
          }}
        >
          See travel
        </em>
        <ChevronDown className="alert-chevron" size={16} />
      </button>
      {expanded && (
        <div className="disruption-details">
          <span><strong>70</strong> Temple Gate to Gloucester Road</span>
          <span><strong>72</strong> Redcliffe Way short holds</span>
          <span><strong>Nearby stop</strong> Temple Gate, 1 min walk</span>
          <small>Last updated 4 min ago</small>
        </div>
      )}
    </div>
  );
}

const TravelSummary = React.forwardRef(function TravelSummary(
  { mode, highlighted, activeTab, onTabChange, onNavigate },
  ref,
) {
  const [expandedRow, setExpandedRow] = useState(null);
  const nearbyRows = [
    { id: "near-temple-meads", icon: Train, title: "Temple Meads Station", meta: "Train services", value: "3 min", tone: "green", detail: "Next useful departure: Bath Spa, platform 4." },
    { id: "near-temple-gate", icon: Bus, title: "Temple Gate", meta: "Routes 70, 72, M1", value: "1 min", tone: "green", detail: "Closest stop for central bus services." },
    { id: "near-redcliffe", icon: Bus, title: "Redcliffe Way", meta: "Routes 8, 70, 72", value: "4 min", tone: "amber", detail: "Route 72 may hold briefly near Zetland Road." },
  ];
  const busRows = [
    { id: "bus-70", icon: Bus, title: "70 to UWE Frenchay", meta: "Gloucester Road delays", value: "6 min", tone: "amber", detail: "Minor delay northbound after roadworks." },
    { id: "bus-72", icon: Bus, title: "72 to Temple Meads", meta: "Short holds near Zetland Road", value: "9 min", tone: "amber", detail: "Service running, but slower than usual." },
    { id: "bus-8", icon: Bus, title: "8 to Clifton", meta: "Normal service", value: "4 min", tone: "green", detail: "No major disruption reported." },
    { id: "bus-m1", icon: Bus, title: "M1 to Cribbs Causeway", meta: "Normal service", value: "7 min", tone: "green", detail: "Metrobus running close to timetable." },
  ];
  const trainRows = [
    { id: "train-bath", icon: Train, title: "Bath Spa", meta: "Temple Meads platform 4", value: "14:18", tone: "green", detail: "Reported on time. Demo timetable." },
    { id: "train-cardiff", icon: Train, title: "Cardiff Central", meta: "Temple Meads platform 7", value: "14:27", tone: "green", detail: "Reported on time. Demo timetable." },
    { id: "train-weston", icon: Train, title: "Weston-super-Mare", meta: "Temple Meads platform 2", value: "14:40", tone: "amber", detail: "Minor delay possible. Demo timetable." },
  ];
  const roadsRows = [
    { id: "road-a38", icon: Car, title: "A38", meta: "Gloucester Road slow northbound", value: "Busy", tone: "amber", detail: "Expect slower movement around Zetland Road." },
    { id: "road-centre", icon: Route, title: "Central bus lanes", meta: "Busiest through Broadmead", value: "Slow", tone: "amber", detail: "Bus lanes and taxi traffic are moving steadily but slowly." },
    { id: "road-m32", icon: Car, title: "M32", meta: "Main approach clear", value: "Clear", tone: "green", detail: "No major queues reported into the city." },
  ];
  const airRows = [
    { id: "air-centre", icon: Leaf, title: "Central Bristol", meta: "Low pollution, comfortable walking", value: "Good", tone: "green", detail: "No unusual air quality alerts." },
    { id: "air-harbour", icon: Leaf, title: "Harbourside", meta: "Breezy after showers", value: "Good", tone: "green", detail: "Good conditions for short outdoor plans." },
    { id: "air-cycle", icon: Leaf, title: "Cycling note", meta: "Wet roads, clean air", value: "Fine", tone: "green", detail: "Visibility is good; watch wet surfaces." },
  ];
  const activeRows =
    mode === "roads" ? roadsRows :
    mode === "air" ? airRows :
    activeTab === "Buses" ? busRows :
    activeTab === "Trains" ? trainRows :
    activeTab === "Roads" ? roadsRows :
    nearbyRows;
  const title = mode === "roads" ? "Roads now" : mode === "air" ? "Air quality now" : "Travel now";
  const sentence = mode === "roads"
    ? "Slow on the A38 and around central bus lanes. No major road closures."
    : mode === "air"
      ? "Air quality is good across Bristol. Rain has kept pollution low."
      : "Most services are running. Expect bus delays around Gloucester Road.";
  return (
    <section
      ref={ref}
      className={`panel travel-summary ${highlighted ? "module-focus" : ""}`}
      tabIndex={-1}
    >
      <div className="section-title-row">
        <h2>{title}</h2>
        <button className="text-link" onClick={() => onNavigate("/travel")}>
          Open Travel
        </button>
      </div>
      <p className="status-sentence">{sentence}</p>
      {mode === "transport" && (
        <SegmentedTabs
          tabs={["Nearby", "Buses", "Trains", "Roads"]}
          active={activeTab}
          onChange={onTabChange}
        />
      )}
      <div className="travel-tab-panel">
        <div className="travel-rows travel-rows-list">
          {activeRows.map((row) => (
            <button
              key={row.id}
              className={`travel-row-detail ${expandedRow === row.id ? "expanded" : ""}`}
              onClick={() => setExpandedRow((value) => (value === row.id ? null : row.id))}
              aria-expanded={expandedRow === row.id}
            >
              <row.icon size={18} className={`tone-${row.tone}`} />
              <span>
                <strong>{row.title}</strong>
                <small>{row.meta}</small>
                {expandedRow === row.id && <b>{row.detail}</b>}
              </span>
              <em className={row.tone}>{row.value}<small>Details</small></em>
            </button>
          ))}
        </div>
        {false && (
          <>
        {activeTab === "Nearby" && (
          <div className="travel-rows">
            {stops.slice(0, 3).map((stop) => (
              <InfoRow
                key={stop.id}
                icon={stop.kind === "train" ? Train : Bus}
                title={stop.name}
                meta={`${stop.walk} walk · ${stop.area}`}
                value={stop.next}
                tone={stop.tone}
              />
            ))}
          </div>
        )}
        {activeTab === "Buses" && (
          <div className="travel-rows">
            {["70", "72", "8"].map((route) => (
              <InfoRow
                key={route}
                icon={Bus}
                title={`Route ${route}`}
                meta="Gloucester Road delays after roadworks"
                value="6-12 min"
                tone="amber"
              />
            ))}
          </div>
        )}
        {activeTab === "Trains" && (
          <div className="travel-rows">
            <span className="micro-label">Demo timetable</span>
            {trainDepartures.slice(0, 3).map((train) => (
              <InfoRow
                key={train.id}
                icon={Train}
                title={train.destination}
                meta={train.platform}
                value={train.time}
                tone={train.tone}
              />
            ))}
          </div>
        )}
        {activeTab === "Roads" && (
          <div className="travel-rows">
            {roadRows.map((road) => (
              <InfoRow
                key={road.name}
                icon={Car}
                title={road.name}
                meta={road.note}
                value={road.status}
                tone={road.tone}
              />
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </section>
  );
});

const WeatherSummary = React.forwardRef(function WeatherSummary({ highlighted, onNavigate }, ref) {
  return (
    <section
      ref={ref}
      className={`panel weather-summary ${highlighted ? "module-focus" : ""}`}
      tabIndex={-1}
    >
      <div className="section-title-row">
        <h2>Today's weather</h2>
        <button className="text-link" onClick={() => onNavigate("/weather")}>
          View forecast
        </button>
      </div>
      <div className="weather-hero-line">
        <CloudRain size={48} />
        <div>
          <strong>14°</strong>
          <span>Light rain easing later</span>
        </div>
      </div>
      <ForecastStrip hours={hourlyForecast.slice(0, 6)} compact continuous />
      <div className="callout coral">
        <Umbrella size={18} />
        <div>
          <strong>Best dry window: 16:30-18:00</strong>
          <span>Good timing for a walk or cycle across town.</span>
        </div>
      </div>
    </section>
  );
});

function WeatherPage({ city }) {
  const [selectedHour, setSelectedHour] = useState(hourlyForecast[0]);

  return (
    <div className="page-content fade-in">
      <section className="intro-grid">
        <div>
          <h1>{city.name} weather</h1>
          <p>Plan around the useful bits, not just the temperature.</p>
        </div>
        <CurrentWeatherCard onClick={() => {}} />
      </section>
      <section className="panel weather-page-panel">
        <ForecastStrip
          hours={hourlyForecast}
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

function ExplorePage({ city, savedIds, onToggleSaved, onOpenDrawer }) {
  const [mode, setMode] = useState("Events");
  const featured = mode === "Events" ? events.slice(0, 3) : places.slice(0, 3);

  return (
    <div className="page-content fade-in">
      <section className="page-heading">
        <h1>Explore {city.name}</h1>
        <p>Events, neighbourhoods and practical places worth knowing.</p>
      </section>
      <SegmentedTabs tabs={["Events", "Places"]} active={mode} onChange={setMode} />
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

function TravelPage({ city }) {
  const [tab, setTab] = useState("Nearby");
  const [selectedStop, setSelectedStop] = useState(stops[1]);

  return (
    <div className="page-content fade-in">
      <section className="page-heading travel-heading">
        <div>
          <h1>Travel in {city.name}</h1>
          <p>Live local transport, road and disruption status.</p>
        </div>
        <span className="micro-label">Demo transport data</span>
      </section>
      <SegmentedTabs tabs={["Nearby", "Bus", "Train", "Road"]} active={tab} onChange={setTab} />
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

function SavedPage({ savedItems, savedIds, onToggleSaved, onNavigate, onOpenDrawer }) {
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
          <button className="primary-button" onClick={() => onNavigate("/explore")}>
            Open Explore
          </button>
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

function SavedGroup({ title, items, savedIds, onToggleSaved, onOpenDrawer }) {
  return (
    <section className="panel side-list">
      <h2>{title}</h2>
      {items.length === 0 && <p className="muted-copy">Nothing saved in this group.</p>}
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

function FeaturedEvent({ event, saved, onToggleSaved, onOpenDrawer }) {
  return (
    <article className="featured-event panel">
      <img src={event.image} alt="" />
      <div className="featured-copy">
        <span className="event-meta">{event.date}</span>
        <h2>{event.title}</h2>
        <p><MapPin size={14} /> {event.venue}</p>
        <p><CalendarDays size={14} /> {event.time}</p>
        <div className="button-row">
          <button className="primary-button" onClick={() => onOpenDrawer(event)}>
            View details
          </button>
          <SaveButton item={event} saved={saved} onToggleSaved={onToggleSaved} />
        </div>
      </div>
    </article>
  );
}

function EventRow({ event, saved, onToggleSaved, onOpenDrawer }) {
  return (
    <div className="event-row">
      <button className="event-row-main" onClick={() => onOpenDrawer(event)}>
        <img src={event.image} alt="" />
        <span>
          <strong>{event.title}</strong>
          <small>{event.time} · {event.venue}</small>
        </span>
      </button>
      <SaveButton item={event} saved={saved} onToggleSaved={onToggleSaved} />
    </div>
  );
}

function VisualCard({ item, saved, onToggleSaved, onOpenDrawer }) {
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

function SaveButton({ item, saved, onToggleSaved }) {
  return (
    <button
      className={`save-button ${saved ? "saved" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggleSaved(item);
      }}
      aria-label={saved ? `Unsave ${item.title}` : `Save ${item.title}`}
    >
      {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
    </button>
  );
}

function DetailDrawer({ item, saved, onToggleSaved, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!item) return undefined;
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="detail-drawer" onMouseDown={(event) => event.stopPropagation()} aria-modal="true">
        <button ref={closeRef} className="drawer-close" onClick={onClose} aria-label="Close details">
          <X size={18} />
        </button>
        <img src={item.image} alt="" />
        <span className="event-meta">{item.date || item.category}</span>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <div className="drawer-facts">
          <span><MapPin size={15} /> {item.venue || item.neighbourhood}</span>
          <span><CalendarDays size={15} /> {item.time || item.hours}</span>
        </div>
        <div className="button-row">
          <button className="primary-button">
            <ExternalLink size={15} /> Open listing
          </button>
          <SaveButton item={item} saved={saved} onToggleSaved={onToggleSaved} />
        </div>
      </aside>
    </div>
  );
}

function SegmentedTabs({ tabs, active, onChange }) {
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

function ForecastStrip({ hours, compact = false, continuous = false, selected, onSelect }) {
  return (
    <div className={`forecast-strip ${compact ? "compact" : ""} ${continuous ? "continuous" : ""}`}>
      {hours.map((hour) => (
        <button
          key={hour.id}
          className={selected === hour.id ? "selected" : ""}
          onClick={() => onSelect?.(hour)}
        >
          <span>{hour.label}</span>
          {hour.icon === "sun" ? <CloudSun size={23} /> : <CloudRain size={23} />}
          <strong>{hour.temp}°</strong>
          <small>{hour.rain}%</small>
        </button>
      ))}
    </div>
  );
}

function InfoRow({ icon: Icon, title, meta, value, tone }) {
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

function MiniStat({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="mini-stat">
      <Icon size={18} className={`tone-${tone}`} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function Category({ icon: Icon, label, count }) {
  return (
    <button className="category">
      <Icon size={18} />
      <span>{label}</span>
      <small>{count}</small>
    </button>
  );
}

function TravelMap({ selectedStop }) {
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

createRoot(document.getElementById("root")).render(<App />);
