// Main Application - Trading Bot SPA
let chartComponent, priceTicker, analysisResult;
let previousPrice = 0;

// Password configuration
const CORRECT_PASSWORD = "SukaForex65";
const WA_NUMBER = "628816984586"; // Format internasional (62 untuk Indonesia)

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    initializeRouter();
    startRealTimeUpdates();
});

function initializeApp() {
    // Initialize components
    chartComponent = new ChartComponent('chart-canvas', 'tradingview-widget');
    priceTicker = new PriceTicker('price-ticker');
    analysisResult = new AnalysisResult('analysis-result');
    
    // Update connection status
    updateConnectionStatus(false);
    
    console.log('App initialized successfully');
}

function initializeRouter() {
    // Setup router routes
    router.addRoute('beranda', () => showSection('beranda'));
    router.addRoute('trading-tools', () => {
        showSection('trading-tools');
        initializeTradingView();
    });
    router.addRoute('join', () => showSection('join'));
    
    // Initial route
    router.handleRoute();
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Scroll to top of section
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function setupEventListeners() {
    // Pair selector change
    const pairSelector = document.getElementById('pair-selector');
    if (pairSelector) {
        pairSelector.addEventListener('change', (e) => {
            state.setState({ currentPair: e.target.value });
            updateTradingView();
            subscribeToPair(e.target.value);
        });
    }

    // Timeframe selector change
    const timeframeSelector = document.getElementById('timeframe-selector');
    if (timeframeSelector) {
        timeframeSelector.addEventListener('change', (e) => {
            state.setState({ currentTimeframe: e.target.value });
            updateTradingView();
        });
    }

    // Analyze button - Show password modal
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', showPasswordModal);
    }

    // Submit password button
    const submitPasswordBtn = document.getElementById('submit-password');
    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', validatePasswordAndAnalyze);
    }

    // Close modal button
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hidePasswordModal);
    }

    // Get password via WhatsApp button (from modal)
    const waPasswordBtn = document.getElementById('wa-password-btn');
    if (waPasswordBtn) {
        waPasswordBtn.addEventListener('click', openWhatsAppForPassword);
    }

    // Get password button (from main page)
    const getPasswordBtn = document.getElementById('get-password-btn');
    if (getPasswordBtn) {
        getPasswordBtn.addEventListener('click', openWhatsAppForPassword);
    }

    // Allow Enter key to submit password
    const passwordInput = document.getElementById('password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                validatePasswordAndAnalyze();
            }
        });
    }

    // Close modal on overlay click
    const modalOverlay = document.getElementById('password-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hidePasswordModal();
            }
        });
    }
}

function showPasswordModal() {
    const modal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('password-error');
    
    // Reset modal state
    passwordInput.value = '';
    errorMessage.style.display = 'none';
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus on password input
    setTimeout(() => {
        passwordInput.focus();
    }, 100);
}

function hidePasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.style.display = 'none';
}

function validatePasswordAndAnalyze() {
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('password-error');
    const enteredPassword = passwordInput.value;
    
    // Validate password
    if (enteredPassword === CORRECT_PASSWORD) {
        // Password correct - proceed with analysis
        hidePasswordModal();
        handleAnalyze();
    } else {
        // Password incorrect - show error
        errorMessage.textContent = 'Password salah! Gagal login. Silakan coba lagi.';
        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        
        // Shake animation for better UX
        const modalContent = document.querySelector('.modal-content');
        modalContent.classList.add('shake');
        setTimeout(() => {
            modalContent.classList.remove('shake');
        }, 500);
    }
}

function openWhatsAppForPassword() {
    const message = encodeURIComponent('Halo, saya ingin mendapatkan password untuk akses bot analisa trading Suka Forex. Mohon bantuannya ya!');
    const waUrl = `https://wa.me/${WA_NUMBER}?text=${message}`;
    window.open(waUrl, '_blank');
}

function handleAnalyze() {
    const pair = document.getElementById('pair-selector').value;
    const timeframe = document.getElementById('timeframe-selector').value;
    const analyzeBtn = document.getElementById('analyze-btn');
    
    // Show loading state
    analyzeBtn.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
    analyzeBtn.disabled = true;
    state.setState({ loading: true });
    
    // Fetch market data and analyze
    Promise.all([
        api.fetchMarketData(pair, timeframe.toLowerCase()),
        api.analyzeMarket(pair)
    ])
    .then(([marketData, analysis]) => {
        // Update state
        state.setState({
            marketData: marketData,
            analysis: analysis,
            loading: false
        });
        
        // Update chart
        chartComponent.drawTechnicalChart(marketData, analysis);
        
        // Update analysis result
        analysisResult.update(analysis, pair, timeframe);
        
        // Update price ticker with latest price
        if (marketData.length > 0) {
            const latestPrice = marketData[marketData.length - 1].close;
            priceTicker.update(latestPrice, previousPrice);
            previousPrice = latestPrice;
        }
    })
    .catch(error => {
        console.error('Error during analysis:', error);
        alert('Terjadi kesalahan saat melakukan analisa. Pastikan Python backend berjalan.');
    })
    .finally(() => {
        analyzeBtn.innerHTML = '🔍 Mulai Analisa';
        analyzeBtn.disabled = false;
        state.setState({ loading: false });
    });
}

function initializeTradingView() {
    const pair = state.getState().currentPair;
    const timeframe = state.getState().currentTimeframe;
    
    // Convert timeframe to TradingView format
    const tvTimeframe = convertToTradingViewTimeframe(timeframe);
    
    // Convert pair to TradingView symbol
    const tvSymbol = convertToTradingViewSymbol(pair);
    
    // Load TradingView widget
    chartComponent.loadTradingViewWidget(tvSymbol, tvTimeframe);
}

function updateTradingView() {
    const pair = state.getState().currentPair;
    const timeframe = state.getState().currentTimeframe;
    
    const tvTimeframe = convertToTradingViewTimeframe(timeframe);
    const tvSymbol = convertToTradingViewSymbol(pair);
    
    chartComponent.updateTradingViewSymbol(tvSymbol, tvTimeframe);
}

function convertToTradingViewTimeframe(timeframe) {
    const timeframeMap = {
        'M1': '1',
        'M5': '5',
        'M15': '15',
        'H1': '60',
        'H4': '240',
        'D1': 'D'
    };
    return timeframeMap[timeframe] || '60';
}

function convertToTradingViewSymbol(pair) {
    const symbolMap = {
        'EURUSD': 'EURUSD',
        'GBPUSD': 'GBPUSD',
        'USDJPY': 'USDJPY',
        'USDCHF': 'USDCHF',
        'AUDUSD': 'AUDUSD',
        'NZDUSD': 'NZDUSD',
        'USDCAD': 'USDCAD',
        'XAUUSD': 'TVC:GOLD'
    };
    return symbolMap[pair] || 'EURUSD';
}

function startRealTimeUpdates() {
    // Connect to WebSocket
    websocket.connect();
    
    // Subscribe to WebSocket messages
    websocket.onMessage((message) => {
        switch (message.type) {
            case 'connected':
                updateConnectionStatus(true);
                subscribeToPair(state.getState().currentPair);
                break;
                
            case 'disconnected':
                updateConnectionStatus(false);
                break;
                
            case 'price_update':
                handlePriceUpdate(message.data);
                break;
                
            case 'subscribed':
                console.log('Subscribed to pair:', message.data.pair);
                break;
                
            case 'error':
                console.error('WebSocket error:', message.data);
                break;
        }
    });
    
    // Update current price periodically
    setInterval(updateCurrentPrice, 5000);
}

function subscribeToPair(pair) {
    websocket.subscribeToPair(pair);
}

function handlePriceUpdate(data) {
    if (data.pair === state.getState().currentPair) {
        priceTicker.update(data.price, previousPrice);
        previousPrice = data.price;
        
        // Update current price in state
        state.setState({
            currentPrice: data.price,
            isConnected: true
        });
    }
}

async function updateCurrentPrice() {
    const pair = state.getState().currentPair;
    
    try {
        const priceData = await api.getCurrentPrice(pair);
        priceTicker.update(priceData.price, previousPrice);
        previousPrice = priceData.price;
        
        state.setState({
            currentPrice: priceData.price,
            isConnected: true
        });
    } catch (error) {
        console.error('Error updating current price:', error);
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(connected) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    if (connected) {
        statusDot.classList.add('connected');
        statusDot.classList.remove('disconnected');
        statusText.textContent = 'Connected';
        statusText.classList.add('connected');
        statusText.classList.remove('disconnected');
    } else {
        statusDot.classList.add('disconnected');
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
        statusText.classList.add('disconnected');
        statusText.classList.remove('connected');
    }
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.getAttribute('href');
        router.navigate(target.substring(1));
    });
});

// Intro animation
window.addEventListener('load', () => {
    const intro = document.getElementById('intro');
    setTimeout(() => {
        intro.style.opacity = '0';
        setTimeout(() => {
            intro.style.display = 'none';
        }, 500);
    }, 2000);
});