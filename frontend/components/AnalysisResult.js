// Analysis Result Component
class AnalysisResult {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.analysis = null;
        this.pair = '';
        this.timeframe = '';
    }

    update(analysis, pair, timeframe) {
        this.analysis = analysis;
        this.pair = pair;
        this.timeframe = timeframe;
        this.render();
    }

    render() {
        if (!this.analysis) {
            this.element.style.display = 'none';
            return;
        }

        this.element.style.display = 'block';
        
        const signalColor = this.analysis.signal === 'BUY' ? '#4CAF50' : 
                           this.analysis.signal === 'SELL' ? '#f44336' : '#ff9800';
        
        this.element.innerHTML = `
            <div class="analysis-result">
                <h3>📊 Hasil Analisa</h3>
                
                <div class="signal-info">
                    <div class="signal-item signal-item-main">
                        <h4>Signal</h4>
                        <p id="signal-value" style="color: ${signalColor}; font-size: 2rem; font-weight: bold;">${this.analysis.signal}</p>
                    </div>
                    <div class="signal-item">
                        <h4>Entry Price</h4>
                        <p id="entry-price">${this.analysis.entry.toFixed(5)}</p>
                    </div>
                    <div class="signal-item">
                        <h4>Stop Loss</h4>
                        <p id="stop-loss" style="color: #f44336;">${this.analysis.stop_loss.toFixed(5)}</p>
                    </div>
                    <div class="signal-item">
                        <h4>Take Profit</h4>
                        <p id="take-profit" style="color: #4CAF50;">${this.analysis.take_profit.toFixed(5)}</p>
                    </div>
                    <div class="signal-item">
                        <h4>Risk/Reward</h4>
                        <p id="rr-ratio">1:${this.analysis.rr_ratio.toFixed(1)}</p>
                    </div>
                    <div class="signal-item">
                        <h4>Confidence</h4>
                        <p id="confidence">${this.analysis.confidence}%</p>
                    </div>
                </div>

                <div class="technical-indicators">
                    <h4 style="color: var(--highlight-color); margin-bottom: 1rem;">📈 Technical Indicators:</h4>
                    <div class="indicators-grid">
                        <div class="indicator-box">
                            <span class="indicator-label">RSI</span>
                            <span class="indicator-value">${this.analysis.technical_indicators?.rsi?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div class="indicator-box">
                            <span class="indicator-label">MACD</span>
                            <span class="indicator-value">${this.analysis.technical_indicators?.macd?.toFixed(5) || 'N/A'}</span>
                        </div>
                        <div class="indicator-box">
                            <span class="indicator-label">EMA 20</span>
                            <span class="indicator-value">${this.analysis.technical_indicators?.ema_20?.toFixed(5) || 'N/A'}</span>
                        </div>
                        <div class="indicator-box">
                            <span class="indicator-label">EMA 50</span>
                            <span class="indicator-value">${this.analysis.technical_indicators?.ema_50?.toFixed(5) || 'N/A'}</span>
                        </div>
                        <div class="indicator-box">
                            <span class="indicator-label">ATR</span>
                            <span class="indicator-value">${this.analysis.technical_indicators?.atr?.toFixed(5) || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="analysis-details" id="analysis-details">
                    <h4 style="color: var(--highlight-color); margin-bottom: 1rem;">📝 Detail Analisa:</h4>
                    <p id="analysis-text" style="color: rgba(255,255,255,0.8); line-height: 1.6;">
                        ${this.analysis.analysis_details?.join('<br>') || 'No analysis details available'}
                    </p>
                </div>

                <button class="whatsapp-btn" id="whatsapp-btn">
                    <span>📱</span> Kirim ke WhatsApp
                </button>
            </div>
        `;
        
        // Add event listener for WhatsApp button
        const whatsappBtn = document.getElementById('whatsapp-btn');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => this.sendToWhatsApp());
        }
    }

    sendToWhatsApp() {
        if (!this.analysis) return;
        
        const message = `🤖 *SUKA FOREX - BOT ANALISA* 🤖

━━━━━━━━━━━━━━━━━━━━━
📊 *ANALISA TRADING*
━━━━━━━━━━━━━━━━━━━━━

🔹 *Pair:* ${this.pair}
🔹 *Timeframe:* ${this.timeframe}
🔹 *Signal:* ${this.analysis.signal}
🔹 *Confidence:* ${this.analysis.confidence}%

━━━━━━━━━━━━━━━━━━━━━
📍 *ENTRY & RISK MANAGEMENT*
━━━━━━━━━━━━━━━━━━━━━

✅ *Entry Price:* ${this.analysis.entry.toFixed(5)}
⛔ *Stop Loss:* ${this.analysis.stop_loss.toFixed(5)}
🎯 *Take Profit:* ${this.analysis.take_profit.toFixed(5)}
📈 *Risk/Reward:* 1:${this.analysis.rr_ratio.toFixed(1)}

━━━━━━━━━━━━━━━━━━━━━
📈 *TECHNICAL INDICATORS*
━━━━━━━━━━━━━━━━━━━━━

• RSI: ${this.analysis.technical_indicators?.rsi?.toFixed(2) || 'N/A'}
• MACD: ${this.analysis.technical_indicators?.macd?.toFixed(5) || 'N/A'}
• EMA 20: ${this.analysis.technical_indicators?.ema_20?.toFixed(5) || 'N/A'}
• EMA 50: ${this.analysis.technical_indicators?.ema_50?.toFixed(5) || 'N/A'}
• ATR: ${this.analysis.technical_indicators?.atr?.toFixed(5) || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━
📝 *DETAIL ANALISA*
━━━━━━━━━━━━━━━━━━━━━

${this.analysis.analysis_details?.join('\n') || 'No details available'}

━━━━━━━━━━━━━━━━━━━━━
⚠️ *DISCLAIMER*
━━━━━━━━━━━━━━━━━━━━━

Analisa ini berdasarkan algoritma ICT & SNR dengan technical indicators advanced. Trading forex memiliki risiko tinggi. Selalu gunakan money management yang baik dan trading dengan bijak.

🚀 *Join Broker Terpercaya:*
• Exness: https://one.exness-track.com/a/V1S8Vg2x
• HFM: https://hfm.com/?refid=593900
• XM: https://clicks.pipaffiliates.com/c?c=916047&l=id&p=1`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
}