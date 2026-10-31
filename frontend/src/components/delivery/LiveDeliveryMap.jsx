import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  TruckIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  PhoneIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BoltIcon
} from '@heroicons/react/24/solid';

// Indian City Coordinate Dictionary
const CITY_COORDINATES = {
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  mumbai: [19.076, 72.8777],
  delhi: [28.6139, 77.209],
  newdelhi: [28.6139, 77.209],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  chandigarh: [30.7333, 76.7794],
  noida: [28.5355, 77.391],
  gurgaon: [28.4595, 77.0266],
  gurugram: [28.4595, 77.0266],
  patna: [25.6127, 85.1589]
};

// Haversine distance formula in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Generate realistic turn-by-turn waypoints between warehouse and customer
const generateRoutePoints = (hub, dest, totalSteps = 80) => {
  const [hubLat, hubLng] = hub;
  const [destLat, destLng] = dest;

  // Intermediate realistic turning points
  const dLat = destLat - hubLat;
  const dLng = destLng - hubLng;

  const waypoints = [
    [hubLat, hubLng],
    [hubLat + dLat * 0.2, hubLng + dLng * 0.05],
    [hubLat + dLat * 0.35, hubLng + dLng * 0.3],
    [hubLat + dLat * 0.55, hubLng + dLng * 0.45],
    [hubLat + dLat * 0.7, hubLng + dLng * 0.75],
    [hubLat + dLat * 0.88, hubLng + dLng * 0.9],
    [destLat, destLng]
  ];

  const fullPath = [];
  const stepsPerLeg = Math.floor(totalSteps / (waypoints.length - 1));

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];

    for (let s = 0; s < stepsPerLeg; s++) {
      const t = s / stepsPerLeg;
      const lat = start[0] + (end[0] - start[0]) * t;
      const lng = start[1] + (end[1] - start[1]) * t;
      fullPath.push([lat, lng]);
    }
  }

  fullPath.push(waypoints[waypoints.length - 1]);
  return fullPath;
};

const LiveDeliveryMap = ({ order }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vanMarkerRef = useRef(null);
  const passedLineRef = useRef(null);
  const remainingLineRef = useRef(null);
  const animationTimerRef = useRef(null);

  // Simulation State
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(2); // default 2x speed for good visual pacing
  const [deliveryStatus, setDeliveryStatus] = useState('on_the_way'); // 'on_the_way' | 'arrived'

  // Check if customer city exists in static coordinate dictionary
  const isCityMapped = useMemo(() => {
    const rawCity = (order?.shippingAddress?.city || '')
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    return Boolean(CITY_COORDINATES[rawCity]);
  }, [order?.shippingAddress?.city]);

  // Resolve Customer Destination Coordinates
  const destCoords = useMemo(() => {
    const rawCity = (order?.shippingAddress?.city || 'Bengaluru')
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    return CITY_COORDINATES[rawCity] || CITY_COORDINATES.bengaluru;
  }, [order?.shippingAddress?.city]);

  // Fulfillment Center Hub Coordinates (~3.5km northwest of destination)
  const hubCoords = useMemo(() => {
    return [destCoords[0] - 0.026, destCoords[1] - 0.032];
  }, [destCoords]);

  // Full turn-by-turn route path
  const fullPath = useMemo(() => {
    return generateRoutePoints(hubCoords, destCoords, 90);
  }, [hubCoords, destCoords]);

  // Live Metrics Calculation
  const currentPos = fullPath[Math.min(stepIndex, fullPath.length - 1)];
  const remainingDistanceKm = calculateDistanceKm(
    currentPos[0],
    currentPos[1],
    destCoords[0],
    destCoords[1]
  );

  const totalDistanceKm = useMemo(() => {
    return calculateDistanceKm(hubCoords[0], hubCoords[1], destCoords[0], destCoords[1]);
  }, [hubCoords, destCoords]);

  const progressPercent = Math.min(
    100,
    Math.round((stepIndex / (fullPath.length - 1)) * 100)
  );

  // Dynamic ETA calculation (averaging ~28 km/h city delivery speed)
  const remainingMinutes = Math.max(1, Math.round((remainingDistanceKm / 28) * 60));

  // ── Initialize Leaflet Map ─────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Center map between hub and destination
    const centerLat = (hubCoords[0] + destCoords[0]) / 2;
    const centerLng = (hubCoords[1] + destCoords[1]) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // OpenStreetMap CartoDB Voyager tiles (modern, high-contrast, clean UI)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // 1. Warehouse / Hub Marker (Custom DivIcon)
    const hubIcon = L.divIcon({
      className: 'custom-hub-marker',
      html: `
        <div style="background: #1e1b4b; border: 2px solid #818cf8; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
          <span style="font-size: 18px;">🏬</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    L.marker(hubCoords, { icon: hubIcon })
      .addTo(map)
      .bindPopup('<b>E-Shop Express Fulfillment Hub</b><br>Order dispatched with temperature control');

    // 2. Customer Destination Marker (Custom DivIcon)
    const homeIcon = L.divIcon({
      className: 'custom-home-marker',
      html: `
        <div style="background: #dc2626; border: 2px solid #fecaca; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(220,38,38,0.35);">
          <span style="font-size: 18px;">🏠</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    L.marker(destCoords, { icon: homeIcon })
      .addTo(map)
      .bindPopup(`<b>Your Delivery Doorstep</b><br>${order?.shippingAddress?.street || 'Customer Address'}`);

    // 3. Upcoming Planned Route Polyline (Dashed Indigo)
    const remainingLine = L.polyline(fullPath, {
      color: '#818cf8',
      weight: 4,
      dashArray: '6, 8',
      opacity: 0.7
    }).addTo(map);
    remainingLineRef.current = remainingLine;

    // 4. Completed Route Polyline (Solid Emerald)
    const passedLine = L.polyline([fullPath[0]], {
      color: '#10b981',
      weight: 5,
      opacity: 0.95
    }).addTo(map);
    passedLineRef.current = passedLine;

    // 5. Animated Delivery Van Marker (With pulsating radar ring)
    const vanIcon = L.divIcon({
      className: 'custom-van-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; background: rgba(16, 185, 129, 0.4); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; z-index: 10; background: #059669; border: 2.5px solid #ffffff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(5,150,105,0.45);">
            <span style="font-size: 17px; transform: scaleX(-1);">🚚</span>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const vanMarker = L.marker(fullPath[0], { icon: vanIcon, zIndexOffset: 1000 }).addTo(map);
    vanMarkerRef.current = vanMarker;

    // Fit map bounds comfortably
    const bounds = L.latLngBounds([hubCoords, destCoords]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hubCoords, destCoords, fullPath, order?.shippingAddress?.street]);

  // ── Step Animation Loop ───────────────────────────────────
  useEffect(() => {
    if (!isPlaying) {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      return;
    }

    const intervalMs = Math.max(100, Math.round(900 / speedMultiplier));

    animationTimerRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= fullPath.length - 1) {
          clearInterval(animationTimerRef.current);
          setIsPlaying(false);
          setDeliveryStatus('arrived');
          return fullPath.length - 1;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlaying, speedMultiplier, fullPath.length]);

  // ── Update Leaflet Marker & Lines on Position Change ──────
  useEffect(() => {
    if (!vanMarkerRef.current || !mapInstanceRef.current) return;

    const currentCoord = fullPath[stepIndex];
    vanMarkerRef.current.setLatLng(currentCoord);

    // Update passed path
    const passedSegment = fullPath.slice(0, stepIndex + 1);
    if (passedLineRef.current) {
      passedLineRef.current.setLatLngs(passedSegment);
    }

    // Update remaining path
    const remainingSegment = fullPath.slice(stepIndex);
    if (remainingLineRef.current) {
      remainingLineRef.current.setLatLngs(remainingSegment);
    }

    if (stepIndex >= fullPath.length - 1) {
      setDeliveryStatus('arrived');
    }
  }, [stepIndex, fullPath]);

  // ── Handlers ──────────────────────────────────────────────
  const handleTogglePlay = () => {
    if (deliveryStatus === 'arrived') {
      // If arrived, restart from beginning
      setStepIndex(0);
      setDeliveryStatus('on_the_way');
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleResetTrip = () => {
    setStepIndex(0);
    setDeliveryStatus('on_the_way');
    setIsPlaying(true);
  };

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-100 transition-all">
      {/* ── Header Ribbon ── */}
      <div className="px-6 py-4 border-b border-slate-100 bg-linear-to-r from-emerald-500/10 via-white to-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <TruckIcon className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900">
                Live Delivery Tracking
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <BoltIcon className="w-3 h-3 text-emerald-600" />
                {deliveryStatus === 'arrived' ? 'Delivered' : 'Live GPS Feed'}
              </span>
              {!isCityMapped && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1" title="Destination city unmapped in coordinate dictionary — simulated route rendered from regional fulfillment hub">
                  <BoltIcon className="w-3 h-3 text-amber-600" />
                  Demo Route (Bengaluru Regional Hub)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulated real-time vehicle coordinate progression to customer address
            </p>
          </div>
        </div>

        {/* Live ETA Card Pill */}
        <div className="flex items-center gap-2">
          {deliveryStatus === 'arrived' ? (
            <div className="px-4 py-2 rounded-2xl bg-emerald-600 text-white flex items-center gap-2 shadow-md shadow-emerald-200">
              <CheckCircleIcon className="w-5 h-5" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-90">Status</p>
                <p className="text-xs font-black">Order Delivered!</p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-indigo-600 text-white flex items-center gap-2.5 shadow-md shadow-indigo-200">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Estimated Arrival</p>
                <p className="text-sm font-black tracking-tight">{remainingMinutes} Mins ({remainingDistanceKm.toFixed(1)} km)</p>
              </div>
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <TruckIcon className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Leaflet Map Container ── */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Top Dashboard Overlay (Zomato / Swiggy Style) */}
        <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-sm z-[1000] pointer-events-auto">
          <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-200/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {deliveryStatus === 'arrived' ? 'Package Handed Over' : 'Delivery Partner en route'}
              </span>
              <span className="text-[11px] font-black text-indigo-600">
                {progressPercent}% Journey
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <BuildingStorefrontIcon className="w-3.5 h-3.5 text-indigo-500" />
                Hub: E-Shop Hub
              </span>
              <span className="flex items-center gap-1">
                <HomeIcon className="w-3.5 h-3.5 text-rose-500" />
                Destination: {order?.shippingAddress?.city || 'Home'}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Bottom Driver Card (Swiggy Style) */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl shadow-slate-900/10">
          {/* Driver Credentials */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-11 h-11 rounded-2xl bg-linear-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-black shadow-xs">
              👨‍✈️
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white">
                <ShieldCheckIcon className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-extrabold text-slate-900">Rajesh Kumar</h4>
                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-amber-100 text-amber-800">
                  4.9 ★ (2.4k+ deliveries)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Express EV Courier • KA-05-EV-8803 • Vaccinated
              </p>
            </div>
          </div>

          {/* Simulation Controls for Viva Demo */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {/* Speed Selector */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                    speedMultiplier === spd
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title={`${spd}x simulation speed`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Play / Pause Toggle */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
              title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
            >
              {isPlaying ? (
                <>
                  <PauseIcon className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <PlayIcon className="w-3.5 h-3.5" /> Resume
                </>
              )}
            </button>

            {/* Restart Trip */}
            <button
              type="button"
              onClick={handleResetTrip}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Restart delivery trip from fulfillment hub"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>

            {/* Call Partner Button */}
            <a
              href="tel:+916209828803"
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Call Delivery Partner"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Call</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Delivery Milestones Ribbon ── */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
          <span>Fulfillment Hub Departure: <b>Verified & Bagged</b></span>
        </span>
        <span className="text-slate-400 hidden sm:inline">•</span>
        <span className="flex items-center gap-1.5 font-medium">
          <TruckIcon className="w-4 h-4 text-indigo-500" />
          <span>Current Speed: <b>~{Math.round(26 + Math.random() * 6)} km/h (EV Express)</b></span>
        </span>
        <span className="text-slate-400 hidden sm:inline">•</span>
        <span className="flex items-center gap-1.5 font-medium">
          <HomeIcon className="w-4 h-4 text-rose-500" />
          <span>Contactless Delivery OTP: <b>4829</b></span>
        </span>
      </div>
    </div>
  );
};

export default LiveDeliveryMap;

