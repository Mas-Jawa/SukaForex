// Smooth Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        this.classList.add('active');
    });
});

// Update active nav on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Forex Analysis Bot
class ForexAnalyzer {
    constructor() {
        this.currentPrice = 0;
        this.historicalData = [];
        this.supportLevels = [];
        this.resistanceLevels = [];
        this.orderBlocks = [];
        this.fvgGaps = [];
    }

    // Generate mock price data (dalam production, ganti dengan API nyata)
    async fetchPriceData(pair, timeframe) {
        // Simulate API call delay
        await this.delay(1500);
        
        // Generate realistic price data based on pair
        const basePrices = {
            'EURUSD': 1.0850,
            'GBPUSD': 1.2650,
            'USDJPY': 149.50,
            'USDCHF': 0.8850,
            'AUDUSD': 0.6500,
            'NZDUSD': 0.6050,
            'USDCAD': 1.3650,
            'XAUUSD': 2030.00
        };

        let basePrice = basePrices[pair] || 1.0000;
        this.currentPrice = basePrice;
        this.historicalData = [];

        // Generate 100 candles of historical data
        for (let i = 0; i < 100; i++) {
            const volatility = basePrice * 0.002;
            const open = basePrice + (Math.random() - 0.5) * volatility;
            const close = open + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random() * volatility * 0.5;
            const low = Math.min(open, close) - Math.random() * volatility * 0.5;

            this.historicalData.push({
                index: i,
                open: open,
                high: high,
                low: low,
                close: close,
                volume: Math.floor(Math.random() * 1000) + 100
            });

            basePrice = close;
        }

        return this.historicalData;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ICT: Detect Order Blocks
    detectOrderBlocks() {
        this.orderBlocks = [];
        const data = this.historicalData;
        
        for (let i = 10; i < data.length - 1; i++) {
            const candle = data[i];
            const nextCandle = data[i + 1];
            
            // Bullish Order Block (last bearish candle before strong up move)
            if (candle.close < candle.open && nextCandle.close > nextCandle.open) {
                if (nextCandle.close > candle.high) {
                    this.orderBlocks.push({
                        type: 'bullish',
                        high: candle.high,
                        low: candle.low,
                        open: candle.open,
                        close: candle.close,
                        index: i,
                        strength: this.calculateOrderBlockStrength(candle, nextCandle)
                    });
                }
            }
            
            // Bearish Order Block (last bullish candle before strong down move)
            if (candle.close > candle.open && nextCandle.close < nextCandle.open) {
                if (nextCandle.close < candle.low) {
                    this.orderBlocks.push({
                        type: 'bearish',
                        high: candle.high,
                        low: candle.low,
                        open: candle.open,
                        close: candle.close,
                        index: i,
                        strength: this.calculateOrderBlockStrength(candle, nextCandle)
                    });
                }
            }
        }

        // Keep only strongest order blocks
        this.orderBlocks = this.orderBlocks
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 5);
    }

    calculateOrderBlockStrength(candle, nextCandle) {
        const bodySize = Math.abs(candle.close - candle.open);
        const nextBodySize = Math.abs(nextCandle.close - nextCandle.open);
        const wickSize = candle.high - candle.low;
        
        return (nextBodySize / bodySize) * (1 - (wickSize / (bodySize * 2)));
    }

    // ICT: Detect Fair Value Gaps (FVG)
    detectFVG() {
        this.fvgGaps = [];
        const data = this.historicalData;
        
        for (let i = 2; i < data.length; i++) {
            const candle1 = data[i - 2];
            const candle2 = data[i - 1];
            const candle3 = data[i];
            
            // Bullish FVG
            if (candle3.low > candle1.high) {
                this.fvgGaps.push({
                    type: 'bullish',
                    high: candle3.low,
                    low: candle1.high,
                    index: i,
                    size: candle3.low - candle1.high
                });
            }
            
            // Bearish FVG
            if (candle3.high < candle1.low) {
                this.fvgGaps.push({
                    type: 'bearish',
                    high: candle1.low,
                    low: candle3.high,
                    index: i,
                    size: candle1.low - candle3.high
                });
            }
        }

        // Keep most significant FVGs
        this.fvgGaps = this.fvgGaps
            .sort((a, b) => b.size - a.size)
            .slice(0, 3);
    }

    // SNR: Detect Support and Resistance
    detectSNR() {
        this.supportLevels = [];
        this.resistanceLevels = [];
        const data = this.historicalData;
        const lookback = 20;
        
        for (let i = lookback; i < data.length - lookback; i++) {
            const candle = data[i];
            let isSwingHigh = true;
            let isSwingLow = true;
            
            // Check for swing high
            for (let j = i - lookback; j <= i + lookback; j++) {
                if (j !== i && data[j].high > candle.high) {
                    isSwingHigh = false;
                }
            }
            
            // Check for swing low
            for (let j = i - lookback; j <= i + lookback; j++) {
                if (j !== i && data[j].low < candle.low) {
                    isSwingLow = false;
                }
            }
            
            if (isSwingHigh) {
                this.resistanceLevels.push({
                    price: candle.high,
                    index: i,
                    touches: this.countTouches(candle.high, 'resistance')
                });
            }
            
            if (isSwingLow) {
                this.supportLevels.push({
                    price: candle.low,
                    index: i,
                    touches: this.countTouches(candle.low, 'support')
                });
            }
        }

        // Cluster nearby levels
        this.supportLevels = this.clusterLevels(this.supportLevels);
        this.resistanceLevels = this.clusterLevels(this.resistanceLevels);
        
        // Sort by touches
        this.supportLevels.sort((a, b) => b.touches - a.touches);
        this.resistanceLevels.sort((a, b) => b.touches - a.touches);
        
        // Keep top 3 of each
        this.supportLevels = this.supportLevels.slice(0, 3);
        this.resistanceLevels = this.resistanceLevels.slice(0, 3);
    }

    countTouches(price, type) {
        const threshold = price * 0.001;
        let touches = 0;
        
        for (const candle of this.historicalData) {
            if (type === 'resistance') {
                if (Math.abs(candle.high - price) < threshold) {
                    touches++;
                }
            } else {
                if (Math.abs(candle.low - price) < threshold) {
                    touches++;
                }
            }
        }
        
        return touches;
    }

    clusterLevels(levels) {
        if (levels.length === 0) return levels;
        
        const clustered = [];
        const threshold = this.currentPrice * 0.002;
        
        levels.sort((a, b) => a.price - b.price);
        
        let currentCluster = [levels[0]];
        
        for (let i = 1; i < levels.length; i++) {
            const lastPrice = currentCluster[currentCluster.length - 1].price;
            if (levels[i].price - lastPrice < threshold) {
                currentCluster.push(levels[i]);
            } else {
                // Average the cluster
                const avgPrice = currentCluster.reduce((sum, level) => sum + level.price, 0) / currentCluster.length;
                const avgTouches = currentCluster.reduce((sum, level) => sum + level.touches, 0) / currentCluster.length;
                clustered.push({ price: avgPrice, touches: avgTouches });
                currentCluster = [levels[i]];
            }
        }
        
        // Add last cluster
        if (currentCluster.length > 0) {
            const avgPrice = currentCluster.reduce((sum, level) => sum + level.price, 0) / currentCluster.length;
            const avgTouches = currentCluster.reduce((sum, level) => sum + level.touches, 0) / currentCluster.length;
            clustered.push({ price: avgPrice, touches: avgTouches });
        }
        
        return clustered;
    }

    // Generate trading signal
    generateSignal() {
        let bullishSignals = 0;
        let bearishSignals = 0;
        let analysisDetails = [];

        // Check Order Blocks
        if (this.orderBlocks.length > 0) {
            const nearestOrderBlock = this.orderBlocks[0];
            if (nearestOrderBlock.type === 'bullish') {
                bullishSignals += 2;
                analysisDetails.push(`✅ Bullish Order Block terdeteksi di ${nearestOrderBlock.low.toFixed(5)}`);
            } else {
                bearishSignals += 2;
                analysisDetails.push(`❌ Bearish Order Block terdeteksi di ${nearestOrderBlock.high.toFixed(5)}`);
            }
        }

        // Check FVG
        if (this.fvgGaps.length > 0) {
            const nearestFVG = this.fvgGaps[0];
            if (nearestFVG.type === 'bullish') {
                bullishSignals += 1.5;
                analysisDetails.push(`✅ Bullish Fair Value Gap di ${nearestFVG.low.toFixed(5)} - ${nearestFVG.high.toFixed(5)}`);
            } else {
                bearishSignals += 1.5;
                analysisDetails.push(`❌ Bearish Fair Value Gap di ${nearestFVG.low.toFixed(5)} - ${nearestFVG.high.toFixed(5)}`);
            }
        }

        // Check Support/Resistance
        if (this.supportLevels.length > 0 && this.resistanceLevels.length > 0) {
            const nearestSupport = this.supportLevels[0];
            const nearestResistance = this.resistanceLevels[0];
            
            const distToSupport = Math.abs(this.currentPrice - nearestSupport.price);
            const distToResistance = Math.abs(this.currentPrice - nearestResistance.price);
            
            if (distToSupport < distToResistance) {
                bullishSignals += 1;
                analysisDetails.push(`✅ Harga dekat Support level di ${nearestSupport.price.toFixed(5)} (${nearestSupport.touches}x)`);
            } else {
                bearishSignals += 1;
                analysisDetails.push(`❌ Harga dekat Resistance level di ${nearestResistance.price.toFixed(5)} (${nearestResistance.touches}x)`);
            }
        }

        // Determine overall signal
        let signal, direction, confidence;
        if (bullishSignals > bearishSignals) {
            signal = 'BUY';
            direction = 'bullish';
            confidence = Math.min(95, 60 + (bullishSignals - bearishSignals) * 10);
        } else if (bearishSignals > bullishSignals) {
            signal = 'SELL';
            direction = 'bearish';
            confidence = Math.min(95, 60 + (bearishSignals - bullishSignals) * 10);
        } else {
            signal = 'WAIT';
            direction = 'neutral';
            confidence = 50;
        }

        // Calculate Entry, SL, TP
        const entry = this.currentPrice;
        let stopLoss, takeProfit;

        if (signal === 'BUY') {
            stopLoss = entry - (entry * 0.002); // 20 pips SL
            takeProfit = entry + (entry * 0.004); // 40 pips TP (1:2 RR)
        } else if (signal === 'SELL') {
            stopLoss = entry + (entry * 0.002);
            takeProfit = entry - (entry * 0.004);
        } else {
            stopLoss = entry;
            takeProfit = entry;
        }

        const rrRatio = signal === 'WAIT' ? 0 : 2;

        return {
            signal,
            direction,
            entry,
            stopLoss,
            takeProfit,
            rrRatio,
            confidence: confidence.toFixed(0),
            analysisDetails
        };
    }
}

// Chart Drawing
class ChartDrawer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    drawCandlestick(data, supportLevels, resistanceLevels, orderBlocks, fvgGaps) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const padding = 50;
        const chartWidth = this.canvas.width - padding * 2;
        const chartHeight = this.canvas.height - padding * 2;
        
        if (data.length === 0) return;

        // Calculate price range
        let minPrice = Math.min(...data.map(d => d.low));
        let maxPrice = Math.max(...data.map(d => d.high));
        const priceRange = maxPrice - minPrice;
        minPrice -= priceRange * 0.1;
        maxPrice += priceRange * 0.1;

        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(this.canvas.width - padding, y);
            this.ctx.stroke();
        }

        // Draw support levels
        supportLevels.forEach(level => {
            const y = padding + chartHeight - ((level.price - minPrice) / (maxPrice - minPrice)) * chartHeight;
            this.ctx.strokeStyle = '#4CAF50';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(this.canvas.width - padding, y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`S: ${level.price.toFixed(5)}`, this.canvas.width - padding - 60, y - 5);
        });

        // Draw resistance levels
        resistanceLevels.forEach(level => {
            const y = padding + chartHeight - ((level.price - minPrice) / (maxPrice - minPrice)) * chartHeight;
            this.ctx.strokeStyle = '#f44336';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(this.canvas.width - padding, y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            this.ctx.fillStyle = '#f44336';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`R: ${level.price.toFixed(5)}`, this.canvas.width - padding - 60, y - 5);
        });

        // Draw FVG gaps
        fvgGaps.forEach(gap => {
            const yHigh = padding + chartHeight - ((gap.high - minPrice) / (maxPrice - minPrice)) * chartHeight;
            const yLow = padding + chartHeight - ((gap.low - minPrice) / (maxPrice - minPrice)) * chartHeight;
            
            this.ctx.fillStyle = gap.type === 'bullish' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)';
            this.ctx.fillRect(padding, yHigh, chartWidth, yLow - yHigh);
        });

        // Draw order blocks
        orderBlocks.forEach(ob => {
            const yHigh = padding + chartHeight - ((ob.high - minPrice) / (maxPrice - minPrice)) * chartHeight;
            const yLow = padding + chartHeight - ((ob.low - minPrice) / (maxPrice - minPrice)) * chartHeight;
            
            this.ctx.fillStyle = ob.type === 'bullish' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 152, 0, 0.2)';
            this.ctx.fillRect(padding, yHigh, chartWidth, yLow - yHigh);
        });

        // Draw candlesticks
        const candleWidth = chartWidth / data.length;
        data.forEach((candle, i) => {
            const x = padding + i * candleWidth;
            const openY = padding + chartHeight - ((candle.open - minPrice) / (maxPrice - minPrice)) * chartHeight;
            const closeY = padding + chartHeight - ((candle.close - minPrice) / (maxPrice - minPrice)) * chartHeight;
            const highY = padding + chartHeight - ((candle.high - minPrice) / (maxPrice - minPrice)) * chartHeight;
            const lowY = padding + chartHeight - ((candle.low - minPrice) / (maxPrice - minPrice)) * chartHeight;
            
            const isBullish = candle.close > candle.open;
            this.ctx.strokeStyle = isBullish ? '#4CAF50' : '#f44336';
            this.ctx.fillStyle = isBullish ? '#4CAF50' : '#f44336';
            
            // Draw wick
            this.ctx.beginPath();
            this.ctx.moveTo(x + candleWidth / 2, highY);
            this.ctx.lineTo(x + candleWidth / 2, lowY);
            this.ctx.stroke();
            
            // Draw body
            const bodyHeight = Math.abs(closeY - openY);
            this.ctx.fillRect(x + 2, Math.min(openY, closeY), candleWidth - 4, Math.max(bodyHeight, 1));
        });

        // Draw current price line
        const currentPrice = data[data.length - 1].close;
        const currentY = padding + chartHeight - ((currentPrice - minPrice) / (maxPrice - minPrice)) * chartHeight;
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(padding, currentY);
        this.ctx.lineTo(this.canvas.width - padding, currentY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(`Current: ${currentPrice.toFixed(5)}`, this.canvas.width - padding - 100, currentY - 10);
    }
}

// Main Application
const analyzer = new ForexAnalyzer();
const chartDrawer = new ChartDrawer('chart-canvas');

const analyzeBtn = document.getElementById('analyze-btn');
const analysisResult = document.getElementById('analysis-result');

let currentAnalysis = null;

analyzeBtn.addEventListener('click', async () => {
    const pair = document.getElementById('pair-selector').value;
    const timeframe = document.getElementById('timeframe-selector').value;
    
    // Show loading state
    analyzeBtn.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
    analyzeBtn.disabled = true;
    analysisResult.style.display = 'none';
    
    try {
        // Fetch data
        await analyzer.fetchPriceData(pair, timeframe);
        
        // Run analysis
        analyzer.detectOrderBlocks();
        analyzer.detectFVG();
        analyzer.detectSNR();
        
        // Generate signal
        currentAnalysis = analyzer.generateSignal();
        
        // Draw chart
        chartDrawer.drawCandlestick(
            analyzer.historicalData,
            analyzer.supportLevels,
            analyzer.resistanceLevels,
            analyzer.orderBlocks,
            analyzer.fvgGaps
        );
        
        // Display results
        displayResults(currentAnalysis, pair, timeframe);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat melakukan analisa. Silakan coba lagi.');
    }
    
    // Reset button
    analyzeBtn.innerHTML = '🔍 Mulai Analisa';
    analyzeBtn.disabled = false;
});

function displayResults(analysis, pair, timeframe) {
    document.getElementById('signal-value').textContent = analysis.signal;
    document.getElementById('signal-value').style.color = analysis.signal === 'BUY' ? '#4CAF50' : analysis.signal === 'SELL' ? '#f44336' : '#ff9800';
    
    document.getElementById('entry-price').textContent = analysis.entry.toFixed(5);
    document.getElementById('stop-loss').textContent = analysis.stopLoss.toFixed(5);
    document.getElementById('take-profit').textContent = analysis.takeProfit.toFixed(5);
    document.getElementById('rr-ratio').textContent = `1:${analysis.rrRatio}`;
    document.getElementById('confidence').textContent = `${analysis.confidence}%`;
    
    document.getElementById('analysis-text').innerHTML = analysis.analysisDetails.join('<br>');
    
    analysisResult.style.display = 'block';
}

// WhatsApp integration
document.getElementById('whatsapp-btn').addEventListener('click', () => {
    if (!currentAnalysis) return;
    
    const pair = document.getElementById('pair-selector').value;
    const timeframe = document.getElementById('timeframe-selector').value;
    
    const message = `🤖 *SUKA FOREX - BOT ANALISA* 🤖

━━━━━━━━━━━━━━━
📊 *ANALISA TRADING*
━━━━━━━━━━━━━━━

🔹 *Pair:* ${pair}
🔹 *Timeframe:* ${timeframe}
🔹 *Signal:* ${currentAnalysis.signal}
🔹 *Confidence:* ${currentAnalysis.confidence}%

━━━━━━━━━━━━━━━
📍 *ENTRY & RISK MANAGEMENT*
━━━━━━━━━━━━━━━

✅ *Entry Price:* ${currentAnalysis.entry.toFixed(5)}
⛔ *Stop Loss:* ${currentAnalysis.stopLoss.toFixed(5)}
🎯 *Take Profit:* ${currentAnalysis.takeProfit.toFixed(5)}
📈 *Risk/Reward:* 1:${currentAnalysis.rrRatio}

━━━━━━━━━━━━━━━
📝 *DETAIL ANALISA*
━━━━━━━━━━━━━━━

${currentAnalysis.analysisDetails.join('\n')}

━━━━━━━━━━━━━━━
⚠️ *DISCLAIMER*
━━━━━━━━━━━━━━━

Analisa ini berdasarkan algoritma ICT & SNR. Trading forex memiliki risiko tinggi. Selalu gunakan money management yang baik dan trading dengan bijak.

🚀 *Join Broker Terpercaya:*
• Exness: https://one.exness-track.com/a/V1S8Vg2x
• HFM: https://hfm.com/?refid=593900
• XM: https://clicks.pipaffiliates.com/c?c=916047&l=id&p=1`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
});

// Initial chart draw
window.addEventListener('load', async () => {
    await analyzer.fetchPriceData('EURUSD', 'H1');
    analyzer.detectOrderBlocks();
    analyzer.detectFVG();
    analyzer.detectSNR();
    chartDrawer.drawCandlestick(
        analyzer.historicalData,
        analyzer.supportLevels,
        analyzer.resistanceLevels,
        analyzer.orderBlocks,
        analyzer.fvgGaps
    );
});