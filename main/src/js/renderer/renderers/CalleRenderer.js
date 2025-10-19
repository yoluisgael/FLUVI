/**
 * CalleRenderer.js - Renderizador de calles
 * Maneja la visualización de calles rectas y curvas
 */

class CalleRenderer {
    constructor(sceneManager, assetLoader) {
        this.scene = sceneManager;
        this.assets = assetLoader;
        this.celda_tamano = window.celda_tamano || 5;
    }

    renderAll(calles) {
        calles.forEach(calle => {
            if (calle.esCurva) {
                this.renderCalleCurva(calle);
            } else {
                this.renderCalleRecta(calle);
            }
        });
    }

    renderCalleRecta(calle) {
        // Si ya existe, actualizar
        if (this.scene.calleSprites.has(calle)) {
            return this.updateCalleSprite(calle);
        }

        // Crear contenedor para la calle
        const container = new PIXI.Container();
        container.x = calle.x;
        container.y = calle.y;
        container.rotation = CoordinateConverter.degreesToRadians(calle.angulo);

        // Usar TilingSprite para repetir textura
        const texture = this.assets.getTexture('carretera');
        const tilingSprite = new PIXI.TilingSprite(
            texture,
            calle.tamano * this.celda_tamano,
            calle.carriles * this.celda_tamano
        );

        container.addChild(tilingSprite);

        // Agregar borde de selección si es la calle seleccionada
        if (window.calleSeleccionada === calle) {
            this.addSelectionBorder(container, calle);
        }

        // Guardar referencia
        this.scene.calleSprites.set(calle, container);
        this.scene.getLayer('streets').addChild(container);

        // Hacer interactivo
        container.interactive = true;
        container.buttonMode = true;
        container.on('pointerdown', (e) => this.onCalleClick(calle, e));
        container.on('pointerover', () => this.onCalleHover(calle, container));
        container.on('pointerout', () => this.onCalleOut(calle, container));

        return container;
    }

    renderCalleCurva(calle) {
        // Para calles curvas, crear múltiples sprites siguiendo vértices
        if (this.scene.calleSprites.has(calle)) {
            return this.updateCalleCurvaSprite(calle);
        }

        const container = new PIXI.Container();
        const texture = this.assets.getTexture('carretera');

        // Renderizar celda por celda siguiendo la curva
        for (let carril = 0; carril < calle.carriles; carril++) {
            for (let i = 0; i < calle.tamano; i++) {
                // Usar función de curvas.js para obtener coordenadas
                const coords = window.obtenerCoordenadasGlobalesCeldaConCurva
                    ? window.obtenerCoordenadasGlobalesCeldaConCurva(calle, carril, i)
                    : this.obtenerCoordenadasBasicas(calle, carril, i);

                const sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                sprite.width = this.celda_tamano;
                sprite.height = this.celda_tamano;
                sprite.x = coords.x;
                sprite.y = coords.y;
                sprite.rotation = CoordinateConverter.degreesToRadians(coords.angulo || calle.angulo);

                container.addChild(sprite);
            }
        }

        // Agregar borde si está seleccionada
        if (window.calleSeleccionada === calle) {
            this.addSelectionBorderCurva(container, calle);
        }

        // Guardar referencia
        this.scene.calleSprites.set(calle, container);
        this.scene.getLayer('streets').addChild(container);

        // Hacer interactivo
        container.interactive = true;
        container.buttonMode = true;
        container.hitArea = new PIXI.Rectangle(
            0,
            0,
            calle.tamano * this.celda_tamano,
            calle.carriles * this.celda_tamano
        );
        container.on('pointerdown', (e) => this.onCalleClick(calle, e));

        return container;
    }

    obtenerCoordenadasBasicas(calle, carril, indice) {
        const angle = -calle.angulo * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const localX = indice * this.celda_tamano + this.celda_tamano / 2;
        const localY = carril * this.celda_tamano + this.celda_tamano / 2;

        return {
            x: calle.x + (localX * cos - localY * sin),
            y: calle.y + (localX * sin + localY * cos),
            angulo: calle.angulo
        };
    }

    updateCalleSprite(calle) {
        const container = this.scene.calleSprites.get(calle);
        if (!container) return;

        container.x = calle.x;
        container.y = calle.y;
        container.rotation = CoordinateConverter.degreesToRadians(calle.angulo);

        // Actualizar borde de selección
        this.updateSelectionBorder(container, calle);
    }

    updateCalleCurvaSprite(calle) {
        // Reconstruir sprites (más simple que actualizar)
        this.removeCalleSprite(calle);
        this.renderCalleCurva(calle);
    }

    addSelectionBorder(container, calle) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(4, window.modoSeleccion === "constructor" ? 0xFFA500 : 0xFFD700);
        graphics.drawRect(
            0,
            0,
            calle.tamano * this.celda_tamano,
            calle.carriles * this.celda_tamano
        );
        graphics.name = 'selectionBorder';
        container.addChild(graphics);
    }

    addSelectionBorderCurva(container, calle) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(2, window.modoSeleccion === "constructor" ? 0xFFA500 : 0xFFD700);
        graphics.setLineDash([5, 3]);

        // Dibujar contorno siguiendo los puntos de la curva
        // Simplificado: dibujar rectángulo alrededor del primer y último punto
        const firstCoords = window.obtenerCoordenadasGlobalesCeldaConCurva
            ? window.obtenerCoordenadasGlobalesCeldaConCurva(calle, 0, 0)
            : { x: calle.x, y: calle.y };

        const lastCoords = window.obtenerCoordenadasGlobalesCeldaConCurva
            ? window.obtenerCoordenadasGlobalesCeldaConCurva(calle, 0, calle.tamano - 1)
            : { x: calle.x + calle.tamano * this.celda_tamano, y: calle.y };

        graphics.moveTo(firstCoords.x, firstCoords.y);
        graphics.lineTo(lastCoords.x, lastCoords.y);

        graphics.name = 'selectionBorder';
        container.addChild(graphics);
    }

    updateSelectionBorder(container, calle) {
        // Remover borde anterior
        const oldBorder = container.getChildByName('selectionBorder');
        if (oldBorder) {
            container.removeChild(oldBorder);
        }

        // Agregar nuevo si está seleccionada
        if (window.calleSeleccionada === calle) {
            this.addSelectionBorder(container, calle);
        }
    }

    removeCalleSprite(calle) {
        const container = this.scene.calleSprites.get(calle);
        if (container) {
            container.destroy({ children: true });
            this.scene.calleSprites.delete(calle);
        }
    }

    // Event handlers
    onCalleClick(calle, event) {
        // Si es Ctrl+Click, seleccionar la calle
        if (event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey) {
            console.log('🖱️ Clic en calle:', calle.nombre);

            // Actualizar selección global
            window.calleSeleccionada = calle;
            window.edificioSeleccionado = null;

            // Actualizar UI (selectores)
            if (window.editorCalles) {
                window.editorCalles.actualizarInputsPosicion();
            }

            // Re-renderizar para mostrar selección
            this.renderAll(window.calles);

            // Llamar a la función global de renderizado si existe
            if (window.renderizarCanvas) {
                window.renderizarCanvas();
            }
        }
    }

    onCalleHover(calle, container) {
        container.alpha = 0.9;
    }

    onCalleOut(calle, container) {
        container.alpha = 1.0;
    }
}

window.CalleRenderer = CalleRenderer;
console.log('✓ CalleRenderer cargado');
