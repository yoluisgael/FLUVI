/**
 * EdificioRenderer.js - Renderizador de edificios
 * Maneja la visualización de edificios y objetos estáticos
 */

class EdificioRenderer {
    constructor(sceneManager, assetLoader) {
        this.scene = sceneManager;
        this.assets = assetLoader;
    }

    // Función auxiliar para detectar si un color es oscuro
    esColorOscuro(colorHex) {
        // Si es número hexadecimal de PixiJS (0xRRGGBB)
        let r, g, b;

        if (typeof colorHex === 'number') {
            r = (colorHex >> 16) & 0xFF;
            g = (colorHex >> 8) & 0xFF;
            b = colorHex & 0xFF;
        } else if (typeof colorHex === 'string') {
            // Si es string tipo "#RRGGBB" o "#RRGGBBaa"
            const hex = colorHex.replace('#', '');
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else {
            return true; // Por defecto asumir oscuro (texto blanco)
        }

        // Calcular luminosidad
        const luminosidad = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminosidad < 0.5;
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

                // Usar las dimensiones exactas del edificio (sin mantener aspect ratio)
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

        // Agregar nombre del edificio si tiene label y no es una imagen
        if (edificio.label && !sprite.texture) {
            // Solo agregar texto si es un graphics (no imagen)
            this.addBuildingLabel(sprite, edificio);
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

    addBuildingLabel(sprite, edificio) {
        // Determinar color del texto basándose en el color de fondo del edificio
        const backgroundColor = edificio.color || 0x808080;
        const esOscuro = this.esColorOscuro(backgroundColor);
        const colorTexto = esOscuro ? 0xFFFFFF : 0x000000; // Blanco para fondos oscuros, negro para claros

        // Crear texto del label
        const text = new PIXI.Text(edificio.label, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: colorTexto,
            align: 'center',
            fontWeight: 'bold'
        });

        text.anchor.set(0.5);
        text.resolution = 2; // Alta resolución para evitar pixelación

        // Posicionar en el centro del edificio
        const width = edificio.width || 100;
        const height = edificio.height || 100;
        text.x = width / 2;
        text.y = height / 2;

        text.name = 'buildingLabel';

        // Agregar al sprite (que es un Graphics)
        if (sprite instanceof PIXI.Graphics || sprite instanceof PIXI.Container) {
            sprite.addChild(text);
        }
    }

    addSelectionBorder(sprite, edificio) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(3, 0xFFD700);

        // Usar las dimensiones REALES del sprite, no las del objeto edificio
        // porque el sprite puede haber sido redimensionado
        let width, height;

        if (sprite instanceof PIXI.Sprite && sprite.texture) {
            // Para imágenes (Sprite), necesitamos compensar la escala del sprite
            // porque el graphics hereda la transformación del padre
            width = sprite.width;
            height = sprite.height;

            // DEBUG: Ver dimensiones reales y escalas
            console.log(`🔍 Edificio "${edificio.label}":`);
            console.log(`   sprite.width=${sprite.width}, sprite.height=${sprite.height}`);
            console.log(`   sprite.scale.x=${sprite.scale.x}, sprite.scale.y=${sprite.scale.y}`);
            console.log(`   texture: ${sprite.texture.width} x ${sprite.texture.height}`);

            // El graphics se escala con el sprite, así que necesitamos compensar
            // dibujando en coordenadas de la textura (sin escala)
            const textureWidth = sprite.texture.width;
            const textureHeight = sprite.texture.height;

            console.log(`   Dibujando en coordenadas de textura: (${-textureWidth/2}, ${-textureHeight/2}, ${textureWidth}, ${textureHeight})`);

            // Dibujar en coordenadas de la textura original (se escalará automáticamente con el sprite)
            graphics.drawRect(-textureWidth / 2, -textureHeight / 2, textureWidth, textureHeight);
        } else {
            // Para Graphics (figuras geométricas), usar las dimensiones del edificio
            width = edificio.width || 100;
            height = edificio.height || 100;
            // Para Graphics, dibujar desde 0, 0
            graphics.drawRect(0, 0, width, height);
        }

        graphics.name = 'selectionBorder';

        if (sprite instanceof PIXI.Container || sprite instanceof PIXI.Sprite) {
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
            console.log('🖱️ Clic en edificio:', edificio.label || 'Sin nombre');

            // Guardar edificio previamente seleccionado
            const previousSelection = window.edificioSeleccionado;

            // Si se clickeó el mismo edificio, deseleccionar
            if (previousSelection === edificio) {
                console.log('🔄 Deseleccionando edificio:', edificio.label || 'Sin nombre');
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

            // NUEVO: Limpiar TODOS los bordes existentes primero
            if (window.pixiApp && window.pixiApp.sceneManager && window.pixiApp.sceneManager.calleRenderer) {
                window.pixiApp.sceneManager.calleRenderer.clearAllSelectionBorders();
            }

            // Actualizar selección global
            window.edificioSeleccionado = edificio;
            window.calleSeleccionada = null;

            // Agregar borde al edificio seleccionado
            const currentSprite = this.scene.edificioSprites.get(edificio);
            if (currentSprite) {
                this.addSelectionBorder(currentSprite, edificio);
            }

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

                // Si estamos en modo edición, recrear handles para el nuevo objeto
                if (window.editorCalles.modoEdicion && window.editorHandles) {
                    console.log('🔄 Cambiando handles al nuevo objeto (edificio) en modo edición');
                    window.editorHandles.clearHandles();
                    window.editorHandles.createHandles(edificio, 'edificio');
                }
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
