// ==================== EDITOR.JS - MODO EDICIÓN (CALLES Y EDIFICIOS) ====================
// Este módulo maneja toda la funcionalidad de edición visual de calles y edificios

class EditorCalles {
    constructor() {
        this.modoEdicion = false;
        this.objetoEditando = null;
        this.tipoObjetoEditando = null;
        this.objetoOriginal = null;
        
        // NUEVO: Estado de edición de vértices
        this.modoEdicionVertices = false;
        this.verticeEditando = null;
        this.indiceVerticeEditando = -1;
        this.isDraggingVertice = false;
        
        // Elementos del DOM
        this.btnModoEdicion = document.getElementById('btnModoEdicion');
        this.btnGuardarEdicion = document.getElementById('btnGuardarEdicion');
        this.btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
        this.editActionButtons = document.getElementById('editActionButtons');
        this.editModeBadge = document.getElementById('editModeBadge');
        this.moveHandle = document.getElementById('moveHandle');
        this.rotationHandle = document.getElementById('rotateHandle');
        
        // Inputs de posición
        this.inputPosX = document.getElementById('inputPosX');
        this.inputPosY = document.getElementById('inputPosY');
        this.inputAngulo = document.getElementById('inputAngulo');
        this.btnAplicarPosicion = document.getElementById('btnAplicarPosicion');
        
        // Selectores
        this.selectTipoObjeto = document.getElementById('selectTipoObjeto');
        this.calleSelector = document.getElementById('calleSelector');
        this.edificioSelector = document.getElementById('edificioSelector');
        this.selectCalle = document.getElementById('selectCalle');
        this.selectEdificio = document.getElementById('selectEdificio');
        
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
        
        // Esperar a que las calles estén inicializadas
        this.esperarInicializacion();
    }
    
    esperarInicializacion() {
        if (window.calles && window.calles.length > 0) {
            console.log('✅ Calles detectadas:', window.calles.length);
            this.inicializarSelectores();
            this.inicializarEventos();
        } else {
            console.log('⏳ Esperando inicialización de calles...');
            setTimeout(() => this.esperarInicializacion(), 500);
        }
    }
    
    inicializarSelectores() {
        console.log('🔧 Inicializando selectores...');
        
        // Poblar selector de calles
        if (this.selectCalle && window.calles) {
            this.selectCalle.innerHTML = '<option value="">Selecciona una calle</option>';
            window.calles.forEach((calle, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = calle.nombre || `Calle ${index + 1}`;
                this.selectCalle.appendChild(option);
            });
            console.log(`✅ ${window.calles.length} calles agregadas al selector`);
        }
        
        // Poblar selector de edificios
        if (this.selectEdificio && window.edificios) {
            this.selectEdificio.innerHTML = '<option value="">Selecciona un edificio</option>';
            window.edificios.forEach((edificio, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = edificio.label || `Edificio ${index + 1}`;
                this.selectEdificio.appendChild(option);
            });
            console.log(`✅ ${window.edificios.length} edificios agregados al selector`);
        }
    }
    
    inicializarEventos() {
        console.log('🔧 Inicializando eventos del editor...');
        
        // Toggle de ajustes avanzados
        this.btnAjustesAvanzados?.addEventListener('click', () => {
            this.advancedSettings.classList.toggle('show');
            this.advancedArrow.textContent = this.advancedSettings.classList.contains('show') ? '▲' : '▼';
        });
        
        // Cambio de tipo de objeto
        this.selectTipoObjeto?.addEventListener('change', () => {
            const tipo = this.selectTipoObjeto.value;
            console.log('📋 Tipo seleccionado:', tipo);
            
            if (tipo === 'calle') {
                this.calleSelector.style.display = 'block';
                this.edificioSelector.style.display = 'none';
                this.selectEdificio.value = '';
            } else if (tipo === 'edificio') {
                this.calleSelector.style.display = 'none';
                this.edificioSelector.style.display = 'block';
                this.selectCalle.value = '';
            } else {
                this.calleSelector.style.display = 'none';
                this.edificioSelector.style.display = 'none';
            }
            
            window.calleSeleccionada = null;
            window.edificioSeleccionado = null;
            this.actualizarInputsPosicion();
            this.actualizarEstadoBotonEdicion();
            if (window.renderizarCanvas) window.renderizarCanvas();
        });
        
        // Selección de calle
        this.selectCalle?.addEventListener('change', () => {
            const calleIndex = this.selectCalle.value;
            console.log('🛣️ Calle seleccionada:', calleIndex);
            
            if (calleIndex !== "") {
                window.calleSeleccionada = window.calles[calleIndex];
                window.edificioSeleccionado = null;
                this.actualizarInputsPosicion();
                console.log('✅ Calle activa:', window.calleSeleccionada.nombre);
            } else {
                window.calleSeleccionada = null;
            }
            this.actualizarEstadoBotonEdicion();
            
            // Si estamos en modo edición, cambiar a la nueva calle
            if (this.modoEdicion && window.calleSeleccionada) {
                this.objetoEditando = window.calleSeleccionada;
                this.tipoObjetoEditando = 'calle';
                this.actualizarPosicionHandles();
            }
            
            if (window.renderizarCanvas) window.renderizarCanvas();
        });
        
        // Selección de edificio
        this.selectEdificio?.addEventListener('change', () => {
            const edificioIndex = this.selectEdificio.value;
            console.log('🏢 Edificio seleccionado:', edificioIndex);
            
            if (edificioIndex !== "") {
                window.edificioSeleccionado = window.edificios[edificioIndex];
                window.edificioSeleccionado.index = parseInt(edificioIndex);
                window.calleSeleccionada = null;
                this.actualizarInputsPosicion();
                console.log('✅ Edificio activo:', window.edificioSeleccionado.label);
            } else {
                window.edificioSeleccionado = null;
            }
            this.actualizarEstadoBotonEdicion();
            
            // Si estamos en modo edición, cambiar al nuevo edificio
            if (this.modoEdicion && window.edificioSeleccionado) {
                this.objetoEditando = window.edificioSeleccionado;
                this.tipoObjetoEditando = 'edificio';
                this.actualizarPosicionHandles();
            }
            
            if (window.renderizarCanvas) window.renderizarCanvas();
        });
        
        // Aplicar posición manual
        this.btnAplicarPosicion?.addEventListener('click', () => {
            const objeto = window.calleSeleccionada || window.edificioSeleccionado;
            if (!objeto) return;
            
            const x = parseFloat(this.inputPosX.value);
            const y = parseFloat(this.inputPosY.value);
            const angulo = parseFloat(this.inputAngulo.value);
            
            if (!isNaN(x)) objeto.x = x;
            if (!isNaN(y)) objeto.y = y;
            
            if (window.calleSeleccionada) {
                if (!isNaN(angulo)) objeto.angulo = angulo % 360;
            } else if (window.edificioSeleccionado) {
                if (!isNaN(angulo)) objeto.angle = angulo % 360;
            }
            
            this.actualizarInputsPosicion();
            this.actualizarPosicionHandles();
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
        this.rotationHandle?.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.iniciarArrastreRotacion(e);
        });
        
        // NUEVO: Capturar mousedown en el canvas para detectar vértices
        const canvas = document.getElementById('simuladorCanvas');
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => {
                // Solo procesar si estamos en modo edición y mostrando conexiones
                if (!this.modoEdicion || !window.mostrarConexiones) return;
                if (this.tipoObjetoEditando !== 'calle') return;
                if (!this.objetoEditando || !this.objetoEditando.vertices) return;
                
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const scaledMouseX = mouseX * scaleX;
                const scaledMouseY = mouseY * scaleY;
                
                const escala = window.escala || 1;
                const offsetX = window.offsetX || 0;
                const offsetY = window.offsetY || 0;
                
                const worldX = (scaledMouseX - offsetX) / escala;
                const worldY = (scaledMouseY - offsetY) / escala;
                
                // Intentar detectar vértice
                const verticeDetectado = this.detectarClicEnVertice(worldX, worldY);
                
                if (verticeDetectado) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.iniciarArrastreVertice(
                        verticeDetectado.vertice,
                        verticeDetectado.indice,
                        worldX,
                        worldY
                    );
                    console.log(`🎯 Vértice ${verticeDetectado.indice} capturado`);
                }
            });
        }
        
        // Eventos globales de mouse
        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingMove) {
                this.arrastreMovimiento(e);
            } else if (this.isDraggingRotate) {
                this.arrastreRotacion(e);
            } else if (this.isDraggingVertice) {
                this.arrastreVertice(e);
            }
            
            // Actualizar posición de handles si estamos en modo edición
            if (this.modoEdicion && !this.isDraggingMove && !this.isDraggingRotate) {
                this.actualizarPosicionHandles();
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isDraggingMove = false;
            this.isDraggingRotate = false;
            
            if (this.isDraggingVertice) {
                this.isDraggingVertice = false;
                this.verticeEditando = null;
                this.indiceVerticeEditando = -1;
                
                // Restaurar cursor
                const canvas = document.getElementById('simuladorCanvas');
                if (canvas) {
                    canvas.classList.remove('dragging-vertex');
                }
            }
        });
        
        console.log('✅ Editor completamente inicializado');
    }
    
    // ==================== FUNCIONES DE DETECCIÓN Y EDICIÓN DE VÉRTICES ====================
    
    // Función para detectar clic en vértice
    detectarClicEnVertice(mouseX, mouseY) {
        if (!this.objetoEditando || !this.objetoEditando.vertices) return null;
        
        const umbralDistancia = 15 / (window.escala || 1);
        
        for (let i = 0; i < this.objetoEditando.vertices.length; i++) {
            const vertice = this.objetoEditando.vertices[i];
            const pos = window.calcularPosicionVertice 
                ? window.calcularPosicionVertice(this.objetoEditando, vertice)
                : null;
            
            if (!pos) continue;
            
            const dx = mouseX - pos.x;
            const dy = mouseY - pos.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);
            
            if (distancia < umbralDistancia) {
                return { vertice, indice: i, pos };
            }
        }
        
        return null;
    }

    // Iniciar arrastre de vértice
    iniciarArrastreVertice(vertice, indice, mouseX, mouseY) {
        this.isDraggingVertice = true;
        this.verticeEditando = vertice;
        this.indiceVerticeEditando = indice;
        this.dragStartX = mouseX;
        this.dragStartY = mouseY;
        
        // Cambiar cursor
        const canvas = document.getElementById('simuladorCanvas');
        if (canvas) {
            canvas.classList.add('dragging-vertex');
        }
        
        console.log(`✏️ Editando vértice ${indice} de ${this.objetoEditando.nombre}`);
    }

    // Arrastrar vértice
    arrastreVertice(e) {
        if (!this.verticeEditando || !this.objetoEditando) return;
        
        const canvas = document.getElementById('simuladorCanvas');
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const scaledMouseX = mouseX * scaleX;
        const scaledMouseY = mouseY * scaleY;
        
        const escala = window.escala || 1;
        const offsetX = window.offsetX || 0;
        const offsetY = window.offsetY || 0;
        
        const worldX = (scaledMouseX - offsetX) / escala;
        const worldY = (scaledMouseY - offsetY) / escala;
        
        // Actualizar ángulo del vértice basado en posición del mouse
        if (window.actualizarVerticePorArrastre) {
            const exito = window.actualizarVerticePorArrastre(
                this.objetoEditando,
                this.indiceVerticeEditando,
                worldX,
                worldY
            );
            
            if (exito) {
                // Activar modo curva si no está activo
                if (!this.objetoEditando.esCurva) {
                    this.objetoEditando.esCurva = true;
                    console.log(`🌊 Modo curva activado para ${this.objetoEditando.nombre}`);
                }
                
                if (window.renderizarCanvas) window.renderizarCanvas();
            }
        }
    }
    
    // ==================== FUNCIONES DE ESTADO Y ACTUALIZACIÓN ====================
    
    actualizarEstadoBotonEdicion() {
        if (this.btnModoEdicion) {
            const haySeleccion = window.calleSeleccionada || window.edificioSeleccionado;
            this.btnModoEdicion.disabled = !haySeleccion;
        }
    }
    
    actualizarInputsPosicion() {
        const objeto = window.calleSeleccionada || window.edificioSeleccionado;
        if (!objeto) {
            if (this.inputPosX) this.inputPosX.value = '';
            if (this.inputPosY) this.inputPosY.value = '';
            if (this.inputAngulo) this.inputAngulo.value = '';
            return;
        }
        
        if (this.inputPosX) this.inputPosX.value = Math.round(objeto.x);
        if (this.inputPosY) this.inputPosY.value = Math.round(objeto.y);
        
        if (window.calleSeleccionada) {
            if (this.inputAngulo) this.inputAngulo.value = Math.round(objeto.angulo);
        } else if (window.edificioSeleccionado) {
            if (this.inputAngulo) this.inputAngulo.value = Math.round(objeto.angle || 0);
        }
    }
    
    // ==================== FUNCIONES DE MODO EDICIÓN ====================
    
    entrarModoEdicion() {
        const calle = window.calleSeleccionada;
        const edificio = window.edificioSeleccionado;
        
        if (!calle && !edificio) {
            alert('⚠️ Selecciona una calle o edificio primero');
            return;
        }
        
        this.modoEdicion = true;
        
        if (calle) {
            this.objetoEditando = calle;
            this.tipoObjetoEditando = 'calle';
            this.objetoOriginal = {
                x: calle.x,
                y: calle.y,
                angulo: calle.angulo
            };
            console.log('✏️ Modo edición activado para calle:', calle.nombre);
            
            // NUEVO: Activar mostrar conexiones automáticamente si la calle tiene vértices
            if (calle.vertices && calle.vertices.length > 0) {
                if (!window.mostrarConexiones) {
                    document.getElementById('btnConexiones')?.click();
                }
            }
        } else if (edificio) {
            this.objetoEditando = edificio;
            this.tipoObjetoEditando = 'edificio';
            this.objetoOriginal = {
                x: edificio.x,
                y: edificio.y,
                angle: edificio.angle || 0
            };
            console.log('✏️ Modo edición activado para edificio:', edificio.label);
        }
        
        // Pausar simulación
        const btnPause = document.getElementById('btnPauseResume');
        if (btnPause && !window.isPaused) {
            btnPause.click();
        }
        
        // Mostrar controles de edición
        if (this.editActionButtons) {
            this.editActionButtons.style.display = 'block';
        }
        if (this.editModeBadge) {
            this.editModeBadge.classList.add('active');
        }
        
        // Cambiar estilo del botón
        if (this.btnModoEdicion) {
            this.btnModoEdicion.textContent = '🔒 Salir de Edición';
            this.btnModoEdicion.classList.remove('btn-warning');
            this.btnModoEdicion.classList.add('btn-secondary');
        }
        
        // Mostrar handles
        this.actualizarPosicionHandles();
        if (this.moveHandle) {
            this.moveHandle.classList.add('active');
            console.log('✅ Handle de movimiento activado');
        }
        if (this.rotationHandle) {
            this.rotationHandle.classList.add('active');
            console.log('✅ Handle de rotación activado');
        }
        
        // Ocultar controles normales
        const controlBar = document.getElementById('canvasControlBar');
        if (controlBar) controlBar.style.opacity = '0.3';
    }
    
    guardarEdicion() {
        if (!this.modoEdicion) return;
        
        if (this.tipoObjetoEditando === 'calle') {
            console.log('💾 Cambios guardados en calle:', {
                calle: this.objetoEditando.nombre,
                nuevaX: this.objetoEditando.x,
                nuevaY: this.objetoEditando.y,
                nuevoAngulo: this.objetoEditando.angulo
            });
            
            // Recalcular intersecciones con las nuevas posiciones
            if (window.inicializarIntersecciones) window.inicializarIntersecciones();
            if (window.construirMapaIntersecciones) window.construirMapaIntersecciones();
        } else if (this.tipoObjetoEditando === 'edificio') {
            console.log('💾 Cambios guardados en edificio:', {
                edificio: this.objetoEditando.label,
                nuevaX: this.objetoEditando.x,
                nuevaY: this.objetoEditando.y,
                nuevoAngulo: this.objetoEditando.angle
            });
        }
        
        this.salirModoEdicion();
        
        alert('✅ Cambios guardados correctamente');
    }
    
    cancelarEdicion() {
        if (!this.modoEdicion || !this.objetoOriginal) return;
        
        this.objetoEditando.x = this.objetoOriginal.x;
        this.objetoEditando.y = this.objetoOriginal.y;
        
        if (this.tipoObjetoEditando === 'calle') {
            this.objetoEditando.angulo = this.objetoOriginal.angulo;
        } else if (this.tipoObjetoEditando === 'edificio') {
            this.objetoEditando.angle = this.objetoOriginal.angle;
        }
        
        this.actualizarInputsPosicion();
        if (window.renderizarCanvas) window.renderizarCanvas();
        
        this.salirModoEdicion();
        
        console.log('❌ Edición cancelada');
    }
    
    salirModoEdicion() {
        this.modoEdicion = false;
        this.objetoEditando = null;
        this.tipoObjetoEditando = null;
        this.objetoOriginal = null;
        
        // Ocultar controles de edición
        if (this.editActionButtons) {
            this.editActionButtons.style.display = 'none';
        }
        if (this.editModeBadge) {
            this.editModeBadge.classList.remove('active');
        }
        if (this.moveHandle) {
            this.moveHandle.classList.remove('active');
        }
        if (this.rotationHandle) {
            this.rotationHandle.classList.remove('active');
        }
        
        // Restaurar estilo del botón
        if (this.btnModoEdicion) {
            this.btnModoEdicion.textContent = '✏️ Modo Edición';
            this.btnModoEdicion.classList.remove('btn-secondary');
            this.btnModoEdicion.classList.add('btn-warning');
        }
        
        // Mostrar controles normales
        const controlBar = document.getElementById('canvasControlBar');
        if (controlBar) controlBar.style.opacity = '1';
    }
    
    // ==================== FUNCIONES DE HANDLES Y ARRASTRE ====================
    
    actualizarPosicionHandles() {
        if (!this.objetoEditando) {
            console.log('⚠️ No hay objeto editando');
            return;
        }
        
        const escala = window.escala || 1;
        const offsetX = window.offsetX || 0;
        const offsetY = window.offsetY || 0;
        const celda_tamano = window.celda_tamano || 5;
        
        let centroX, centroY, rotX, rotY;
        
        if (this.tipoObjetoEditando === 'calle') {
            const screenX = this.objetoEditando.x * escala + offsetX;
            const screenY = this.objetoEditando.y * escala + offsetY;
        
            centroX = screenX + (this.objetoEditando.tamano * celda_tamano * escala) / 2;
            centroY = screenY + (this.objetoEditando.carriles * celda_tamano * escala) / 2;
            
            rotX = screenX + (this.objetoEditando.tamano * celda_tamano * escala);
            rotY = screenY;
            
        } else if (this.tipoObjetoEditando === 'edificio') {
            const screenX = this.objetoEditando.x * escala + offsetX;
            const screenY = this.objetoEditando.y * escala + offsetY;
            
            centroX = screenX;
            centroY = screenY;
            
            const angle = (this.objetoEditando.angle || 0) * Math.PI / 180;
            const offsetRotX = (this.objetoEditando.width / 2) * Math.cos(angle) * escala;
            const offsetRotY = (this.objetoEditando.width / 2) * Math.sin(angle) * escala;
            
            rotX = screenX + offsetRotX;
            rotY = screenY + offsetRotY;
        }
        
        if (this.moveHandle) {
            this.moveHandle.style.left = `${centroX - 20}px`;
            this.moveHandle.style.top = `${centroY - 20}px`;
        }
        
        if (this.rotationHandle) {
            this.rotationHandle.style.left = `${rotX - 20}px`;
            this.rotationHandle.style.top = `${rotY - 20}px`;
        }
    }
    
    iniciarArrastreMovimiento(e) {
        e.preventDefault();
        e.stopPropagation();
        this.isDraggingMove = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        console.log('🖱️ Iniciando arrastre de movimiento');
    }
    
    arrastreMovimiento(e) {
        if (!this.objetoEditando) return;
        
        const escala = window.escala || 1;
        const deltaX = (e.clientX - this.dragStartX) / escala;
        const deltaY = (e.clientY - this.dragStartY) / escala;
        
        this.objetoEditando.x += deltaX;
        this.objetoEditando.y += deltaY;
        
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        
        this.actualizarInputsPosicion();
        this.actualizarPosicionHandles();
        if (window.renderizarCanvas) window.renderizarCanvas();
    }
    
    iniciarArrastreRotacion(e) {
        e.preventDefault();
        e.stopPropagation();
        this.isDraggingRotate = true;
        
        const celda_tamano = window.celda_tamano || 5;
        const escala = window.escala || 1;
        const offsetX = window.offsetX || 0;
        const offsetY = window.offsetY || 0;
        
        let centroX, centroY;
        
        if (this.tipoObjetoEditando === 'calle') {
            centroX = this.objetoEditando.x + (this.objetoEditando.tamano * celda_tamano) / 2;
            centroY = this.objetoEditando.y + (this.objetoEditando.carriles * celda_tamano) / 2;
        } else if (this.tipoObjetoEditando === 'edificio') {
            centroX = this.objetoEditando.x;
            centroY = this.objetoEditando.y;
        }
        
        const mouseWorldX = (e.clientX - offsetX) / escala;
        const mouseWorldY = (e.clientY - offsetY) / escala;
        
        this.rotationStartAngle = Math.atan2(
            mouseWorldY - centroY,
            mouseWorldX - centroX
        ) * 180 / Math.PI;
        
        console.log('🔄 Iniciando rotación');
    }
    
    arrastreRotacion(e) {
        if (!this.objetoEditando) return;
        
        const celda_tamano = window.celda_tamano || 5;
        const escala = window.escala || 1;
        const offsetX = window.offsetX || 0;
        const offsetY = window.offsetY || 0;
        
        let centroX, centroY;
        
        if (this.tipoObjetoEditando === 'calle') {
            centroX = this.objetoEditando.x + (this.objetoEditando.tamano * celda_tamano) / 2;
            centroY = this.objetoEditando.y + (this.objetoEditando.carriles * celda_tamano) / 2;
        } else if (this.tipoObjetoEditando === 'edificio') {
            centroX = this.objetoEditando.x;
            centroY = this.objetoEditando.y;
        }
        
        const mouseWorldX = (e.clientX - offsetX) / escala;
        const mouseWorldY = (e.clientY - offsetY) / escala;
        
        const currentAngle = Math.atan2(
            mouseWorldY - centroY,
            mouseWorldX - centroX
        ) * 180 / Math.PI;
        
        const deltaAngle = currentAngle - this.rotationStartAngle;
        
        if (this.tipoObjetoEditando === 'calle') {
            this.objetoEditando.angulo = (this.objetoEditando.angulo + deltaAngle) % 360;
            if (this.objetoEditando.angulo < 0) {
                this.objetoEditando.angulo += 360;
            }
        } else if (this.tipoObjetoEditando === 'edificio') {
            if (!this.objetoEditando.angle) this.objetoEditando.angle = 0;
            this.objetoEditando.angle = (this.objetoEditando.angle + deltaAngle) % 360;
            if (this.objetoEditando.angle < 0) {
                this.objetoEditando.angle += 360;
            }
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
        console.log('✅ Editor de calles y edificios inicializado');
    });
} else {
    editorCalles = new EditorCalles();
    console.log('🚀 Editor de calles y edificios cargado');
}