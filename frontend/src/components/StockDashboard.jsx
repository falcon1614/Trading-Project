import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Search,
  RefreshCw, AlertCircle, Clock, Zap, BarChart2
} from 'lucide-react';

const StocksDashboard = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('1d');
  const [stockData, setStockData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Configuration for timeframes
  const timeframes = [
    { label: '5 Min', value: '5m' },
    { label: '15 Min', value: '15m' },
    { label: '1 Hour', value: '1h' },
    { label: '4 Hour', value: '4h' },
    { label: 'Daily', value: '1d' },
    { label: 'Weekly', value: '1wk' },
  ];

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Historical Data
      const historyRes = await fetch(`http://localhost:8000/api/stock/${symbol}?interval=${interval}`);
      if (!historyRes.ok) throw new Error("Failed to fetch stock history");
      const historyJson = await historyRes.json();

      // 2. Fetch Prediction
      const predictRes = await fetch(`http://localhost:8000/api/predict/${symbol}?interval=${interval}`);
      if (!predictRes.ok) throw new Error("Failed to fetch prediction");
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

  // Initial fetch
  useEffect(() => {
    fetchStockData();
  }, [interval]); // Refetch when interval changes

  // Helper to format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Helper for percentage color
  const getChangeColor = (val) => {
    if (!val) return 'text-gray-400';
    return val.includes('-') ? 'text-red-400' : 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans">
      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="text-blue-400" />
              DashBoard
            </h1>
            <p className="text-gray-500 text-sm mt-1">Multi-Model Stock Prediction Engine</p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {lastUpdated && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} />
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <div className={`h-2 w-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'}`}></div>
          </div>
        </header>

        {/* --- CONTROLS --- */}
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">

          {/* Search */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && fetchStockData()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              placeholder="Enter Symbol (e.g. BTC-USD)"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          </div>

          {/* Timeframe Selector */}
          <div className="flex bg-gray-800 rounded-lg p-1 overflow-x-auto">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setInterval(tf.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  interval === tf.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
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
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
            Analyze
          </button>
        </div>

        {/* --- ERROR MESSAGE --- */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* --- MAIN CONTENT --- */}
        {stockData && prediction && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT COLUMN: Chart & Indicators */}
            <div className="lg:col-span-2 space-y-6">

              {/* Chart Card */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">{stockData.symbol} Price Action</h2>
                    <p className="text-gray-500 text-sm">Historical Data & Moving Averages</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{formatPrice(prediction.current_price)}</p>
                    <p className={`text-sm font-medium ${prediction.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                      {prediction.direction === 'UP' ? '+' : ''}{prediction.expected_change_pct}
                    </p>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stockData.data}>
                      <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return interval.includes('m') || interval.includes('h')
                            ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : date.toLocaleDateString([], {month: 'short', day: 'numeric'});
                        }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        stroke="#6b7280"
                        tickFormatter={(number) => `$${number.toFixed(0)}`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                        itemStyle={{ color: '#e5e7eb' }}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                      />
                      <Area
                        type="monotone"
                        dataKey="close"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorClose)"
                        strokeWidth={2}
                        name="Price"
                      />
                      <Line type="monotone" dataKey="ma_50" stroke="#10b981" dot={false} strokeWidth={1} name="MA 50" />
                      <Line type="monotone" dataKey="ma_200" stroke="#f59e0b" dot={false} strokeWidth={1} name="MA 200" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Technical Indicators Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">RSI (14)</p>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold text-white">
                      {stockData.data[stockData.data.length - 1].rsi?.toFixed(2) || 'N/A'}
                    </span>
                    <BarChart2 className="text-purple-500 opacity-50" />
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 mt-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${stockData.data[stockData.data.length - 1].rsi || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">MACD</p>
                  <div className="flex justify-between items-end">
                    <span className={`text-2xl font-bold ${stockData.data[stockData.data.length - 1].macd > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stockData.data[stockData.data.length - 1].macd?.toFixed(4) || 'N/A'}
                    </span>
                    <Activity className="text-blue-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Volume</p>
                  <span className="text-xl font-bold text-white block truncate">
                    {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(stockData.data[stockData.data.length - 1].volume)}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: AI Prediction */}
            <div className="space-y-6">

              {/* Prediction Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${prediction.direction === 'UP' ? 'bg-green-500' : 'bg-red-500'}`}></div>

                <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Zap className="text-yellow-400" size={20} />
                  AI Forecast (Next Candle)
                </h3>

                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-full ${prediction.direction === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {prediction.direction === 'UP' ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Predicted Close</p>
                    <p className="text-3xl font-bold text-white">{formatPrice(prediction.predicted_next_close)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400 text-sm">Linear Reg</span>
                    <span className="text-white font-mono">{formatPrice(prediction.details.models.LinearRegression)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      XGBoost
                    </span>
                    <span className="text-white font-mono">{formatPrice(prediction.details.models.XGBoost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      LSTM (Deep Learning)
                    </span>
                    <span className="text-white font-mono">
                      {prediction.details.models.LSTM !== "Failed"
                        ? formatPrice(prediction.details.models.LSTM)
                        : <span className="text-red-400 text-xs">Model Loading...</span>
                      }
                    </span>
                  </div>
                </div>

                <div className="mt-6 bg-gray-950/50 p-3 rounded-lg text-xs text-gray-400 leading-relaxed">
                  <span className="font-bold text-gray-300">Analysis:</span> The ensemble model predicts a
                  <span className={prediction.direction === 'UP' ? 'text-green-400 mx-1' : 'text-red-400 mx-1'}>
                    {prediction.expected_change_pct} move {prediction.direction}
                  </span>
                  based on current momentum and {interval} technical indicators.
                </div>
              </div>

              {/* Strategy Tip */}
              <div className="bg-blue-900/10 border border-blue-800 p-4 rounded-xl">
                <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Trading Signal
                </h4>
                <p className="text-gray-300 text-sm">
                  {prediction.direction === 'UP'
                    ? `Strong buy pressure detected. Look for entry points near ${formatPrice(prediction.current_price * 0.995)}.`
                    : `Bearish momentum active. Consider setting stop-losses or waiting for a reversal.`
                  }
                </p>
              </div>

            </div>
          </div>
        )}

        {/* --- EMPTY STATE --- */}
        {!stockData && !loading && !error && (
          <div className="text-center py-20 opacity-50">
            <Activity size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-400">Enter a stock symbol to generate AI predictions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StocksDashboard;
