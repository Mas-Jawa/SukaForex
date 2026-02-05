from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import pandas as pd
import numpy as np
import ta
import yfinance as yf
from datetime import datetime, timedelta
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'forex-trading-bot-secret-key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store active connections and market data
active_connections = {}
market_data_cache = {}

# Pair configurations
PAIR_CONFIG = {
    'EURUSD': {'symbol': 'EURUSD=X', 'name': 'EUR/USD', 'pip': 0.0001},
    'GBPUSD': {'symbol': 'GBPUSD=X', 'name': 'GBP/USD', 'pip': 0.0001},
    'USDJPY': {'symbol': 'USDJPY=X', 'name': 'USD/JPY', 'pip': 0.01},
    'USDCHF': {'symbol': 'USDCHF=X', 'name': 'USD/CHF', 'pip': 0.0001},
    'AUDUSD': {'symbol': 'AUDUSD=X', 'name': 'AUD/USD', 'pip': 0.0001},
    'NZDUSD': {'symbol': 'NZDUSD=X', 'name': 'NZD/USD', 'pip': 0.0001},
    'USDCAD': {'symbol': 'USDCAD=X', 'name': 'USD/CAD', 'pip': 0.0001},
    'XAUUSD': {'symbol': 'GC=F', 'name': 'Gold', 'pip': 0.01}
}

def fetch_real_time_data(pair, interval='1h'):
    """Fetch real-time data from Yahoo Finance"""
    try:
        symbol = PAIR_CONFIG[pair]['symbol']
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Fetch data
        df = yf.download(symbol, start=start_date, end=end_date, interval=interval, progress=False)
        
        if df.empty:
            # Fallback to mock data if API fails
            return generate_mock_data(pair)
        
        # Reset index
        df.reset_index(inplace=True)
        
        # Convert to required format
        data = []
        for _, row in df.tail(100).iterrows():
            data.append({
                'time': row['Date'].strftime('%Y-%m-%d %H:%M:%S'),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume']) if 'Volume' in row else 0
            })
        
        return data
    
    except Exception as e:
        print(f"Error fetching data for {pair}: {e}")
        return generate_mock_data(pair)

def generate_mock_data(pair):
    """Generate realistic mock data as fallback"""
    base_prices = {
        'EURUSD': 1.0850,
        'GBPUSD': 1.2650,
        'USDJPY': 149.50,
        'USDCHF': 0.8850,
        'AUDUSD': 0.6500,
        'NZDUSD': 0.6050,
        'USDCAD': 1.3650,
        'XAUUSD': 2030.00
    }
    
    base_price = base_prices.get(pair, 1.0000)
    volatility = base_price * 0.002
    data = []
    
    for i in range(100):
        time_str = (datetime.now() - timedelta(hours=100-i)).strftime('%Y-%m-%d %H:%M:%S')
        open_price = base_price + (np.random.random() - 0.5) * volatility
        close_price = open_price + (np.random.random() - 0.5) * volatility
        high_price = max(open_price, close_price) + np.random.random() * volatility * 0.5
        low_price = min(open_price, close_price) - np.random.random() * volatility * 0.5
        
        data.append({
            'time': time_str,
            'open': open_price,
            'high': high_price,
            'low': low_price,
            'close': close_price,
            'volume': int(np.random.random() * 1000) + 100
        })
        
        base_price = close_price
    
    return data

class AdvancedForexAnalyzer:
    def __init__(self, data, pair):
        self.data = data
        self.pair = pair
        self.df = pd.DataFrame(data)
        self.current_price = self.df['close'].iloc[-1]
        
    def calculate_technical_indicators(self):
        """Calculate advanced technical indicators using ta library"""
        df = self.df.copy()
        
        # RSI (Relative Strength Index)
        df['rsi'] = ta.momentum.RSIIndicator(df['close'], window=14).rsi()
        
        # MACD (Moving Average Convergence Divergence)
        macd = ta.trend.MACD(df['close'])
        df['macd'] = macd.macd()
        df['macd_signal'] = macd.macd_signal()
        df['macd_diff'] = macd.macd_diff()
        
        # Bollinger Bands
        bollinger = ta.volatility.BollingerBands(df['close'], window=20)
        df['bb_upper'] = bollinger.bollinger_hband()
        df['bb_middle'] = bollinger.bollinger_mavg()
        df['bb_lower'] = bollinger.bollinger_lband()
        
        # EMA (Exponential Moving Averages)
        df['ema_20'] = ta.trend.EMAIndicator(df['close'], window=20).ema_indicator()
        df['ema_50'] = ta.trend.EMAIndicator(df['close'], window=50).ema_indicator()
        
        # ATR (Average True Range)
        df['atr'] = ta.volatility.AverageTrueRange(df['high'], df['low'], df['close']).average_true_range()
        
        return df
    
    def detect_support_resistance_advanced(self):
        """Advanced support and resistance detection using pivot points"""
        df = self.df.copy()
        lookback = 20
        
        support_levels = []
        resistance_levels = []
        
        for i in range(lookback, len(df) - lookback):
            current = df.iloc[i]
            
            # Find swing highs (resistance)
            is_swing_high = True
            for j in range(i - lookback, i + lookback + 1):
                if j != i and df.iloc[j]['high'] > current['high']:
                    is_swing_high = False
                    break
            
            if is_swing_high:
                resistance_levels.append({
                    'price': float(current['high']),
                    'index': i,
                    'time': current['time']
                })
            
            # Find swing lows (support)
            is_swing_low = True
            for j in range(i - lookback, i + lookback + 1):
                if j != i and df.iloc[j]['low'] < current['low']:
                    is_swing_low = False
                    break
            
            if is_swing_low:
                support_levels.append({
                    'price': float(current['low']),
                    'index': i,
                    'time': current['time']
                })
        
        # Cluster nearby levels
        support_levels = self._cluster_levels(support_levels)
        resistance_levels = self._cluster_levels(resistance_levels)
        
        # Keep only the strongest levels
        support_levels = sorted(support_levels, key=lambda x: x['strength'], reverse=True)[:3]
        resistance_levels = sorted(resistance_levels, key=lambda x: x['strength'], reverse=True)[:3]
        
        return support_levels, resistance_levels
    
    def _cluster_levels(self, levels):
        """Cluster nearby price levels"""
        if len(levels) == 0:
            return []
        
        threshold = self.current_price * 0.002
        clustered = []
        current_cluster = [levels[0]]
        
        for level in levels[1:]:
            last_price = current_cluster[-1]['price']
            if abs(level['price'] - last_price) < threshold:
                current_cluster.append(level)
            else:
                # Average the cluster
                avg_price = sum(l['price'] for l in current_cluster) / len(current_cluster)
                clustered.append({
                    'price': avg_price,
                    'strength': len(current_cluster),
                    'time': current_cluster[0]['time']
                })
                current_cluster = [level]
        
        # Add last cluster
        if current_cluster:
            avg_price = sum(l['price'] for l in current_cluster) / len(current_cluster)
            clustered.append({
                'price': avg_price,
                'strength': len(current_cluster),
                'time': current_cluster[0]['time']
            })
        
        return clustered
    
    def detect_ict_patterns(self):
        """ICT (Inner Circle Trader) pattern detection"""
        df = self.df.copy()
        
        order_blocks = []
        fvg_gaps = []
        
        # Detect Order Blocks
        for i in range(5, len(df) - 1):
            current = df.iloc[i]
            next_candle = df.iloc[i + 1]
            
            # Bullish Order Block
            if current['close'] < current['open'] and next_candle['close'] > next_candle['open']:
                if next_candle['close'] > current['high']:
                    order_blocks.append({
                        'type': 'bullish',
                        'high': float(current['high']),
                        'low': float(current['low']),
                        'open': float(current['open']),
                        'close': float(current['close']),
                        'index': i,
                        'time': current['time']
                    })
            
            # Bearish Order Block
            elif current['close'] > current['open'] and next_candle['close'] < next_candle['open']:
                if next_candle['close'] < current['low']:
                    order_blocks.append({
                        'type': 'bearish',
                        'high': float(current['high']),
                        'low': float(current['low']),
                        'open': float(current['open']),
                        'close': float(current['close']),
                        'index': i,
                        'time': current['time']
                    })
        
        # Detect Fair Value Gaps (FVG)
        for i in range(2, len(df)):
            candle1 = df.iloc[i - 2]
            candle3 = df.iloc[i]
            
            # Bullish FVG
            if candle3['low'] > candle1['high']:
                fvg_gaps.append({
                    'type': 'bullish',
                    'high': float(candle3['low']),
                    'low': float(candle1['high']),
                    'index': i,
                    'time': candle3['time']
                })
            
            # Bearish FVG
            elif candle3['high'] < candle1['low']:
                fvg_gaps.append({
                    'type': 'bearish',
                    'high': float(candle1['low']),
                    'low': float(candle3['high']),
                    'index': i,
                    'time': candle3['time']
                })
        
        # Keep most significant patterns
        order_blocks = order_blocks[-3:] if len(order_blocks) > 3 else order_blocks
        fvg_gaps = fvg_gaps[-2:] if len(fvg_gaps) > 2 else fvg_gaps
        
        return order_blocks, fvg_gaps
    
    def generate_signal_advanced(self):
        """Generate advanced trading signal"""
        df = self.calculate_technical_indicators()
        support_levels, resistance_levels = self.detect_support_resistance_advanced()
        order_blocks, fvg_gaps = self.detect_ict_patterns()
        
        bullish_signals = 0
        bearish_signals = 0
        analysis_details = []
        
        # RSI Analysis
        latest_rsi = df['rsi'].iloc[-1]
        if latest_rsi < 30:
            bullish_signals += 2
            analysis_details.append(f"✅ RSI Oversold ({latest_rsi:.2f})")
        elif latest_rsi > 70:
            bearish_signals += 2
            analysis_details.append(f"❌ RSI Overbought ({latest_rsi:.2f})")
        
        # MACD Analysis
        macd_diff = df['macd_diff'].iloc[-1]
        if macd_diff > 0:
            bullish_signals += 1.5
            analysis_details.append(f"✅ MACD Bullish Crossover")
        else:
            bearish_signals += 1.5
            analysis_details.append(f"❌ MACD Bearish Crossover")
        
        # EMA Analysis
        ema_20 = df['ema_20'].iloc[-1]
        ema_50 = df['ema_50'].iloc[-1]
        if ema_20 > ema_50:
            bullish_signals += 1
            analysis_details.append(f"✅ EMA 20 above EMA 50")
        else:
            bearish_signals += 1
            analysis_details.append(f"❌ EMA 20 below EMA 50")
        
        # Bollinger Bands Analysis
        bb_upper = df['bb_upper'].iloc[-1]
        bb_lower = df['bb_lower'].iloc[-1]
        if self.current_price < bb_lower:
            bullish_signals += 1.5
            analysis_details.append(f"✅ Price below lower Bollinger Band")
        elif self.current_price > bb_upper:
            bearish_signals += 1.5
            analysis_details.append(f"❌ Price above upper Bollinger Band")
        
        # Support/Resistance Analysis
        if support_levels:
            nearest_support = support_levels[0]
            dist_to_support = abs(self.current_price - nearest_support['price']) / self.current_price
            if dist_to_support < 0.002:
                bullish_signals += 1
                analysis_details.append(f"✅ Price near Support ({nearest_support['price']:.5f}, {nearest_support['strength']} touches)")
        
        if resistance_levels:
            nearest_resistance = resistance_levels[0]
            dist_to_resistance = abs(self.current_price - nearest_resistance['price']) / self.current_price
            if dist_to_resistance < 0.002:
                bearish_signals += 1
                analysis_details.append(f"❌ Price near Resistance ({nearest_resistance['price']:.5f}, {nearest_resistance['strength']} touches)")
        
        # ICT Patterns Analysis
        if order_blocks:
            latest_ob = order_blocks[-1]
            if latest_ob['type'] == 'bullish':
                bullish_signals += 1
                analysis_details.append(f"✅ Bullish Order Block at {latest_ob['low']:.5f}")
            else:
                bearish_signals += 1
                analysis_details.append(f"❌ Bearish Order Block at {latest_ob['high']:.5f}")
        
        if fvg_gaps:
            latest_fvg = fvg_gaps[-1]
            if latest_fvg['type'] == 'bullish':
                bullish_signals += 0.5
                analysis_details.append(f"✅ Bullish FVG gap detected")
            else:
                bearish_signals += 0.5
                analysis_details.append(f"❌ Bearish FVG gap detected")
        
        # Determine overall signal
        if bullish_signals > bearish_signals:
            signal = 'BUY'
            direction = 'bullish'
            confidence = min(95, 60 + (bullish_signals - bearish_signals) * 5)
        elif bearish_signals > bullish_signals:
            signal = 'SELL'
            direction = 'bearish'
            confidence = min(95, 60 + (bearish_signals - bullish_signals) * 5)
        else:
            signal = 'WAIT'
            direction = 'neutral'
            confidence = 50
        
        # Calculate Entry, SL, TP using ATR
        atr = df['atr'].iloc[-1]
        entry = self.current_price
        
        if signal == 'BUY':
            stop_loss = entry - (atr * 1.5)
            take_profit = entry + (atr * 3.0)
        elif signal == 'SELL':
            stop_loss = entry + (atr * 1.5)
            take_profit = entry - (atr * 3.0)
        else:
            stop_loss = entry
            take_profit = entry
        
        rr_ratio = 0 if signal == 'WAIT' else 2.0
        
        return {
            'signal': signal,
            'direction': direction,
            'entry': entry,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'rr_ratio': rr_ratio,
            'confidence': int(confidence),
            'analysis_details': analysis_details,
            'technical_indicators': {
                'rsi': float(latest_rsi),
                'macd': float(df['macd'].iloc[-1]),
                'ema_20': float(ema_20),
                'ema_50': float(ema_50),
                'atr': float(atr)
            },
            'support_levels': support_levels,
            'resistance_levels': resistance_levels,
            'order_blocks': order_blocks,
            'fvg_gaps': fvg_gaps
        }

# API Routes
@app.route('/api/data/<pair>')
def get_market_data(pair):
    """Get market data for a specific pair"""
    timeframe = request.args.get('timeframe', '1h')
    data = fetch_real_time_data(pair, timeframe)
    return jsonify(data)

@app.route('/api/analyze', methods=['POST'])
def analyze_market():
    """Analyze market and generate trading signal"""
    data = request.json
    pair = data.get('pair', 'EURUSD')
    market_data = data.get('data', fetch_real_time_data(pair))
    
    analyzer = AdvancedForexAnalyzer(market_data, pair)
    signal = analyzer.generate_signal_advanced()
    
    return jsonify(signal)

@app.route('/api/pairs')
def get_pairs():
    """Get available trading pairs"""
    return jsonify(PAIR_CONFIG)

@app.route('/api/price/<pair>')
def get_current_price(pair):
    """Get current price for a pair"""
    try:
        symbol = PAIR_CONFIG[pair]['symbol']
        ticker = yf.Ticker(symbol)
        info = ticker.history(period='1d', interval='1m')
        
        if not info.empty:
            current_price = float(info['Close'].iloc[-1])
            return jsonify({
                'pair': pair,
                'price': current_price,
                'timestamp': datetime.now().isoformat()
            })
    except:
        pass
    
    # Fallback to cached or mock data
    data = fetch_real_time_data(pair)
    current_price = data[-1]['close']
    
    return jsonify({
        'pair': pair,
        'price': current_price,
        'timestamp': datetime.now().isoformat()
    })

# SocketIO for real-time updates
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('subscribe_pair')
def handle_subscribe(data):
    pair = data.get('pair', 'EURUSD')
    socketio.emit('subscribed', {'pair': pair})
    
    # Start real-time updates for this pair
    def update_market():
        while True:
            try:
                price_data = get_current_price(pair).json
                socketio.emit('price_update', price_data)
                time.sleep(5)  # Update every 5 seconds
            except Exception as e:
                print(f"Error updating price: {e}")
                time.sleep(5)
    
    thread = threading.Thread(target=update_market)
    thread.daemon = True
    thread.start()

def background_thread():
    """Background thread for periodic updates"""
    while True:
        for pair in PAIR_CONFIG.keys():
            try:
                price_data = get_current_price(pair).json
                socketio.emit('price_update', price_data)
            except:
                pass
        time.sleep(10)

if __name__ == '__main__':
    # Start background thread
    thread = threading.Thread(target=background_thread)
    thread.daemon = True
    thread.start()
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)