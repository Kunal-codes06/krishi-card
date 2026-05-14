/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { useState } from 'react';
import { useLocation as useRouteLocation, Link, useNavigate } from 'react-router-dom';
import { User, ShoppingCart, MapPin, Search, ChevronDown, Globe, LogOut, Home, Store, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import LocationMapModal from './LocationMapModal';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();
  const { selectedLocation, updateLocation } = useLocation();
  const { isLoggedIn, logout, user } = useAuth();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const isAuthPage = routeLocation.pathname === '/login' || routeLocation.pathname === '/signup' || routeLocation.pathname === '/forgot-password';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center gap-4">
          
          {/* Left: Logo & Location */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center h-10 w-10 overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 group-hover:shadow border-primary/20 transition-all p-0.5">
                <img src="/krishi-cart-logo.png" alt="Krishi Cart Logo" className="h-full w-full object-contain mix-blend-multiply" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-primary-dark leading-none hidden md:block">KRISHI CART</span>
            </Link>

            {!isAuthPage && (
              <button 
                onClick={() => setIsMapOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group relative"
              >
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{selectedLocation}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
              </button>
            )}
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            {!isAuthPage && (
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search for fresh produce..."
                  defaultValue={new URLSearchParams(routeLocation.search).get('search') || ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/?search=${e.target.value}`);
                    }
                  }}
                  className="w-full bg-slate-100 border border-slate-200 rounded-full py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                />
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={toggleLanguage} 
              className="p-2 text-slate-500 hover:text-primary transition-colors bg-slate-50 rounded-full hover:bg-slate-100"
              title="Change Language"
            >
              <Globe className="w-5 h-5" />
            </button>

            {!isAuthPage ? (
              <div className="flex items-center gap-2 lg:gap-4 pl-4 border-l border-slate-200">
                {!isLoggedIn ? (
                  <div className="flex items-center gap-2 ml-2">
                    <Link 
                      to="/login" 
                      className="text-slate-600 hover:text-primary font-bold text-sm px-4 py-2 rounded-xl transition-all hidden sm:block"
                    >
                      {t('nav.loginAction')}
                    </Link>
                    <Link 
                      to="/signup" 
                      className="bg-primary text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                      {t('nav.signupAction')}
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to="/profile" className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/50 transition-colors group" title="Profile">
                      {user?.image ? (
                        <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      )}
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                    {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'farmer') && (
                      <Link to="/analytics" className="p-2 text-slate-500 hover:text-emerald-600 transition-colors bg-slate-50 rounded-full hover:bg-emerald-50 ml-2" title="Analytics Dashboard">
                        <BarChart2 className="w-5 h-5 transition-transform hover:scale-110" />
                      </Link>
                    )}
                    {(user?.role?.toLowerCase() === 'consumer') && (
                      <Link to="/nearby" className="p-2 text-slate-500 hover:text-emerald-600 transition-colors bg-slate-50 rounded-full hover:bg-emerald-50 ml-2" title="Nearby Farmers Map">
                        <MapPin className="w-5 h-5 transition-transform hover:scale-110" />
                      </Link>
                    )}
                  </div>
                )}
                
                <Link to="/checkout" className="relative p-2.5 text-slate-600 hover:text-primary transition-colors bg-slate-50 rounded-full hover:bg-slate-100" title="Cart">
                  <ShoppingCart className="w-5 h-5 transition-transform hover:scale-110" />
                  <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">0</span>
                </Link>
              </div>
            ) : (
               <Link to="/" className="text-primary font-bold text-sm bg-primary/5 px-4 py-2 rounded-xl">Back to Home</Link>
            )}
          </div>
        </div>
      </div>
      <LocationMapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />
    </nav>
  );
};

export default Navbar;
