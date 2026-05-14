/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingCart, IndianRupee, MapPin, QrCode, X, User, Clock, CheckCircle, ArrowRight, ChevronRight, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../context/LocationContext';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import SmartSell from '../components/SmartSell';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getCoordinates = (locationName) => {
  if (locationName.includes('Nashik')) return [19.9975, 73.7898];
  if (locationName.includes('Agra')) return [27.1767, 78.0081];
  return [21.1458 + (Math.random() * 2 - 1), 79.0882 + (Math.random() * 2 - 1)];
};

const ConsumerMarketplace = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedLocation } = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedTraceProduct, setSelectedTraceProduct] = useState(null);
  const [ratingFarmer, setRatingFarmer] = useState(null);
  const [farmerRating, setFarmerRating] = useState(5);
  const [farmerComment, setFarmerComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showSmartBuy, setShowSmartBuy] = useState(false);
  const [mandiPrices, setMandiPrices] = useState([]);
  const [dataSource, setDataSource] = useState('mock');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  const fetchMandiPrices = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/mandi-prices?city=${encodeURIComponent(selectedLocation || 'Lucknow')}`);
      const data = await res.json();
      setDataSource(data.source || 'mock');
      if (data && data.records) {
        setMandiPrices(data.records);
      }
    } catch (error) {
      console.error('Error fetching mandi prices:', error);
    }
  }, [selectedLocation]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchMandiPrices();
  }, [selectedLocation, fetchMandiPrices]);

  const handleAddToCart = (product) => {
    navigate('/checkout', { state: { product } });
  };

  const handleRateFarmer = async (e) => {
    e.preventDefault();
    setIsSubmittingRating(true);
    try {
      const res = await fetch('http://localhost:5000/api/farmer-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: ratingFarmer.farmer,
          rating: farmerRating,
          comment: farmerComment
        })
      });
      if (res.ok) {
        alert('Rating submitted successfully!');
        setRatingFarmer(null);
        setFarmerComment('');
        setFarmerRating(5);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.farmer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Live Mandi Rates Ticker */}
        {mandiPrices.length > 0 && (
          <div className="mb-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row items-stretch relative">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 px-6 py-4 flex flex-col items-center justify-center gap-1 text-white font-bold whitespace-nowrap shadow-[4px_0_15px_rgba(0,0,0,0.5)] z-10 md:w-auto w-full border-b md:border-b-0 md:border-r border-emerald-500/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-300" /> <span className="tracking-wide">LIVE RATES</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-200">Source: {dataSource}</span>
            </div>
            
            <div className="flex-1 overflow-hidden relative flex items-center bg-slate-900">
              {/* Fade gradients for smooth entering/exiting of marquee */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-900 to-transparent z-[5]"></div>
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-900 to-transparent z-[5]"></div>
              
              <div className="flex w-max animate-marquee py-4 pl-4 cursor-default">
                {[...mandiPrices, ...mandiPrices].map((price, idx) => (
                  <div key={idx} className="inline-flex items-center gap-3 bg-slate-800/80 border border-slate-700/50 rounded-2xl px-5 py-2.5 mx-2 shadow-inner backdrop-blur-sm group hover:bg-slate-800 transition-colors">
                    <span className="font-bold text-slate-100 group-hover:text-white transition-colors">{price.commodity}</span>
                    <span className="text-xs text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/30">{price.market}</span>
                    <span className="font-black text-yellow-400 tracking-wide">₹{price.modal_price}</span>
                    {price.trend === 'up' ? 
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> : 
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero Banner */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-emerald-50 mb-12 shadow-sm border border-emerald-100">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            <div className="p-10 md:p-16 lg:p-20 space-y-6">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-emerald-100 mb-4">
                 <div className="bg-emerald-100 p-1 rounded-lg">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                 </div>
                 <span className="text-emerald-800 font-bold text-sm tracking-wide">Directly from Farmers</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                Farm Fresh <br />
                <span className="text-emerald-700 font-black">Delivered to Your Home</span>
              </h1>
              <p className="text-slate-600 font-medium text-lg max-w-md">
                Experience the true taste of nature with 100% organic produce harvested today.
              </p>
              <button 
                onClick={() => document.getElementById('market-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-emerald-200 group"
              >
                Shop Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="relative h-[300px] md:h-[500px] w-full">
              <img 
                src="/hero-banner.png" 
                alt="Fresh Vegetables" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-transparent to-transparent md:block hidden"></div>
            </div>
          </div>
        </div>

        {/* Smart Buy Banner/Toggle */}
        <div className="mb-12">
          {!showSmartBuy ? (
            <div className="bg-emerald-700 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-emerald-900/20 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10 max-w-xl mb-6 md:mb-0">
                <h3 className="text-3xl font-black mb-2 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-yellow-300" /> Unlock Smart Bulk Deals
                </h3>
                <p className="text-emerald-100 font-medium">Buy produce directly from verified farmers in bulk and get exclusive dynamic discounts. Perfect for restaurants, retailers, and large families.</p>
              </div>
              <button 
                onClick={() => setShowSmartBuy(true)}
                className="relative z-10 bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg whitespace-nowrap"
              >
                Explore Smart Buy
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-emerald-600" /> Active Smart Deals
                </h3>
                <button 
                  onClick={() => setShowSmartBuy(false)}
                  className="text-slate-500 hover:text-slate-700 font-bold text-sm flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Close Deals
                </button>
              </div>
              <SmartSell mode="buy" />
            </div>
          )}
        </div>

        {/* Section Heading */}
        <div className="flex justify-between items-end mb-8" id="market-grid">
           <div className="space-y-1">
             <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Now from Farmers</h2>
                <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">
                   <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                   LIVE
                </span>
             </div>
             <p className="text-slate-500 font-medium">Real-time inventory from local sources</p>
           </div>
           <button 
             onClick={() => setShowMap(!showMap)}
             className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
           >
             {showMap ? 'Show Grid' : 'View All'}
             <ChevronRight className="w-4 h-4" />
           </button>
        </div>

        {/* Content */}
        {showMap ? (
          <div className="h-[600px] w-full rounded-[2rem] border border-slate-200 shadow-sm relative z-0 overflow-hidden">
            <MapContainer center={[21.1458, 79.0882]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredProducts.map(product => {
                const position = getCoordinates(product.location);
                return (
                  <Marker key={product.id} position={position}>
                    <Popup>
                      <div className="text-center p-1">
                        <img src={product.image} alt={product.name} className="w-full h-24 object-cover rounded-xl mb-2" />
                        <h3 className="font-bold text-slate-900">{product.name}</h3>
                        <p className="text-sm font-bold text-emerald-700">₹{product.price}/kg</p>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="mt-2 w-full bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all border border-slate-100 group">
                <div className="h-64 overflow-hidden relative p-4">
                  <div className="relative h-full w-full rounded-2xl overflow-hidden">
                    <img 
                      src={product.image || 'https://images.unsplash.com/photo-1595856417537-8848d56b063d?ixlib=rb-4.0.3&w=500&q=60'} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg z-10">
                       <div className="h-1 w-1 rounded-full bg-white animate-pulse"></div>
                       LIVE
                    </div>
                    {/* Traceability Float Button */}
                    <button 
                      onClick={() => setSelectedTraceProduct(product)}
                      className="absolute bottom-3 right-3 bg-white/90 hover:bg-white backdrop-blur-md p-2 rounded-xl text-emerald-700 shadow-lg border border-white/50 transition-all transform group-hover:scale-110"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-xl text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center text-xl font-black text-slate-900">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                      {product.price}
                      <span className="text-sm font-medium text-slate-400 ml-1">/ kg</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 overflow-hidden">
                          {product.farmer.charAt(0)}
                       </div>
                       <div className="flex flex-col">
                          <button 
                            onClick={() => setRatingFarmer(product)}
                            className="text-sm font-bold text-slate-800 hover:text-emerald-700 text-left"
                          >
                            {product.farmer}
                          </button>
                          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5">
                             <MapPin className="w-3 h-3" /> {product.location}
                          </span>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 hover:bg-emerald-700 hover:text-white transition-all shadow-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-900 font-bold text-xl">No produce found</p>
                <p className="text-slate-500 font-medium mt-1">Try adjusting your filters or search term</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Traceability Modal */}
      {selectedTraceProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="relative h-40">
              <img src={selectedTraceProduct.image} alt={selectedTraceProduct.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-emerald-900/20"></div>
              <button 
                onClick={() => setSelectedTraceProduct(null)}
                className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white p-3 rounded-2xl shadow-xl border border-slate-50">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=krishicart://trace/${selectedTraceProduct.id}`} alt="QR Code" className="w-full h-full" />
              </div>
            </div>
            
            <div className="pt-16 pb-10 px-8 text-center">
              <h3 className="text-2xl font-black text-slate-900 mb-2">{selectedTraceProduct.name}</h3>
              <p className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs px-3 py-1 rounded-full mb-8">
                <CheckCircle className="w-3.5 h-3.5" /> 100% Traceable Source
              </p>
              
              <div className="space-y-4 text-left">
                <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                   <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-emerald-600">
                      <MapPin className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</p>
                      <p className="font-bold text-slate-900">{selectedTraceProduct.location}</p>
                   </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                   <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-emerald-600">
                      <User className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Farmer</p>
                      <p className="font-bold text-slate-900">{selectedTraceProduct.farmer}</p>
                   </div>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedTraceProduct(null)}
                className="w-full mt-8 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
    )}
    {/* Farmer Rating Modal */}
      {ratingFarmer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900">Rate {ratingFarmer.farmer}</h3>
                  <button onClick={() => setRatingFarmer(null)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleRateFarmer} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFarmerRating(num)}
                          className={`p-1 transition-all ${farmerRating >= num ? 'text-yellow-400 scale-110' : 'text-slate-200'}`}
                        >
                          <Star className={`w-6 h-6 ${farmerRating >= num ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Comment</label>
                    <textarea
                      value={farmerComment}
                      onChange={(e) => setFarmerComment(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-24 resize-none"
                      placeholder="Share your experience with this farmer..."
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingRating}
                    className="w-full bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-800 transition-all disabled:opacity-50"
                  >
                    {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Star = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);

export default ConsumerMarketplace;
