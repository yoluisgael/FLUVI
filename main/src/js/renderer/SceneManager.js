/**
 * SceneManager.js - Gestor del Scene Graph
 * Administra las capas, sprites y la actualización de la escena
 */

class SceneManager {
    constructor(app, assetLoader) {
        this.app = app;
        this.assets = assetLoader;

        // Contenedor principal con soporte para z-index
        this.mainContainer = new PIXI.Container();
        this.mainContainer.sortableChildren = true;
        this.app.stage.addChild(this.mainContainer);

        // Crear capas en orden de renderizado
        this.layers = {
            background: this.createLayer(0),    // Fondo
            streets: this.createLayer(10),      // Calles
            connections: this.createLayer(15),  // Conexiones
            vehicles: this.createLayer(20),     // Vehículos
            buildings: this.createLayer(25),    // Edificios
            ui: this.createLayer(30),           // UI (etiquetas, handles)
            debug: this.createLayer(40)         // Debug (intersecciones, vértices)
        };

        // Maps para tracking de sprites (referencia dato → sprite)
        this.calleSprites = new Map();      // Map<Calle, PIXI.Container>
        this.carroSprites = new Map();      // Map<id:string, PIXI.Sprite>
        this.edificioSprites = new Map();   // Map<Edificio, PIXI.Sprite>
        this.conexionGraphics = new Map();  // Map<Conexion, PIXI.Graphics>
        this.verticeSprites = new Map();    // Map<id:string, PIXI.Graphics>

        // Inicializar renderers especializados (se crearán después)
        this.calleRenderer = null;
        this.carroRenderer = null;
        this.edificioRenderer = null;
        this.conexionRenderer = null;
        this.uiRenderer = null;

        console.log('🎬 SceneManager creado');
    }

    createLayer(zIndex) {
        const layer = new PIXI.Container();
        layer.zIndex = zIndex;
        layer.sortableChildren = true;
        this.mainContainer.addChild(layer);
        return layer;
    }

    getLayer(name) {
        if (!this.layers[name]) {
            console.warn(`⚠️ Capa no encontrada: ${name}`);
        }
        return this.layers[name];
    }

    initRenderers() {
        this.calleRenderer = new CalleRenderer(this, this.assets);
        this.carroRenderer = new CarroRenderer(this, this.assets);
        this.edificioRenderer = new EdificioRenderer(this, this.assets);
        this.conexionRenderer = new ConexionRenderer(this, this.assets);
        this.uiRenderer = new UIRenderer(this, this.assets);

        console.log('✅ Renderers inicializados');
    }

    update(delta) {
        // Actualizar sprites de vehículos (cambios cada frame)
        if (this.carroRenderer) {
            this.carroRenderer.updateAll(window.calles || []);
        }

        // Actualizar etiquetas si están visibles
        if (window.mostrarEtiquetas && this.uiRenderer) {
            this.uiRenderer.updateEtiquetas(window.calles || []);
        }

        // Actualizar vértices si están visibles
        if (window.mostrarConexiones && this.uiRenderer && window.calleSeleccionada) {
            this.uiRenderer.updateVertices(window.calleSeleccionada);
        }
    }

    renderAll() {
        // Renderizar edificios
        if (this.edificioRenderer && window.edificios) {
            this.edificioRenderer.renderAll(window.edificios);
        }

        // Renderizar calles
        if (this.calleRenderer && window.calles) {
            this.calleRenderer.renderAll(window.calles);
        }

        // Renderizar vehículos
        if (this.carroRenderer && window.calles) {
            this.carroRenderer.renderAll(window.calles);
        }

        // Renderizar conexiones si están visibles
        if (window.mostrarConexiones && this.conexionRenderer && window.conexiones) {
            this.conexionRenderer.renderAll(window.conexiones);
        }

        // Renderizar intersecciones si están visibles
        if (window.mostrarIntersecciones && window.intersecciones) {
            this.renderIntersecciones();
        }

        // Renderizar vértices de curvas si están visibles
        if (window.mostrarConexiones && this.uiRenderer) {
            this.renderVertices();
        }

        // Renderizar etiquetas si están visibles
        if (window.mostrarEtiquetas && this.uiRenderer) {
            this.uiRenderer.updateEtiquetas(window.calles || []);
        }
    }

    renderIntersecciones() {
        const layer = this.getLayer('debug');

        // Limpiar intersecciones anteriores
        layer.removeChildren();

        if (!window.intersecciones || window.intersecciones.length === 0) {
            return;
        }

        const celda_tamano = window.celda_tamano || 5;
        const radio = celda_tamano / 2;

        window.intersecciones.forEach(inter => {
            if (inter.coords) {
                const graphics = new PIXI.Graphics();
                graphics.beginFill(0xFF00FF, 0.5); // Magenta semi-transparente
                graphics.drawCircle(inter.coords.x, inter.coords.y, radio);
                graphics.endFill();
                layer.addChild(graphics);
            }
        });
    }

    renderVertices() {
        if (!window.calles) return;

        const layer = this.getLayer('debug');

        // Limpiar vértices anteriores (solo los que agregamos aquí)
        const childrenToRemove = [];
        layer.children.forEach(child => {
            if (child.name && child.name.startsWith('vertice_')) {
                childrenToRemove.push(child);
            }
        });
        childrenToRemove.forEach(child => layer.removeChild(child));

        window.calles.forEach(calle => {
            if (calle.tipo !== window.TIPOS?.CONEXION || !calle.vertices || calle.vertices.length === 0) {
                return;
            }

            calle.vertices.forEach((vertice, index) => {
                if (!window.calcularPosicionVertice) return;

                const pos = window.calcularPosicionVertice(calle, vertice);

                // Dibujar línea guía entre vértices
                if (index > 0 && calle.vertices[index - 1]) {
                    const verticeAnterior = calle.vertices[index - 1];
                    const posAnterior = window.calcularPosicionVertice(calle, verticeAnterior);

                    const line = new PIXI.Graphics();
                    line.lineStyle(1, 0xFFA500, 0.4); // Naranja semi-transparente
                    line.moveTo(posAnterior.x, posAnterior.y);
                    line.lineTo(pos.x, pos.y);
                    line.name = `vertice_line_${calle.nombre}_${index}`;
                    layer.addChild(line);
                }

                // Dibujar círculo del vértice
                const circle = new PIXI.Graphics();

                // Si es el vértice seleccionado, hacerlo más grande y de otro color
                if (window.verticeSeleccionado === vertice) {
                    circle.lineStyle(3, 0xFFFFFF);
                    circle.beginFill(0xFF0000, 0.9);
                    circle.drawCircle(pos.x, pos.y, 10);
                } else {
                    circle.lineStyle(2, 0xFFFFFF);
                    circle.beginFill(0x9370DB, 0.8);
                    circle.drawCircle(pos.x, pos.y, 8);
                }
                circle.endFill();
                circle.name = `vertice_${calle.nombre}_${index}`;

                // Hacer interactivo para poder arrastrarlo
                circle.interactive = true;
                circle.buttonMode = true;
                circle.cursor = 'pointer';

                layer.addChild(circle);
            });
        });
    }

    clearLayer(layerName) {
        const layer = this.getLayer(layerName);
        if (layer) {
            layer.removeChildren();
        }
    }

    clearAll() {
        Object.keys(this.layers).forEach(name => {
            this.clearLayer(name);
        });

        this.calleSprites.clear();
        this.carroSprites.clear();
        this.edificioSprites.clear();
        this.conexionGraphics.clear();
        this.verticeSprites.clear();

        console.log('🗑️ Escena limpiada');
    }
}

window.SceneManager = SceneManager;
console.log('✓ SceneManager cargado');
