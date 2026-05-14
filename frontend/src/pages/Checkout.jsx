/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Truck, CreditCard, ShieldCheck, MapPin, AlertCircle, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLocation as useGlobalLocation } from '../context/LocationContext';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { selectedLocation } = useGlobalLocation();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [quantity, setQuantity] = useState(1);
  const [orderError, setOrderError] = useState('');

  const returnRoute = user?.role === 'Farmer' ? '/farmer' : '/consumer';

  const product = location.state?.product || { 
    id: 1,
    name: 'Fresh Tomatoes', 
    stock: '50kg', 
    price: 200, 
    farmer: 'Ramesh Singh',
    lat: 19.9975,
    lng: 73.7898,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&w=100&q=60'
  };

  const availableStock = parseInt(String(product.stock).replace(/\D/g, '')) || 100;
  const basePrice = product.price * (parseInt(quantity) || 0);
  const subtotal = basePrice;
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  const handlePayment = async () => {
    setIsProcessing(true);
    setOrderError('');
    
    // Get actual customer location via GPS
    const getBuyerLocation = () => {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => resolve({ lat: (product.lat || 20.0) + 0.1, lng: (product.lng || 73.0) + 0.1 }),
            { enableHighAccuracy: true }
          );
        } else {
          resolve({ lat: (product.lat || 20.0) + 0.1, lng: (product.lng || 73.0) + 0.1 });
        }
      });
    };

    const buyerLoc = await getBuyerLocation();

    const orderData = {
      productId: product.id,
      quantity: quantity,
      buyer: user?.name || 'Current Consumer',
      buyerLat: buyerLoc.lat,
      buyerLng: buyerLoc.lng,
      amount: total,
      location: selectedLocation,
      paymentMethod: paymentMethod
    };

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Redirect directly to the live tracking page
        navigate(`/track/${encodeURIComponent(data.order.id)}`);
      } else {
        setOrderError(data.error || 'Failed to place order.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderError('Network error. Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl text-center border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-green-400 to-primary"></div>
          
          <div className="w-24 h-24 bg-primary/10 border-2 border-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20"></div>
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">{t('checkout.confirmed')}</h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            {t('checkout.confirmedSub1')} <span className="text-slate-900 font-bold">{product.farmer}</span>{t('checkout.confirmedSub2')}
          </p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-100">
                <Truck className="w-4 h-4 text-secondary" />
              </div>
              <span>{t('checkout.deliveryExpected')} <strong className="text-slate-900">{t('checkout.tomorrow')}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <span>{t('checkout.securedVia')} <strong className="text-slate-900">{t('checkout.escrow')}</strong></span>
            </div>
          </div>

          <button 
            onClick={() => navigate(returnRoute)}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
          >
            {t('checkout.continue')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to={returnRoute} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> {t('checkout.back')}
        </Link>

        {orderError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Order Error</p>
              <p className="text-red-700 text-sm">{orderError}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Side - Main Content */}
          <div className="flex-grow space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border border-primary/20">{step}</span>
                {step === 1 ? t('checkout.stepCart') : t('checkout.stepPayment')}
              </h2>
              
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border border-slate-200 rounded-2xl bg-slate-50 shadow-sm gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-24 h-24 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-slate-500 font-medium mb-2">{t('checkout.from')} <span className="text-slate-700 font-bold">{product.farmer}</span></p>
                        <div className="font-black text-xl text-emerald-700">₹{product.price}<span className="text-sm text-slate-500">/kg</span></div>
                        <p className="text-sm text-slate-500 font-medium mt-1">Available Stock: <span className="text-emerald-600 font-bold">{availableStock} kg</span></p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity (kg)</label>
                      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                         <button 
                            onClick={() => setQuantity(Math.max(1, (parseInt(quantity) || 1) - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition-colors"
                         >-</button>
                         <input 
                           type="number" 
                           min="1" 
                           max={availableStock}
                           value={quantity}
                           onChange={(e) => {
                             const val = e.target.value;
                             if (val === '') {
                               setQuantity('');
                             } else {
                               const num = parseInt(val);
                               if (!isNaN(num)) {
                                 setQuantity(Math.min(availableStock, num));
                               }
                             }
                           }}
                           onBlur={(e) => {
                             const val = parseInt(e.target.value);
                             if (isNaN(val) || val < 1) {
                               setQuantity(1);
                             }
                           }}
                           className="w-16 text-center font-bold text-slate-900 bg-transparent outline-none"
                         />
                         <button 
                            onClick={() => setQuantity(Math.min(availableStock, (parseInt(quantity) || 0) + 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold transition-colors"
                         >+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                     <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                     <div>
                        <p className="font-bold text-blue-900 text-sm">Delivery Location</p>
                        <p className="text-blue-700 text-sm">{selectedLocation}</p>
                     </div>
                  </div>

                  <label className={`flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer shadow-sm relative overflow-hidden transition-all ${paymentMethod === 'upi' ? 'border-primary/50 bg-primary/5' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    {paymentMethod === 'upi' && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>}
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="text-primary focus:ring-primary w-5 h-5 bg-white border-slate-300 cursor-pointer" 
                      />
                      <span className="font-extrabold text-slate-900 flex items-center gap-2"><CreditCard className="w-5 h-5 text-slate-500"/> {t('checkout.upi')}</span>
                    </div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-5 opacity-90" />
                  </label>
                  <label className={`flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer shadow-sm relative overflow-hidden transition-all ${paymentMethod === 'cod' ? 'border-primary/50 bg-primary/5' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    {paymentMethod === 'cod' && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>}
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-primary focus:ring-primary w-5 h-5 bg-white border-slate-300 cursor-pointer" 
                      />
                      <span className="font-bold text-slate-700">{t('checkout.cod')}</span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="w-full md:w-96">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-24">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6">{t('checkout.summary')}</h2>
              
              <div className="space-y-4 text-sm mb-8">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>{t('checkout.subtotal')} ({quantity}kg)</span>
                  <span className="font-bold text-slate-700">₹{basePrice}</span>
                </div>

                <div className="flex justify-between text-slate-500 font-medium">
                  <span>{t('checkout.delivery')} <span className="text-xs ml-1 bg-yellow-100 text-yellow-800 font-bold px-1.5 py-0.5 rounded border border-yellow-200">Direct</span></span>
                  <span className="font-bold text-slate-700">₹{deliveryFee}</span>
                </div>

                
                <div className="border-t border-slate-200 pt-5 mt-2 flex justify-between items-center">
                  <span className="font-extrabold text-slate-800">{t('checkout.total')}</span>
                  <span className="font-black text-3xl text-emerald-700">₹{total}</span>
                </div>
              </div>
              
              {step === 1 ? (
                 <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl transition-all shadow-md flex justify-center items-center gap-2 text-base"
                >
                  {t('checkout.proceed')}
                </button>
              ) : (
                <button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-primary/30 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-base"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t('checkout.processing')}
                    </span>
                  ) : (
                    `${t('checkout.paySecurely')} ₹${total}`
                  )}
                </button>
              )}
              
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {t('checkout.securePayment')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
