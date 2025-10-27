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

// Referencias a elementos del DOM
let toggleBloqueoCarril;
let toggleInundacion;
let toggleObstaculo;
let paintModeIndicatorBloqueo;
let paintModeIndicatorInundacion;
let paintModeIndicatorObstaculo;
let btnClearBloqueos;
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
    btnClearBloqueos = document.getElementById('btnClearBloqueos');
    selectorEmojiObstaculo = document.getElementById('selectorEmojiObstaculo');
    canvasEscenarios = document.getElementById('simuladorCanvas');

    // Verificar que existen los elementos esenciales
    if (!toggleBloqueoCarril || !paintModeIndicatorBloqueo || !btnClearBloqueos || !canvasEscenarios) {
        console.error('❌ No se encontraron todos los elementos necesarios para escenarios');
        return;
    }

    // Event listener para el toggle de bloqueo de carril
    toggleBloqueoCarril.addEventListener('change', (e) => {
        if (e.target.checked) {
            activarEscenario('bloqueo');
        } else {
            desactivarEscenario();
        }
    });

    // Event listener para el toggle de inundación
    if (toggleInundacion) {
        toggleInundacion.addEventListener('change', (e) => {
            if (e.target.checked) {
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

    // Event listener para limpiar bloqueos
    btnClearBloqueos.addEventListener('click', () => {
        limpiarTodosLosBloqueos();
    });

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

    // Desactivar otros toggles
    if (tipo !== 'bloqueo' && toggleBloqueoCarril) toggleBloqueoCarril.checked = false;
    if (tipo !== 'inundacion' && toggleInundacion) toggleInundacion.checked = false;
    if (tipo !== 'obstaculo' && toggleObstaculo) toggleObstaculo.checked = false;

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
        } else if (tipo === 'obstaculo' && paintModeIndicatorObstaculo) {
            paintModeIndicatorObstaculo.style.display = 'block';
        }

        canvasEscenarios.classList.add('blocking-mode');

        // Pausar simulación si está corriendo
        if (window.isPaused === false && typeof window.pauseSimulation === 'function') {
            window.pauseSimulation();
            console.log('⏸️ Simulación pausada automáticamente');
        }
    } else {
        console.log('🚧 Modo escenario DESACTIVADO');

        // Ocultar todos los indicadores
        if (paintModeIndicatorBloqueo) paintModeIndicatorBloqueo.style.display = 'none';
        if (paintModeIndicatorInundacion) paintModeIndicatorInundacion.style.display = 'none';
        if (paintModeIndicatorObstaculo) paintModeIndicatorObstaculo.style.display = 'none';

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

// Exponer funciones globalmente
window.inicializarEscenarios = inicializarEscenarios;
window.exportarBloqueos = exportarBloqueos;
window.importarBloqueos = importarBloqueos;
window.estadoEscenarios = estadoEscenarios;

console.log('✅ escenarios.js cargado');
