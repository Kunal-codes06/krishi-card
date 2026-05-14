import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Tractor, ShoppingBag, ArrowRight, User, Bike } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { t } = useTranslation();
  const [role, setRole] = useState('farmer');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phoneOrEmail: '',
    password: '',
  });

  // Verification States
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [aadharNumber, setAadharNumber] = useState('');
  const [verifyingAadhar, setVerifyingAadhar] = useState(false);
  const [aadharVerified, setAadharVerified] = useState(false);

  const handleSendOTP = () => {
    setShowOtpInput(true);
    // Simulate sending SMS
  };

  const handleVerifyOTP = () => {
    if (otp.length === 4) setPhoneVerified(true);
    else alert("Invalid OTP");
  };

  const handleVerifyAadhar = () => {
    if (aadharNumber.length !== 12) {
      alert("Aadhar must be exactly 12 digits");
      return;
    }
    setVerifyingAadhar(true);
    setTimeout(() => {
      setVerifyingAadhar(false);
      setAadharVerified(true);
    }, 1500); // Simulate API call to UIDAI/Gov Database
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!phoneVerified) {
      alert("Please verify your phone number using OTP first to prevent fake accounts.");
      return;
    }
    if ((role === 'farmer' || role === 'delivery') && !aadharVerified) {
      alert("Government ID (Aadhar) verification is mandatory for Partners and Farmers.");
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phoneOrEmail: formData.phoneOrEmail,
          password: formData.password,
          role: role,
          aadharNumber: aadharNumber
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.user);
        if (role === 'farmer') navigate('/farmer');
        else if (role === 'delivery') navigate('/delivery');
        else navigate('/consumer');
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Network error. Failed to sign up.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative items-center justify-center overflow-hidden border-r border-slate-200">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        <div className="z-10 text-center px-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary-dark text-sm font-bold mb-6 border border-primary/20 bg-white/80 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t('login.livePlatform')}
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 mb-6 leading-tight">{t('login.title1')} <span className="text-primary">{t('login.title2')}</span></h1>
          <p className="text-lg text-slate-600 font-medium">{t('login.subtitle')}</p>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('login.createAccount')}</h2>
            <p className="text-slate-500 font-medium">{t('login.signupSub')}</p>
          </div>
          
          {/* Role Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 border border-slate-200 shadow-inner">
            <button
              onClick={() => setRole('farmer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${role === 'farmer' ? 'bg-white text-primary-dark shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <Tractor className="w-4 h-4" /> {t('login.farmer')}
            </button>
            <button
              onClick={() => setRole('consumer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${role === 'consumer' ? 'bg-white text-primary-dark shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <ShoppingBag className="w-4 h-4" /> {t('login.consumer')}
            </button>
            <button
              onClick={() => setRole('delivery')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${role === 'delivery' ? 'bg-white text-primary-dark shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <Bike className="w-4 h-4" /> Delivery
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('login.fullName')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 shadow-sm"
                  placeholder={t('login.namePlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('login.phoneEmail')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.phoneOrEmail}
                  onChange={(e) => setFormData({...formData, phoneOrEmail: e.target.value})}
                  disabled={phoneVerified}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 shadow-sm disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder={t('login.phonePlaceholder')}
                  required
                />
                {!phoneVerified && !showOtpInput && (
                  <button type="button" onClick={handleSendOTP} className="bg-slate-900 text-white font-bold px-4 rounded-xl whitespace-nowrap hover:bg-slate-800 transition-colors">
                    Get OTP
                  </button>
                )}
                {phoneVerified && (
                  <div className="bg-emerald-50 text-emerald-600 font-bold px-4 rounded-xl flex items-center border border-emerald-200">
                    Verified ✅
                  </div>
                )}
              </div>
              
              {showOtpInput && !phoneVerified && (
                <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="text"
                    maxLength="4"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-center tracking-widest font-black outline-none"
                    placeholder="Enter 4-digit OTP"
                  />
                  <button type="button" onClick={handleVerifyOTP} className="bg-emerald-500 text-white font-bold px-4 rounded-xl whitespace-nowrap hover:bg-emerald-600 transition-colors">
                    Verify
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('login.password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 shadow-sm"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            {/* KYC for Delivery Partner */}
            {role === 'delivery' && (
              <div className="space-y-4 p-5 bg-slate-100 rounded-2xl border border-slate-200 mt-2 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Delivery Partner KYC</p>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Vehicle Type</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-400 outline-none cursor-pointer">
                    <option>Motorcycle / Bike</option>
                    <option>Electric Scooter (EV)</option>
                    <option>Mini Truck / Three Wheeler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Vehicle Number Plate</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 placeholder-slate-400 uppercase" placeholder="e.g. MH 12 AB 1234" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Government Aadhar Number</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      maxLength="12"
                      value={aadharNumber}
                      onChange={(e) => setAadharNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      disabled={aadharVerified || verifyingAadhar}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 placeholder-slate-400 tracking-wider disabled:bg-slate-50" 
                      placeholder="12-digit Aadhar No." 
                      required 
                    />
                    {!aadharVerified ? (
                      <button 
                        type="button" 
                        onClick={handleVerifyAadhar}
                        disabled={verifyingAadhar || aadharNumber.length !== 12}
                        className="bg-slate-800 text-white font-bold px-4 rounded-xl whitespace-nowrap hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {verifyingAadhar ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Verify UIDAI'}
                      </button>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-600 font-bold px-4 rounded-xl flex items-center border border-emerald-200">
                        Verified ✅
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Upload Driving License (DL)</label>
                  <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer bg-white border border-slate-300 rounded-xl" required />
                </div>
              </div>
            )}

            {/* KYC for Farmer */}
            {role === 'farmer' && (
              <div className="space-y-4 p-5 bg-green-50 rounded-2xl border border-green-200 mt-2 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs font-black text-green-700 uppercase tracking-widest">Farm Verification</p>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Farm Size</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer">
                    <option>Small (Under 2 Acres)</option>
                    <option>Medium (2 - 5 Acres)</option>
                    <option>Large (More than 5 Acres)</option>
                    <option>Greenhouse / Polyhouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Primary Crops Category</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 placeholder-slate-400" placeholder="e.g. Organic Vegetables, Wheat, Fruits" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Government Aadhar Number</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      maxLength="12"
                      value={aadharNumber}
                      onChange={(e) => setAadharNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      disabled={aadharVerified || verifyingAadhar}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 placeholder-slate-400 tracking-wider disabled:bg-slate-50" 
                      placeholder="12-digit Aadhar No." 
                      required 
                    />
                    {!aadharVerified ? (
                      <button 
                        type="button" 
                        onClick={handleVerifyAadhar}
                        disabled={verifyingAadhar || aadharNumber.length !== 12}
                        className="bg-slate-800 text-white font-bold px-4 rounded-xl whitespace-nowrap hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {verifyingAadhar ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Verify UIDAI'}
                      </button>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-600 font-bold px-4 rounded-xl flex items-center border border-emerald-200">
                        Verified ✅
                      </div>
                    )}
                  </div>
                  {aadharVerified && <p className="text-xs text-emerald-600 font-bold mt-1">✓ Identity matched with central database.</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Kisaan ID / FSSAI (Recommended)</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 placeholder-slate-400" placeholder="Registration ID for Verified Badge" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" className="rounded bg-white border-slate-300 text-primary focus:ring-primary/50 cursor-pointer" required />
              <span className="text-sm text-slate-600 font-medium">{t('login.agreeTerms')}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-primary/20 flex justify-center items-center gap-2 mt-2"
            >
              {t('login.createAccount')} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            {t('login.alreadyAccount')} <Link to="/login" className="text-primary-dark font-bold hover:underline transition-colors">{t('login.signIn')} </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
