/**
 * gestionEscenarios.js - Interfaz de usuario para gestionar escenarios
 * Maneja los modales de guardado y carga de escenarios
 */

console.log('📂 gestionEscenarios.js cargando...');

// Referencias a elementos del DOM
let btnGuardarEscenario;
let btnCargarEscenario;
let btnConfirmarGuardarEscenario;
let inputNombreEscenario;
let inputDescripcionEscenario;
let modalGuardarEscenario;
let modalCargarEscenario;
let listaEscenariosGuardados;
let noEscenariosMessage;
let escenarioActualInfo;
let escenarioActualNombre;
let escenarioActualFecha;

/**
 * Inicializa el módulo de gestión de escenarios
 */
function inicializarGestionEscenarios() {
    console.log('📂 Inicializando gestión de escenarios...');

    // Obtener referencias a elementos del DOM
    btnGuardarEscenario = document.getElementById('btnGuardarEscenario');
    btnCargarEscenario = document.getElementById('btnCargarEscenario');
    btnConfirmarGuardarEscenario = document.getElementById('btnConfirmarGuardarEscenario');
    inputNombreEscenario = document.getElementById('inputNombreEscenario');
    inputDescripcionEscenario = document.getElementById('inputDescripcionEscenario');
    listaEscenariosGuardados = document.getElementById('listaEscenariosGuardados');
    noEscenariosMessage = document.getElementById('noEscenariosMessage');
    escenarioActualInfo = document.getElementById('escenarioActualInfo');
    escenarioActualNombre = document.getElementById('escenarioActualNombre');
    escenarioActualFecha = document.getElementById('escenarioActualFecha');

    // Crear instancias de modales Bootstrap
    const modalGuardarElement = document.getElementById('modalGuardarEscenario');
    const modalCargarElement = document.getElementById('modalCargarEscenario');

    if (modalGuardarElement) {
        modalGuardarEscenario = new bootstrap.Modal(modalGuardarElement);
    }

    if (modalCargarElement) {
        modalCargarEscenario = new bootstrap.Modal(modalCargarElement);
    }

    // Event listeners
    if (btnGuardarEscenario) {
        btnGuardarEscenario.addEventListener('click', abrirModalGuardar);
    }

    if (btnCargarEscenario) {
        btnCargarEscenario.addEventListener('click', abrirModalCargar);
    }

    if (btnConfirmarGuardarEscenario) {
        btnConfirmarGuardarEscenario.addEventListener('click', confirmarGuardarEscenario);
    }

    // Validación en tiempo real del nombre
    if (inputNombreEscenario) {
        inputNombreEscenario.addEventListener('input', function() {
            if (this.value.trim() === '') {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });
    }

    console.log('✅ Gestión de escenarios inicializada');
}

/**
 * Abre el modal para guardar un escenario
 */
function abrirModalGuardar() {
    // Limpiar formulario
    if (inputNombreEscenario) {
        inputNombreEscenario.value = '';
        inputNombreEscenario.classList.remove('is-invalid');
    }

    if (inputDescripcionEscenario) {
        inputDescripcionEscenario.value = '';
    }

    // Verificar si hay celdas bloqueadas
    const celdasBloqueadas = window.estadoEscenarios?.celdasBloqueadas;
    if (!celdasBloqueadas || celdasBloqueadas.size === 0) {
        mostrarNotificacion('warning', 'Escenario Vacío',
            'No hay obstáculos, inundaciones ni bloqueos configurados.\n' +
            'Configura al menos un elemento antes de guardar.');
        return;
    }

    // Mostrar modal
    if (modalGuardarEscenario) {
        modalGuardarEscenario.show();
    }
}

/**
 * Confirma y guarda el escenario
 */
function confirmarGuardarEscenario() {
    const nombre = inputNombreEscenario.value.trim();
    const descripcion = inputDescripcionEscenario.value.trim();

    // Validar nombre
    if (nombre === '') {
        inputNombreEscenario.classList.add('is-invalid');
        mostrarNotificacion('error', 'Error de Validación', 'El nombre del escenario es obligatorio.');
        return;
    }

    // Crear el escenario directamente (sin localStorage)
    const escenarioGuardado = window.crearEscenarioJSON(nombre, descripcion);

    if (escenarioGuardado) {
        // Descargar como archivo JSON
        descargarEscenarioJSON(escenarioGuardado, nombre);

        // Cerrar modal
        if (modalGuardarEscenario) {
            modalGuardarEscenario.hide();
        }

        // Mostrar notificación de éxito
        mostrarNotificacion('success', 'Escenario Guardado',
            `El escenario "${nombre}" se ha guardado exitosamente.\n` +
            `El archivo JSON se ha descargado automáticamente.\n` +
            `Guarda el archivo y cárgalo cuando quieras usar este escenario.`);

        // Limpiar formulario
        inputNombreEscenario.value = '';
        inputNombreEscenario.classList.remove('is-invalid');
        inputDescripcionEscenario.value = '';
    } else {
        mostrarNotificacion('error', 'Error al Guardar', 'No se pudo guardar el escenario. Inténtalo de nuevo.');
    }
}

/**
 * Descarga un escenario como archivo JSON
 */
function descargarEscenarioJSON(escenario, nombreArchivo) {
    // Convertir a JSON con formato legible
    const jsonString = JSON.stringify(escenario, null, 2);

    // Crear blob
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Crear URL temporal
    const url = URL.createObjectURL(blob);

    // Crear elemento de descarga temporal
    const a = document.createElement('a');
    a.href = url;
    a.download = `escenario_${nombreArchivo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();

    // Limpiar
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`📥 Escenario descargado como: ${a.download}`);
}

/**
 * Abre el modal para cargar un escenario
 */
function abrirModalCargar() {
    // Solo mostrar el modal (sin listar escenarios de localStorage)
    // Los usuarios cargarán archivos JSON directamente

    // Mostrar modal
    if (modalCargarEscenario) {
        modalCargarEscenario.show();
    }
}

/**
 * Crea un elemento HTML para un escenario en la lista
 */
function crearItemEscenario(escenario) {
    const div = document.createElement('div');
    div.className = 'list-group-item list-group-item-action';

    // Formatear fecha
    const fecha = new Date(escenario.fechaCreacion);
    const fechaFormateada = fecha.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Estadísticas
    const stats = escenario.estadisticas || {
        totalBloqueos: 0,
        totalInundaciones: 0,
        totalObstaculos: 0
    };

    const totalElementos = stats.totalBloqueos + stats.totalInundaciones + stats.totalObstaculos;

    div.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-start">
            <div class="flex-grow-1">
                <h6 class="mb-1">${escenario.nombre}</h6>
                ${escenario.descripcion ? `<p class="mb-1 small text-muted">${escenario.descripcion}</p>` : ''}
                <small class="text-muted">
                    📅 ${fechaFormateada} |
                    📊 ${totalElementos} elementos
                </small>
                <div class="mt-2 small">
                    ${stats.totalBloqueos > 0 ? `<span class="badge bg-danger me-1">🚧 ${stats.totalBloqueos} bloqueos</span>` : ''}
                    ${stats.totalInundaciones > 0 ? `<span class="badge bg-info me-1">🌊 ${stats.totalInundaciones} inundaciones</span>` : ''}
                    ${stats.totalObstaculos > 0 ? `<span class="badge bg-warning me-1">⚠️ ${stats.totalObstaculos} obstáculos</span>` : ''}
                </div>
            </div>
            <div class="btn-group-vertical ms-2" role="group">
                <button class="btn btn-sm btn-primary" onclick="cargarEscenarioUI('${escenario.id}')">
                    📂 Cargar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarEscenarioUI('${escenario.id}', '${escenario.nombre}')">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `;

    return div;
}

/**
 * Carga un escenario desde un objeto JSON
 */
function cargarEscenarioUI(escenarioObj) {
    const resultado = window.cargarEscenarioDesdeJSON(escenarioObj);

    if (resultado.exito) {
        // Cerrar modal
        if (modalCargarEscenario) {
            modalCargarEscenario.hide();
        }

        // Actualizar info del escenario actual
        actualizarInfoEscenarioActual(resultado.escenario);

        // Mostrar notificación de éxito
        mostrarNotificacion('success', 'Escenario Cargado', resultado.mensaje);
    } else {
        // Mostrar notificación de error
        mostrarNotificacion('error', 'Error al Cargar', resultado.mensaje);
    }
}


/**
 * Actualiza la información del escenario actualmente cargado
 */
function actualizarInfoEscenarioActual(escenario) {
    if (escenarioActualInfo && escenarioActualNombre && escenarioActualFecha) {
        escenarioActualNombre.textContent = escenario.nombre;

        const fecha = new Date(escenario.fechaCreacion);
        escenarioActualFecha.textContent = fecha.toLocaleString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        escenarioActualInfo.style.display = 'block';
    }
}

/**
 * Limpia la información del escenario actualmente cargado
 */
function limpiarInfoEscenarioActual() {
    if (escenarioActualInfo) {
        escenarioActualInfo.style.display = 'none';
    }

    window.escenarioActualCargado = null;
}

/**
 * Carga un escenario desde un archivo JSON subido
 */
function cargarDesdeArchivoJSON(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    // Verificar que sea un archivo JSON
    if (!file.name.endsWith('.json')) {
        mostrarNotificacion('error', 'Archivo Inválido', 'Por favor selecciona un archivo JSON válido.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            // Parsear JSON
            const escenario = JSON.parse(e.target.result);

            // Validar estructura básica
            if (!escenario.version || !escenario.nombre || !escenario.celdasBloqueadas) {
                throw new Error('El archivo JSON no tiene el formato correcto de un escenario.');
            }

            // Cargar el escenario directamente (sin localStorage)
            const resultado = window.cargarEscenarioDesdeJSON(escenario);

            if (resultado.exito) {
                // Cerrar modal
                if (modalCargarEscenario) {
                    modalCargarEscenario.hide();
                }

                // Actualizar info del escenario actual
                actualizarInfoEscenarioActual(escenario);

                // Mostrar notificación de éxito
                mostrarNotificacion('success', 'Escenario Cargado desde Archivo',
                    `El escenario "${escenario.nombre}" se ha cargado exitosamente desde el archivo JSON.\n${resultado.mensaje}`);
            } else {
                mostrarNotificacion('error', 'Error al Cargar', resultado.mensaje);
            }

            // Limpiar input para permitir cargar el mismo archivo nuevamente
            event.target.value = '';

        } catch (error) {
            console.error('❌ Error al parsear JSON:', error);
            mostrarNotificacion('error', 'Error al Cargar Archivo',
                `No se pudo leer el archivo JSON:\n${error.message}`);

            event.target.value = ''; // Limpiar input
        }
    };

    reader.onerror = function() {
        mostrarNotificacion('error', 'Error de Lectura', 'No se pudo leer el archivo.');
        event.target.value = ''; // Limpiar input
    };

    // Leer el archivo como texto
    reader.readAsText(file);
}

// Exponer funciones globalmente
window.inicializarGestionEscenarios = inicializarGestionEscenarios;
window.cargarEscenarioUI = cargarEscenarioUI;
window.cargarDesdeArchivoJSON = cargarDesdeArchivoJSON;

console.log('✅ gestionEscenarios.js cargado');
