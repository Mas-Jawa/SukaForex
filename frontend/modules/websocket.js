// WebSocket Module for Real-time Updates
class WebSocketManager {
    constructor() {
        this.socket = null;
        this.listeners = [];
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        try {
            // Connect to Socket.IO server
            this.socket = io('http://localhost:5000', {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: this.maxReconnectAttempts
            });

            this.setupEventHandlers();
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    setupEventHandlers() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.notifyListeners({ type: 'connected' });
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            this.notifyListeners({ type: 'disconnected' });
        });

        this.socket.on('price_update', (data) => {
            this.notifyListeners({ type: 'price_update', data: data });
        });

        this.socket.on('subscribed', (data) => {
            console.log('Subscribed to pair:', data.pair);
            this.notifyListeners({ type: 'subscribed', data: data });
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.notifyListeners({ type: 'error', data: error });
        });
    }

    subscribeToPair(pair) {
        if (this.socket && this.isConnected) {
            this.socket.emit('subscribe_pair', { pair: pair });
        }
    }

    onMessage(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notifyListeners(message) {
        this.listeners.forEach(listener => listener(message));
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
        }
    }

    getConnectionStatus() {
        return this.isConnected;
    }
}

// Export WebSocket instance
const websocket = new WebSocketManager();