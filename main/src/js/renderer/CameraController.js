/**
 * CameraController.js - Sistema de Cámara
 * Gestiona el zoom, pan y transformaciones de vista
 */

class CameraController {
    constructor(app, sceneManager) {
        this.app = app;
        this.scene = sceneManager;

        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // Límites de zoom (mismos valores que Canvas 2D original)
        this.minScale = 0.7;  // Zoom out mínimo
        this.maxScale = 20.0; // Zoom in máximo

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.setupEvents();

        // Exponer para compatibilidad con código existente
        window.escala = this.scale;
        window.offsetX = this.offsetX;
        window.offsetY = this.offsetY;

        console.log('🎥 CameraController inicializado');
    }

    setupEvents() {
        const view = this.app.view;

        // Zoom con rueda del ratón
        view.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(zoomFactor, e.offsetX, e.offsetY);
        }, { passive: false });

        // Pan con arrastre
        view.addEventListener('mousedown', (e) => {
            // No capturar si se está arrastrando un objeto en modo edición
            if (window.editorHandles && (window.editorHandles.isDraggingMove || window.editorHandles.isDraggingRotate)) {
                return;
            }

            // No capturar si SHIFT está presionado en modo edición (para arrastrar objetos)
            if (e.shiftKey && window.editorCalles && window.editorCalles.modoEdicion) {
                return;
            }

            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            view.style.cursor = 'grabbing';
        });

        view.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.pan(dx, dy);
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        view.addEventListener('mouseup', () => {
            this.isDragging = false;
            view.style.cursor = 'default';
        });

        view.addEventListener('mouseleave', () => {
            this.isDragging = false;
            view.style.cursor = 'default';
        });
    }

    zoom(factor, centerX, centerY) {
        const oldScale = this.scale;
        this.scale *= factor;
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale));

        // Ajustar offset para zoom centrado en punto del mouse
        const scaleFactor = this.scale / oldScale;
        this.offsetX = centerX - (centerX - this.offsetX) * scaleFactor;
        this.offsetY = centerY - (centerY - this.offsetY) * scaleFactor;

        this.applyLimits();
        this.applyTransform();
        this.updateGlobals();
    }

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;

        this.applyLimits();
        this.applyTransform();
        this.updateGlobals();
    }

    setScale(newScale) {
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
        this.applyLimits();
        this.applyTransform();
        this.updateGlobals();
    }

    setPosition(x, y) {
        this.offsetX = x;
        this.offsetY = y;
        this.applyLimits();
        this.applyTransform();
        this.updateGlobals();
    }

    applyLimits() {
        // Usar la función de límites de trafico.js si está disponible
        if (typeof window.calcularLimitesMapa === 'function' && window.calles && window.calles.length > 0) {
            const limites = window.calcularLimitesMapa();
            const canvas = this.app.view;

            // Calcular límites basados en la escala actual
            // A mayor zoom (scale), más espacio de movimiento necesitamos
            const minOffsetX = -(limites.maxX * this.scale - canvas.width);
            const maxOffsetX = -limites.minX * this.scale;
            const minOffsetY = -(limites.maxY * this.scale - canvas.height);
            const maxOffsetY = -limites.minY * this.scale;

            // Aplicar límites
            this.offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, this.offsetX));
            this.offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, this.offsetY));
        }
    }

    applyTransform() {
        const container = this.scene.mainContainer;
        container.scale.set(this.scale);
        container.position.set(this.offsetX, this.offsetY);
    }

    updateGlobals() {
        // Mantener compatibilidad con código existente
        window.escala = this.scale;
        window.offsetX = this.offsetX;
        window.offsetY = this.offsetY;

        // Actualizar handles del editor si está disponible y en modo edición
        if (window.editorCalles && window.editorCalles.modoEdicion) {
            window.editorCalles.actualizarPosicionHandles();
        }
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.scale + this.offsetX,
            y: worldY * this.scale + this.offsetY
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.offsetX) / this.scale,
            y: (screenY - this.offsetY) / this.scale
        };
    }

    fitToView(bounds) {
        // Calcular escala para que todo sea visible
        const scaleX = this.app.screen.width / bounds.width;
        const scaleY = this.app.screen.height / bounds.height;
        this.scale = Math.min(scaleX, scaleY) * 0.9; // 90% para margen

        // Centrar
        this.offsetX = (this.app.screen.width - bounds.width * this.scale) / 2;
        this.offsetY = (this.app.screen.height - bounds.height * this.scale) / 2;

        this.applyTransform();
        this.updateGlobals();
    }
}

window.CameraController = CameraController;
console.log('✓ CameraController cargado');
