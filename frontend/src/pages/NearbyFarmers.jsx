import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { Navigation, MapPin, Search, Navigation2, ShoppingCart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const farmerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Component to dynamically center map
const MapCenterer = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 12, { animate: true });
    }
  }, [map, position]);
  return null;
};

const NearbyFarmers = () => {
  const [userPos, setUserPos] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [radius, setRadius] = useState(50); // 50km radius
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
          fetchProducts(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.error("Location error", err);
          // Fallback to Lucknow default if denied
          const fallback = { lat: 26.8467, lng: 80.9462 };
          setUserPos(fallback);
          setLocating(false);
          fetchProducts(fallback.lat, fallback.lng);
        }
      );
    } else {
      const fallback = { lat: 26.8467, lng: 80.9462 };
      setUserPos(fallback);
      setLocating(false);
      fetchProducts(fallback.lat, fallback.lng);
    }
  }, []);

  const fetchProducts = async (lat, lng) => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      if (res.ok) {
        const data = await res.json();
        // Calculate distance for each product
        const withDistances = data.map(p => {
          // Some mock products might not have lat/lng, generate them around the user for demo if missing
          const pLat = p.lat || lat + (Math.random() - 0.5) * 1.5;
          const pLng = p.lng || lng + (Math.random() - 0.5) * 1.5;
          const dist = calculateDistance(lat, lng, pLat, pLng);
          return { ...p, lat: pLat, lng: pLng, distance: dist };
        });
        
        // Sort by nearest
        withDistances.sort((a, b) => a.distance - b.distance);
        setProducts(withDistances);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = (product) => {
    navigate('/checkout', { state: { product } });
  };

  const filteredProducts = products.filter(p => p.distance <= radius);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-slate-50">
      
      {/* Sidebar List */}
      <div className="w-full lg:w-1/3 h-full bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 shrink-0">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Nearby Farmers
          </h1>
          <p className="text-sm text-slate-500 mt-1">Discover fresh produce from local farms around you.</p>
          
          <div className="mt-4">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Search Radius: {radius} km</label>
            <input 
              type="range" 
              min="5" 
              max="200" 
              step="5"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {loading || locating ? (
            <div className="flex flex-col items-center justify-center h-full text-emerald-600">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-medium">{locating ? 'Finding your location...' : 'Searching for nearby farmers...'}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No farmers found within {radius} km.</p>
              <button onClick={() => setRadius(100)} className="text-emerald-600 text-sm mt-2 font-medium hover:underline">Increase radius</button>
            </div>
          ) : (
            filteredProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-emerald-500 transition-colors group">
                <div className="flex gap-4">
                  <img src={p.image} alt={p.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 truncate pr-2">{p.name}</h3>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        {p.distance.toFixed(1)} km
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{p.farmer}</p>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {p.location}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <p className="font-bold text-slate-800">₹{p.price}<span className="text-xs font-normal text-slate-500">/kg</span></p>
                      <button 
                        onClick={() => handleBuy(p)}
                        className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" /> Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="w-full lg:w-2/3 h-full relative bg-slate-200">
        {!locating && userPos && (
          <MapContainer 
            center={userPos} 
            zoom={12} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
            
            {/* User Marker */}
            <Marker position={userPos} icon={userIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-red-600 mb-1">Your Location</p>
                  <p className="text-xs text-slate-500">Searching within {radius}km radius.</p>
                </div>
              </Popup>
            </Marker>

            {/* Radius Circle */}
            <Circle 
              center={userPos} 
              radius={radius * 1000} // in meters
              pathOptions={{ fillColor: '#10b981', color: '#10b981', fillOpacity: 0.1, weight: 1 }} 
            />

            {/* Farmer Markers */}
            {filteredProducts.map(p => (
              <Marker key={p.id} position={{ lat: p.lat, lng: p.lng }} icon={farmerIcon}>
                <Popup className="custom-popup">
                  <div className="min-w-[200px]">
                    <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{p.name}</h3>
                    <p className="text-sm text-slate-500">{p.farmer}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                      <span className="font-bold text-emerald-600">₹{p.price}/kg</span>
                      <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{p.distance.toFixed(1)} km</span>
                    </div>
                    <button 
                      onClick={() => handleBuy(p)}
                      className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg mt-3 hover:bg-emerald-700 transition-colors text-sm"
                    >
                      Order from Farmer
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            <MapCenterer position={userPos} />
          </MapContainer>
        )}

        {locating && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm z-[400]">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
              <h2 className="font-bold text-lg text-slate-800">Accessing GPS</h2>
              <p className="text-slate-500 text-sm">Please allow location access to find nearby farmers.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyFarmers;
