/**
 * UIRenderer.js - Renderizador de UI
 * Maneja la visualización de elementos de interfaz como etiquetas y vértices
 */

class UIRenderer {
    constructor(sceneManager, assetLoader) {
        this.scene = sceneManager;
        this.assets = assetLoader;
        this.etiquetas = new Map();
    }

    updateEtiquetas(calles) {
        if (!calles || !window.mostrarEtiquetas) {
            this.clearEtiquetas();
            return;
        }

        calles.forEach(calle => {
            this.updateEtiqueta(calle);
        });
    }

    updateEtiqueta(calle) {
        let text = this.etiquetas.get(calle);

        if (!text) {
            // Crear nueva etiqueta
            text = new PIXI.Text(calle.nombre, {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xFFFFFF,
                stroke: 0x000000,
                strokeThickness: 3
            });
            text.anchor.set(0.5);

            this.scene.getLayer('ui').addChild(text);
            this.etiquetas.set(calle, text);
        }

        // Actualizar posición (centro de la calle)
        const celda_tamano = window.celda_tamano || 5;

        if (calle.esCurva && window.calcularCentroCalleCurva) {
            const centro = window.calcularCentroCalleCurva(calle);
            text.x = centro.x;
            text.y = centro.y;
        } else {
            const angle = -calle.angulo * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const centerLocalX = (calle.tamano * celda_tamano) / 2;
            const centerLocalY = (calle.carriles * celda_tamano) / 2;

            text.x = calle.x + (centerLocalX * cos - centerLocalY * sin);
            text.y = calle.y + (centerLocalX * sin + centerLocalY * cos);
        }

        text.visible = true;
    }

    clearEtiquetas() {
        this.etiquetas.forEach((text, calle) => {
            text.destroy();
        });
        this.etiquetas.clear();
    }

    updateVertices(calle) {
        if (!calle || !calle.esCurva || !calle.vertices) {
            this.clearVertices();
            return;
        }

        // Limpiar vértices anteriores
        this.clearVertices();

        calle.vertices.forEach((vertice, index) => {
            const id = `${calle.nombre}_vertice_${index}`;

            const pos = window.calcularPosicionVertice
                ? window.calcularPosicionVertice(calle, vertice)
                : { x: calle.x, y: calle.y };

            // Crear círculo para el vértice
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0x9370DB, 0.8);
            graphics.drawCircle(0, 0, 8);
            graphics.endFill();
            graphics.lineStyle(2, 0xFFFFFF);
            graphics.drawCircle(0, 0, 8);

            graphics.x = pos.x;
            graphics.y = pos.y;

            // Hacer interactivo para arrastre
            graphics.interactive = true;
            graphics.buttonMode = true;
            graphics.cursor = 'pointer';

            // Eventos de arrastre (se implementarán en EditorHandles)
            graphics.on('pointerdown', (e) => {
                if (window.editorHandles) {
                    window.editorHandles.onVerticeMouseDown(calle, vertice, index, e);
                }
            });

            this.scene.getLayer('debug').addChild(graphics);
            this.scene.verticeSprites.set(id, graphics);
        });
    }

    clearVertices() {
        this.scene.verticeSprites.forEach((graphics, id) => {
            graphics.destroy();
        });
        this.scene.verticeSprites.clear();
    }

    clearAll() {
        this.clearEtiquetas();
        this.clearVertices();
    }
}

window.UIRenderer = UIRenderer;
console.log('✓ UIRenderer cargado');
