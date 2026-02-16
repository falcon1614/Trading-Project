import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  Search,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart2,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronDown,
  X,
  Menu
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

// Popular stocks list
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD' },
  { symbol: 'ETH-USD', name: 'Ethereum USD' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'DIS', name: 'Walt Disney' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'IBM', name: 'IBM Corp.' }
];

// --- Utility Components ---

const MetricCard = ({ label, value, sub, icon: Icon, color, trend }) => (
  <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className="text-stone-500 text-xs font-medium mb-1">{label}</p>
        <h3 className="text-xl font-bold text-stone-900 mb-1">{value ?? "—"}</h3>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{Math.abs(trend).toFixed(2)}%</span>
          </div>
        )}
        {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-stone-200 p-3 rounded-lg shadow-xl">
        <p className="text-stone-700 text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-stone-500">{entry.name}:</span>
            <span className="text-stone-900 font-mono font-medium">
              ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Component ---

export default function StockDashboard() {
  const [symbol, setSymbol] = useState('AAPL');
  const [inputVal, setInputVal] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState('line');
  const [timeRange, setTimeRange] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [visibility, setVisibility] = useState({
    close: true,
    ma50: true,
    ma100: true,
    ma200: true
  });

  // --- Fetch Data ---
  const fetchData = async (searchSymbol) => {
    setLoading(true);
    setError(null);
    setStockData(null);

    try {
      const stockRes = await fetch(`${API_BASE}/stock/${searchSymbol}`);

      if (!stockRes.ok) throw new Error(`Failed to fetch ${searchSymbol}`);

      const sData = await stockRes.json();
      setStockData(sData);
      setSymbol(searchSymbol.toUpperCase());
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(symbol);
  }, []);

  const handleSearch = () => {
    if (inputVal.trim()) {
      fetchData(inputVal.trim());
      setInputVal('');
      setShowDropdown(false);
    }
  };

  const handleSelectStock = (stockSymbol) => {
    fetchData(stockSymbol);
    setShowDropdown(false);
    setShowMobileMenu(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // --- Filter data by time range ---
  const filterDataByTimeRange = (data) => {
    if (!data || timeRange === 'all') return data;

    const ranges = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
    };

    const daysToShow = ranges[timeRange];
    return data.slice(-daysToShow);
  };

  // --- Prepare Chart Data ---
  const allPriceData = stockData?.series?.index?.map((iso, i) => ({
    date: iso.slice(0, 10),
    close: stockData.series.close[i],
    ma50: stockData.series.ma_50[i],
    ma100: stockData.series.ma_100[i],
    ma200: stockData.series.ma_200[i],
  })) || [];

  const priceChartData = filterDataByTimeRange(allPriceData);

  // --- Calculate Metrics ---
  const calculateTrend = () => {
    if (!stockData?.series?.close || stockData.series.close.length < 2) return 0;
    const prices = stockData.series.close.filter(p => p !== null);
    const lastPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2];
    return ((lastPrice - prevPrice) / prevPrice) * 100;
  };

  const calculate52WeekStats = () => {
    if (!stockData?.series?.close) return { high: 0, low: 0 };
    const prices = stockData.series.close.filter(p => p !== null);
    const last252 = prices.slice(-252);
    return {
      high: Math.max(...last252),
      low: Math.min(...last252),
    };
  };

  const getTrend = () => {
    if (!stockData) return null;
    const price = stockData.last_close;
    const ma200 = stockData.ma_200;
    if (!price || !ma200) return { label: 'Unknown', color: 'text-stone-400', icon: <Activity className="w-4 h-4" /> };
    if (price > ma200) return { label: 'Bullish', color: 'text-emerald-600', icon: <TrendingUp className="w-4 h-4" /> };
    if (price < ma200) return { label: 'Bearish', color: 'text-red-600', icon: <TrendingDown className="w-4 h-4" /> };
    return { label: 'Neutral', color: 'text-stone-400', icon: <Activity className="w-4 h-4" /> };
  };

  const trend = calculateTrend();
  const weekStats = calculate52WeekStats();
  const marketTrend = getTrend();

  const formatCurrency = (val) => val ? `$${val.toFixed(2)}` : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 text-stone-900 font-sans">

      {/* Header / Navbar */}
      <div className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-md">
              <Activity className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AlgoMente
              </h1>
              <p className="text-xs text-stone-500 hidden sm:block">Stock Analytics Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Search */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="Search Symbol..."
                  className="w-48 lg:w-64 bg-stone-100 border border-stone-300 text-sm rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="absolute right-1 top-1 p-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 shadow-md"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin text-white"/> : <Search className="h-4 w-4 text-white" />}
                </button>
              </div>

              {/* Stock Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="px-3 py-2 bg-stone-100 border border-stone-300 rounded-lg hover:bg-stone-200 transition-colors flex items-center gap-1"
                >
                  <span className="text-sm font-medium">{symbol}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                    <div className="p-2 border-b border-stone-200">
                      <p className="text-xs font-semibold text-stone-600 px-2 py-1">Popular Stocks</p>
                    </div>
                    {POPULAR_STOCKS.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => handleSelectStock(stock.symbol)}
                        className="w-full px-3 py-2 text-left hover:bg-stone-50 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{stock.symbol}</p>
                          <p className="text-xs text-stone-500">{stock.name}</p>
                        </div>
                        {symbol === stock.symbol && (
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!loading && stockData && (
                <button
                  onClick={() => fetchData(symbol)}
                  className="p-2 bg-stone-100 border border-stone-300 rounded-lg hover:bg-stone-200 transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="h-4 w-4 text-stone-600" />
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 bg-stone-100 border border-stone-300 rounded-lg"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="sm:hidden bg-white border-t border-stone-200 p-4">
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="Search Symbol..."
                  className="w-full bg-stone-100 border border-stone-300 text-sm rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-1 top-1 p-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                >
                  <Search className="h-4 w-4 text-white" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto border border-stone-200 rounded-lg">
                <p className="text-xs font-semibold text-stone-600 px-3 py-2 border-b border-stone-200">Popular Stocks</p>
                {POPULAR_STOCKS.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectStock(stock.symbol)}
                    className="w-full px-3 py-2 text-left hover:bg-stone-50 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold">{stock.symbol}</p>
                      <p className="text-xs text-stone-500">{stock.name}</p>
                    </div>
                    {symbol === stock.symbol && (
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !stockData && (
          <div className="flex flex-col items-center justify-center h-64 text-stone-500">
            <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-600" />
            <p className="text-lg font-medium">Analyzing market data...</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && stockData && (
          <div className="space-y-4 sm:space-y-6">

            {/* Header Info */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">{stockData.symbol}</h2>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      trend >= 0
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {trend >= 0 ? '+' : ''}{trend.toFixed(2)}%
                    </span>
                    {marketTrend && (
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${
                        marketTrend.label === 'Bullish' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        marketTrend.label === 'Bearish' ? 'bg-red-50 border-red-200 text-red-700' :
                        'bg-stone-100 border-stone-200 text-stone-600'
                      }`}>
                        {marketTrend.icon}
                        {marketTrend.label}
                      </span>
                    )}
                  </div>
                  <p className="text-stone-500 flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Latest: {stockData.last_date.slice(0, 10)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-stone-500">52W High</p>
                    <p className="text-sm font-semibold text-stone-900">${weekStats.high.toFixed(2)}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-stone-500">52W Low</p>
                    <p className="text-sm font-semibold text-stone-900">${weekStats.low.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MetricCard
                label="Last Close"
                value={formatCurrency(stockData.last_close)}
                sub="Latest price"
                icon={DollarSign}
                color="bg-emerald-600"
                trend={trend}
              />
              <MetricCard
                label="50-Day MA"
                value={formatCurrency(stockData.ma_50)}
                sub="Short-term"
                icon={Activity}
                color="bg-blue-600"
              />
              <MetricCard
                label="100-Day MA"
                value={formatCurrency(stockData.ma_100)}
                sub="Mid-term"
                icon={BarChart2}
                color="bg-purple-600"
              />
              <MetricCard
                label="200-Day MA"
                value={formatCurrency(stockData.ma_200)}
                sub="Long-term"
                icon={TrendingUp}
                color="bg-orange-600"
              />
            </div>

            {/* Chart Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-stone-500 mr-1 flex items-center">Time:</span>
                {['1m', '3m', '6m', '1y', 'all'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      timeRange === range
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {range === 'all' ? 'All' : range.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setChartView('line')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartView === 'line'
                      ? 'bg-blue-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartView('area')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartView === 'area'
                      ? 'bg-blue-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Area
                </button>
              </div>
            </div>

            {/* Price Chart */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-stone-900">Price History & Moving Averages</h3>
                <p className="text-xs sm:text-sm text-stone-500">Technical analysis with key indicators</p>
              </div>

              <div className="h-[300px] sm:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'line' ? (
                    <LineChart data={priceChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#78716c', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        tick={{ fill: '#78716c', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />

                      {visibility.close && <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} dot={false} name="Close" />}
                      {visibility.ma50 && <Line type="monotone" dataKey="ma50" stroke="#3b82f6" strokeWidth={2} dot={false} name="MA50" strokeDasharray="5 5" />}
                      {visibility.ma100 && <Line type="monotone" dataKey="ma100" stroke="#8b5cf6" strokeWidth={2} dot={false} name="MA100" strokeDasharray="5 5" />}
                      {visibility.ma200 && <Line type="monotone" dataKey="ma200" stroke="#f97316" strokeWidth={2} dot={false} name="MA200" strokeDasharray="5 5" />}
                    </LineChart>
                  ) : (
                    <AreaChart data={priceChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#78716c', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        tick={{ fill: '#78716c', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />

                      <Area type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorClose)" name="Close" />
                      <Line type="monotone" dataKey="ma50" stroke="#3b82f6" strokeWidth={2} dot={false} name="MA50" />
                      <Line type="monotone" dataKey="ma200" stroke="#f97316" strokeWidth={2} dot={false} name="MA200" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Toggle Visibility */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => setVisibility({...visibility, close: !visibility.close})}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    visibility.close ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  Close
                </button>
                <button
                  onClick={() => setVisibility({...visibility, ma50: !visibility.ma50})}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    visibility.ma50 ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  MA50
                </button>
                <button
                  onClick={() => setVisibility({...visibility, ma100: !visibility.ma100})}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    visibility.ma100 ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  MA100
                </button>
                <button
                  onClick={() => setVisibility({...visibility, ma200: !visibility.ma200})}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    visibility.ma200 ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  MA200
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
