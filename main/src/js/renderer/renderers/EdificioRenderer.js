/**
 * EdificioRenderer.js - Renderizador de edificios
 * Maneja la visualización de edificios y objetos estáticos
 */

class EdificioRenderer {
    constructor(sceneManager, assetLoader) {
        this.scene = sceneManager;
        this.assets = assetLoader;
    }

    renderAll(edificios) {
        if (!edificios) return;

        edificios.forEach(edificio => {
            try {
                this.renderEdificio(edificio);
            } catch (error) {
                console.error(`Error renderizando edificio:`, edificio, error);
                // Continuar con el siguiente edificio sin detener la simulación
            }
        });
    }

    renderEdificio(edificio) {
        // Si ya existe, actualizar
        if (this.scene.edificioSprites.has(edificio)) {
            return this.updateEdificioSprite(edificio);
        }

        let sprite;

        // Intentar usar imagen del edificio (case-insensitive)
        if (edificio.imagen) {
            const imagenLower = edificio.imagen.toLowerCase();
            if (this.assets.hasTexture(imagenLower)) {
                const texture = this.assets.getTexture(imagenLower);
                sprite = new PIXI.Sprite(texture);
                sprite.width = edificio.width || 100;
                sprite.height = edificio.height || 100;
            }
        }

        // Si no se pudo crear con imagen, usar rectángulo de color
        if (!sprite) {
            // Usar rectángulo de color
            const graphics = new PIXI.Graphics();

            // Convertir color de forma segura
            let color = 0x808080; // Gris por defecto

            try {
                if (edificio.color) {
                    if (typeof edificio.color === 'string') {
                        // Si es string tipo "#RRGGBB"
                        const colorStr = edificio.color.replace('#', '');
                        color = parseInt('0x' + colorStr);

                        // Validar que el color esté en rango válido (0x000000 a 0xFFFFFF)
                        if (isNaN(color) || color < 0 || color > 0xFFFFFF) {
                            console.warn(`Color inválido en edificio: ${edificio.color}, usando gris por defecto`);
                            color = 0x808080;
                        }
                    } else if (typeof edificio.color === 'number') {
                        // Si ya es un número, validar que esté en rango
                        if (edificio.color >= 0 && edificio.color <= 0xFFFFFF) {
                            color = edificio.color;
                        } else {
                            console.warn(`Color numérico fuera de rango en edificio: ${edificio.color}, usando gris por defecto`);
                            color = 0x808080;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error procesando color de edificio:`, edificio, error);
                color = 0x808080;
            }

            graphics.beginFill(color);
            graphics.drawRect(0, 0, edificio.width || 100, edificio.height || 100);
            graphics.endFill();
            sprite = graphics;
        }

        sprite.x = edificio.x;
        sprite.y = edificio.y;

        if (edificio.angle) {
            sprite.rotation = CoordinateConverter.degreesToRadians(edificio.angle);
        }

        // Agregar borde si está seleccionado
        if (window.edificioSeleccionado === edificio) {
            this.addSelectionBorder(sprite, edificio);
        }

        // Guardar referencia
        this.scene.edificioSprites.set(edificio, sprite);
        this.scene.getLayer('buildings').addChild(sprite);

        // Hacer interactivo
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.on('pointerdown', (e) => this.onEdificioClick(edificio, e));
        sprite.on('pointerover', () => this.onEdificioHover(edificio, sprite));
        sprite.on('pointerout', () => this.onEdificioOut(edificio, sprite));

        return sprite;
    }

    updateEdificioSprite(edificio) {
        const sprite = this.scene.edificioSprites.get(edificio);
        if (!sprite) return;

        sprite.x = edificio.x;
        sprite.y = edificio.y;

        if (edificio.angle !== undefined) {
            sprite.rotation = CoordinateConverter.degreesToRadians(edificio.angle);
        }

        // Actualizar borde de selección
        this.updateSelectionBorder(sprite, edificio);
    }

    addSelectionBorder(sprite, edificio) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(3, 0xFFD700);
        graphics.drawRect(0, 0, edificio.width || 100, edificio.height || 100);
        graphics.name = 'selectionBorder';

        if (sprite instanceof PIXI.Container) {
            sprite.addChild(graphics);
        }
    }

    updateSelectionBorder(sprite, edificio) {
        const oldBorder = sprite.getChildByName ? sprite.getChildByName('selectionBorder') : null;
        if (oldBorder) {
            sprite.removeChild(oldBorder);
        }

        if (window.edificioSeleccionado === edificio) {
            this.addSelectionBorder(sprite, edificio);
        }
    }

    removeEdificioSprite(edificio) {
        const sprite = this.scene.edificioSprites.get(edificio);
        if (sprite) {
            sprite.destroy({ children: true });
            this.scene.edificioSprites.delete(edificio);
        }
    }

    // Event handlers
    onEdificioClick(edificio, event) {
        if (event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey) {
            console.log('🖱️ Clic en edificio:', edificio.nombre || 'Sin nombre');

            window.edificioSeleccionado = edificio;
            window.calleSeleccionada = null;

            if (window.editorCalles) {
                window.editorCalles.actualizarInputsPosicion();
            }

            this.renderAll(window.edificios);

            if (window.renderizarCanvas) {
                window.renderizarCanvas();
            }
        }
    }

    onEdificioHover(edificio, sprite) {
        sprite.alpha = 0.9;
    }

    onEdificioOut(edificio, sprite) {
        sprite.alpha = 1.0;
    }
}

window.EdificioRenderer = EdificioRenderer;
console.log('✓ EdificioRenderer cargado');
