import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, CheckCircle, AlertTriangle, Users, DollarSign, ShoppingBag } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [predictionData, setPredictionData] = useState({
    crop: 'Wheat',
    season: 'Summer',
    demand: 'Medium',
    quantity: 100,
    currentPrice: 30
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = user?.role?.toLowerCase() === 'farmer' 
          ? `http://localhost:5000/api/analytics/dashboard-stats?farmerId=${user.name}`
          : 'http://localhost:5000/api/analytics/dashboard-stats';
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/predict-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(predictionData)
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setError('Failed to fetch prediction. Make sure ML backend is running.');
      }
    } catch (err) {
      setError('Network error. Check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-emerald-600" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-600 mt-2">Monitor sales, predict future crop prices, and track revenue growth.</p>
      </div>

      {/* Global Stats Overview */}
      {stats && !statsLoading && (
        <div className="mb-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-800">₹{stats.totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Orders</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.totalSales}</h3>
              </div>
            </div>

            {stats.userStats && stats.userStats.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 lg:col-span-2">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Users</p>
                    <h3 className="text-2xl font-bold text-slate-800">
                      {stats.userStats.reduce((acc, curr) => acc + curr.value, 0)}
                    </h3>
                  </div>
                  <div className="flex gap-4">
                    {stats.userStats.map((u, idx) => (
                      <div key={idx} className="text-center">
                        <p className="text-xs text-slate-400">{u.name}</p>
                        <p className="font-bold text-slate-700">{u.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Revenue Growth (Last 6 Months)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.revenueGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" tickFormatter={(value) => `₹${value}`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Top Selling Products</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topProducts} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]}>
                      {stats.topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      <hr className="border-slate-200 mb-12" />

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          AI Price Prediction Model
        </h2>
        <p className="text-slate-600 mt-2">Simulate market conditions to predict future commodity prices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-600" />
            Prediction Parameters
          </h2>
          
          <form onSubmit={handlePredict} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Crop Type</label>
              <select 
                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                value={predictionData.crop}
                onChange={e => setPredictionData({...predictionData, crop: e.target.value})}
              >
                {['Wheat', 'Rice', 'Tomato', 'Potato', 'Onion', 'Apple', 'Mango', 'Cotton', 'Mustard', 'Soyabean'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Market Price (₹/kg)</label>
              <input 
                type="number" 
                required
                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                value={predictionData.currentPrice}
                onChange={e => setPredictionData({...predictionData, currentPrice: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Season</label>
              <select 
                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                value={predictionData.season}
                onChange={e => setPredictionData({...predictionData, season: e.target.value})}
              >
                {['Summer', 'Winter', 'Monsoon', 'Spring'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Market Demand</label>
              <select 
                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                value={predictionData.demand}
                onChange={e => setPredictionData({...predictionData, demand: e.target.value})}
              >
                {['Low', 'Medium', 'High'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supply Quantity (kg)</label>
              <input 
                type="number" 
                required
                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                value={predictionData.quantity}
                onChange={e => setPredictionData({...predictionData, quantity: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'Running ML Model...' : 'Predict Future Price'}
            </button>
            {error && <p className="text-red-500 text-sm flex items-center gap-1 mt-2"><AlertTriangle className="w-4 h-4"/> {error}</p>}
          </form>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {result ? (
            <>
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
                  <p className="text-sm text-slate-500 font-medium">Predicted Future Price</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{result.predictedPrice}/kg</h3>
                </div>
                
                <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 ${result.trend === 'up' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <p className="text-sm text-slate-500 font-medium">Expected Trend</p>
                  <h3 className={`text-2xl font-bold mt-2 flex items-center gap-2 ${result.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {result.trend === 'up' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    {result.percentageChange}% {result.trend === 'up' ? 'Increase' : 'Decrease'}
                  </h3>
                </div>

                <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100">
                  <p className="text-sm text-emerald-600 font-medium mb-2">AI Recommendation</p>
                  <h3 className="text-lg font-bold text-emerald-800 flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
                    {result.recommendation}
                  </h3>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6">7-Day Price Projection</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.trendGraph} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="day" stroke="#64748b" />
                      <YAxis stroke="#64748b" tickFormatter={(value) => `₹${value}`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`₹${value}`, 'Price']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <BarChart2 className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700">Awaiting Prediction</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Enter the crop parameters on the left and run the AI model to see future price trends and analytics here.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
