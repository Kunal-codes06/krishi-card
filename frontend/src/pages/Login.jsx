import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Tractor, ShoppingBag, ArrowRight, ShieldCheck, Mail, KeyRound, Bike } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [role, setRole] = useState('farmer');
  const [step, setStep] = useState(1); // 1: Email/Phone, 2: OTP
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate sending OTP delay
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: identifier, role })
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.user);
        if (role === 'farmer') navigate('/farmer');
        else if (role === 'delivery') navigate('/delivery');
        else navigate('/consumer');
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Network error. Failed to login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative items-center justify-center overflow-hidden border-r border-slate-200">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1592982537447-6f2a6a0c6c48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-20"></div>
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

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('login.welcome')}</h2>
            <p className="text-slate-500 font-medium">{t('login.welcomeSub')}</p>
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

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('login.phoneEmail')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 shadow-sm"
                    placeholder={t('login.phonePlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="rounded bg-white border-slate-300 text-primary focus:ring-primary/50 cursor-pointer" />
                  <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{t('login.remember')}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-primary/20 flex justify-center items-center gap-2 mt-4 active:scale-[0.98]"
              >
                {isLoading ? (
                   <span className="flex items-center gap-2">Sending OTP <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span></span>
                ) : (
                   <span className="flex items-center gap-2">Send OTP <ArrowRight className="w-4 h-4" /></span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-200 flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                 <span>We've sent an OTP to <span className="font-bold">{identifier}</span></span>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Enter OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 text-center text-2xl tracking-[0.5em] rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-300 shadow-sm font-mono"
                    placeholder="------"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 4}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-slate-900/20 flex justify-center items-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                   <span className="flex items-center gap-2">Verifying <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span></span>
                ) : (
                   <span className="flex items-center gap-2">Verify & Login <ArrowRight className="w-4 h-4" /></span>
                )}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-slate-500 font-bold text-sm hover:text-primary transition-colors py-2"
              >
                Change Phone/Email
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            {t('login.noAccount')} <Link to="/signup" className="text-primary-dark font-bold hover:underline transition-colors">{t('login.signUp')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
