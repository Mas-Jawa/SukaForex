// Price Ticker Component for Real-time Price Display
class PriceTicker {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.price = 0;
        this.change = 0;
        this.changePercent = 0;
        this.previousPrice = 0;
    }

    update(price, previousPrice) {
        this.price = price;
        this.previousPrice = previousPrice;
        
        if (previousPrice > 0) {
            this.change = price - previousPrice;
            this.changePercent = (this.change / previousPrice) * 100;
        }
        
        this.render();
    }

    render() {
        const isPositive = this.change >= 0;
        const color = isPositive ? '#4CAF50' : '#f44336';
        const arrow = isPositive ? '▲' : '▼';
        
        this.element.innerHTML = `
            <div class="price-ticker">
                <div class="price-value">
                    <span class="price-label">Current Price:</span>
                    <span class="price-number" style="color: ${color}">${this.price.toFixed(5)}</span>
                </div>
                <div class="price-change">
                    <span style="color: ${color}">${arrow} ${Math.abs(this.change).toFixed(5)} (${Math.abs(this.changePercent).toFixed(2)}%)</span>
                </div>
                <div class="price-time">
                    <span class="live-indicator ${isPositive ? 'live-up' : 'live-down'}"></span>
                    <span>Live</span>
                </div>
            </div>
        `;
    }
}