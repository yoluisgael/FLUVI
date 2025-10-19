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
        this.dragStartX = 0;
        this.dragStartY = 0;
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

        this.moveHandle.interactive = true;
        this.moveHandle.buttonMode = true;
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

        this.rotateHandle.interactive = true;
        this.rotateHandle.buttonMode = true;
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
    }

    setupGlobalDragEvents() {
        const stage = this.scene.app.stage;

        stage.interactive = true;
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
            this.isDraggingMove = false;
            this.isDraggingRotate = false;
            this.isDraggingVertice = false;
            this.draggedVertice = null;
            this.draggedVerticeIndex = -1;
            this.draggedCalle = null;

            if (this.rotateHandle) {
                this.rotateHandle.cursor = 'grab';
            }
        });
    }

    updateHandlePositions() {
        if (!this.currentObject) return;

        const celda_tamano = window.celda_tamano || 5;

        // Calcular centro del objeto
        let centroX, centroY, rotX, rotY;

        if (this.objectType === 'calle') {
            const calle = this.currentObject;

            if (calle.esCurva && window.calcularCentroCalleCurva) {
                const centro = window.calcularCentroCalleCurva(calle);
                centroX = centro.x;
                centroY = centro.y;

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

                const centerLocalX = (calle.tamano * celda_tamano) / 2;
                const centerLocalY = (calle.carriles * celda_tamano) / 2;

                centroX = calle.x + (centerLocalX * cos - centerLocalY * sin);
                centroY = calle.y + (centerLocalX * sin + centerLocalY * cos);

                const rotOffsetLocalX = calle.tamano * celda_tamano;
                rotX = calle.x + (rotOffsetLocalX * cos);
                rotY = calle.y + (rotOffsetLocalX * sin);
            }
        } else {
            // Es un edificio
            const edificio = this.currentObject;
            centroX = edificio.x + (edificio.width || 100) / 2;
            centroY = edificio.y + (edificio.height || 100) / 2;

            const angle = (edificio.angle || 0) * Math.PI / 180;
            const offsetX = (edificio.width || 100) / 2 * Math.cos(angle);
            const offsetY = (edificio.width || 100) / 2 * Math.sin(angle);

            rotX = edificio.x + offsetX;
            rotY = edificio.y + offsetY;
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

        console.log('🖱️ Iniciando arrastre de movimiento');
    }

    onMoveHandleDrag(event) {
        if (!this.currentObject) return;

        const camera = window.pixiApp.cameraController;
        const pos = event.data.global;

        const deltaX = (pos.x - this.dragStartX) / camera.scale;
        const deltaY = (pos.y - this.dragStartY) / camera.scale;

        this.currentObject.x += deltaX;
        this.currentObject.y += deltaY;

        this.dragStartX = pos.x;
        this.dragStartY = pos.y;

        // Actualizar posiciones
        this.updateHandlePositions();

        // Actualizar sprite del objeto
        if (this.objectType === 'calle') {
            window.pixiApp.sceneManager.calleRenderer?.updateCalleSprite(this.currentObject);
        } else {
            window.pixiApp.sceneManager.edificioRenderer?.updateEdificioSprite(this.currentObject);
        }

        // Actualizar inputs en UI
        if (window.editorCalles) {
            window.editorCalles.actualizarInputsPosicion();
        }
    }

    onRotateHandleDragStart(event) {
        this.isDraggingRotate = true;
        this.rotateHandle.cursor = 'grabbing';

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

        // Actualizar sprite del objeto
        if (this.objectType === 'calle') {
            window.pixiApp.sceneManager.calleRenderer?.updateCalleSprite(this.currentObject);
        } else {
            window.pixiApp.sceneManager.edificioRenderer?.updateEdificioSprite(this.currentObject);
        }

        // Actualizar posiciones de handles
        this.updateHandlePositions();

        // Actualizar inputs en UI
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

    clearHandles() {
        if (this.moveHandle) {
            this.moveHandle.destroy();
            this.moveHandle = null;
        }

        if (this.rotateHandle) {
            this.rotateHandle.destroy();
            this.rotateHandle = null;
        }

        this.currentObject = null;
        this.objectType = null;
        this.isDraggingMove = false;
        this.isDraggingRotate = false;
    }
}

window.EditorHandles = EditorHandles;
console.log('✓ EditorHandles cargado');
