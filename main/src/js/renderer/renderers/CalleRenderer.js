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

        // Renderizar vértices para TODAS las calles (la función decidirá si mostrarlos o no)
        calles.forEach(calle => {
            if (calle.vertices && calle.vertices.length > 0) {
                this.renderVertices(calle);
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

        // Si es Ctrl+Click, seleccionar/deseleccionar la calle
        if (event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey) {
            console.log('🖱️ Ctrl+Clic en calle:', calle.nombre);

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
            // (funciona tanto en calles seleccionadas como no seleccionadas)
            console.log('🖱️ Clic normal en calle:', calle.nombre);
            console.log('   Estado de pausa:', window.isPaused);

            if (typeof window.encontrarCeldaMasCercana === 'function') {
                const celdaObjetivo = window.encontrarCeldaMasCercana(worldX, worldY);

                if (celdaObjetivo) {
                    const { calle: calleObjetivo, carril, indice } = celdaObjetivo;

                    // Verificar que la celda objetivo sea de la calle clickeada
                    if (calleObjetivo === calle) {
                        console.log(`📍 Celda objetivo: [${carril}][${indice}], valor actual: ${calleObjetivo.arreglo[carril]?.[indice]}`);

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
                    } else {
                        console.log(`⚠️ La celda más cercana no pertenece a la calle clickeada`);
                    }
                } else {
                    console.log(`⚠️ No se encontró celda cercana en (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`);
                }
            } else {
                console.warn('⚠️ window.encontrarCeldaMasCercana no está definido');
            }
        }
    }

    onCalleHover(calle, container) {
        container.alpha = 0.9;
    }

    onCalleOut(calle, container) {
        container.alpha = 1.0;
    }

    // ==================== RENDERIZADO DE VÉRTICES PARA CURVAS ====================

    renderVertices(calle) {
        console.log(`🔍 renderVertices llamado para: ${calle.nombre}`);
        console.log(`   Tiene vértices: ${calle.vertices ? calle.vertices.length : 0}`);

        // Solo renderizar vértices si:
        // 1. La calle tiene vértices
        // 2. La calle está seleccionada
        // 3. Estamos en modo edición
        if (!calle.vertices || calle.vertices.length === 0) {
            console.log('   ❌ No tiene vértices, saliendo...');
            return;
        }

        const isSelected = window.calleSeleccionada === calle;
        const isEditMode = window.editorCalles && window.editorCalles.modoEdicion;

        console.log(`   isSelected: ${isSelected}, isEditMode: ${isEditMode}`);

        const shouldShow = isSelected && isEditMode;

        if (!shouldShow) {
            console.log('   ❌ No debería mostrar vértices, limpiando...');
            // Limpiar vértices existentes
            this.clearVertices(calle);
            return;
        }

        console.log(`   ✅ Debería mostrar vértices, procediendo...`);

        // Obtener o crear contenedor de vértices
        let verticesContainer = this.scene.verticeSprites.get(calle);

        if (!verticesContainer) {
            verticesContainer = new PIXI.Container();
            verticesContainer.name = 'verticesContainer';
            verticesContainer.sortableChildren = true; // Permitir ordenamiento por zIndex
            verticesContainer.eventMode = 'static'; // Habilitar eventos en PixiJS v7+
            verticesContainer.interactiveChildren = true; // Permitir interactividad en hijos
            this.scene.verticeSprites.set(calle, verticesContainer);
            this.scene.getLayer('ui').addChild(verticesContainer);
            console.log(`   📦 Contenedor de vértices creado con eventMode='static'`);
        }

        // Limpiar vértices anteriores
        verticesContainer.removeChildren();

        console.log(`   📍 Renderizando ${calle.vertices.length} vértices...`);

        // Renderizar cada vértice
        calle.vertices.forEach((vertice, index) => {
            const pos = window.calcularPosicionVertice
                ? window.calcularPosicionVertice(calle, vertice)
                : null;

            if (!pos) {
                console.log(`   ⚠️ No se pudo calcular posición para vértice ${index}`);
                return;
            }

            console.log(`   🔵 Vértice ${index} en (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);

            // Crear círculo para el vértice
            const graphics = new PIXI.Graphics();

            // Estilo según si está seleccionado
            const isFirst = index === 0;
            const isLast = index === calle.vertices.length - 1;

            if (isFirst || isLast) {
                // Primer y último vértice: azul (fijos, no editables)
                graphics.beginFill(0x4A90E2, 0.8);
                graphics.lineStyle(2, 0xFFFFFF);
            } else {
                // Vértices intermedios: amarillo (editables)
                graphics.beginFill(0xFFD700, 0.8);
                graphics.lineStyle(2, 0xFFFFFF);
            }

            const circleRadius = (isFirst || isLast) ? 6 : 8;
            graphics.drawCircle(0, 0, circleRadius);
            graphics.endFill();

            // Agregar efecto de glow para vértices editables
            if (!isFirst && !isLast) {
                graphics.filters = [];
                // El glow se agregará dinámicamente cuando Z esté presionado

                // IMPORTANTE: Área de hit más grande para facilitar el click
                const hitArea = new PIXI.Circle(0, 0, 15); // Radio de 15 píxeles para hit area
                graphics.hitArea = hitArea;
                console.log(`      → Hit area establecida: radio 15px`);
            }

            graphics.x = pos.x;
            graphics.y = pos.y;
            graphics.name = `vertice_${index}`;

            // IMPORTANTE: Asegurar que el vértice está por encima de todo
            graphics.zIndex = 1000 + index;

            // Hacer interactivo solo si es un vértice intermedio
            if (!isFirst && !isLast) {
                console.log(`      → Vértice ${index} es EDITABLE, haciendo interactivo...`);

                // IMPORTANTE: En PixiJS v7+ necesitamos usar eventMode
                graphics.eventMode = 'static'; // Habilitar eventos
                graphics.cursor = 'pointer';

                // El cursor se cambiará dinámicamente según si Z está presionado
                graphics.on('pointerover', () => {
                    console.log(`      🖱️ Hover sobre vértice ${index}, Z: ${window.zKeyPressed}`);
                    if (window.zKeyPressed) {
                        graphics.cursor = 'grab';
                    } else {
                        graphics.cursor = 'pointer';
                    }
                });

                graphics.on('pointerout', () => {
                    graphics.cursor = 'pointer';
                });

                // NOTA: El arrastre de vértices se maneja mediante eventos DOM en editor.js
                // Los eventos PixiJS están deshabilitados porque CameraController interfiere
                // y el sistema original usaba eventos DOM directamente

                // graphics.on('pointerdown', (e) => {
                //     console.log(`      🖱️ POINTERDOWN en vértice ${index}!`);
                //     this.onVerticePointerDown(calle, vertice, index, e);
                // });

                console.log(`      ✅ Vértice ${index} renderizado (eventos manejados por editor.js)`);
            } else {
                console.log(`      → Vértice ${index} es ${isFirst ? 'PRIMERO' : 'ÚLTIMO'}, no editable`);
            }

            verticesContainer.addChild(graphics);
        });

        console.log(`   ✅ Todos los vértices renderizados (${calle.vertices.length} total)`);
    }

    clearVertices(calle) {
        const verticesContainer = this.scene.verticeSprites.get(calle);
        if (verticesContainer) {
            verticesContainer.destroy({ children: true });
            this.scene.verticeSprites.delete(calle);
        }
    }

    // ==================== EVENTOS DE VÉRTICES ====================

    onVerticePointerDown(calle, vertice, index, event) {
        console.log(`🔍 Click en vértice ${index}, Z presionada: ${window.zKeyPressed}`);

        // Solo permitir arrastre si Z está presionado
        if (!window.zKeyPressed) {
            console.log('⚠️ Mantén presionada la tecla Z para editar vértices');
            return;
        }

        event.stopPropagation(); // Evitar que se active el click de la calle

        console.log(`🎯 Vértice ${index} capturado para arrastre (Z+Click)`);
        console.log(`   Calle: ${calle.nombre}`);
        console.log(`   Vértice actual anguloOffset: ${vertice.anguloOffset}°`);

        // Cambiar cursor a grabbing
        const canvas = this.scene.app.view;
        if (canvas) {
            canvas.classList.add('dragging-vertex');
        }

        // Guardar estado inicial
        const dragData = {
            calle: calle,
            vertice: vertice,
            index: index,
            isDragging: true
        };

        console.log(`   dragData creado:`, dragData);

        // Activar modo curva si no está activo
        if (!calle.esCurva) {
            calle.esCurva = true;
            console.log(`🌊 Modo curva activado para ${calle.nombre}`);
        }

        // Función de arrastre
        const onPointerMove = (e) => {
            console.log(`🖱️ onPointerMove disparado, isDragging: ${dragData.isDragging}`);

            if (!dragData.isDragging) {
                console.log('   ❌ No está arrastrando, saliendo...');
                return;
            }

            // Obtener posición global del mouse
            const globalPos = e.data.global;
            console.log(`   Global pos: (${globalPos.x}, ${globalPos.y})`);

            // Convertir a coordenadas del mundo (sin transformaciones de cámara)
            const worldPos = this.scene.mainContainer.toLocal(globalPos);

            console.log(`📍 Mouse en mundo: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);

            // Actualizar ángulo del vértice usando la función de curvas.js
            if (window.actualizarVerticePorArrastre) {
                console.log(`   Llamando actualizarVerticePorArrastre...`);
                const resultado = window.actualizarVerticePorArrastre(
                    dragData.calle,
                    dragData.index,
                    worldPos.x,
                    worldPos.y
                );

                console.log(`   Resultado: ${resultado}`);

                if (resultado) {
                    console.log(`✅ Ángulo actualizado: ${dragData.calle.vertices[dragData.index].anguloOffset.toFixed(2)}°`);

                    // Re-renderizar la calle y los vértices
                    if (this.scene.calleSprites.has(dragData.calle)) {
                        this.scene.calleSprites.get(dragData.calle).destroy({ children: true });
                        this.scene.calleSprites.delete(dragData.calle);
                    }

                    if (dragData.calle.esCurva) {
                        this.renderCalleCurva(dragData.calle);
                    } else {
                        this.renderCalleRecta(dragData.calle);
                    }

                    this.renderVertices(dragData.calle);
                } else {
                    console.warn('⚠️ No se pudo actualizar el ángulo del vértice');
                }
            } else {
                console.error('❌ window.actualizarVerticePorArrastre no está definido');
            }
        };

        // Función de soltar
        const onPointerUp = () => {
            dragData.isDragging = false;
            this.scene.app.stage.off('pointermove', onPointerMove);
            this.scene.app.stage.off('pointerup', onPointerUp);
            this.scene.app.stage.off('pointerupoutside', onPointerUp);

            // Restaurar cursor
            const canvas = this.scene.app.view;
            if (canvas) {
                canvas.classList.remove('dragging-vertex');
            }

            console.log(`✅ Vértice ${index} soltado`);
        };

        // Registrar eventos globales
        this.scene.app.stage.on('pointermove', onPointerMove);
        this.scene.app.stage.on('pointerup', onPointerUp);
        this.scene.app.stage.on('pointerupoutside', onPointerUp);
    }
}

window.CalleRenderer = CalleRenderer;
console.log('✓ CalleRenderer cargado');
