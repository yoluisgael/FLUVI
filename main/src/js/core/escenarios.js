console.log('🎬 escenarios.js cargando...');

/**
 * MÓDULO DE ESCENARIOS
 * Gestiona los diferentes escenarios de tráfico (bloqueo de carriles, inundaciones, obstáculos)
 */

// Estado del módulo de escenarios
const estadoEscenarios = {
    modoBloqueoActivo: false,
    tipoEscenarioActivo: null, // 'bloqueo', 'inundacion', 'obstaculo'
    emojiObstaculoSeleccionado: 'bache', // Textura por defecto para obstáculos
    isPainting: false,
    celdasBloqueadas: new Map() // key: "calleId:carril:indice", value: { tipo: string, texture?: string }
};

/**
 * Muestra una alerta Bootstrap temporal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta: 'warning', 'danger', 'info', 'success'
 * @param {number} duracion - Duración en ms (por defecto 4000)
 */
function mostrarAlertaBootstrap(mensaje, tipo = 'warning', duracion = 4000) {
    // Crear contenedor si no existe
    let contenedor = document.getElementById('alertContainer');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'alertContainer';
        contenedor.style.position = 'fixed';
        contenedor.style.top = '20px';
        contenedor.style.right = '20px';
        contenedor.style.zIndex = '9999';
        contenedor.style.maxWidth = '400px';
        document.body.appendChild(contenedor);
    }

    // Crear alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    alerta.setAttribute('role', 'alert');

    alerta.innerHTML = `
        <strong>⚠️</strong> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    contenedor.appendChild(alerta);

    // Auto-cerrar después de la duración especificada
    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 150);
    }, duracion);
}

// Referencias a elementos del DOM
let toggleBloqueoCarril;
let toggleInundacion;
let toggleObstaculo;
let paintModeIndicatorBloqueo;
let paintModeIndicatorInundacion;
let paintModeIndicatorObstaculo;
let selectorEmojiObstaculo;
let canvasEscenarios;

/**
 * Inicializa el módulo de escenarios
 */
function inicializarEscenarios() {
    console.log('🎬 Inicializando módulo de escenarios...');

    // Obtener referencias a elementos del DOM
    toggleBloqueoCarril = document.getElementById('toggleBloqueoCarril');
    toggleInundacion = document.getElementById('toggleInundacion');
    toggleObstaculo = document.getElementById('toggleObstaculo');
    paintModeIndicatorBloqueo = document.getElementById('paintModeIndicator');
    paintModeIndicatorInundacion = document.getElementById('paintModeIndicatorInundacion');
    paintModeIndicatorObstaculo = document.getElementById('paintModeIndicatorObstaculo');
    selectorEmojiObstaculo = document.getElementById('selectorEmojiObstaculo');
    canvasEscenarios = document.getElementById('simuladorCanvas');

    // Verificar que existen los elementos esenciales
    if (!toggleBloqueoCarril || !paintModeIndicatorBloqueo || !canvasEscenarios) {
        console.error('❌ No se encontraron todos los elementos necesarios para escenarios');
        return;
    }

    // Event listener para el toggle de bloqueo de carril
    toggleBloqueoCarril.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Verificar si hay otro modo activo
            if (estadoEscenarios.tipoEscenarioActivo) {
                e.preventDefault();
                toggleBloqueoCarril.checked = false;
                const modoActual = estadoEscenarios.tipoEscenarioActivo === 'inundacion' ? 'Inundación' : 'Obstáculo';
                mostrarAlertaBootstrap(
                    `Ya tienes el modo "<strong>${modoActual}</strong>" activo.<br>Debes desactivarlo primero antes de activar otro modo de escenario.`,
                    'warning',
                    5000
                );
                return;
            }
            activarEscenario('bloqueo');
        } else {
            desactivarEscenario();
        }
    });

    // Event listener para el toggle de inundación
    if (toggleInundacion) {
        toggleInundacion.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Verificar si hay otro modo activo
                if (estadoEscenarios.tipoEscenarioActivo) {
                    e.preventDefault();
                    toggleInundacion.checked = false;
                    const modoActual = estadoEscenarios.tipoEscenarioActivo === 'bloqueo' ? 'Bloqueo de Carril' : 'Obstáculo';
                    mostrarAlertaBootstrap(
                        `Ya tienes el modo "<strong>${modoActual}</strong>" activo.<br>Debes desactivarlo primero antes de activar otro modo de escenario.`,
                        'warning',
                        5000
                    );
                    return;
                }
                activarEscenario('inundacion');
            } else {
                desactivarEscenario();
            }
        });
    }

    // Event listener para el toggle de obstáculo
    if (toggleObstaculo) {
        toggleObstaculo.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Verificar si hay otro modo activo
                if (estadoEscenarios.tipoEscenarioActivo) {
                    e.preventDefault();
                    toggleObstaculo.checked = false;
                    const modoActual = estadoEscenarios.tipoEscenarioActivo === 'bloqueo' ? 'Bloqueo de Carril' : 'Inundación';
                    mostrarAlertaBootstrap(
                        `Ya tienes el modo "<strong>${modoActual}</strong>" activo.<br>Debes desactivarlo primero antes de activar otro modo de escenario.`,
                        'warning',
                        5000
                    );
                    return;
                }
                activarEscenario('obstaculo');
                // Mostrar selector de emoji
                const container = document.getElementById('selectorObstaculoContainer');
                if (container) container.style.display = 'block';
            } else {
                desactivarEscenario();
                // Ocultar selector de emoji
                const container = document.getElementById('selectorObstaculoContainer');
                if (container) container.style.display = 'none';
            }
        });
    }

    // Event listener para selector de textura de obstáculo
    if (selectorEmojiObstaculo) {
        selectorEmojiObstaculo.addEventListener('change', (e) => {
            estadoEscenarios.emojiObstaculoSeleccionado = e.target.value;
            console.log('🎨 Textura de obstáculo seleccionada:', e.target.value);
        });
    }

    console.log('✅ Módulo de escenarios inicializado');
    console.log('ℹ️ Los clicks en el canvas son manejados por CalleRenderer con prioridad al modo bloqueo');
}

/**
 * Activa un tipo de escenario específico
 */
function activarEscenario(tipo) {
    // Desactivar el modo edición si está activo
    if (window.editorVisual && window.editorVisual.modoEdicion) {
        window.editorVisual.salirModoEdicion();
        console.log('✅ Modo Edición desactivado para activar escenario');
    }

    estadoEscenarios.modoBloqueoActivo = true;
    estadoEscenarios.tipoEscenarioActivo = tipo;

    toggleModoBloqueo(true, tipo);
    console.log(`🎬 Escenario activado: ${tipo}`);
}

/**
 * Desactiva todos los escenarios
 */
function desactivarEscenario() {
    estadoEscenarios.modoBloqueoActivo = false;
    estadoEscenarios.tipoEscenarioActivo = null;

    toggleModoBloqueo(false);
    console.log('🎬 Escenario desactivado');
}

/**
 * Activa o desactiva el modo bloqueo
 */
function toggleModoBloqueo(activar, tipo = 'bloqueo') {
    const btnPauseResume = document.getElementById('btnPauseResume');
    const btnPaso = document.getElementById('btnPaso');

    if (activar) {
        console.log(`🚧 Modo ${tipo} ACTIVADO`);

        // Ocultar todos los indicadores primero
        if (paintModeIndicatorBloqueo) paintModeIndicatorBloqueo.style.display = 'none';
        if (paintModeIndicatorInundacion) paintModeIndicatorInundacion.style.display = 'none';
        if (paintModeIndicatorObstaculo) paintModeIndicatorObstaculo.style.display = 'none';

        // Mostrar solo el indicador correspondiente al tipo de escenario
        if (tipo === 'bloqueo' && paintModeIndicatorBloqueo) {
            paintModeIndicatorBloqueo.style.display = 'block';
        } else if (tipo === 'inundacion' && paintModeIndicatorInundacion) {
            paintModeIndicatorInundacion.style.display = 'block';

            // 🌧️ ACTIVAR EFECTO DE LLUVIA para modo inundación
            if (window.pixiApp && window.RainEffect) {
                if (!window.pixiApp.rainEffect) {
                    window.pixiApp.rainEffect = new window.RainEffect(window.pixiApp.app);
                }
                window.pixiApp.rainEffect.start();
                console.log('🌧️ Efecto de lluvia activado');
            }
        } else if (tipo === 'obstaculo' && paintModeIndicatorObstaculo) {
            paintModeIndicatorObstaculo.style.display = 'block';
        }

        canvasEscenarios.classList.add('blocking-mode');
    } else {
        console.log('🚧 Modo escenario DESACTIVADO');

        // Ocultar todos los indicadores
        if (paintModeIndicatorBloqueo) paintModeIndicatorBloqueo.style.display = 'none';
        if (paintModeIndicatorInundacion) paintModeIndicatorInundacion.style.display = 'none';
        if (paintModeIndicatorObstaculo) paintModeIndicatorObstaculo.style.display = 'none';

        // 🌧️ DESACTIVAR EFECTO DE LLUVIA
        if (window.pixiApp && window.pixiApp.rainEffect) {
            window.pixiApp.rainEffect.stop();
            console.log('🌧️ Efecto de lluvia desactivado');
        }

        canvasEscenarios.classList.remove('blocking-mode');
        estadoEscenarios.isPainting = false;
    }
}

// NOTA: La funcionalidad de pintar/bloquear celdas ahora está integrada en CalleRenderer.onCalleClick
// para evitar conflictos con otros manejadores de eventos

/**
 * Limpia todos los bloqueos
 */
function limpiarTodosLosBloqueos() {
    if (estadoEscenarios.celdasBloqueadas.size === 0) {
        console.log('ℹ️ No hay bloqueos para limpiar');
        return;
    }

    const confirmacion = confirm(`¿Estás seguro de que quieres eliminar ${estadoEscenarios.celdasBloqueadas.size} bloqueo(s)?`);

    if (!confirmacion) return;

    // Recorrer todas las celdas bloqueadas y desbloquearlas
    estadoEscenarios.celdasBloqueadas.forEach((metadata, celdaKey) => {
        const [calleId, carril, indice] = celdaKey.split(':').map(Number);

        // Buscar la calle por ID
        const calle = window.calles?.find(c => c.id === calleId);

        if (calle && calle.arreglo[carril]) {
            calle.arreglo[carril][indice] = 0;
        }
    });

    // Limpiar el Map
    estadoEscenarios.celdasBloqueadas.clear();

    console.log('🗑️ Todos los bloqueos han sido eliminados');

    // Forzar actualización del renderer
    if (window.pixiApp && window.pixiApp.sceneManager && window.pixiApp.sceneManager.carroRenderer) {
        window.pixiApp.sceneManager.carroRenderer.updateAll(window.calles);
    }
}

// NOTA: Las funciones de conversión de coordenadas y detección de celdas
// ahora son manejadas por CalleRenderer usando window.obtenerCeldaEnPosicion

/**
 * Exporta el estado de los bloqueos para guardarlo
 */
function exportarBloqueos() {
    const bloqueos = [];
    estadoEscenarios.celdasBloqueadas.forEach((metadata, celdaKey) => {
        bloqueos.push({ key: celdaKey, ...metadata });
    });
    return bloqueos;
}

/**
 * Importa el estado de los bloqueos desde un guardado
 */
function importarBloqueos(bloqueosArray) {
    estadoEscenarios.celdasBloqueadas.clear();

    if (Array.isArray(bloqueosArray)) {
        bloqueosArray.forEach(bloqueo => {
            const celdaKey = bloqueo.key;
            // Soportar tanto el formato antiguo (emoji) como el nuevo (texture)
            const metadata = {
                tipo: bloqueo.tipo,
                texture: bloqueo.texture || bloqueo.emoji
            };

            estadoEscenarios.celdasBloqueadas.set(celdaKey, metadata);

            // Aplicar el bloqueo en las calles
            const [calleId, carril, indice] = celdaKey.split(':').map(Number);
            const calle = window.calles?.find(c => c.id === calleId);

            if (calle && calle.arreglo[carril]) {
                calle.arreglo[carril][indice] = 7;
            }
        });

        console.log(`📥 Importados ${bloqueosArray.length} bloqueos`);
    }
}

// ============================================================
// SISTEMA DE GUARDADO Y CARGA DE ESCENARIOS
// ============================================================

/**
 * Guarda el escenario actual en localStorage
 * @param {string} nombre - Nombre del escenario
 * @param {string} descripcion - Descripción opcional
 * @returns {boolean} - true si se guardó exitosamente
 */
function crearEscenarioJSON(nombre, descripcion = '') {
    if (!nombre || nombre.trim() === '') {
        console.error('❌ El nombre del escenario es obligatorio');
        return null;
    }

    try {
        // Capturar configuración actual de las calles
        const callesConfig = window.calles.map(calle => ({
            id: calle.id || calle.nombre, // ID único de la calle
            nombre: calle.nombre,
            tamano: calle.tamano,
            carriles: calle.carriles
        }));

        // Capturar todas las celdas bloqueadas
        const celdasBloqueadasArray = [];
        estadoEscenarios.celdasBloqueadas.forEach((valor, key) => {
            const [calleId, carril, indice] = key.split(':');

            // Encontrar la calle correspondiente (buscar por id o nombre)
            const calle = window.calles.find(c => c.id === calleId || c.nombre === calleId);
            if (calle) {
                celdasBloqueadasArray.push({
                    calleNombre: calle.nombre,
                    calleId: calle.id || calle.nombre,
                    carril: parseInt(carril),
                    indice: parseInt(indice),
                    tipo: valor.tipo,
                    texture: valor.texture || null
                });
            }
        });

        // Crear objeto del escenario
        const escenario = {
            version: '1.0',
            id: Date.now().toString(),
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            fechaCreacion: new Date().toISOString(),
            callesConfig: callesConfig,
            celdasBloqueadas: celdasBloqueadasArray,
            estadisticas: {
                totalBloqueos: celdasBloqueadasArray.filter(c => c.tipo === 'bloqueo').length,
                totalInundaciones: celdasBloqueadasArray.filter(c => c.tipo === 'inundacion').length,
                totalObstaculos: celdasBloqueadasArray.filter(c => c.tipo === 'obstaculo').length
            }
        };

        console.log('✅ Escenario creado exitosamente:', escenario);
        return escenario;

    } catch (error) {
        console.error('❌ Error al crear escenario:', error);
        return null;
    }
}

/**
 * Obtiene todos los escenarios guardados
 * @returns {Array} - Array de escenarios
 */
function obtenerEscenariosGuardados() {
    try {
        const data = localStorage.getItem('escenariosGuardados');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('❌ Error al obtener escenarios guardados:', error);
        return [];
    }
}

/**
 * Valida si un escenario es compatible con la configuración actual
 * @param {Object} escenario - Escenario a validar
 * @returns {Object} - { valido: boolean, errores: Array }
 */
function validarEscenario(escenario) {
    const errores = [];

    // Validar que existan las calles referenciadas
    escenario.callesConfig.forEach(calleGuardada => {
        const calleActual = window.calles.find(c =>
            (c.id && c.id === calleGuardada.id) || c.nombre === calleGuardada.nombre
        );

        if (!calleActual) {
            errores.push(`La calle "${calleGuardada.nombre}" no existe en el simulador actual`);
        } else {
            // Validar longitud (tamano)
            if (calleActual.tamano !== calleGuardada.tamano) {
                errores.push(
                    `La calle "${calleGuardada.nombre}" tiene una longitud diferente ` +
                    `(actual: ${calleActual.tamano} celdas, guardada: ${calleGuardada.tamano} celdas)`
                );
            }

            // Validar número de carriles
            if (calleActual.carriles !== calleGuardada.carriles) {
                errores.push(
                    `La calle "${calleGuardada.nombre}" tiene un número diferente de carriles ` +
                    `(actual: ${calleActual.carriles}, guardado: ${calleGuardada.carriles})`
                );
            }
        }
    });

    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * Carga un escenario desde un objeto JSON
 * @param {Object} escenario - Objeto del escenario a cargar
 * @returns {Object} - { exito: boolean, mensaje: string }
 */
function cargarEscenarioDesdeJSON(escenario) {
    try {
        if (!escenario) {
            return { exito: false, mensaje: 'Escenario no válido' };
        }

        // Validar compatibilidad
        const validacion = validarEscenario(escenario);
        if (!validacion.valido) {
            const mensajeError = 'No se puede cargar el escenario:\n\n' +
                validacion.errores.map(e => `• ${e}`).join('\n');
            return { exito: false, mensaje: mensajeError };
        }

        // Limpiar todos los bloqueos actuales
        limpiarTodosLosBloqueos();

        // Cargar celdas bloqueadas
        let celdasCargadas = 0;
        escenario.celdasBloqueadas.forEach(celda => {
            const calle = window.calles.find(c =>
                (c.id && c.id === celda.calleId) || c.nombre === celda.calleNombre
            );

            if (calle && calle.arreglo && calle.arreglo[celda.carril] && calle.arreglo[celda.carril][celda.indice] !== undefined) {
                // Marcar la celda como bloqueada en el arreglo
                calle.arreglo[celda.carril][celda.indice] = 7;

                // IMPORTANTE: Usar calle.id (o nombre si no hay id) para la clave
                const calleId = calle.id || calle.nombre;
                const key = `${calleId}:${celda.carril}:${celda.indice}`;

                // Registrar en el mapa de celdas bloqueadas con metadata completa
                estadoEscenarios.celdasBloqueadas.set(key, {
                    tipo: celda.tipo,
                    texture: celda.texture
                });

                console.log(`✓ Celda cargada: ${key} - Tipo: ${celda.tipo}, Textura: ${celda.texture}`);
                celdasCargadas++;
            } else {
                console.warn(`⚠️ No se pudo cargar celda en ${celda.calleNombre}[${celda.carril}][${celda.indice}]`);
            }
        });

        // Guardar el escenario actualmente cargado
        window.escenarioActualCargado = {
            id: escenario.id,
            nombre: escenario.nombre,
            fechaCarga: new Date().toISOString()
        };

        // Forzar actualización del renderizado visual
        if (window.USE_PIXI && window.pixiApp && window.pixiApp.sceneManager) {
            console.log('🎨 Actualizando renderizado PixiJS...');

            // Forzar actualización del CarroRenderer para mostrar los obstáculos
            if (window.pixiApp.sceneManager.carroRenderer) {
                window.pixiApp.sceneManager.carroRenderer.updateAll(window.calles);
            }
        }

        // Renderizar el canvas (para modo Canvas 2D)
        if (window.renderizarCanvas) {
            window.renderizarCanvas();
        }

        console.log(`✅ Escenario "${escenario.nombre}" cargado exitosamente. Celdas cargadas: ${celdasCargadas}`);
        return {
            exito: true,
            mensaje: `Escenario cargado exitosamente\n${celdasCargadas} celdas aplicadas`,
            escenario: escenario
        };

    } catch (error) {
        console.error('❌ Error al cargar escenario:', error);
        return { exito: false, mensaje: 'Error al cargar el escenario: ' + error.message };
    }
}

/**
 * Elimina un escenario guardado
 * @param {string} escenarioId - ID del escenario a eliminar
 * @returns {boolean} - true si se eliminó exitosamente
 */
function eliminarEscenario(escenarioId) {
    try {
        let escenarios = obtenerEscenariosGuardados();
        const indiceAntes = escenarios.length;

        escenarios = escenarios.filter(e => e.id !== escenarioId);

        if (escenarios.length === indiceAntes) {
            return false; // No se encontró el escenario
        }

        localStorage.setItem('escenariosGuardados', JSON.stringify(escenarios));
        console.log('✅ Escenario eliminado exitosamente');
        return true;

    } catch (error) {
        console.error('❌ Error al eliminar escenario:', error);
        return false;
    }
}

// Exponer funciones globalmente
window.inicializarEscenarios = inicializarEscenarios;
window.exportarBloqueos = exportarBloqueos;
window.importarBloqueos = importarBloqueos;
window.estadoEscenarios = estadoEscenarios;
window.crearEscenarioJSON = crearEscenarioJSON;
window.validarEscenario = validarEscenario;
window.cargarEscenarioDesdeJSON = cargarEscenarioDesdeJSON;

console.log('✅ escenarios.js cargado');
