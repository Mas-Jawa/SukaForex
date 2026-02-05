// Chart Component with TradingView Widget
class ChartComponent {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.container = document.getElementById(containerId);
        this.ctx = this.canvas.getContext('2d');
        this.tradingViewWidget = null;
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    drawTechnicalChart(data, analysis) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!data || data.length === 0) return;

        const padding = 50;
        const chartWidth = this.canvas.width - padding * 2;
        const chartHeight = this.canvas.height - padding * 2;

        // Calculate price range
        const allPrices = data.flatMap(d => [d.high, d.low]);
        let minPrice = Math.min(...allPrices);
        let maxPrice = Math.max(...allPrices);
        const priceRange = maxPrice - minPrice;
        minPrice -= priceRange * 0.1;
        maxPrice += priceRange * 0.1;

        // Draw grid
        this.drawGrid(padding, chartWidth, chartHeight);

        // Draw support levels
        if (analysis && analysis.support_levels) {
            this.drawSupportLevels(analysis.support_levels, minPrice, maxPrice, padding, chartWidth, chartHeight);
        }

        // Draw resistance levels
        if (analysis && analysis.resistance_levels) {
            this.drawResistanceLevels(analysis.resistance_levels, minPrice, maxPrice, padding, chartWidth, chartHeight);
        }

        // Draw FVG gaps
        if (analysis && analysis.fvg_gaps) {
            this.drawFVGGaps(analysis.fvg_gaps, minPrice, maxPrice, padding, chartWidth, chartHeight);
        }

        // Draw order blocks
        if (analysis && analysis.order_blocks) {
            this.drawOrderBlocks(analysis.order_blocks, minPrice, maxPrice, padding, chartWidth, chartHeight);
        }

        // Draw candlesticks
        this.drawCandlesticks(data, minPrice, maxPrice, padding, chartWidth, chartHeight);

        // Draw current price line
        this.drawCurrentPriceLine(data[data.length - 1], minPrice, maxPrice, padding, chartWidth, chartHeight);
    }

    drawGrid(padding, chartWidth, chartHeight) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(this.canvas.width - padding, y);
            this.ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 0; i <= 5; i++) {
            const x = padding + (chartWidth / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding);
            this.ctx.lineTo(x, this.canvas.height - padding);
            this.ctx.stroke();
        }
    }

    drawSupportLevels(levels, minPrice, maxPrice, padding, chartWidth, chartHeight) {
        levels.forEach(level => {
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
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(`S: ${level.price.toFixed(5)} (${level.strength}x)`, this.canvas.width - padding - 100, y - 5);
        });
    }

    drawResistanceLevels(levels, minPrice, maxPrice, padding, chartWidth, chartHeight) {
        levels.forEach(level => {
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
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(`R: ${level.price.toFixed(5)} (${level.strength}x)`, this.canvas.width - padding - 100, y - 5);
        });
    }

    drawFVGGaps(gaps, minPrice, maxPrice, padding, chartWidth, chartHeight) {
        gaps.forEach(gap => {
            const yHigh = padding + chartHeight - ((gap.high - minPrice) / (maxPrice - minPrice)) * chartHeight;
            const yLow = padding + chartHeight - ((gap.low - minPrice) / (maxPrice - minPrice)) * chartHeight;
            
            this.ctx.fillStyle = gap.type === 'bullish' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)';
            this.ctx.fillRect(padding, yHigh, chartWidth, yLow - yHigh);
        });
    }

    drawOrderBlocks(blocks, minPrice, maxPrice, padding, chartWidth, chartHeight) {
        blocks.forEach(ob => {
            const yHigh = padding + chartHeight - ((ob.high - minPrice) / (maxPrice - minPrice)) * chartHeight;
            const yLow = padding + chartHeight - ((ob.low - minPrice) / (maxPrice - minPrice)) * chartHeight;
            
            this.ctx.fillStyle = ob.type === 'bullish' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 152, 0, 0.2)';
            this.ctx.fillRect(padding, yHigh, chartWidth, yLow - yHigh);
        });
    }

    drawCandlesticks(data, minPrice, maxPrice, padding, chartWidth, chartHeight) {
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
    }

    drawCurrentPriceLine(candle, minPrice, maxPrice, padding, chartWidth, chartHeight) {
        const currentY = padding + chartHeight - ((candle.close - minPrice) / (maxPrice - minPrice)) * chartHeight;
        
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
        this.ctx.fillText(`Current: ${candle.close.toFixed(5)}`, this.canvas.width - padding - 120, currentY - 10);
    }

    // Load TradingView Widget
    loadTradingViewWidget(symbol, timeframe = '60') {
        // Clear existing widget
        this.container.innerHTML = '';
        
        // Create widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'tradingview-widget';
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '600px';
        this.container.appendChild(widgetContainer);

        // TradingView widget script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        
        script.onload = () => {
            if (window.TradingView) {
                new TradingView.widget({
                    "autosize": true,
                    "symbol": symbol,
                    "interval": timeframe,
                    "timezone": "Asia/Jakarta",
                    "theme": "dark",
                    "style": "1",
                    "locale": "id",
                    "toolbar_bg": "#f1f3f6",
                    "enable_publishing": false,
                    "allow_symbol_change": true,
                    "container_id": "tradingview-widget",
                    "hide_side_toolbar": false,
                    "studies": [
                        "MASimple@tv-basicstudies",
                        "RSI@tv-basicstudies",
                        "MACD@tv-basicstudies"
                    ]
                });
            }
        };
        
        document.head.appendChild(script);
    }

    updateTradingViewSymbol(symbol, timeframe = '60') {
        if (this.tradingViewWidget) {
            this.loadTradingViewWidget(symbol, timeframe);
        } else {
            this.loadTradingViewWidget(symbol, timeframe);
        }
    }
}