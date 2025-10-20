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

        // Crear aplicación PixiJS con fallback a Canvas 2D si WebGL no está disponible
        try {
            this.app = new PIXI.Application({
                width: width,
                height: height,
                backgroundColor: 0xc6cbcd, // Color actual del fondo
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                antialias: true,
                powerPreference: 'high-performance',
                forceCanvas: false // Intentar WebGL primero
            });
            console.log('✅ WebGL disponible, usando aceleración GPU');
        } catch (webglError) {
            console.warn('⚠️ WebGL no disponible, usando Canvas 2D renderer como fallback...');
            console.warn('   Razón:', webglError.message);
            this.app = new PIXI.Application({
                width: width,
                height: height,
                backgroundColor: 0xc6cbcd,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                antialias: false, // Desactivar antialiasing en Canvas 2D para mejor performance
                powerPreference: 'high-performance',
                forceCanvas: true // Forzar Canvas 2D
            });
            console.log('✅ Canvas 2D renderer activado (sin aceleración GPU)');
        }

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

            // Inicializar minimapa (opcional, no crítico)
            if (typeof MinimapRenderer !== 'undefined') {
                try {
                    this.minimapRenderer = new MinimapRenderer();
                    console.log('✅ Minimapa inicializado');
                } catch (minimapError) {
                    console.warn('⚠️ No se pudo inicializar el minimapa:', minimapError.message);
                    console.warn('   Continuando sin minimapa...');
                    this.minimapRenderer = null;
                }
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

            // Actualizar minimapa en cada frame (es ligero, usa Canvas 2D)
            if (typeof window.dibujarMinimapa === 'function') {
                window.dibujarMinimapa();
            }
        });
    }

    setupResize() {
        window.addEventListener('resize', () => {
            const sidebar = document.querySelector('.sidebar');
            const header = document.querySelector('header');

            // Verificar si el sidebar está visible (no tiene clase 'hidden')
            const sidebarVisible = sidebar && !sidebar.classList.contains('hidden');
            const sidebarWidth = window.innerWidth > 768 && sidebarVisible ? (sidebar.offsetWidth || 380) : 0;
            const headerHeight = header ? header.offsetHeight : 0;

            this.app.renderer.resize(
                window.innerWidth - sidebarWidth,
                window.innerHeight - headerHeight
            );

            console.log(`📐 Resize: ${window.innerWidth - sidebarWidth}x${window.innerHeight - headerHeight} (sidebar: ${sidebarVisible ? 'visible' : 'hidden'})`);
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
