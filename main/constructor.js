// ==================== CONSTRUCTOR DE SIMULACIONES ====================
// Sistema para crear, editar, guardar y cargar simulaciones personalizadas

// Variables globales del constructor
let modoConstructor = false;
let simulacionActual = {
    nombre: "Nueva Simulación",
    calles: [],
    conexiones: [],
    edificios: []
};

// ==================== INICIALIZACIÓN ====================

function inicializarConstructor() {
    console.log("🏗️ Constructor de simulaciones inicializado");

    // Poblar selector de edificios si existen
    if (window.edificios) {
        const selectEdificio = document.getElementById('selectEdificio');
        if (selectEdificio) {
            window.edificios.forEach((edificio, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = edificio.label || `Edificio ${index + 1}`;
                selectEdificio.appendChild(option);
            });
        }
    }

    configurarEventosConstructor();
}

// ==================== CONFIGURACIÓN DE EVENTOS ====================

function configurarEventosConstructor() {
    // Botón Agregar Calle
    const btnAgregarCalle = document.getElementById('btnAgregarCalle');
    if (btnAgregarCalle) {
        btnAgregarCalle.addEventListener('click', mostrarDialogoNuevaCalle);
    }

    // Botón Agregar Conexión
    const btnAgregarConexion = document.getElementById('btnAgregarConexion');
    if (btnAgregarConexion) {
        btnAgregarConexion.addEventListener('click', mostrarDialogoNuevaConexion);
    }

    // Botón Guardar Simulación
    const btnGuardarSimulacion = document.getElementById('btnGuardarSimulacion');
    if (btnGuardarSimulacion) {
        btnGuardarSimulacion.addEventListener('click', guardarSimulacion);
    }

    // Botón Cargar Simulación
    const btnCargarSimulacion = document.getElementById('btnCargarSimulacion');
    if (btnCargarSimulacion) {
        btnCargarSimulacion.addEventListener('click', () => {
            document.getElementById('inputCargarSimulacion').click();
        });
    }

    // Input file para cargar
    const inputCargarSimulacion = document.getElementById('inputCargarSimulacion');
    if (inputCargarSimulacion) {
        inputCargarSimulacion.addEventListener('change', cargarSimulacion);
    }

    // Botón Nueva Simulación
    const btnNuevaSimulacion = document.getElementById('btnNuevaSimulacion');
    if (btnNuevaSimulacion) {
        btnNuevaSimulacion.addEventListener('click', nuevaSimulacion);
    }

    // Botón Eliminar Calle
    const btnEliminarCalle = document.getElementById('btnEliminarCalle');
    if (btnEliminarCalle) {
        btnEliminarCalle.addEventListener('click', eliminarCalleSeleccionada);
    }
}

// ==================== DIÁLOGO NUEVA CALLE ====================

function mostrarDialogoNuevaCalle() {
    const nombre = prompt("Nombre de la calle:", "Nueva Calle");
    if (!nombre) return;

    const tamano = parseInt(prompt("Tamaño (número de celdas):", "100"));
    if (isNaN(tamano) || tamano <= 0) {
        alert("Tamaño inválido");
        return;
    }

    const tipo = prompt("Tipo (GENERADOR, CONEXION, DEVORADOR):", "CONEXION").toUpperCase();
    if (!["GENERADOR", "CONEXION", "DEVORADOR"].includes(tipo)) {
        alert("Tipo inválido");
        return;
    }

    const x = parseFloat(prompt("Posición X:", "500"));
    const y = parseFloat(prompt("Posición Y:", "500"));
    const angulo = parseFloat(prompt("Ángulo (grados):", "0"));
    const carriles = parseInt(prompt("Número de carriles:", "3"));
    const probGen = parseFloat(prompt("Probabilidad de generación (0-1):", "0.5"));
    const probSalto = parseFloat(prompt("Probabilidad de cambio de carril (0-1):", "0.02"));

    if (isNaN(x) || isNaN(y) || isNaN(angulo) || isNaN(carriles) || isNaN(probGen) || isNaN(probSalto)) {
        alert("Valores inválidos");
        return;
    }

    agregarCalle(nombre, tamano, tipo, x, y, angulo, probGen, carriles, probSalto);
}

// ==================== AGREGAR CALLE ====================

function agregarCalle(nombre, tamano, tipo, x, y, angulo, probabilidadGeneracion, carriles, probabilidadSaltoDeCarril) {
    // Mapear tipo string a constante
    const TIPOS = {
        GENERADOR: "generador",
        CONEXION: "conexion",
        DEVORADOR: "devorador"
    };

    const tipoMapeado = TIPOS[tipo] || TIPOS.CONEXION;

    // Crear calle usando la función existente
    if (typeof window.crearCalle === 'function') {
        const calle = window.crearCalle(
            nombre,
            tamano,
            { nombre: tipoMapeado },
            x,
            y,
            angulo,
            probabilidadGeneracion,
            carriles,
            probabilidadSaltoDeCarril
        );

        // Agregar a simulación actual
        simulacionActual.calles.push({
            nombre,
            tamano,
            tipo,
            x,
            y,
            angulo,
            probabilidadGeneracion,
            carriles,
            probabilidadSaltoDeCarril
        });

        // Actualizar selector
        actualizarSelectorCalles();

        // Renderizar
        if (window.renderizarCanvas) {
            window.renderizarCanvas();
        }

        console.log(`✅ Calle "${nombre}" agregada a la simulación`);
        alert(`Calle "${nombre}" agregada exitosamente`);
    } else {
        console.error("❌ Función crearCalle no disponible");
        alert("Error: No se puede crear la calle");
    }
}

// ==================== DIÁLOGO NUEVA CONEXIÓN ====================

function mostrarDialogoNuevaConexion() {
    if (!window.calles || window.calles.length < 2) {
        alert("Necesitas al menos 2 calles para crear una conexión");
        return;
    }

    // Mostrar lista de calles
    let listaCalles = "Calles disponibles:\n";
    window.calles.forEach((calle, index) => {
        listaCalles += `${index}: ${calle.nombre}\n`;
    });

    const origenIdx = parseInt(prompt(listaCalles + "\nÍndice de calle origen:", "0"));
    if (isNaN(origenIdx) || origenIdx < 0 || origenIdx >= window.calles.length) {
        alert("Índice de origen inválido");
        return;
    }

    const destinoIdx = parseInt(prompt("Índice de calle destino:", "1"));
    if (isNaN(destinoIdx) || destinoIdx < 0 || destinoIdx >= window.calles.length) {
        alert("Índice de destino inválido");
        return;
    }

    const tipo = prompt("Tipo de conexión (LINEAL, INCORPORACION, PROBABILISTICA):", "LINEAL").toUpperCase();
    if (!["LINEAL", "INCORPORACION", "PROBABILISTICA"].includes(tipo)) {
        alert("Tipo de conexión inválido");
        return;
    }

    const origen = window.calles[origenIdx];
    const destino = window.calles[destinoIdx];

    let conexionesCreadas = [];

    if (tipo === "LINEAL") {
        conexionesCreadas = crearConexionLinealSimple(origen, destino);
    } else if (tipo === "INCORPORACION") {
        const carrilDestino = parseInt(prompt("Carril destino (0-" + (destino.carriles - 1) + "):", "0"));
        const posInicial = parseInt(prompt("Posición inicial en destino:", "0"));

        if (isNaN(carrilDestino) || isNaN(posInicial)) {
            alert("Valores inválidos");
            return;
        }

        conexionesCreadas = crearConexionIncorporacionSimple(origen, destino, carrilDestino, posInicial);
    } else if (tipo === "PROBABILISTICA") {
        const carrilOrigen = parseInt(prompt("Carril origen (0-" + (origen.carriles - 1) + "):", "0"));
        const carrilDestino = parseInt(prompt("Carril destino (0-" + (destino.carriles - 1) + "):", "0"));
        const probabilidad = parseFloat(prompt("Probabilidad (0-1):", "0.5"));

        if (isNaN(carrilOrigen) || isNaN(carrilDestino) || isNaN(probabilidad)) {
            alert("Valores inválidos");
            return;
        }

        conexionesCreadas = crearConexionProbabilisticaSimple(origen, carrilOrigen, destino, carrilDestino, probabilidad);
    }

    if (conexionesCreadas && conexionesCreadas.length > 0) {
        // Guardar en simulación actual
        simulacionActual.conexiones.push({
            origenIdx,
            destinoIdx,
            tipo,
            detalles: conexionesCreadas.map(c => ({
                carrilOrigen: c.carrilOrigen,
                carrilDestino: c.carrilDestino,
                probabilidad: c.probabilidadTransferencia
            }))
        });

        console.log(`✅ Conexión ${tipo} creada entre "${origen.nombre}" y "${destino.nombre}"`);
        alert(`Conexión ${tipo} creada exitosamente`);

        if (window.renderizarCanvas) {
            window.renderizarCanvas();
        }
    }
}

// ==================== FUNCIONES AUXILIARES DE CONEXIÓN ====================

function crearConexionLinealSimple(origen, destino) {
    if (typeof window.crearConexionLineal === 'function') {
        const conexiones = window.crearConexionLineal(origen, destino);

        if (typeof window.registrarConexiones === 'function') {
            window.registrarConexiones(conexiones);
        }

        if (window.conexiones) {
            window.conexiones.push(...conexiones);
        }

        return conexiones;
    }
    return [];
}

function crearConexionIncorporacionSimple(origen, destino, carrilDestino, posInicial) {
    if (typeof window.crearConexionIncorporacion === 'function') {
        const conexiones = window.crearConexionIncorporacion(origen, destino, carrilDestino, posInicial);

        if (typeof window.registrarConexiones === 'function') {
            window.registrarConexiones(conexiones);
        }

        if (window.conexiones) {
            window.conexiones.push(...conexiones);
        }

        return conexiones;
    }
    return [];
}

function crearConexionProbabilisticaSimple(origen, carrilOrigen, destino, carrilDestino, probabilidad) {
    if (typeof window.crearConexionProbabilistica === 'function') {
        const distribucion = [{
            carrilDestino: carrilDestino,
            posOrigen: -1,
            posDestino: 0,
            probabilidad: probabilidad
        }];

        const conexiones = window.crearConexionProbabilistica(origen, carrilOrigen, destino, distribucion);

        if (typeof window.registrarConexiones === 'function') {
            window.registrarConexiones(conexiones);
        }

        if (window.conexiones) {
            window.conexiones.push(...conexiones);
        }

        return conexiones;
    }
    return [];
}

// ==================== ACTUALIZAR SELECTOR DE CALLES ====================

function actualizarSelectorCalles() {
    const selectCalle = document.getElementById('selectCalle');
    if (!selectCalle || !window.calles) return;

    // Limpiar opciones existentes (excepto la primera)
    while (selectCalle.options.length > 1) {
        selectCalle.remove(1);
    }

    // Agregar todas las calles
    window.calles.forEach((calle, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = calle.nombre;
        selectCalle.appendChild(option);
    });
}

// ==================== ELIMINAR CALLE ====================

function eliminarCalleSeleccionada() {
    if (!window.calleSeleccionada) {
        alert("No hay ninguna calle seleccionada");
        return;
    }

    const confirmacion = confirm(`¿Eliminar la calle "${window.calleSeleccionada.nombre}"?`);
    if (!confirmacion) return;

    const index = window.calles.findIndex(c => c.nombre === window.calleSeleccionada.nombre);
    if (index !== -1) {
        // Eliminar calle
        window.calles.splice(index, 1);

        // Eliminar de simulación actual
        simulacionActual.calles = simulacionActual.calles.filter(c => c.nombre !== window.calleSeleccionada.nombre);

        // Limpiar selección
        window.calleSeleccionada = null;

        // Actualizar selector
        actualizarSelectorCalles();

        // Reinicializar intersecciones
        if (window.inicializarIntersecciones) {
            window.inicializarIntersecciones();
        }

        // Renderizar
        if (window.renderizarCanvas) {
            window.renderizarCanvas();
        }

        console.log(`🗑️ Calle eliminada`);
        alert("Calle eliminada exitosamente");
    }
}

// ==================== GUARDAR SIMULACIÓN ====================

function guardarSimulacion() {
    // Obtener nombre de la simulación
    const nombreSimulacion = prompt("Nombre de la simulación:", simulacionActual.nombre || "Nueva Simulación");
    if (!nombreSimulacion) return;

    simulacionActual.nombre = nombreSimulacion;

    // Recopilar datos actuales
    const datosSimulacion = {
        version: "1.0",
        nombre: nombreSimulacion,
        fecha: new Date().toISOString(),
        calles: window.calles ? window.calles.map(calle => ({
            nombre: calle.nombre,
            tamano: calle.tamano,
            tipo: calle.tipo.nombre || calle.tipo,
            x: calle.x,
            y: calle.y,
            angulo: calle.angulo,
            probabilidadGeneracion: calle.probabilidadGeneracion,
            carriles: calle.carriles,
            probabilidadSaltoDeCarril: calle.probabilidadSaltoDeCarril,
            // Guardar vértices si existen
            vertices: calle.vertices || [],
            esCurva: calle.esCurva || false
        })) : [],
        conexiones: simulacionActual.conexiones,
        edificios: window.edificios || []
    };

    // Convertir a JSON
    const jsonString = JSON.stringify(datosSimulacion, null, 2);

    // Crear blob y descargar
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombreSimulacion.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`💾 Simulación "${nombreSimulacion}" guardada`);
    alert(`Simulación "${nombreSimulacion}" guardada exitosamente como JSON`);
}

// ==================== CARGAR SIMULACIÓN ====================

function cargarSimulacion(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const datosSimulacion = JSON.parse(e.target.result);

            // Validar estructura
            if (!datosSimulacion.calles || !Array.isArray(datosSimulacion.calles)) {
                throw new Error("Formato de archivo inválido");
            }

            // Confirmar carga
            const confirmacion = confirm(`¿Cargar simulación "${datosSimulacion.nombre}"?\nEsto eliminará la simulación actual.`);
            if (!confirmacion) return;

            // Limpiar simulación actual
            limpiarSimulacionActual();

            // Cargar calles
            datosSimulacion.calles.forEach(calleData => {
                agregarCalle(
                    calleData.nombre,
                    calleData.tamano,
                    calleData.tipo.toUpperCase(),
                    calleData.x,
                    calleData.y,
                    calleData.angulo,
                    calleData.probabilidadGeneracion,
                    calleData.carriles,
                    calleData.probabilidadSaltoDeCarril
                );

                // Restaurar vértices si existen
                if (calleData.vertices && calleData.vertices.length > 0) {
                    const calleCreada = window.calles[window.calles.length - 1];
                    if (calleCreada) {
                        calleCreada.vertices = calleData.vertices;
                        calleCreada.esCurva = calleData.esCurva || false;
                    }
                }
            });

            // Cargar edificios si existen
            if (datosSimulacion.edificios && Array.isArray(datosSimulacion.edificios)) {
                window.edificios = datosSimulacion.edificios;
            }

            // Cargar conexiones (en segundo paso para asegurar que las calles existan)
            if (datosSimulacion.conexiones && Array.isArray(datosSimulacion.conexiones)) {
                setTimeout(() => {
                    datosSimulacion.conexiones.forEach(conexionData => {
                        const origen = window.calles[conexionData.origenIdx];
                        const destino = window.calles[conexionData.destinoIdx];

                        if (!origen || !destino) {
                            console.warn(`⚠️ Conexión omitida: calles no encontradas`);
                            return;
                        }

                        if (conexionData.tipo === "LINEAL") {
                            crearConexionLinealSimple(origen, destino);
                        } else if (conexionData.tipo === "INCORPORACION" && conexionData.detalles && conexionData.detalles[0]) {
                            const detalle = conexionData.detalles[0];
                            crearConexionIncorporacionSimple(origen, destino, detalle.carrilDestino, 0);
                        } else if (conexionData.tipo === "PROBABILISTICA" && conexionData.detalles && conexionData.detalles[0]) {
                            const detalle = conexionData.detalles[0];
                            crearConexionProbabilisticaSimple(
                                origen,
                                detalle.carrilOrigen,
                                destino,
                                detalle.carrilDestino,
                                detalle.probabilidad
                            );
                        }
                    });

                    // Inicializar intersecciones
                    if (window.inicializarIntersecciones) {
                        window.inicializarIntersecciones();
                    }

                    if (window.construirMapaIntersecciones) {
                        window.construirMapaIntersecciones();
                    }

                    // Renderizar
                    if (window.renderizarCanvas) {
                        window.renderizarCanvas();
                    }

                    console.log(`✅ Simulación "${datosSimulacion.nombre}" cargada completamente`);
                }, 100);
            }

            simulacionActual = datosSimulacion;

            alert(`Simulación "${datosSimulacion.nombre}" cargada exitosamente`);

        } catch (error) {
            console.error("❌ Error al cargar simulación:", error);
            alert(`Error al cargar simulación: ${error.message}`);
        }
    };

    reader.readAsText(file);

    // Resetear input
    event.target.value = '';
}

// ==================== NUEVA SIMULACIÓN ====================

function nuevaSimulacion() {
    const confirmacion = confirm("¿Crear una nueva simulación?\nEsto eliminará la simulación actual.");
    if (!confirmacion) return;

    limpiarSimulacionActual();

    simulacionActual = {
        nombre: "Nueva Simulación",
        calles: [],
        conexiones: [],
        edificios: []
    };

    alert("Nueva simulación creada");
}

// ==================== LIMPIAR SIMULACIÓN ====================

function limpiarSimulacionActual() {
    // Limpiar calles
    if (window.calles) {
        window.calles.length = 0;
    }

    // Limpiar conexiones
    if (window.conexiones) {
        window.conexiones.length = 0;
    }

    // Limpiar intersecciones
    if (window.intersecciones) {
        window.intersecciones.length = 0;
    }

    // Limpiar selección
    window.calleSeleccionada = null;

    // Actualizar selector
    actualizarSelectorCalles();

    // Renderizar
    if (window.renderizarCanvas) {
        window.renderizarCanvas();
    }

    console.log("🧹 Simulación limpiada");
}

// ==================== EXPONER FUNCIONES GLOBALMENTE ====================

window.inicializarConstructor = inicializarConstructor;
window.agregarCalle = agregarCalle;
window.guardarSimulacion = guardarSimulacion;
window.cargarSimulacion = cargarSimulacion;
window.nuevaSimulacion = nuevaSimulacion;
window.simulacionActual = simulacionActual;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarConstructor);
} else {
    // Si ya se cargó, inicializar directamente
    setTimeout(inicializarConstructor, 500);
}

console.log("🏗️ Constructor.js cargado");
