import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Search,
  RefreshCw, AlertCircle, Clock, Zap, BarChart2, Layers,
  Target, Cpu, Radio, Eye
} from 'lucide-react';

// Popular symbols by category
const POPULAR_SYMBOLS = {
  stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'],
  crypto: ['BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'ADA-USD', 'XRP-USD', 'DOGE-USD', 'DOT-USD'],
  forex: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X', 'EURGBP=X', 'USDCHF=X'],
  indices: ['^GSPC', '^DJI', '^IXIC', '^FTSE', '^N225', '^HSI', '^STOXX50E', '^AXJO']
};

const FuturisticStocksDashboard = () => {
  const [category, setCategory] = useState('stocks');
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('1d');
  const [stockData, setStockData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [scanlineOffset, setScanlineOffset] = useState(0);

  // Scanline animation effect
  useEffect(() => {
    const scanlineInterval = setInterval(() => {
      setScanlineOffset(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(scanlineInterval);
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    try {
      const historyRes = await fetch(`http://localhost:8000/api/stock/${symbol}?interval=${interval}`);
      if (!historyRes.ok) throw new Error(`Failed to fetch history (${historyRes.status})`);
      const historyJson = await historyRes.json();

      const predictRes = await fetch(`http://localhost:8000/api/predict/${symbol}?interval=${interval}`);
      if (!predictRes.ok) throw new Error(`Failed to fetch prediction (${predictRes.status})`);
      const predictJson = await predictRes.json();

      setStockData(historyJson);
      setPrediction(predictJson);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // When category changes, set the first popular symbol of that category
  useEffect(() => {
    setSymbol(POPULAR_SYMBOLS[category][0]);
  }, [category]);

  // Fetch data when symbol or interval changes
  useEffect(() => {
    if (symbol) {
      fetchStockData();
    }
  }, [symbol, interval]);

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getLatest = (key) => {
    if (!stockData?.data?.length) return null;
    return stockData.data[stockData.data.length - 1][key];
  };

  // Tick formatter function - moved outside JSX to prevent recreation
  const formatXAxisTick = (str) => {
    if (!str) return '';
    const date = new Date(str);
    return interval && (interval.includes('m') || interval.includes('h'))
      ? date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
      : date.toLocaleDateString([], {month:'short', day:'numeric'});
  };

  const timeframes = [
    { label: '5M', value: '5m' },
    { label: '15M', value: '15m' },
    { label: '1H', value: '1h' },
    { label: '4H', value: '4h' },
    { label: '1D', value: '1d' },
    { label: '1W', value: '1wk' },
  ];

  const categories = [
    { id: 'stocks', label: 'Stocks', icon: '📈' },
    { id: 'crypto', label: 'Crypto', icon: '₿' },
    { id: 'forex', label: 'Forex', icon: '💱' },
    { id: 'indices', label: 'Indices', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-mono relative overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite'
      }} />

      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100% 4px',
          transform: `translateY(${scanlineOffset}px)`
        }}
      />

      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes hologramFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .hologram-border {
          position: relative;
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(138, 43, 226, 0.1));
          border: 1px solid rgba(0, 255, 255, 0.3);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(0, 255, 255, 0.1);
        }
        .hologram-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(45deg, transparent, rgba(0, 255, 255, 0.3), transparent);
          border-radius: inherit;
          animation: hologramFlicker 3s infinite;
        }
        .cyber-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }
        .cyber-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.4), transparent);
          transition: left 0.5s;
        }
        .cyber-button:hover::before {
          left: 100%;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #06b6d4, #a855f7);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0891b2, #9333ea);
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Futuristic Header */}
        <header className="relative">
          <div className="hologram-border rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-50 animate-pulse" />
                  <Target className="relative text-cyan-400" size={48} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    NEXUS QUANTUM
                  </h1>
                  <p className="text-cyan-400 text-xs tracking-widest mt-1 flex items-center gap-2">
                    <Radio size={12} className="animate-pulse" />
                    NEURAL ENSEMBLE PREDICTOR v4.7.2
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4 md:mt-0">
                {lastUpdated && (
                  <div className="text-right">
                    <div className="text-[10px] text-cyan-400 tracking-widest">SYNC STATUS</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <Clock size={12} />
                      {lastUpdated.toLocaleTimeString()}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full border-2 ${
                    loading ? 'border-yellow-400 bg-yellow-400' :
                    error ? 'border-red-400 bg-red-400' :
                    'border-green-400 bg-green-400'
                  }`} style={{ animation: loading ? 'pulse 1s infinite' : 'none' }} />
                  <span className="text-[10px] text-cyan-400 tracking-widest">
                    {loading ? 'ANALYZING' : error ? 'ERROR' : 'ONLINE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`cyber-button px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                category === cat.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-black border-2 border-cyan-400 shadow-lg shadow-cyan-500/50'
                  : 'bg-black/50 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Popular Symbols */}
        <div className="flex gap-2 flex-wrap">
          {POPULAR_SYMBOLS[category].map(sym => (
            <button
              key={sym}
              onClick={() => setSymbol(sym)}
              className={`cyber-button px-3 py-1.5 rounded-lg text-xs transition-all ${
                symbol === sym
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-black border border-cyan-400'
                  : 'bg-black/50 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Control Panel */}
        <div className="hologram-border rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Symbol Input */}
            <div className="relative w-full md:w-72 group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition-opacity" />
              <div className="relative">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && fetchStockData()}
                  className="w-full bg-black/50 border border-cyan-500/50 rounded-lg py-3 pl-12 pr-4 text-cyan-100 placeholder-cyan-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-sm"
                  placeholder="ENTER SYMBOL"
                />
                <Search className="absolute left-4 top-3.5 text-cyan-400" size={20} />
                <div className="absolute right-4 top-3.5">
                  <Eye size={18} className="text-cyan-400/50" />
                </div>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex gap-2 flex-wrap justify-center">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setInterval(tf.value)}
                  className={`cyber-button px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    interval === tf.value
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-black border-2 border-cyan-400 shadow-lg shadow-cyan-500/50'
                      : 'bg-black/50 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Analyze Button */}
            <button
              onClick={fetchStockData}
              disabled={loading}
              className="cyber-button w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-black px-8 py-3 rounded-lg font-bold transition-all hover:shadow-2xl hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span className="tracking-wider">PROCESSING</span>
                </>
              ) : (
                <>
                  <Zap size={20} />
                  <span className="tracking-wider">ANALYZE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="hologram-border rounded-xl p-4 bg-red-900/20 border-red-500 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={24} />
              <div>
                <div className="text-xs tracking-widest">SYSTEM ERROR</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        {stockData && prediction && !loading && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="xl:col-span-2 space-y-6">
              {/* Main Chart */}
              <div className="hologram-border rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-cyan-400">{stockData.symbol}</h2>
                      <span className="text-purple-400 text-sm border border-purple-500/50 px-3 py-1 rounded-full">
                        {interval}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1 tracking-wider">
                      QUANTUM ANALYSIS · {stockData.data.length} DATA POINTS
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-cyan-400 tracking-widest mb-1">CURRENT PRICE</div>
                    <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      {formatPrice(prediction.current_price)}
                    </p>
                    <p className={`text-sm font-bold mt-1 ${
                      prediction.direction === 'UP' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {prediction.direction === 'UP' ? '▲' : '▼'} {prediction.expected_change_pct}
                    </p>
                  </div>
                </div>

                <div className="h-[400px] w-full relative">
                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400" />

                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stockData.data}>
                      <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorClose2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 182, 212, 0.2)" />
                      <XAxis
                        dataKey="date"
                        stroke="#06b6d4"
                        tick={{ fill: '#06b6d4', fontSize: 11 }}
                        tickFormatter={formatXAxisTick}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        stroke="#06b6d4"
                        tick={{ fill: '#06b6d4', fontSize: 11 }}
                        tickFormatter={(n) => `$${n.toFixed(0)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          borderColor: '#06b6d4',
                          borderRadius: '8px',
                          padding: '12px',
                          color: '#06b6d4'
                        }}
                        labelStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                        labelFormatter={(l) => new Date(l).toLocaleString()}
                      />
                      <Area type="monotone" dataKey="close" stroke="#06b6d4" fill="url(#colorClose)" strokeWidth={3} name="Close" />
                      <Line type="monotone" dataKey="ma_50" stroke="#10b981" dot={false} strokeWidth={2} name="MA 50" />
                      <Line type="monotone" dataKey="ma_200" stroke="#f59e0b" dot={false} strokeWidth={2} name="MA 200" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* RSI */}
                <div className="hologram-border rounded-xl p-5 backdrop-blur-sm group hover:scale-105 transition-transform">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-[10px] text-cyan-400 tracking-widest">RSI INDICATOR</div>
                      <div className="text-3xl font-bold text-white mt-1">
                        {getLatest('rsi')?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                    <BarChart2 className="text-purple-400" size={24} />
                  </div>
                  <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${Math.min(getLatest('rsi') || 0, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                    <span>OVERSOLD</span>
                    <span>NEUTRAL</span>
                    <span>OVERBOUGHT</span>
                  </div>
                </div>

                {/* MACD */}
                <div className="hologram-border rounded-xl p-5 backdrop-blur-sm group hover:scale-105 transition-transform">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-[10px] text-cyan-400 tracking-widest">MACD SIGNAL</div>
                      <div className={`text-3xl font-bold mt-1 ${
                        (getLatest('macd') || 0) > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {getLatest('macd')?.toFixed(4) || 'N/A'}
                      </div>
                    </div>
                    <Activity className="text-cyan-400" size={24} />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${
                      (getLatest('macd') || 0) > 0 ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <span className="text-gray-400">
                      {(getLatest('macd') || 0) > 0 ? 'BULLISH' : 'BEARISH'}
                    </span>
                  </div>
                </div>

                {/* Volume */}
                <div className="hologram-border rounded-xl p-5 backdrop-blur-sm group hover:scale-105 transition-transform">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-[10px] text-cyan-400 tracking-widest">VOLUME</div>
                      <div className="text-2xl font-bold text-white mt-1">
                        {new Intl.NumberFormat('en-US', { notation: "compact" }).format(getLatest('volume') || 0)}
                      </div>
                    </div>
                    <Layers className="text-pink-400" size={24} />
                  </div>
                  <div className="text-xs text-gray-400">TRADING ACTIVITY</div>
                </div>
              </div>
            </div>

            {/* Prediction Panel */}
            <div className="space-y-6">
              <div className="hologram-border rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
                {/* Animated corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <Cpu className="text-cyan-400 animate-pulse" size={24} />
                    <div>
                      <h3 className="text-lg font-bold text-cyan-400 tracking-wider">NEURAL FORECAST</h3>
                      <p className="text-[10px] text-gray-500 tracking-widest">NEXT CANDLE PREDICTION</p>
                    </div>
                  </div>

                  {/* Prediction Direction */}
                  <div className="mb-6 p-4 rounded-xl bg-black/50 border border-cyan-500/30">
                    <div className="flex items-center gap-4">
                      <div className={`relative p-4 rounded-full ${
                        prediction.direction === 'UP'
                          ? 'bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500'
                          : 'bg-gradient-to-br from-red-500/20 to-red-500/5 border-2 border-red-500'
                      }`}>
                        <div className={`absolute inset-0 rounded-full blur-xl ${
                          prediction.direction === 'UP' ? 'bg-green-500/50' : 'bg-red-500/50'
                        } animate-pulse`} />
                        {prediction.direction === 'UP' ? (
                          <TrendingUp size={32} className="relative text-green-400" />
                        ) : (
                          <TrendingDown size={32} className="relative text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] text-gray-500 tracking-widest">TARGET PRICE</div>
                        <div className="text-3xl font-bold text-white">
                          {formatPrice(prediction.predicted_next_close)}
                        </div>
                        <div className={`text-sm font-bold ${
                          prediction.direction === 'UP' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {prediction.direction} {prediction.expected_change_pct}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ensemble Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/30">
                      <span className="text-xs text-gray-400 tracking-wider">MODELS ACTIVE</span>
                      <span className="text-lg font-bold text-purple-400">{prediction.details.num_strategies}</span>
                    </div>
                    {prediction.details.cluster_regime !== null && (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-cyan-900/20 to-pink-900/20 border border-cyan-500/30">
                        <span className="text-xs text-gray-400 tracking-wider">MARKET REGIME</span>
                        <span className="text-sm font-mono text-cyan-400">CLUSTER {prediction.details.cluster_regime}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-500/30">
                      <span className="text-xs text-gray-400 tracking-wider">ENSEMBLE TYPE</span>
                      <span className="text-sm font-mono text-pink-400">{prediction.details.ensemble_method}</span>
                    </div>
                  </div>

                  {/* Model Outputs */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="text-cyan-400" size={16} />
                      <span className="text-xs text-cyan-400 tracking-widest">MODEL OUTPUTS</span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(prediction.details.raw_predictions || {})
                        .slice(0, 10)
                        .map(([name, value], idx) => (
                          <div
                            key={name}
                            className="flex justify-between items-center p-2 rounded bg-black/30 border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <span className="text-xs text-gray-400 capitalize">
                              {name.replace('strategy_', '').replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-mono text-cyan-300">{formatPrice(value)}</span>
                          </div>
                        ))}
                      {Object.keys(prediction.details.raw_predictions || {}).length > 10 && (
                        <div className="text-center text-[10px] text-gray-600 italic mt-3">
                          + {Object.keys(prediction.details.raw_predictions).length - 10} MORE STRATEGIES
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signal Summary */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-cyan-500/50">
                    <div className="text-[10px] text-cyan-400 tracking-widest mb-2">SIGNAL ANALYSIS</div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Ensemble prediction indicates a
                      <span className={`mx-1 font-bold ${
                        prediction.direction === 'UP' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {prediction.expected_change_pct}
                      </span>
                      movement based on {prediction.details.num_strategies} quantum models.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!stockData && !loading && !error && (
          <div className="hologram-border rounded-2xl p-20 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-50 animate-pulse" />
                <Target size={64} className="relative text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-2 tracking-wider">SYSTEM READY</h3>
              <p className="text-gray-500 text-sm tracking-widest">ENTER SYMBOL TO INITIATE ANALYSIS</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuturisticStocksDashboard;
