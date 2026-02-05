// SPA Router Module
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Handle initial route
        window.addEventListener('load', () => this.handleRoute());
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    handleRoute() {
        const hash = window.location.hash || '#beranda';
        const route = hash.substring(1);
        
        // Update active navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            }
        });

        // Route to handler
        if (this.routes[route]) {
            this.routes[route]();
        } else if (this.routes['beranda']) {
            this.routes['beranda']();
        }

        this.currentRoute = route;
    }

    navigate(route) {
        window.location.hash = route;
    }
}

// Export router instance
const router = new Router();