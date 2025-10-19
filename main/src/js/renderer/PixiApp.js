/**
 * PixiApp.js - Aplicación principal de PixiJS
 * Singleton que gestiona la inicialización y ciclo de vida del motor gráfico
 */

class PixiApp {
    static instance = null;

    static getInstance(canvasId = 'simuladorCanvas') {
        if (!PixiApp.instance) {
            PixiApp.instance = new PixiApp(canvasId);
        }
        return PixiApp.instance;
    }

    constructor(canvasId) {
        if (PixiApp.instance) {
            return PixiApp.instance;
        }

        // Obtener dimensiones del canvas actual
        const oldCanvas = document.getElementById(canvasId);
        if (!oldCanvas) {
            console.error(`❌ Canvas con id "${canvasId}" no encontrado`);
            return;
        }

        const parent = oldCanvas.parentElement;
        const width = oldCanvas.width;
        const height = oldCanvas.height;

        // Crear aplicación PixiJS
        this.app = new PIXI.Application({
            width: width,
            height: height,
            backgroundColor: 0xc6cbcd, // Color actual del fondo
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true,
            powerPreference: 'high-performance'
        });

        // Reemplazar canvas viejo con el de PixiJS
        oldCanvas.remove();
        this.app.view.id = canvasId;
        this.app.view.style.display = 'block';
        parent.appendChild(this.app.view);

        // Inicializar subsistemas (se inicializarán después)
        this.assetLoader = null;
        this.sceneManager = null;
        this.cameraController = null;
        this.minimapRenderer = null;

        // Exponer globalmente para compatibilidad
        window.pixiApp = this;

        console.log('🎨 PixiApp creado');
    }

    async init() {
        console.log('🔧 Inicializando PixiApp...');

        try {
            // Cargar assets
            this.assetLoader = new AssetLoader();
            await this.assetLoader.loadAssets();

            // Crear gestores
            this.sceneManager = new SceneManager(this.app, this.assetLoader);
            this.cameraController = new CameraController(this.app, this.sceneManager);

            // Inicializar renderers
            this.sceneManager.initRenderers();

            // Inicializar minimapa
            if (typeof MinimapRenderer !== 'undefined') {
                this.minimapRenderer = new MinimapRenderer();
            }

            // Setup events
            this.setupResize();
            this.setupTicker();

            console.log('✅ PixiApp inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando PixiApp:', error);
            return false;
        }
    }

    setupTicker() {
        this.app.ticker.add((delta) => {
            // PixiJS renderiza automáticamente el stage
            // Solo actualizar lógica si es necesario
            if (!window.isPaused && this.sceneManager) {
                this.sceneManager.update(delta);
            }
        });
    }

    setupResize() {
        window.addEventListener('resize', () => {
            const sidebar = document.querySelector('.sidebar');
            const header = document.querySelector('header');
            const sidebarWidth = window.innerWidth > 768 ? (sidebar ? sidebar.offsetWidth : 380) : 0;
            const headerHeight = header ? header.offsetHeight : 0;

            this.app.renderer.resize(
                window.innerWidth - sidebarWidth,
                window.innerHeight - headerHeight
            );
        });
    }

    // API pública para compatibilidad
    render() {
        // PixiJS renderiza automáticamente, pero mantener compatibilidad
        if (this.sceneManager) {
            this.sceneManager.renderAll();
        }
    }

    destroy() {
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
        }
        PixiApp.instance = null;
        console.log('🗑️ PixiApp destruido');
    }
}

// Exponer globalmente
window.PixiApp = PixiApp;
console.log('✓ PixiApp cargado');
