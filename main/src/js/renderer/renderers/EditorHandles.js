/**
 * EditorHandles.js - Handles visuales de edición con PixiJS
 * Gestiona los handles de movimiento y rotación para el modo de edición
 */

class EditorHandles {
    constructor(sceneManager) {
        this.scene = sceneManager;
        this.moveHandle = null;
        this.rotateHandle = null;
        this.currentObject = null;
        this.objectType = null;

        this.isDraggingMove = false;
        this.isDraggingRotate = false;
        this.isDraggingVertice = false;
        this.isShiftDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragInitialX = undefined;
        this.dragInitialY = undefined;
        this.draggedVertice = null;
        this.draggedVerticeIndex = -1;
        this.draggedCalle = null;

        // Exponer globalmente
        window.editorHandles = this;
    }

    createHandles(objeto, tipo) {
        this.clearHandles();
        this.currentObject = objeto;
        this.objectType = tipo;

        // Handle de movimiento (círculo azul)
        this.moveHandle = new PIXI.Graphics();
        this.moveHandle.beginFill(0x0099FF, 0.8);
        this.moveHandle.drawCircle(0, 0, 20);
        this.moveHandle.endFill();
        this.moveHandle.lineStyle(3, 0xFFFFFF);
        this.moveHandle.drawCircle(0, 0, 20);

        // PixiJS v7+ API
        this.moveHandle.eventMode = 'static';
        this.moveHandle.cursor = 'move';

        this.moveHandle.on('pointerdown', (e) => {
            e.stopPropagation();
            this.onMoveHandleDragStart(e);
        });

        // Handle de rotación (círculo verde)
        this.rotateHandle = new PIXI.Graphics();
        this.rotateHandle.beginFill(0x00FF00, 0.8);
        this.rotateHandle.drawCircle(0, 0, 20);
        this.rotateHandle.endFill();
        this.rotateHandle.lineStyle(3, 0xFFFFFF);
        this.rotateHandle.drawCircle(0, 0, 20);

        // PixiJS v7+ API
        this.rotateHandle.eventMode = 'static';
        this.rotateHandle.cursor = 'grab';

        this.rotateHandle.on('pointerdown', (e) => {
            e.stopPropagation();
            this.onRotateHandleDragStart(e);
        });

        // Agregar a capa UI
        const uiLayer = this.scene.getLayer('ui');
        uiLayer.addChild(this.moveHandle);
        uiLayer.addChild(this.rotateHandle);

        // Posicionar handles
        this.updateHandlePositions();

        // Setup eventos globales de arrastre
        this.setupGlobalDragEvents();

        // Habilitar arrastre con SHIFT+Click
        this.enableShiftDrag();
    }

    setupGlobalDragEvents() {
        const stage = this.scene.app.stage;
        const view = this.scene.app.view;

        // Ya está configurado en SceneManager como eventMode = 'static'
        // Asegurarse de que el stage capture eventos en toda el área del canvas
        stage.hitArea = new PIXI.Rectangle(0, 0, this.scene.app.screen.width, this.scene.app.screen.height);

        // Eventos de PixiJS para handles visuales
        stage.on('pointermove', (e) => {
            if (this.isDraggingMove) {
                this.onMoveHandleDrag(e);
            } else if (this.isDraggingRotate) {
                this.onRotateHandleDrag(e);
            } else if (this.isDraggingVertice) {
                this.onVerticeDrag(e);
            }
        });

        stage.on('pointerup', () => {
            // Si finalizamos un arrastre
            if (this.isDraggingMove || this.isDraggingRotate) {
                // Actualizar inputs de UI ahora que terminó el drag
                if (window.editorCalles) {
                    window.editorCalles.actualizarInputsPosicion();
                }

                // NUEVO: Restaurar opacidad normal de vértices
                if (this.objectType === 'calle' && this.currentObject && this.currentObject.vertices) {
                    this.setVerticesTranslucency(false);
                }

                // Si es una calle, recalcular intersecciones
                if (this.currentObject && this.objectType === 'calle') {
                    console.log('✅ Arrastre finalizado:', this.currentObject.nombre,
                                `Nueva posición: (${Math.round(this.currentObject.x)}, ${Math.round(this.currentObject.y)})`);

                    // Recalcular intersecciones después de mover la calle
                    if (window.inicializarIntersecciones) {
                        window.inicializarIntersecciones();
                    }
                    if (window.construirMapaIntersecciones) {
                        window.construirMapaIntersecciones();
                    }
                }
            }

            this.isDraggingMove = false;
            this.isDraggingRotate = false;
            this.isDraggingVertice = false;
            this.draggedVertice = null;
            this.draggedVerticeIndex = -1;
            this.draggedCalle = null;
            this.dragInitialX = undefined;
            this.dragInitialY = undefined;

            if (this.rotateHandle) {
                this.rotateHandle.cursor = 'grab';
            }

            // Restablecer cursor
            if (view) {
                view.style.cursor = 'default';
            }
        });

        // Eventos nativos para SHIFT+Click
        this.nativeMouseMoveHandler = (e) => {
            if (this.isDraggingMove && this.isShiftDragging) {
                this.onMoveHandleDrag(e);
            }
        };

        this.nativeMouseUpHandler = () => {
            if (this.isDraggingMove && this.isShiftDragging) {
                // Actualizar inputs de UI ahora que terminó el drag
                if (window.editorCalles) {
                    window.editorCalles.actualizarInputsPosicion();
                }

                // NUEVO: Restaurar opacidad normal de vértices
                if (this.objectType === 'calle' && this.currentObject && this.currentObject.vertices) {
                    this.setVerticesTranslucency(false);
                }

                // Finalizar arrastre SHIFT+Click
                if (this.currentObject && this.objectType === 'calle') {
                    console.log('✅ Arrastre de calle finalizado (SHIFT+Click):', this.currentObject.nombre,
                                `Nueva posición: (${Math.round(this.currentObject.x)}, ${Math.round(this.currentObject.y)})`);

                    // Recalcular intersecciones
                    if (window.inicializarIntersecciones) {
                        window.inicializarIntersecciones();
                    }
                    if (window.construirMapaIntersecciones) {
                        window.construirMapaIntersecciones();
                    }
                }

                this.isDraggingMove = false;
                this.isShiftDragging = false;
                this.dragInitialX = undefined;
                this.dragInitialY = undefined;

                if (view) {
                    view.style.cursor = 'default';
                }
            }
        };

        document.addEventListener('mousemove', this.nativeMouseMoveHandler);
        document.addEventListener('mouseup', this.nativeMouseUpHandler);
    }

    // Habilitar arrastre con SHIFT+Click directamente en objetos
    enableShiftDrag() {
        if (!this.currentObject) return;

        const view = this.scene.app.view;

        // Crear handler para SHIFT+mousedown
        this.shiftMouseDownHandler = (e) => {
            if (!e.shiftKey || !window.editorCalles || !window.editorCalles.modoEdicion) return;
            if (!this.currentObject) return;

            // Obtener posición del mouse en coordenadas del mundo
            const rect = view.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const camera = window.pixiApp.cameraController;
            const worldPos = camera.screenToWorld(mouseX, mouseY);

            // Usar hit detection geométrico correcto según el tipo de objeto
            let isHit = false;

            if (this.objectType === 'calle') {
                const calle = this.currentObject;
                const celda_tamano = window.celda_tamano || 5;

                // Si la calle tiene curvas, verificar por celdas
                if (calle.esCurva && calle.vertices && calle.vertices.length > 0 && window.obtenerCoordenadasGlobalesCeldaConCurva) {
                    for (let carril = 0; carril < calle.carriles && !isHit; carril++) {
                        for (let indice = 0; indice < calle.tamano && !isHit; indice++) {
                            const coords = window.obtenerCoordenadasGlobalesCeldaConCurva(calle, carril, indice);
                            const dx = worldPos.x - coords.x;
                            const dy = worldPos.y - coords.y;
                            const distancia = Math.sqrt(dx * dx + dy * dy);

                            if (distancia < celda_tamano) {
                                isHit = true;
                            }
                        }
                    }
                } else {
                    // Para calles rectas, usar transformación geométrica
                    const angle = -calle.angulo * Math.PI / 180;
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);

                    const dx = worldPos.x - calle.x;
                    const dy = worldPos.y - calle.y;
                    const localX = dx * cos + dy * sin;
                    const localY = -dx * sin + dy * cos;

                    const width = calle.tamano * celda_tamano;
                    const height = calle.carriles * celda_tamano;

                    if (localX >= 0 && localX <= width && localY >= 0 && localY <= height) {
                        isHit = true;
                    }
                }
            } else {
                // Es un edificio
                const edificio = this.currentObject;
                const angle = -(edificio.angle || 0) * Math.PI / 180;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                const dx = worldPos.x - edificio.x;
                const dy = worldPos.y - edificio.y;
                const localX = dx * cos + dy * sin;
                const localY = -dx * sin + dy * cos;

                const halfWidth = edificio.width / 2;
                const halfHeight = edificio.height / 2;

                if (localX >= -halfWidth && localX <= halfWidth &&
                    localY >= -halfHeight && localY <= halfHeight) {
                    isHit = true;
                }
            }

            if (isHit) {
                e.preventDefault();
                this.isDraggingMove = true;
                this.isShiftDragging = true;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.dragInitialX = this.currentObject.x;
                this.dragInitialY = this.currentObject.y;
                view.style.cursor = 'move';

                // NUEVO: Si es una calle, hacer vértices translúcidos
                if (this.objectType === 'calle' && this.currentObject.vertices) {
                    this.setVerticesTranslucency(true);
                }

                console.log('🖱️ Iniciando arrastre con SHIFT+Click');
            }
        };

        view.addEventListener('mousedown', this.shiftMouseDownHandler);
    }

    // Limpiar evento de SHIFT cuando se limpia
    disableShiftDrag() {
        if (this.shiftMouseDownHandler && this.scene.app.view) {
            this.scene.app.view.removeEventListener('mousedown', this.shiftMouseDownHandler);
            this.shiftMouseDownHandler = null;
        }

        if (this.nativeMouseMoveHandler) {
            document.removeEventListener('mousemove', this.nativeMouseMoveHandler);
            this.nativeMouseMoveHandler = null;
        }

        if (this.nativeMouseUpHandler) {
            document.removeEventListener('mouseup', this.nativeMouseUpHandler);
            this.nativeMouseUpHandler = null;
        }
    }

    updateHandlePositions() {
        if (!this.currentObject) return;

        const celda_tamano = window.celda_tamano || 5;
        const handleRadius = 20; // Radio del handle en píxeles mundo
        const offsetMinimo = 30; // Distancia mínima del handle al borde del objeto

        // Calcular centro del objeto y dimensiones
        let centroX, centroY, rotX, rotY;
        let objectWidth, objectHeight;

        if (this.objectType === 'calle') {
            const calle = this.currentObject;

            if (calle.esCurva && window.calcularCentroCalleCurva) {
                const centro = window.calcularCentroCalleCurva(calle);
                centroX = centro.x;
                centroY = centro.y;

                // Para calles curvas, estimar dimensiones aproximadas
                objectWidth = calle.tamano * celda_tamano;
                objectHeight = calle.carriles * celda_tamano;

                if (window.calcularPuntoFinalCalleCurva) {
                    const puntoFinal = window.calcularPuntoFinalCalleCurva(calle);
                    rotX = puntoFinal.x;
                    rotY = puntoFinal.y;
                } else {
                    rotX = centroX + 50;
                    rotY = centroY;
                }
            } else {
                const angle = -calle.angulo * Math.PI / 180;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                objectWidth = calle.tamano * celda_tamano;
                objectHeight = calle.carriles * celda_tamano;

                const centerLocalX = objectWidth / 2;
                const centerLocalY = objectHeight / 2;

                centroX = calle.x + (centerLocalX * cos - centerLocalY * sin);
                centroY = calle.y + (centerLocalX * sin + centerLocalY * cos);

                const rotOffsetLocalX = objectWidth;
                rotX = calle.x + (rotOffsetLocalX * cos);
                rotY = calle.y + (rotOffsetLocalX * sin);
            }
        } else {
            // Es un edificio
            const edificio = this.currentObject;
            objectWidth = edificio.width || 100;
            objectHeight = edificio.height || 100;

            centroX = edificio.x + objectWidth / 2;
            centroY = edificio.y + objectHeight / 2;

            const angle = (edificio.angle || 0) * Math.PI / 180;
            const offsetX = objectWidth / 2 * Math.cos(angle);
            const offsetY = objectWidth / 2 * Math.sin(angle);

            rotX = edificio.x + offsetX;
            rotY = edificio.y + offsetY;
        }

        // NUEVA LÓGICA: Determinar si el objeto es pequeño y ajustar handles para que estén fuera
        const objetoPequeno = objectWidth < 80 || objectHeight < 80;

        if (objetoPequeno) {
            // Para objetos pequeños, colocar handles fuera del objeto
            if (this.objectType === 'calle') {
                const calle = this.currentObject;
                const angle = -calle.angulo * Math.PI / 180;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                // Handle de movimiento: arriba del objeto (perpendicular)
                const moveOffsetDistance = objectHeight / 2 + offsetMinimo;
                centroX = calle.x + (objectWidth / 2 * cos - moveOffsetDistance * sin);
                centroY = calle.y + (objectWidth / 2 * sin + moveOffsetDistance * cos);

                // Handle de rotación: a la derecha del objeto
                const rotOffsetDistance = objectWidth + offsetMinimo;
                rotX = calle.x + (rotOffsetDistance * cos);
                rotY = calle.y + (rotOffsetDistance * sin);

            } else {
                // Edificio pequeño
                const edificio = this.currentObject;
                const angle = (edificio.angle || 0) * Math.PI / 180;

                // Handle de movimiento: arriba del edificio
                const moveOffsetDistance = objectHeight / 2 + offsetMinimo;
                centroX = edificio.x + objectWidth / 2 * Math.cos(angle) - moveOffsetDistance * Math.sin(angle);
                centroY = edificio.y + objectWidth / 2 * Math.sin(angle) + moveOffsetDistance * Math.cos(angle);

                // Handle de rotación: a la derecha del edificio
                const rotOffsetDistance = objectWidth / 2 + offsetMinimo;
                rotX = edificio.x + rotOffsetDistance * Math.cos(angle);
                rotY = edificio.y + rotOffsetDistance * Math.sin(angle);
            }
        }

        // Posicionar handles
        if (this.moveHandle) {
            this.moveHandle.x = centroX;
            this.moveHandle.y = centroY;
            this.moveHandle.zIndex = 100;
        }

        if (this.rotateHandle) {
            this.rotateHandle.x = rotX;
            this.rotateHandle.y = rotY;
            this.rotateHandle.zIndex = 100;
        }
    }

    onMoveHandleDragStart(event) {
        this.isDraggingMove = true;
        const pos = event.data.global;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;

        // Cambiar cursor del canvas completo
        if (this.scene.app.view) {
            this.scene.app.view.style.cursor = 'move';
        }

        // NUEVO: Si es una calle, hacer vértices translúcidos
        if (this.objectType === 'calle' && this.currentObject.vertices) {
            this.setVerticesTranslucency(true);
        }

        // NO guardar posición inicial para usar movimiento incremental (más fluido)
        console.log('🖱️ Iniciando arrastre de movimiento (handle PixiJS)');
    }

    onMoveHandleDrag(event) {
        if (!this.currentObject) return;

        const camera = window.pixiApp.cameraController;

        // Detectar si es evento de PixiJS o evento nativo del mouse
        let currentX, currentY;

        if (this.isShiftDragging && event.clientX !== undefined) {
            // Evento nativo del mouse (SHIFT+Click)
            currentX = event.clientX;
            currentY = event.clientY;

            // Para SHIFT+Click, usar posición inicial y delta total
            const deltaX = (currentX - this.dragStartX) / camera.scale;
            const deltaY = (currentY - this.dragStartY) / camera.scale;

            this.currentObject.x = this.dragInitialX + deltaX;
            this.currentObject.y = this.dragInitialY + deltaY;
        } else if (event.data && event.data.global) {
            // Evento de PixiJS (handles visuales)
            const pos = event.data.global;
            currentX = pos.x;
            currentY = pos.y;

            // Para handles visuales, usar delta incremental
            const deltaX = (currentX - this.dragStartX) / camera.scale;
            const deltaY = (currentY - this.dragStartY) / camera.scale;

            this.currentObject.x += deltaX;
            this.currentObject.y += deltaY;

            this.dragStartX = currentX;
            this.dragStartY = currentY;
        } else {
            return;
        }

        // Actualizar posiciones de handles
        this.updateHandlePositions();

        // Actualizar sprite del objeto (solo posición, muy rápido)
        if (this.objectType === 'calle') {
            const container = this.scene.calleSprites.get(this.currentObject);
            if (container) {
                container.x = this.currentObject.x;
                container.y = this.currentObject.y;
            }
        } else {
            const sprite = this.scene.edificioSprites.get(this.currentObject);
            if (sprite) {
                sprite.x = this.currentObject.x;
                sprite.y = this.currentObject.y;
            }
        }

        // Actualizar inputs de UI en tiempo real durante el drag
        if (window.editorCalles) {
            window.editorCalles.actualizarInputsPosicion();
        }
    }

    onRotateHandleDragStart(event) {
        this.isDraggingRotate = true;
        this.rotateHandle.cursor = 'grabbing';

        // Cambiar cursor del canvas completo
        if (this.scene.app.view) {
            this.scene.app.view.style.cursor = 'grabbing';
        }

        // NUEVO: Si es una calle, hacer vértices translúcidos
        if (this.objectType === 'calle' && this.currentObject.vertices) {
            this.setVerticesTranslucency(true);
        }

        const pos = event.data.global;
        const camera = window.pixiApp.cameraController;
        const worldPos = camera.screenToWorld(pos.x, pos.y);

        // Calcular ángulo inicial
        const celda_tamano = window.celda_tamano || 5;
        let centroX, centroY;

        if (this.objectType === 'calle') {
            const calle = this.currentObject;
            const angle = -calle.angulo * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const centerLocalX = (calle.tamano * celda_tamano) / 2;
            const centerLocalY = (calle.carriles * celda_tamano) / 2;

            centroX = calle.x + (centerLocalX * cos - centerLocalY * sin);
            centroY = calle.y + (centerLocalX * sin + centerLocalY * cos);
        } else {
            centroX = this.currentObject.x + (this.currentObject.width || 100) / 2;
            centroY = this.currentObject.y + (this.currentObject.height || 100) / 2;
        }

        this.rotationStartAngle = Math.atan2(
            worldPos.y - centroY,
            worldPos.x - centroX
        );

        console.log('🔄 Iniciando rotación');
    }

    onRotateHandleDrag(event) {
        if (!this.currentObject) return;

        const pos = event.data.global;
        const camera = window.pixiApp.cameraController;
        const worldPos = camera.screenToWorld(pos.x, pos.y);

        const celda_tamano = window.celda_tamano || 5;
        let centroX, centroY;

        if (this.objectType === 'calle') {
            const calle = this.currentObject;
            const angle = -calle.angulo * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const centerLocalX = (calle.tamano * celda_tamano) / 2;
            const centerLocalY = (calle.carriles * celda_tamano) / 2;

            centroX = calle.x + (centerLocalX * cos - centerLocalY * sin);
            centroY = calle.y + (centerLocalX * sin + centerLocalY * cos);
        } else {
            centroX = this.currentObject.x + (this.currentObject.width || 100) / 2;
            centroY = this.currentObject.y + (this.currentObject.height || 100) / 2;
        }

        const currentAngle = Math.atan2(
            worldPos.y - centroY,
            worldPos.x - centroX
        );

        const deltaAngle = (currentAngle - this.rotationStartAngle) * 180 / Math.PI;

        if (this.objectType === 'calle') {
            this.currentObject.angulo = (this.currentObject.angulo + deltaAngle) % 360;
            if (this.currentObject.angulo < 0) {
                this.currentObject.angulo += 360;
            }
        } else {
            if (!this.currentObject.angle) this.currentObject.angle = 0;
            this.currentObject.angle = (this.currentObject.angle + deltaAngle) % 360;
            if (this.currentObject.angle < 0) {
                this.currentObject.angle += 360;
            }
        }

        this.rotationStartAngle = currentAngle;

        // Actualizar sprite del objeto (solo rotación, muy rápido)
        if (this.objectType === 'calle') {
            const container = this.scene.calleSprites.get(this.currentObject);
            if (container) {
                container.rotation = CoordinateConverter.degreesToRadians(this.currentObject.angulo);
            }
        } else {
            const sprite = this.scene.edificioSprites.get(this.currentObject);
            if (sprite) {
                sprite.rotation = CoordinateConverter.degreesToRadians(this.currentObject.angle || 0);
            }
        }

        // Actualizar posiciones de handles
        this.updateHandlePositions();

        // Actualizar inputs de UI en tiempo real durante el drag
        if (window.editorCalles) {
            window.editorCalles.actualizarInputsPosicion();
        }
    }

    // Manejo de arrastre de vértices
    onVerticeMouseDown(calle, vertice, index, event) {
        this.isDraggingVertice = true;
        this.draggedVertice = vertice;
        this.draggedVerticeIndex = index;
        this.draggedCalle = calle;

        console.log(`🖱️ Iniciando arrastre de vértice ${index}`);
    }

    onVerticeDrag(event) {
        if (!this.draggedVertice || !this.draggedCalle || this.draggedVerticeIndex < 0) return;

        const camera = window.pixiApp.cameraController;
        const pos = event.data.global;
        const worldPos = camera.screenToWorld(pos.x, pos.y);

        // Actualizar ángulo del vértice usando la función de curvas.js
        if (window.actualizarVerticePorArrastre) {
            const actualizado = window.actualizarVerticePorArrastre(
                this.draggedCalle,
                this.draggedVerticeIndex,
                worldPos.x,
                worldPos.y
            );

            if (actualizado) {
                // Re-renderizar la calle curva
                if (window.pixiApp.sceneManager.calleRenderer) {
                    window.pixiApp.sceneManager.calleRenderer.updateCalleCurvaSprite(this.draggedCalle);
                }

                // Re-renderizar vértices
                if (window.mostrarConexiones) {
                    window.pixiApp.sceneManager.renderVertices();
                }
            }
        }
    }

    // Función para hacer todos los vértices translúcidos o restaurar opacidad normal
    setVerticesTranslucency(translucent) {
        if (!this.currentObject || !this.currentObject.vertices) return;

        const calle = this.currentObject;
        const verticesContainer = this.scene.verticeSprites.get(calle);

        if (!verticesContainer) {
            console.log('⚠️ No se encontró contenedor de vértices para la calle');
            return;
        }

        const targetAlpha = translucent ? 0.3 : 1.0;

        // Iterar sobre todos los vértices y cambiar su opacidad
        verticesContainer.children.forEach((vertexGraphic, index) => {
            vertexGraphic.alpha = targetAlpha;
        });

        console.log(`🎨 Vértices de ${calle.nombre} ${translucent ? 'translúcidos' : 'restaurados'} (alpha: ${targetAlpha})`);
    }

    clearHandles() {
        if (this.moveHandle) {
            this.moveHandle.destroy();
            this.moveHandle = null;
        }

        if (this.rotateHandle) {
            this.rotateHandle.destroy();
            this.rotateHandle = null;
        }

        // Limpiar SHIFT+Click handler
        this.disableShiftDrag();

        this.currentObject = null;
        this.objectType = null;
        this.isDraggingMove = false;
        this.isDraggingRotate = false;
    }
}

window.EditorHandles = EditorHandles;
console.log('✓ EditorHandles cargado');
