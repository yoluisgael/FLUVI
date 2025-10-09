// ==================== EDITOR.JS - MODO EDICIÓN ====================
// Este módulo maneja toda la funcionalidad de edición visual de calles

class EditorCalles {
    constructor() {
        this.modoEdicion = false;
        this.calleEditando = null;
        this.calleOriginal = null;
        
        // Elementos del DOM
        this.btnModoEdicion = document.getElementById('btnModoEdicion');
        this.btnGuardarEdicion = document.getElementById('btnGuardarEdicion');
        this.btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
        this.editActionButtons = document.getElementById('editActionButtons');
        this.editModeBadge = document.getElementById('editModeBadge');
        this.moveHandle = document.getElementById('moveHandle');
        this.rotateHandle = document.getElementById('rotateHandle');
        
        // Inputs de posición
        this.inputPosX = document.getElementById('inputPosX');
        this.inputPosY = document.getElementById('inputPosY');
        this.inputAngulo = document.getElementById('inputAngulo');
        this.btnAplicarPosicion = document.getElementById('btnAplicarPosicion');
        
        // Ajustes avanzados
        this.btnAjustesAvanzados = document.getElementById('btnAjustesAvanzados');
        this.advancedSettings = document.getElementById('advancedSettings');
        this.advancedArrow = document.getElementById('advancedArrow');
        
        // Estado de arrastre
        this.isDraggingMove = false;
        this.isDraggingRotate = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.rotationStartAngle = 0;
        
        this.inicializarEventos();
    }
    
    inicializarEventos() {
        // Toggle de ajustes avanzados
        this.btnAjustesAvanzados?.addEventListener('click', () => {
            this.advancedSettings.classList.toggle('show');
            this.advancedArrow.textContent = this.advancedSettings.classList.contains('show') ? '▲' : '▼';
        });
        
        // Aplicar posición manual
        this.btnAplicarPosicion?.addEventListener('click', () => {
            if (!window.calleSeleccionada) return;
            
            const x = parseFloat(this.inputPosX.value);
            const y = parseFloat(this.inputPosY.value);
            const angulo = parseFloat(this.inputAngulo.value);
            
            if (!isNaN(x)) window.calleSeleccionada.x = x;
            if (!isNaN(y)) window.calleSeleccionada.y = y;
            if (!isNaN(angulo)) window.calleSeleccionada.angulo = angulo % 360;
            
            this.actualizarInputsPosicion();
            if (window.renderizarCanvas) window.renderizarCanvas();
        });
        
        // Entrar a modo edición
        this.btnModoEdicion?.addEventListener('click', () => {
            if (this.modoEdicion) {
                this.salirModoEdicion();
            } else {
                this.entrarModoEdicion();
            }
        });
        
        // Guardar cambios
        this.btnGuardarEdicion?.addEventListener('click', () => {
            this.guardarEdicion();
        });
        
        // Cancelar edición
        this.btnCancelarEdicion?.addEventListener('click', () => {
            this.cancelarEdicion();
        });
        
        // Eventos de arrastre para mover
        this.moveHandle?.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.iniciarArrastreMovimiento(e);
        });
        
        // Eventos de arrastre para rotar
        this.rotateHandle?.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.iniciarArrastreRotacion(e);
        });
        
        // Eventos globales de mouse
        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingMove) {
                this.arrastreMovimiento(e);
            } else if (this.isDraggingRotate) {
                this.arrastreRotacion(e);
            }
            
            // Actualizar posición de handles si estamos en modo edición
            if (this.modoEdicion && !this.isDraggingMove && !this.isDraggingRotate) {
                this.actualizarPosicionHandles();
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isDraggingMove = false;
            this.isDraggingRotate = false;
        });
        
        // Actualizar inputs cuando cambia la selección de calle
        document.getElementById('selectCalle')?.addEventListener('change', () => {
            this.actualizarInputsPosicion();
            
            // Habilitar botón de edición solo si hay calle seleccionada
            if (this.btnModoEdicion) {
                this.btnModoEdicion.disabled = !window.calleSeleccionada;
            }
            
            // Si estamos en modo edición, cambiar a la nueva calle
            if (this.modoEdicion && window.calleSeleccionada) {
                this.calleEditando = window.calleSeleccionada;
                this.actualizarPosicionHandles();
            }
        });
    }
    
    actualizarInputsPosicion() {
        if (!window.calleSeleccionada) return;
        
        if (this.inputPosX) this.inputPosX.value = Math.round(window.calleSeleccionada.x);
        if (this.inputPosY) this.inputPosY.value = Math.round(window.calleSeleccionada.y);
        if (this.inputAngulo) this.inputAngulo.value = Math.round(window.calleSeleccionada.angulo);
    }
    
    entrarModoEdicion() {
        if (!window.calleSeleccionada) {
            alert('⚠️ Selecciona una calle primero');
            return;
        }
        
        this.modoEdicion = true;
        this.calleEditando = window.calleSeleccionada;
        
        // Hacer backup de la calle original
        this.calleOriginal = {
            x: this.calleEditando.x,
            y: this.calleEditando.y,
            angulo: this.calleEditando.angulo
        };
        
        // Pausar simulación si está corriendo
        if (window.isPaused === false) {
            document.getElementById('btnPauseResume')?.click();
        }
        
        // Mostrar controles de edición
        this.editModeBadge?.classList.add('active');
        this.editActionButtons.style.display = 'block';
        this.btnModoEdicion.textContent = '🔒 Salir de Edición';
        this.btnModoEdicion.classList.remove('btn-warning');
        this.btnModoEdicion.classList.add('btn-secondary');
        
        // Mostrar handles
        this.actualizarPosicionHandles();
        this.moveHandle?.classList.add('active');
        this.rotateHandle?.classList.add('active');
        
        // Ocultar controles del canvas
        const controlBar = document.getElementById('canvasControlBar');
        if (controlBar) controlBar.style.opacity = '0.3';
        
        console.log('✏️ Modo edición activado para:', this.calleEditando.nombre);
    }
    
    guardarEdicion() {
        if (!this.modoEdicion) return;
        
        console.log('💾 Cambios guardados:', {
            calle: this.calleEditando.nombre,
            nuevaX: this.calleEditando.x,
            nuevaY: this.calleEditando.y,
            nuevoAngulo: this.calleEditando.angulo
        });
        
        // Recalcular intersecciones con las nuevas posiciones
        if (window.inicializarIntersecciones) window.inicializarIntersecciones();
        if (window.construirMapaIntersecciones) window.construirMapaIntersecciones();
        
        this.salirModoEdicion();
        
        alert('✅ Cambios guardados correctamente');
    }
    
    cancelarEdicion() {
        if (!this.modoEdicion || !this.calleOriginal) return;
        
        // Restaurar valores originales
        this.calleEditando.x = this.calleOriginal.x;
        this.calleEditando.y = this.calleOriginal.y;
        this.calleEditando.angulo = this.calleOriginal.angulo;
        
        this.actualizarInputsPosicion();
        if (window.renderizarCanvas) window.renderizarCanvas();
        
        this.salirModoEdicion();
        
        console.log('❌ Edición cancelada');
    }
    
    salirModoEdicion() {
        this.modoEdicion = false;
        this.calleEditando = null;
        this.calleOriginal = null;
        
        // Ocultar controles de edición
        this.editModeBadge?.classList.remove('active');
        this.editActionButtons.style.display = 'none';
        this.btnModoEdicion.textContent = '✏️ Modo Edición';
        this.btnModoEdicion.classList.remove('btn-secondary');
        this.btnModoEdicion.classList.add('btn-warning');
        
        // Ocultar handles
        this.moveHandle?.classList.remove('active');
        this.rotateHandle?.classList.remove('active');
        
        // Restaurar controles del canvas
        const controlBar = document.getElementById('canvasControlBar');
        if (controlBar) controlBar.style.opacity = '1';
    }
    
    actualizarPosicionHandles() {
        if (!this.calleEditando || !window.escala) return;
        
        const escala = window.escala;
        const offsetX = window.offsetX || 0;
        const offsetY = window.offsetY || 0;
        const celda_tamano = window.celda_tamano || 5;
        
        // Calcular posición en pantalla (considerando zoom y pan)
        const screenX = this.calleEditando.x * escala + offsetX;
        const screenY = this.calleEditando.y * escala + offsetY;
        
        // Posicionar handle de movimiento (centro de la calle)
        const centroX = screenX + (this.calleEditando.tamano * celda_tamano * escala) / 2;
        const centroY = screenY + (this.calleEditando.carriles * celda_tamano * escala) / 2;
        
        if (this.moveHandle) {
            this.moveHandle.style.left = `${centroX - 20}px`;
            this.moveHandle.style.top = `${centroY - 20}px`;
        }
        
        // Posicionar handle de rotación (esquina superior derecha)
        const rotX = screenX + (this.calleEditando.tamano * celda_tamano * escala);
        const rotY = screenY;
        
        if (this.rotateHandle) {
            this.rotateHandle.style.left = `${rotX - 20}px`;
            this.rotateHandle.style.top = `${rotY - 20}px`;
        }
    }
    
    iniciarArrastreMovimiento(e) {
        e.preventDefault();
        this.isDraggingMove = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
    }
    
    arrastreMovimiento(e) {
        if (!this.calleEditando || !window.escala) return;
        
        const deltaX = (e.clientX - this.dragStartX) / window.escala;
        const deltaY = (e.clientY - this.dragStartY) / window.escala;
        
        this.calleEditando.x += deltaX;
        this.calleEditando.y += deltaY;
        
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        
        this.actualizarInputsPosicion();
        this.actualizarPosicionHandles();
        if (window.renderizarCanvas) window.renderizarCanvas();
    }
    
    iniciarArrastreRotacion(e) {
        e.preventDefault();
        this.isDraggingRotate = true;
        
        const celda_tamano = window.celda_tamano || 5;
        const centroX = this.calleEditando.x + (this.calleEditando.tamano * celda_tamano) / 2;
        const centroY = this.calleEditando.y + (this.calleEditando.carriles * celda_tamano) / 2;
        
        const offsetX = window.offsetX || 0;
        const offsetY = window.offsetY || 0;
        const escala = window.escala || 1;
        
        const mouseWorldX = (e.clientX - offsetX) / escala;
        const mouseWorldY = (e.clientY - offsetY) / escala;
        
        this.rotationStartAngle = Math.atan2(
            mouseWorldY - centroY,
            mouseWorldX - centroX
        ) * 180 / Math.PI;
    }
    
    arrastreRotacion(e) {
        if (!this.calleEditando) return;
        
        const celda_tamano = window.celda_tamano || 5;
        const centroX = this.calleEditando.x + (this.calleEditando.tamano * celda_tamano) / 2;
        const centroY = this.calleEditando.y + (this.calleEditando.carriles * celda_tamano) / 2;
        
        const offsetX = window.offsetX || 0;
        const offsetY = window.offsetY || 0;
        const escala = window.escala || 1;
        
        const mouseWorldX = (e.clientX - offsetX) / escala;
        const mouseWorldY = (e.clientY - offsetY) / escala;
        
        const currentAngle = Math.atan2(
            mouseWorldY - centroY,
            mouseWorldX - centroX
        ) * 180 / Math.PI;
        
        const deltaAngle = currentAngle - this.rotationStartAngle;
        this.calleEditando.angulo = (this.calleEditando.angulo + deltaAngle) % 360;
        
        if (this.calleEditando.angulo < 0) {
            this.calleEditando.angulo += 360;
        }
        
        this.rotationStartAngle = currentAngle;
        
        this.actualizarInputsPosicion();
        this.actualizarPosicionHandles();
        if (window.renderizarCanvas) window.renderizarCanvas();
    }
}

// Instanciar el editor cuando el DOM esté listo
let editorCalles;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        editorCalles = new EditorCalles();
        console.log('✅ Editor de calles inicializado');
    });
} else {
    editorCalles = new EditorCalles();
    console.log('✅ Editor de calles inicializado');
}