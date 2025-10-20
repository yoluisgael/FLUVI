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
        if (!calles || calles.length === 0) {
            console.warn('⚠️ CalleRenderer: No hay calles para renderizar');
            return;
        }

        console.log(`🛣️ CalleRenderer: Renderizando ${calles.length} calles`);

        calles.forEach(calle => {
            try {
                if (calle.esCurva) {
                    this.renderCalleCurva(calle);
                } else {
                    this.renderCalleRecta(calle);
                }
            } catch (error) {
                console.error(`❌ Error renderizando calle ${calle.nombre}:`, error);
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

        if (!texture) {
            console.error('❌ Textura de carretera no encontrada');
            return null;
        }

        const tilingSprite = new PIXI.TilingSprite(
            texture,
            calle.tamano * this.celda_tamano,
            calle.carriles * this.celda_tamano
        );

        // Configurar el tiling para que cada celda muestre la textura completa
        if (texture.width && texture.height) {
            tilingSprite.tileScale.set(
                this.celda_tamano / texture.width,
                this.celda_tamano / texture.height
            );
        }

        // Hacer el TilingSprite interactivo para asegurar que capture eventos
        tilingSprite.interactive = true;

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
        // El container se posiciona en (0,0) del mundo, los sprites usan coordenadas globales
        container.x = 0;
        container.y = 0;

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
                // Usar coordenadas globales directamente ya que el container está en (0,0)
                sprite.x = coords.x;
                sprite.y = coords.y;
                sprite.rotation = CoordinateConverter.degreesToRadians(coords.angulo || calle.angulo);

                // Hacer cada sprite individual interactivo para calles curvas
                sprite.interactive = true;
                sprite.buttonMode = true;
                sprite.on('pointerdown', (e) => this.onCalleClick(calle, e));
                sprite.on('pointerover', () => this.onCalleHover(calle, container));
                sprite.on('pointerout', () => this.onCalleOut(calle, container));

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
        graphics.lineStyle(2, window.modoSeleccion === "constructor" ? 0xFFA500 : 0xFFD700);
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
        const color = window.modoSeleccion === "constructor" ? 0xFFA500 : 0xFFD700;

        graphics.lineStyle(2, color, 1);

        // Dibujar contorno siguiendo ambos bordes de la calle curva (sin offset)
        if (window.obtenerCoordenadasGlobalesCeldaConCurva) {
            // Borde superior (carril 0)
            for (let i = 0; i < calle.tamano; i++) {
                const coords = window.obtenerCoordenadasGlobalesCeldaConCurva(calle, 0, i);

                if (i === 0) {
                    graphics.moveTo(coords.x, coords.y);
                } else {
                    graphics.lineTo(coords.x, coords.y);
                }
            }

            // Borde inferior (último carril)
            for (let i = calle.tamano - 1; i >= 0; i--) {
                const coords = window.obtenerCoordenadasGlobalesCeldaConCurva(calle, calle.carriles - 1, i);
                graphics.lineTo(coords.x, coords.y);
            }

            // Cerrar el contorno volviendo al primer punto
            const firstCoords = window.obtenerCoordenadasGlobalesCeldaConCurva(calle, 0, 0);
            graphics.lineTo(firstCoords.x, firstCoords.y);
        }

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

    updateSelectionBorderCurva(container, calle) {
        // Remover borde anterior
        const oldBorder = container.getChildByName('selectionBorder');
        if (oldBorder) {
            container.removeChild(oldBorder);
        }

        // Agregar nuevo si está seleccionada
        if (window.calleSeleccionada === calle) {
            this.addSelectionBorderCurva(container, calle);
        }
    }

    removeCalleSprite(calle) {
        const container = this.scene.calleSprites.get(calle);
        if (container) {
            container.destroy({ children: true });
            this.scene.calleSprites.delete(calle);
        }
    }

    clearAllSelectionBorders() {
        // Limpiar bordes de TODAS las calles
        this.scene.calleSprites.forEach((container, calle) => {
            const border = container.getChildByName('selectionBorder');
            if (border) {
                container.removeChild(border);
                border.destroy();
            }
        });

        // Limpiar bordes de TODOS los edificios
        if (window.pixiApp && window.pixiApp.sceneManager && window.pixiApp.sceneManager.edificioRenderer) {
            const edificioRenderer = window.pixiApp.sceneManager.edificioRenderer;
            edificioRenderer.scene.edificioSprites.forEach((sprite, edificio) => {
                const border = sprite.getChildByName ? sprite.getChildByName('selectionBorder') : null;
                if (border) {
                    sprite.removeChild(border);
                    border.destroy();
                }
            });
        }

        console.log('🧹 Todos los bordes de selección limpiados');
    }

    // Event handlers
    onCalleClick(calle, event) {
        // Obtener coordenadas del mundo
        const globalPos = event.data.global;
        const worldX = (globalPos.x - window.offsetX) / window.escala;
        const worldY = (globalPos.y - window.offsetY) / window.escala;

        // Si es Ctrl+Click, seleccionar la calle
        if (event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey) {
            console.log('🖱️ Clic en calle:', calle.nombre);

            // Guardar la calle previamente seleccionada
            const previousSelection = window.calleSeleccionada;

            // Si se clickeó la misma calle, deseleccionar
            if (previousSelection === calle) {
                console.log('🔄 Deseleccionando calle:', calle.nombre);
                window.calleSeleccionada = null;

                // Remover borde de selección
                const container = this.scene.calleSprites.get(calle);
                if (container) {
                    const border = container.getChildByName('selectionBorder');
                    if (border) {
                        container.removeChild(border);
                        border.destroy();
                    }
                }

                // Resetear AMBOS selectores de calle
                const selectCalle = document.getElementById('selectCalle');
                const selectCalleEditor = document.getElementById('selectCalleEditor');
                if (selectCalle) {
                    selectCalle.selectedIndex = 0;
                }
                if (selectCalleEditor) {
                    selectCalleEditor.selectedIndex = 0;
                }

                // Actualizar UI
                if (window.editorCalles) {
                    window.editorCalles.actualizarInputsPosicion();
                }

                return;
            }

            // NUEVO: Limpiar TODOS los bordes existentes primero
            this.clearAllSelectionBorders();

            // Actualizar selección global
            window.calleSeleccionada = calle;
            window.edificioSeleccionado = null;

            // Agregar borde a la calle seleccionada
            const currentContainer = this.scene.calleSprites.get(calle);
            if (currentContainer) {
                // Primero remover cualquier borde existente (por si acaso)
                const existingBorder = currentContainer.getChildByName('selectionBorder');
                if (existingBorder) {
                    currentContainer.removeChild(existingBorder);
                    existingBorder.destroy();
                }

                // Agregar el nuevo borde
                if (calle.esCurva) {
                    this.addSelectionBorderCurva(currentContainer, calle);
                } else {
                    this.addSelectionBorder(currentContainer, calle);
                }
            }

            // Actualizar selector de tipo de objeto en Constructor
            const selectTipoObjeto = document.getElementById('selectTipoObjeto');
            if (selectTipoObjeto) {
                selectTipoObjeto.value = 'calle';
                // Disparar evento change para mostrar el selector correcto
                selectTipoObjeto.dispatchEvent(new Event('change'));
            }

            // Actualizar AMBOS selectores de calle (Constructor y Configuración)
            const selectCalle = document.getElementById('selectCalle');
            const selectCalleEditor = document.getElementById('selectCalleEditor');
            const calleIndex = window.calles ? window.calles.indexOf(calle) : -1;

            if (calleIndex !== -1) {
                // Actualizar selector de Configuración de Calles
                if (selectCalle) {
                    selectCalle.value = calleIndex;
                    // Disparar evento change para actualizar los inputs de probabilidades
                    selectCalle.dispatchEvent(new Event('change'));
                }
                // Actualizar selector del Constructor
                if (selectCalleEditor) {
                    selectCalleEditor.value = calleIndex;
                    selectCalleEditor.dispatchEvent(new Event('change'));
                }
            }

            // Resetear selector de edificios ya que ahora hay una calle seleccionada
            const selectEdificio = document.getElementById('selectEdificio');
            if (selectEdificio) {
                selectEdificio.value = '';
            }

            // Actualizar UI (selectores y paneles)
            if (window.editorCalles) {
                window.editorCalles.actualizarInputsPosicion();

                // Si estamos en modo edición, recrear handles para el nuevo objeto
                if (window.editorCalles.modoEdicion && window.editorHandles) {
                    console.log('🔄 Cambiando handles al nuevo objeto en modo edición');
                    window.editorHandles.clearHandles();
                    window.editorHandles.createHandles(calle, 'calle');
                }
            }

            // Llamar a la función global de renderizado si existe (para Canvas 2D fallback)
            if (!window.USE_PIXI && window.renderizarCanvas) {
                window.renderizarCanvas();
            }
        } else {
            // Comportamiento normal sin Ctrl: agregar/quitar vehículos
            if (typeof window.encontrarCeldaMasCercana === 'function') {
                const celdaObjetivo = window.encontrarCeldaMasCercana(worldX, worldY);

                if (celdaObjetivo) {
                    const { calle: calleObjetivo, carril, indice } = celdaObjetivo;

                    // Verificar que la celda objetivo sea de la calle clickeada
                    if (calleObjetivo === calle) {
                        if (calleObjetivo.arreglo[carril] !== undefined && calleObjetivo.arreglo[carril][indice] === 0) {
                            // Agregar vehículo
                            calleObjetivo.arreglo[carril][indice] = 1;
                            console.log(`🚗 Vehículo agregado en ${calle.nombre} [${carril}][${indice}]`);
                        } else if (calleObjetivo.arreglo[carril] !== undefined && calleObjetivo.arreglo[carril][indice] !== 0) {
                            // Quitar vehículo
                            calleObjetivo.arreglo[carril][indice] = 0;
                            console.log(`🚫 Vehículo removido de ${calle.nombre} [${carril}][${indice}]`);
                        }

                        // Los vehículos se actualizan automáticamente en el siguiente frame
                        // No es necesario llamar a renderizarCanvas en PixiJS
                    }
                }
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
