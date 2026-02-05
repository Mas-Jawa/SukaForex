// API Module for Backend Communication
const API_BASE_URL = 'http://localhost:5000/api';

class APIClient {
    async fetchMarketData(pair, timeframe = '1h') {
        try {
            const response = await fetch(`${API_BASE_URL}/data/${pair}?timeframe=${timeframe}`);
            if (!response.ok) throw new Error('Failed to fetch market data');
            return await response.json();
        } catch (error) {
            console.error('Error fetching market data:', error);
            throw error;
        }
    }

    async analyzeMarket(pair, data = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pair: pair,
                    data: data
                })
            });
            if (!response.ok) throw new Error('Failed to analyze market');
            return await response.json();
        } catch (error) {
            console.error('Error analyzing market:', error);
            throw error;
        }
    }

    async getCurrentPrice(pair) {
        try {
            const response = await fetch(`${API_BASE_URL}/price/${pair}`);
            if (!response.ok) throw new Error('Failed to fetch current price');
            return await response.json();
        } catch (error) {
            console.error('Error fetching current price:', error);
            throw error;
        }
    }

    async getPairs() {
        try {
            const response = await fetch(`${API_BASE_URL}/pairs`);
            if (!response.ok) throw new Error('Failed to fetch pairs');
            return await response.json();
        } catch (error) {
            console.error('Error fetching pairs:', error);
            throw error;
        }
    }
}

// Export API instance
const api = new APIClient();