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

        // Intentar usar imagen del edificio basada en label (case-insensitive)
        // Buscar tanto en edificio.imagen como edificio.label
        const imagenKey = edificio.imagen || edificio.label;

        if (imagenKey) {
            const imagenLower = imagenKey.toLowerCase();
            if (this.assets.hasTexture(imagenLower)) {
                const texture = this.assets.getTexture(imagenLower);
                sprite = new PIXI.Sprite(texture);
                sprite.width = edificio.width || 100;
                sprite.height = edificio.height || 100;
                sprite.anchor.set(0.5);
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
                        // Si es string tipo "#RRGGBB" o "#RRGGBBaa"
                        let colorStr = edificio.color.replace('#', '');

                        // Si tiene alpha (8 caracteres), tomar solo los 6 primeros (RGB)
                        if (colorStr.length === 8) {
                            colorStr = colorStr.substring(0, 6);
                        }

                        color = parseInt('0x' + colorStr);

                        // Validar que el color esté en rango válido (0x000000 a 0xFFFFFF)
                        if (isNaN(color) || color < 0 || color > 0xFFFFFF) {
                            console.warn(`Color inválido en edificio ${edificio.label || 'sin nombre'}: ${edificio.color}, usando gris por defecto`);
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
            // Dibujar desde 0,0 (luego ajustaremos el pivot)
            const width = edificio.width || 100;
            const height = edificio.height || 100;
            graphics.drawRect(0, 0, width, height);
            graphics.endFill();

            // Establecer el pivot en el centro para que la rotación funcione correctamente
            graphics.pivot.set(width / 2, height / 2);
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

            // Guardar edificio previamente seleccionado
            const previousSelection = window.edificioSeleccionado;

            // Si se clickeó el mismo edificio, deseleccionar
            if (previousSelection === edificio) {
                console.log('🔄 Deseleccionando edificio:', edificio.nombre || 'Sin nombre');
                window.edificioSeleccionado = null;

                // Remover borde de selección
                const sprite = this.scene.edificioSprites.get(edificio);
                if (sprite) {
                    const border = sprite.getChildByName ? sprite.getChildByName('selectionBorder') : null;
                    if (border) {
                        sprite.removeChild(border);
                        border.destroy();
                    }
                }

                // Resetear selector de edificios
                const selectEdificio = document.getElementById('selectEdificio');
                if (selectEdificio) {
                    selectEdificio.selectedIndex = 0;
                }

                // Actualizar UI
                if (window.editorCalles) {
                    window.editorCalles.actualizarInputsPosicion();
                }

                return;
            }

            // Actualizar selección global
            window.edificioSeleccionado = edificio;
            const previousCalle = window.calleSeleccionada;
            window.calleSeleccionada = null;

            // Quitar borde del edificio anterior si existe
            if (previousSelection && previousSelection !== edificio) {
                const prevSprite = this.scene.edificioSprites.get(previousSelection);
                if (prevSprite) {
                    const oldBorder = prevSprite.getChildByName ? prevSprite.getChildByName('selectionBorder') : null;
                    if (oldBorder) {
                        prevSprite.removeChild(oldBorder);
                        oldBorder.destroy();
                    }
                }
            }

            // Quitar borde de la calle previamente seleccionada
            if (previousCalle && window.pixiApp && window.pixiApp.sceneManager) {
                const calleRenderer = window.pixiApp.sceneManager.calleRenderer;
                if (calleRenderer) {
                    const calleContainer = calleRenderer.scene.calleSprites.get(previousCalle);
                    if (calleContainer) {
                        const calleBorder = calleContainer.getChildByName('selectionBorder');
                        if (calleBorder) {
                            calleContainer.removeChild(calleBorder);
                            calleBorder.destroy();
                        }
                    }
                }
            }

            // Re-renderizar todos los edificios para actualizar bordes
            this.renderAll(window.edificios);

            // Actualizar selector de tipo de objeto en Constructor
            const selectTipoObjeto = document.getElementById('selectTipoObjeto');
            if (selectTipoObjeto) {
                selectTipoObjeto.value = 'edificio';
                // Disparar evento change para mostrar el selector correcto
                selectTipoObjeto.dispatchEvent(new Event('change'));
            }

            // Actualizar selector de edificios
            const selectEdificio = document.getElementById('selectEdificio');
            if (selectEdificio && window.edificios) {
                const edificioIndex = window.edificios.indexOf(edificio);
                if (edificioIndex !== -1) {
                    selectEdificio.value = edificioIndex;
                    selectEdificio.dispatchEvent(new Event('change'));
                }
            }

            // Resetear AMBOS selectores de calle
            const selectCalle = document.getElementById('selectCalle');
            const selectCalleEditor = document.getElementById('selectCalleEditor');
            if (selectCalle) {
                selectCalle.value = '';
            }
            if (selectCalleEditor) {
                selectCalleEditor.value = '';
            }

            // Actualizar UI
            if (window.editorCalles) {
                window.editorCalles.actualizarInputsPosicion();
            }

            // Renderizar Canvas 2D si es necesario
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
