import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgePercent,
  BedDouble,
  Bus,
  CalendarDays,
  Car,
  ChartPie,
  Check,
  ChevronDown,
  CloudSun,
  Compass,
  DollarSign,
  Gem,
  Hotel,
  Loader2,
  MapPinned,
  MessageCircle,
  Minus,
  PackageCheck,
  Plane,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Sun,
  Train,
  Utensils,
  Users,
  WalletCards,
} from 'lucide-react';

let API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
// Remove trailing slashes and clean up common configuration path errors
API_BASE = API_BASE.trim().replace(/\/+$/, '');
if (API_BASE.endsWith('/generate-plan') || API_BASE.endsWith('/chat-trip') || API_BASE.endsWith('/estimate-transport')) {
  API_BASE = API_BASE.substring(0, API_BASE.lastIndexOf('/'));
}

const TRAVEL_THEMES = ['Adventure', 'Relaxing', 'Cultural', 'Foodie', 'Romantic'];
const INTERESTS_OPTIONS = [
  'Sightseeing',
  'Shopping',
  'Hiking',
  'Museums',
  'Nightlife',
  'Beaches',
  'Local Food',
  'Theme Parks',
  'Art Galleries',
  'Nature & Wildlife',
  'Photography',
  'Local Experiences',
];
const COMPANIONS = ['Solo', 'Couple', 'Family', 'Friends'];
const STAYS = ['Hotel', 'Airbnb', 'Hostel', 'Resort'];
const DIETS = ['Vegetarian', 'Vegan', 'Non-Veg', 'Halal', 'Kosher', 'Gluten Free'];
const WEATHER = ['Sunny', 'Cold', 'Rainy', "Doesn't Matter"];
const SEASONS = ['No Preference', 'Spring', 'Summer', 'Autumn', 'Winter'];
const LOADING_STEPS = [
  'Collecting route, stay, weather, and offer data',
  'Comparing transport modes and tradeoffs',
  'Optimizing cost across the whole trip',
  'Writing links, route maps, checklist, and suggestions',
];

const BASE_PACKING_ITEMS = [
  'Government ID / passport',
  'Phone charger and power bank',
  'Weather-suitable clothes',
  'Comfortable walking shoes',
  'Reusable water bottle',
  'Basic medicines',
  'Cards and emergency cash',
];

const MODE_ICONS = {
  Flight: Plane,
  Train: Train,
  Bus: Bus,
  'Self Drive': Car,
  Taxi: Car,
  Metro: Train,
};

const formatINR = (value) => new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
}).format(value);

function estimateTransportOptions({ departureLocation, destination, totalBudget, days }) {
  if (!departureLocation.trim() || !destination.trim()) return null;

  const routeWeight = Math.max(2, Math.min(12, Math.round((departureLocation.length + destination.length) / 2)));
  const budgetPressure = totalBudget < 1800 ? 'tight' : totalBudget > 5000 ? 'flexible' : 'balanced';
  const flightPrice = 2600 + routeWeight * 240;
  const trainPrice = 520 + routeWeight * 85;
  const busPrice = 650 + routeWeight * 95;
  const drivePrice = 1900 + routeWeight * 180;
  const taxiPrice = 3200 + routeWeight * 260;
  const metroPrice = 80 + routeWeight * 12;

  const options = [
    {
      id: 'train-metro',
      mode: 'Train + Metro',
      primaryMode: 'Train',
      price: trainPrice + metroPrice,
      duration: `${Math.max(6, routeWeight + 3)}h ${routeWeight % 2 ? '30m' : '10m'}`,
      comfort: '4/5',
      transfers: 1,
      badge: 'Recommended',
      explanation: `Choosing the train keeps the trip comfortable and saves ${formatINR(Math.max(0, flightPrice - trainPrice))} compared to flying.`,
      pros: ['Best value', 'City-center arrival'],
      cons: ['Longer travel time'],
    },
    {
      id: 'flight-taxi',
      mode: 'Flight + Taxi',
      primaryMode: 'Flight',
      price: flightPrice + Math.round(taxiPrice * 0.18),
      duration: `${Math.max(1, Math.round(routeWeight / 4))}h ${20 + routeWeight * 3}m`,
      comfort: '5/5',
      transfers: 1,
      badge: 'Fastest',
      explanation: 'Best when saving time matters more than preserving the activity or hotel budget.',
      pros: ['Shortest journey', 'Low fatigue'],
      cons: ['Higher fare'],
    },
    {
      id: 'bus-local',
      mode: 'Bus + Local Bus',
      primaryMode: 'Bus',
      price: busPrice,
      duration: `${Math.max(8, routeWeight + 5)}h`,
      comfort: '3/5',
      transfers: 1,
      badge: 'Budget',
      explanation: 'A practical low-cost route if you are comfortable with a slower overnight journey.',
      pros: ['Lowest upfront cost', 'Overnight option'],
      cons: ['Less comfortable'],
    },
    {
      id: 'self-drive',
      mode: 'Self Drive',
      primaryMode: 'Self Drive',
      price: drivePrice,
      duration: `${Math.max(5, routeWeight + 2)}h`,
      comfort: '3.5/5',
      transfers: 0,
      badge: 'Flexible',
      explanation: 'Useful when you want scenic stops and control over the route.',
      pros: ['Flexible stops', 'Good for groups'],
      cons: ['Driving fatigue'],
    },
  ];

  const availableOptions = budgetPressure === 'tight'
    ? options.filter((option) => option.primaryMode !== 'Taxi')
    : options;

  const recommended = budgetPressure === 'flexible' && days <= 3
    ? availableOptions.find((option) => option.id === 'flight-taxi')
    : availableOptions[0];

  return {
    recommended,
    others: availableOptions.filter((option) => option.id !== recommended.id),
    insights: [
      `${recommended.mode} protects more of your trip budget for hotels, food, and experiences.`,
      `Compared with the fastest option, this recommendation can preserve about ${Math.max(5, Math.round((flightPrice - recommended.price) / Math.max(totalBudget, 1) * 100))}% of your total budget.`,
      'Flight is still worth choosing when minimizing travel time is the top priority.',
    ],
    combinations: availableOptions.map((option) => ({
      id: option.id,
      mode: option.mode,
      price: option.price,
      duration: option.duration,
    })),
  };
}

function ChoiceGroup({ label, icon: Icon, options, value, onChange, disabled }) {
  return (
    <div className="form-group">
      <label className="form-label">
        <Icon size={16} />
        {label}
      </label>
      <div className="choice-grid">
        {options.map((option) => (
          <button
            className={`choice-btn ${value === option ? 'active' : ''}`}
            disabled={disabled}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {value === option && <Check size={15} />}
            <span>{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TransportSkeleton() {
  return (
    <div className="transport-skeleton">
      <span />
      <strong />
      <p />
      <p />
    </div>
  );
}

function TransportPlanner({ data, disabled, isLoading, onRetry, onSelect, selectedTransport, status }) {
  if (isLoading) {
    return (
      <div className="transport-advisor">
        <TransportSkeleton />
        <div className="transport-skeleton-grid">
          <TransportSkeleton />
          <TransportSkeleton />
          <TransportSkeleton />
        </div>
      </div>
    );
  }

  if (status === 'unavailable' || !data?.recommended) {
    return (
      <div className="transport-unavailable">
        <AlertCircle size={22} />
        <div>
          <strong>Transport information is temporarily unavailable.</strong>
          <p>Enter a departure location and destination, then retry. The rest of your itinerary can still be generated.</p>
        </div>
        <button onClick={onRetry} type="button">
          <RotateCcw size={16} />
          Retry
        </button>
      </div>
    );
  }

  const recommended = data.recommended;
  const RecommendedIcon = MODE_ICONS[recommended.primaryMode] || Compass;

  return (
    <div className="transport-advisor">
      <article className="recommended-transport">
        <div className="recommendation-badge">
          <Sparkles size={15} />
          AI Recommended
        </div>
        <div className="recommended-layout">
          <div className="recommended-icon">
            <RecommendedIcon size={30} />
          </div>
          <div>
            <h3>{recommended.mode}</h3>
            <p>{recommended.explanation}</p>
          </div>
          <div className="recommended-metrics">
            <strong>{formatINR(recommended.price)}</strong>
            <span>{recommended.duration}</span>
          </div>
        </div>
        <button className="choose-transport" disabled={disabled} onClick={() => onSelect(recommended.mode)} type="button">
          {selectedTransport === recommended.mode ? 'Selected' : 'Choose this option'}
        </button>
      </article>

      {data.others.length > 0 && (
        <div className="transport-section">
          <h3>Other Available Options</h3>
          <div className="transport-option-list">
            {data.others.map((option) => {
              const Icon = MODE_ICONS[option.primaryMode] || Compass;
              return (
                <button
                  className={`transport-option-row ${selectedTransport === option.mode ? 'selected' : ''}`}
                  disabled={disabled}
                  key={option.id}
                  onClick={() => onSelect(option.mode)}
                  type="button"
                >
                  <div className="transport-mode">
                    <Icon size={20} />
                    <strong>{option.mode}</strong>
                    <span>{option.badge}</span>
                  </div>
                  <div className="transport-facts">
                    <span>{formatINR(option.price)}</span>
                    <span>{option.duration}</span>
                    <span>Comfort {option.comfort}</span>
                    <span>{option.transfers} transfer{option.transfers === 1 ? '' : 's'}</span>
                  </div>
                  <div className="transport-pros-cons">
                    <span>Pros: {option.pros.join(', ')}</span>
                    <span>Cons: {option.cons.join(', ')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="transport-section transport-columns">
        <div>
          <h3>AI Insights</h3>
          <div className="insight-list">
            {data.insights.map((insight) => <p key={insight}>{insight}</p>)}
          </div>
        </div>
        <div>
          <h3>Transport Combinations</h3>
          <div className="combo-list">
            {data.combinations.map((combo) => (
              <div key={combo.id}>
                <strong>{combo.mode}</strong>
                <span>{formatINR(combo.price)} · {combo.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [departureLocation, setDepartureLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState(5);
  const [travelers, setTravelers] = useState(1);
  const [totalBudget, setTotalBudget] = useState(2500);
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [preferredSeason, setPreferredSeason] = useState('No Preference');
  const [companionType, setCompanionType] = useState('Solo');
  const [accommodationType, setAccommodationType] = useState('Hotel');
  const [dietaryPreference, setDietaryPreference] = useState('Vegetarian');
  const [weatherPreference, setWeatherPreference] = useState("Doesn't Matter");
  const [travelStyle, setTravelStyle] = useState('Cultural');
  const [selectedTransport, setSelectedTransport] = useState('');
  const [transportData, setTransportData] = useState(null);
  const [transportStatus, setTransportStatus] = useState('unavailable');
  const [isTransportLoading, setIsTransportLoading] = useState(false);
  const [transportRetryKey, setTransportRetryKey] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [packedItems, setPackedItems] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [error, setError] = useState(null);

  const tripSummary = useMemo(() => {
    const route = departureLocation && destination ? `${departureLocation} to ${destination}` : 'Your route';
    return `${route} | ${travelers} traveler${travelers === 1 ? '' : 's'} | ${formatINR(totalBudget)} total`;
  }, [departureLocation, destination, travelers, totalBudget]);

  const packingItems = useMemo(() => {
    const items = [...BASE_PACKING_ITEMS];
    if (weatherPreference === 'Sunny') items.push('Sunscreen', 'Sunglasses', 'Hat');
    if (weatherPreference === 'Cold') items.push('Jacket', 'Thermals', 'Gloves');
    if (weatherPreference === 'Rainy') items.push('Umbrella', 'Rain cover', 'Quick-dry clothes');
    if (selectedInterests.includes('Beaches')) items.push('Swimwear', 'Slippers');
    if (selectedInterests.includes('Hiking')) items.push('Hiking shoes', 'First aid kit');
    if (selectedInterests.includes('Photography')) items.push('Camera batteries', 'Lens cloth');
    return [...new Set(items)];
  }, [selectedInterests, weatherPreference]);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) return;
    setDays(Math.max(1, Math.round((end - start) / 86400000) + 1));
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return undefined;
    }
    const interval = setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, LOADING_STEPS.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!departureLocation.trim() || !destination.trim()) {
      setTransportData(null);
      setTransportStatus('unavailable');
      setIsTransportLoading(false);
      return undefined;
    }

    setIsTransportLoading(true);
    setTransportStatus('loading');
    const timer = setTimeout(() => {
      const nextData = estimateTransportOptions({ days, departureLocation, destination, totalBudget });
      if (!nextData?.recommended) {
        setTransportData(null);
        setTransportStatus('unavailable');
      } else {
        setTransportData(nextData);
        setTransportStatus('ready');
        setSelectedTransport((current) => {
          const availableModes = [nextData.recommended, ...nextData.others].map((option) => option.mode);
          return availableModes.includes(current) ? current : nextData.recommended.mode;
        });
      }
      setIsTransportLoading(false);
    }, 650);

    return () => clearTimeout(timer);
  }, [days, departureLocation, destination, totalBudget, transportRetryKey]);

  const toggleInterest = (interest) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  const togglePacked = (item) => {
    setPackedItems((current) =>
      current.includes(item) ? current.filter((packed) => packed !== item) : [...current, item],
    );
  };

  const userPreferences = useMemo(() => (
    [
      `Transport preference: ${selectedTransport}`,
      `Stay: ${accommodationType}`,
      `Diet: ${dietaryPreference}`,
      `Weather: ${weatherPreference}`,
      `Interests: ${selectedInterests.join(', ') || 'None selected'}`,
      `Additional requirements: ${additionalRequirements || 'None'}`,
    ].join('\n')
  ), [accommodationType, additionalRequirements, dietaryPreference, selectedInterests, selectedTransport, weatherPreference]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!departureLocation.trim() || !destination.trim()) {
      setError('Please enter both departure location and destination.');
      return;
    }

    if (!totalBudget || totalBudget < 1) {
      setError('Please enter a valid total budget.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult(null);
    setChatHistory([]);

    try {
      console.log('Fetching from backend URL:', `${API_BASE}/generate-plan`);
      const response = await fetch(`${API_BASE}/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureLocation,
          destination,
          days,
          startDate: startDate || 'Not fixed',
          endDate: endDate || 'Not fixed',
          travelers,
          totalBudget,
          travelStyle,
          budgetType: 'total',
          budgetValue: totalBudget,
          departureDate: startDate || 'Not fixed',
          flexibleDates,
          preferredSeason,
          companionType,
          accommodationType,
          dietaryPreference,
          weatherPreference,
          additionalRequirements: `${additionalRequirements}\nPreferred transport: ${selectedTransport}`,
          interests: selectedInterests,
        }),
      });

      if (!response.ok) {
        const serverError = await response.json().catch(() => null);
        throw new Error(serverError?.detail || `Server returned ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setActiveTab('itinerary');
    } catch (err) {
      setError(err.message || 'Unable to generate your trip. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async (event) => {
    event.preventDefault();
    if (!chatMessage.trim() || !result?.itinerary) return;

    const message = chatMessage.trim();
    setChatMessage('');
    setChatHistory((history) => [...history, { role: 'user', text: message }]);
    setIsChatLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          currentTrip: result.itinerary,
          destination,
          userPreferences,
        }),
      });

      if (!response.ok) {
        const serverError = await response.json().catch(() => null);
        throw new Error(serverError?.detail || `Server returned ${response.status}`);
      }

      const data = await response.json();
      setResult((current) => ({ ...current, itinerary: data.itinerary }));
      setChatHistory((history) => [...history, { role: 'assistant', text: 'Updated the itinerary while keeping the rest stable.' }]);
      setActiveTab('itinerary');
    } catch (err) {
      setChatHistory((history) => [...history, { role: 'assistant', text: err.message || 'Unable to update this trip.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const parseInlineMarkdown = (text) => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  };

  const renderMarkdown = (text) => {
    if (!text) return null;

    return (
      <div className="md-content">
        {text.split('\n').map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return <div className="md-space" key={index} />;
          if (trimmed.startsWith('### ')) return <h3 key={index}>{trimmed.slice(4)}</h3>;
          if (trimmed.startsWith('## ')) return <h2 key={index}>{trimmed.slice(3)}</h2>;
          if (trimmed.startsWith('# ')) return <h1 key={index}>{trimmed.slice(2)}</h1>;
          if (/^[-*]\s+\[[ x]\]/i.test(trimmed)) {
            return (
              <p
                className="md-check-item"
                dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.replace(/^[-*]\s+\[[ x]\]\s*/i, '')) }}
                key={index}
              />
            );
          }
          if (/^[-*]\s+/.test(trimmed)) {
            return (
              <p
                className="md-list-item"
                dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, '')) }}
                key={index}
              />
            );
          }
          return <p dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }} key={index} />;
        })}
      </div>
    );
  };

  return (
    <div className="page-shell">
      <nav className="navbar">
        <div className="logo">
          <Compass size={28} />
          <span>RouteWise</span>
        </div>
        <div className="transport-status">
          <Sparkles size={16} />
          AI trip optimizer
        </div>
      </nav>

      <header className="hero">
        <p className="eyebrow">Personal AI travel agent</p>
        <h1>Plan, compare, optimize, and refine the whole trip.</h1>
        <p>
          Compare routes, balance budget tradeoffs, keep hotels and restaurants as links, and use chat
          to make targeted edits after the plan is generated.
        </p>
      </header>

      <main>
        <section className="planner-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Trip builder</p>
              <h2>{tripSummary}</h2>
            </div>
            <Sparkles size={24} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid two">
              <div className="form-group">
                <label className="form-label" htmlFor="departure-location">
                  <MapPinned size={16} />
                  Departure Location
                </label>
                <input
                  className="input-text"
                  disabled={isLoading}
                  id="departure-location"
                  onChange={(event) => setDepartureLocation(event.target.value)}
                  placeholder="Mumbai, Delhi, New York..."
                  type="text"
                  value={departureLocation}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="destination">
                  <MapPinned size={16} />
                  Destination
                </label>
                <input
                  className="input-text"
                  disabled={isLoading}
                  id="destination"
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Goa, Tokyo, Paris..."
                  type="text"
                  value={destination}
                />
              </div>
            </div>

            <div className="form-grid four">
              <div className="form-group">
                <label className="form-label" htmlFor="start-date">
                  <CalendarDays size={16} />
                  Start Date
                </label>
                <input className="input-text" disabled={isLoading} id="start-date" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="end-date">
                  <CalendarDays size={16} />
                  End Date
                </label>
                <input className="input-text" disabled={isLoading} id="end-date" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
              </div>

              <div className="form-group">
                <label className="form-label">Travelers</label>
                <div className="stepper">
                  <button disabled={isLoading || travelers <= 1} onClick={() => setTravelers((value) => value - 1)} type="button"><Minus size={16} /></button>
                  <strong>{travelers}</strong>
                  <button disabled={isLoading || travelers >= 20} onClick={() => setTravelers((value) => value + 1)} type="button"><Plus size={16} /></button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Duration</label>
                <div className="stepper">
                  <button disabled={isLoading || days <= 1} onClick={() => setDays((value) => value - 1)} type="button"><Minus size={16} /></button>
                  <strong>{days} days</strong>
                  <button disabled={isLoading || days >= 30} onClick={() => setDays((value) => value + 1)} type="button"><Plus size={16} /></button>
                </div>
              </div>
            </div>

            <div className="form-grid three">
              <div className="form-group">
                <label className="form-label">Flexible Dates</label>
                <div className="toggle-row">
                  <button className={!flexibleDates ? 'active' : ''} disabled={isLoading} onClick={() => setFlexibleDates(false)} type="button">No</button>
                  <button className={flexibleDates ? 'active' : ''} disabled={isLoading} onClick={() => setFlexibleDates(true)} type="button">Yes</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="season">
                  <Sun size={16} />
                  Preferred Season
                </label>
                <div className="select-wrap">
                  <select className="input-text" disabled={isLoading} id="season" onChange={(event) => setPreferredSeason(event.target.value)} value={preferredSeason}>
                    {SEASONS.map((season) => <option key={season}>{season}</option>)}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <WalletCards size={16} />
                  Total Budget
                </label>
                <div className="range-row">
                  <DollarSign size={18} />
                  <input disabled={isLoading} max="10000" min="200" onChange={(event) => setTotalBudget(Number(event.target.value))} step="50" type="range" value={totalBudget} />
                  <strong>{formatINR(totalBudget)}</strong>
                </div>
              </div>
            </div>

            <ChoiceGroup disabled={isLoading} icon={Users} label="Traveler Type" onChange={setCompanionType} options={COMPANIONS} value={companionType} />
            <ChoiceGroup disabled={isLoading} icon={BedDouble} label="Stay Preference" onChange={setAccommodationType} options={STAYS} value={accommodationType} />
            <ChoiceGroup disabled={isLoading} icon={Utensils} label="Food Preference" onChange={setDietaryPreference} options={DIETS} value={dietaryPreference} />
            <ChoiceGroup disabled={isLoading} icon={CloudSun} label="Weather Preference" onChange={setWeatherPreference} options={WEATHER} value={weatherPreference} />
            <ChoiceGroup disabled={isLoading} icon={Compass} label="Travel Style" onChange={setTravelStyle} options={TRAVEL_THEMES} value={travelStyle} />

            <div className="form-group">
              <label className="form-label">
                <Plane size={16} />
                Multi-Modal Transport Planner
              </label>
              <TransportPlanner
                data={transportData}
                disabled={isLoading}
                isLoading={isTransportLoading}
                onRetry={() => setTransportRetryKey((key) => key + 1)}
                onSelect={setSelectedTransport}
                selectedTransport={selectedTransport}
                status={transportStatus}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Interests</label>
              <div className="interest-list">
                {INTERESTS_OPTIONS.map((interest) => (
                  <button className={selectedInterests.includes(interest) ? 'active' : ''} disabled={isLoading} key={interest} onClick={() => toggleInterest(interest)} type="button">
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="requirements">
                <MessageCircle size={16} />
                Additional Requirements
              </label>
              <textarea
                className="input-text textarea"
                disabled={isLoading}
                id="requirements"
                onChange={(event) => setAdditionalRequirements(event.target.value)}
                placeholder="I love beaches. Vegetarian food only. Avoid crowds. Need wheelchair accessibility. No trekking. Prefer local experiences."
                value={additionalRequirements}
              />
            </div>

            {error && (
              <div className="error-box">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button className="submit-btn" disabled={isLoading} type="submit">
              {isLoading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              {isLoading ? 'Optimizing your trip...' : 'Generate Optimized Travel Plan'}
            </button>
          </form>
        </section>

        <section className="insight-grid">
          <div className="mini-panel">
            <ChartPie size={22} />
            <h3>Budget Optimizer</h3>
            <p>Compares transport, stay, food, activities, taxes, buffers, and remaining budget.</p>
          </div>
          <div className="mini-panel">
            <BadgePercent size={22} />
            <h3>Offers</h3>
            <p>Checks for coupons and discounts, and says clearly when live offers are unavailable.</p>
          </div>
          <div className="mini-panel">
            <CloudSun size={22} />
            <h3>Weather Intelligence</h3>
            <p>Turns forecast clues into clothing, timing, and activity advice.</p>
          </div>
          <div className="mini-panel">
            <Gem size={22} />
            <h3>Hidden Gems</h3>
            <p>Separates local markets, cafes, viewpoints, street food, and underrated places.</p>
          </div>
        </section>

        <section className="results-panel">
          {isLoading && (
            <div className="loading-box">
              <Loader2 className="spin" size={38} />
              <h2>Building your travel strategy</h2>
              <div className="loading-steps">
                {LOADING_STEPS.map((step, index) => (
                  <div className={`loading-step ${index <= loadingStep ? 'active' : ''}`} key={step}>
                    <span>{index + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="empty-state">
              <MapPinned size={44} />
              <h2>Your optimized plan will appear here</h2>
              <p>Expect transport comparisons, budget tradeoffs, weather advice, hidden gems, packing, offers, links, and route maps.</p>
            </div>
          )}

          {!isLoading && result && (
            <div className="result-content">
              <div className="tabs-header">
                <button className={activeTab === 'itinerary' ? 'active' : ''} onClick={() => setActiveTab('itinerary')} type="button">
                  <CalendarDays size={16} />
                  Full Plan
                </button>
                <button className={activeTab === 'hotels' ? 'active' : ''} onClick={() => setActiveTab('hotels')} type="button">
                  <Hotel size={16} />
                  Hotels & Food
                </button>
                <button className={activeTab === 'research' ? 'active' : ''} onClick={() => setActiveTab('research')} type="button">
                  <MapPinned size={16} />
                  Source Research
                </button>
                <button className={activeTab === 'packing' ? 'active' : ''} onClick={() => setActiveTab('packing')} type="button">
                  <PackageCheck size={16} />
                  Packing
                </button>
                <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')} type="button">
                  <MessageCircle size={16} />
                  AI Chat
                </button>
              </div>

              {activeTab === 'itinerary' && renderMarkdown(result.itinerary)}
              {activeTab === 'hotels' && renderMarkdown(result.hotels)}
              {activeTab === 'research' && renderMarkdown(result.research)}
              {activeTab === 'packing' && (
                <div className="packing-list">
                  {packingItems.map((item) => (
                    <label className={packedItems.includes(item) ? 'packed' : ''} key={item}>
                      <input checked={packedItems.includes(item)} onChange={() => togglePacked(item)} type="checkbox" />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              )}
              {activeTab === 'chat' && (
                <div className="chat-panel">
                  <div className="chat-history">
                    {chatHistory.length === 0 && <p className="chat-placeholder">Try: "Make it cheaper", "Add nightlife", "Reduce walking", or "Suggest vegetarian restaurants".</p>}
                    {chatHistory.map((item, index) => (
                      <div className={`chat-bubble ${item.role}`} key={`${item.role}-${index}`}>{item.text}</div>
                    ))}
                  </div>
                  <form className="chat-form" onSubmit={handleChat}>
                    <input className="input-text" disabled={isChatLoading} onChange={(event) => setChatMessage(event.target.value)} placeholder="Ask AI to edit this trip..." value={chatMessage} />
                    <button className="submit-btn icon-submit" disabled={isChatLoading || !chatMessage.trim()} type="submit">
                      {isChatLoading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
