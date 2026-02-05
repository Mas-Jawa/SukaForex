// State Management Module
class StateManager {
    constructor() {
        this.state = {
            currentPair: 'EURUSD',
            currentTimeframe: 'H1',
            marketData: null,
            analysis: null,
            currentPrice: 0,
            loading: false,
            isConnected: false
        };
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// Export state instance
const state = new StateManager();