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

    // Botón Agregar Edificio
    const btnAgregarEdificio = document.getElementById('btnAgregarEdificio');
    if (btnAgregarEdificio) {
        btnAgregarEdificio.addEventListener('click', mostrarDialogoNuevoEdificio);
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

    // Botón Eliminar Objeto (calle o edificio)
    const btnEliminarObjeto = document.getElementById('btnEliminarObjeto');
    if (btnEliminarObjeto) {
        btnEliminarObjeto.addEventListener('click', eliminarObjetoSeleccionado);
    }

    // Botón Mostrar Lista de Conexiones
    const btnMostrarListaConexiones = document.getElementById('btnMostrarListaConexiones');
    if (btnMostrarListaConexiones) {
        btnMostrarListaConexiones.addEventListener('click', toggleListaConexiones);
    }

}

// ==================== DIÁLOGO NUEVA CALLE ====================

function mostrarDialogoNuevaCalle() {
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalNuevaCalle'));
    modal.show();

    // Configurar evento del botón confirmar (solo una vez)
    const btnConfirmar = document.getElementById('btnConfirmarNuevaCalle');
    const nuevoHandler = function() {
        const nombre = document.getElementById('inputNombreCalle').value;
        const tamano = parseInt(document.getElementById('inputTamanoCalle').value);
        const tipo = document.getElementById('selectTipoCalle').value;
        const carriles = parseInt(document.getElementById('inputCarrilesCalle').value);
        const x = parseFloat(document.getElementById('inputXCalle').value);
        const y = parseFloat(document.getElementById('inputYCalle').value);
        const angulo = parseFloat(document.getElementById('inputAnguloCalle').value);
        const probGen = parseFloat(document.getElementById('inputProbGenCalle').value);
        const probSalto = parseFloat(document.getElementById('inputProbSaltoCalle').value);

        // Validaciones
        if (!nombre || nombre.trim() === '') {
            alert("❌ El nombre es obligatorio");
            return;
        }

        if (isNaN(tamano) || tamano <= 0) {
            alert("❌ Tamaño inválido");
            return;
        }

        if (isNaN(x) || isNaN(y) || isNaN(angulo) || isNaN(carriles) || isNaN(probGen) || isNaN(probSalto)) {
            alert("❌ Valores inválidos. Verifica todos los campos numéricos.");
            return;
        }

        if (probGen < 0 || probGen > 1 || probSalto < 0 || probSalto > 1) {
            alert("❌ Las probabilidades deben estar entre 0 y 1");
            return;
        }

        // Agregar calle
        agregarCalle(nombre, tamano, tipo, x, y, angulo, probGen, carriles, probSalto);

        // Cerrar modal
        modal.hide();

        // Limpiar formulario
        document.getElementById('inputNombreCalle').value = '';

        // Remover listener
        btnConfirmar.removeEventListener('click', nuevoHandler);
    };

    btnConfirmar.removeEventListener('click', nuevoHandler);
    btnConfirmar.addEventListener('click', nuevoHandler);
}

// ==================== AGREGAR CALLE ====================

function agregarCalle(nombre, tamano, tipo, x, y, angulo, probabilidadGeneracion, carriles, probabilidadSaltoDeCarril, silencioso = false) {
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

        // Solo mostrar alerta si no es silencioso (para evitar alertas múltiples al cargar archivo)
        if (!silencioso) {
            alert(`Calle "${nombre}" agregada exitosamente`);
        }

        return true;
    } else {
        console.error("❌ Función crearCalle no disponible");
        if (!silencioso) {
            alert("Error: No se puede crear la calle");
        }
        return false;
    }
}

// ==================== DIÁLOGO NUEVA CONEXIÓN ====================

function mostrarDialogoNuevaConexion() {
    if (!window.calles || window.calles.length < 2) {
        alert("❌ Necesitas al menos 2 calles para crear una conexión");
        return;
    }

    // Poblar selectores de calles
    const selectOrigen = document.getElementById('selectCalleOrigen');
    const selectDestino = document.getElementById('selectCalleDestino');

    selectOrigen.innerHTML = '<option value="">Selecciona calle origen...</option>';
    selectDestino.innerHTML = '<option value="">Selecciona calle destino...</option>';

    window.calles.forEach((calle, index) => {
        const optionOrigen = document.createElement('option');
        optionOrigen.value = index;
        optionOrigen.textContent = `${index}: ${calle.nombre}`;
        selectOrigen.appendChild(optionOrigen);

        const optionDestino = document.createElement('option');
        optionDestino.value = index;
        optionDestino.textContent = `${index}: ${calle.nombre}`;
        selectDestino.appendChild(optionDestino);
    });

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalNuevaConexion'));
    modal.show();

    // Configurar cambio de tipo de conexión para mostrar/ocultar campos
    const selectTipoConexion = document.getElementById('selectTipoConexion');
    const camposIncorporacion = document.getElementById('camposIncorporacion');
    const camposProbabilistica = document.getElementById('camposProbabilistica');

    selectTipoConexion.addEventListener('change', function() {
        const tipo = this.value;
        camposIncorporacion.style.display = tipo === 'INCORPORACION' ? 'block' : 'none';
        camposProbabilistica.style.display = tipo === 'PROBABILISTICA' ? 'block' : 'none';
    });

    // Configurar evento del botón confirmar
    const btnConfirmar = document.getElementById('btnConfirmarNuevaConexion');
    const nuevoHandler = function() {
        const origenIdx = parseInt(selectOrigen.value);
        const destinoIdx = parseInt(selectDestino.value);
        const tipo = selectTipoConexion.value;

        // Validaciones básicas
        if (isNaN(origenIdx) || origenIdx < 0 || origenIdx >= window.calles.length) {
            alert("❌ Selecciona una calle de origen válida");
            return;
        }

        if (isNaN(destinoIdx) || destinoIdx < 0 || destinoIdx >= window.calles.length) {
            alert("❌ Selecciona una calle de destino válida");
            return;
        }

        if (origenIdx === destinoIdx) {
            alert("❌ La calle de origen y destino no pueden ser la misma");
            return;
        }

        const origen = window.calles[origenIdx];
        const destino = window.calles[destinoIdx];
        let conexionesCreadas = [];

        if (tipo === "LINEAL") {
            conexionesCreadas = crearConexionLinealSimple(origen, destino);
        } else if (tipo === "INCORPORACION") {
            const carrilDestino = parseInt(document.getElementById('inputCarrilDestino').value);
            const posInicial = parseInt(document.getElementById('inputPosInicial').value);

            if (isNaN(carrilDestino) || isNaN(posInicial)) {
                alert("❌ Valores inválidos para incorporación");
                return;
            }

            if (carrilDestino < 0 || carrilDestino >= destino.carriles) {
                alert(`❌ El carril destino debe estar entre 0 y ${destino.carriles - 1}`);
                return;
            }

            conexionesCreadas = crearConexionIncorporacionSimple(origen, destino, carrilDestino, posInicial);
        } else if (tipo === "PROBABILISTICA") {
            const carrilOrigen = parseInt(document.getElementById('inputCarrilOrigen').value);
            const carrilDestino = parseInt(document.getElementById('inputCarrilDestinoProb').value);
            const probabilidad = parseFloat(document.getElementById('inputProbabilidad').value);

            if (isNaN(carrilOrigen) || isNaN(carrilDestino) || isNaN(probabilidad)) {
                alert("❌ Valores inválidos para conexión probabilística");
                return;
            }

            if (carrilOrigen < 0 || carrilOrigen >= origen.carriles) {
                alert(`❌ El carril origen debe estar entre 0 y ${origen.carriles - 1}`);
                return;
            }

            if (carrilDestino < 0 || carrilDestino >= destino.carriles) {
                alert(`❌ El carril destino debe estar entre 0 y ${destino.carriles - 1}`);
                return;
            }

            if (probabilidad < 0 || probabilidad > 1) {
                alert("❌ La probabilidad debe estar entre 0 y 1");
                return;
            }

            conexionesCreadas = crearConexionProbabilisticaSimple(origen, carrilOrigen, destino, carrilDestino, probabilidad);
        }

        if (conexionesCreadas && conexionesCreadas.length > 0) {
            // Guardar en simulación actual con todos los detalles necesarios
            simulacionActual.conexiones.push({
                origenIdx,
                destinoIdx,
                tipo,
                detalles: conexionesCreadas.map(c => ({
                    carrilOrigen: c.carrilOrigen,
                    carrilDestino: c.carrilDestino,
                    posOrigen: c.posOrigen,
                    posDestino: c.posDestino,
                    probabilidad: c.probabilidadTransferencia
                }))
            });

            // IMPORTANTE: Reinicializar intersecciones para que la simulación reconozca las nuevas conexiones
            if (window.inicializarIntersecciones) {
                window.inicializarIntersecciones();
                console.log('🔄 Intersecciones reinicializadas');
            }

            if (window.construirMapaIntersecciones) {
                window.construirMapaIntersecciones();
                console.log('🗺️ Mapa de intersecciones reconstruido');
            }

            // Renderizar canvas
            if (window.renderizarCanvas) {
                window.renderizarCanvas();
            }

            console.log(`✅ Conexión ${tipo} creada entre "${origen.nombre}" y "${destino.nombre}"`);
            console.log('📊 Detalles de conexión:', conexionesCreadas);

            // Actualizar lista de conexiones si está visible
            const listaContainer = document.getElementById('listaConexionesContainer');
            if (listaContainer && listaContainer.style.display !== 'none') {
                actualizarListaConexiones();
            }

            alert(`✅ Conexión ${tipo} creada exitosamente\n\nLa simulación está lista para usar la nueva conexión.`);

            // Cerrar modal
            modal.hide();

            // Resetear formulario
            selectOrigen.value = '';
            selectDestino.value = '';
            selectTipoConexion.value = 'LINEAL';
            camposIncorporacion.style.display = 'none';
            camposProbabilistica.style.display = 'none';

            // Remover listener
            btnConfirmar.removeEventListener('click', nuevoHandler);
        }
    };

    btnConfirmar.removeEventListener('click', nuevoHandler);
    btnConfirmar.addEventListener('click', nuevoHandler);
}

// ==================== FUNCIONES AUXILIARES DE CONEXIÓN ====================

function crearConexionLinealSimple(origen, destino, noPush = false) {
    if (typeof window.crearConexionLineal === 'function') {
        const conexiones = window.crearConexionLineal(origen, destino);

        if (typeof window.registrarConexiones === 'function') {
            window.registrarConexiones(conexiones);
        }

        // Solo agregar a window.conexiones si no se especifica noPush
        if (!noPush && window.conexiones) {
            window.conexiones.push(...conexiones);
        }

        return conexiones;
    }
    return [];
}

function crearConexionIncorporacionSimple(origen, destino, carrilDestino, posInicial, noPush = false) {
    if (typeof window.crearConexionIncorporacion === 'function') {
        const conexiones = window.crearConexionIncorporacion(origen, destino, carrilDestino, posInicial);

        if (typeof window.registrarConexiones === 'function') {
            window.registrarConexiones(conexiones);
        }

        // Solo agregar a window.conexiones si no se especifica noPush
        if (!noPush && window.conexiones) {
            window.conexiones.push(...conexiones);
        }

        return conexiones;
    }
    return [];
}

function crearConexionProbabilisticaSimple(origen, carrilOrigen, destino, carrilDestino, probabilidad, noPush = false) {
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

        // Solo agregar a window.conexiones si no se especifica noPush
        if (!noPush && window.conexiones) {
            window.conexiones.push(...conexiones);
        }

        return conexiones;
    }
    return [];
}

// ==================== DIÁLOGO NUEVO EDIFICIO ====================

function mostrarDialogoNuevoEdificio() {
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalNuevoEdificio'));
    modal.show();

    // Configurar evento del botón confirmar
    const btnConfirmar = document.getElementById('btnConfirmarNuevoEdificio');
    const nuevoHandler = function() {
        const label = document.getElementById('inputNombreEdificio').value;
        const x = parseFloat(document.getElementById('inputXEdificio').value);
        const y = parseFloat(document.getElementById('inputYEdificio').value);
        const width = parseFloat(document.getElementById('inputWidthEdificio').value);
        const height = parseFloat(document.getElementById('inputHeightEdificio').value);
        const angle = parseFloat(document.getElementById('inputAnguloEdificio').value);

        // Validaciones
        if (!label || label.trim() === '') {
            alert("❌ El nombre es obligatorio");
            return;
        }

        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) || isNaN(angle)) {
            alert("❌ Valores inválidos. Verifica todos los campos numéricos.");
            return;
        }

        if (width <= 0 || height <= 0) {
            alert("❌ El ancho y alto deben ser mayores a 0");
            return;
        }

        // Agregar edificio
        agregarEdificio(label, x, y, width, height, angle);

        // Cerrar modal
        modal.hide();

        // Limpiar formulario
        document.getElementById('inputNombreEdificio').value = '';

        // Remover listener
        btnConfirmar.removeEventListener('click', nuevoHandler);
    };

    btnConfirmar.removeEventListener('click', nuevoHandler);
    btnConfirmar.addEventListener('click', nuevoHandler);
}

// ==================== AGREGAR EDIFICIO ====================

function agregarEdificio(label, x, y, width, height, angle) {
    // Inicializar array de edificios si no existe
    if (!window.edificios) {
        window.edificios = [];
    }

    // Crear edificio
    const edificio = {
        label: label,
        x: x,
        y: y,
        width: width,
        height: height,
        angle: angle || 0,
        color: '#8B4513' // Color café por defecto
    };

    // Agregar a la lista global
    window.edificios.push(edificio);

    // Agregar a simulación actual
    simulacionActual.edificios.push(edificio);

    // Actualizar selectores
    actualizarSelectorEdificios();

    // Renderizar
    if (window.renderizarCanvas) {
        window.renderizarCanvas();
    }

    console.log(`✅ Edificio "${label}" agregado a la simulación`);
    alert(`Edificio "${label}" agregado exitosamente`);
}

// ==================== ACTUALIZAR SELECTORES ====================

function actualizarSelectorCalles() {
    const selectCalle = document.getElementById('selectCalle');
    const selectCalleEditor = document.getElementById('selectCalleEditor');

    // Actualizar selector en Configuración de Calles
    if (selectCalle && window.calles) {
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

    // Actualizar selector en Constructor de Mapas
    if (selectCalleEditor && window.calles) {
        // Limpiar opciones existentes (excepto la primera)
        while (selectCalleEditor.options.length > 1) {
            selectCalleEditor.remove(1);
        }

        // Agregar todas las calles
        window.calles.forEach((calle, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = calle.nombre;
            selectCalleEditor.appendChild(option);
        });
    }
}

function actualizarSelectorEdificios() {
    const selectEdificio = document.getElementById('selectEdificio');
    if (!selectEdificio || !window.edificios) return;

    // Limpiar opciones existentes (excepto la primera)
    while (selectEdificio.options.length > 1) {
        selectEdificio.remove(1);
    }

    // Agregar todos los edificios
    window.edificios.forEach((edificio, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = edificio.label || `Edificio ${index + 1}`;
        selectEdificio.appendChild(option);
    });
}

// ==================== ELIMINAR OBJETO SELECCIONADO ====================

function eliminarObjetoSeleccionado() {
    const calle = window.calleSeleccionada;
    const edificio = window.edificioSeleccionado;

    if (!calle && !edificio) {
        alert("No hay ningún objeto seleccionado. Selecciona una calle o edificio primero.");
        return;
    }

    if (calle) {
        const confirmacion = confirm(`¿Eliminar la calle "${calle.nombre}"?`);
        if (!confirmacion) return;

        const index = window.calles.findIndex(c => c.nombre === calle.nombre);
        if (index !== -1) {
            // Eliminar calle
            window.calles.splice(index, 1);

            // Eliminar de simulación actual
            simulacionActual.calles = simulacionActual.calles.filter(c => c.nombre !== calle.nombre);

            // Limpiar selección
            window.calleSeleccionada = null;

            // Actualizar selectores
            actualizarSelectorCalles();

            // Reinicializar intersecciones
            if (window.inicializarIntersecciones) {
                window.inicializarIntersecciones();
            }

            // Renderizar
            if (window.renderizarCanvas) {
                window.renderizarCanvas();
            }

            console.log(`🗑️ Calle "${calle.nombre}" eliminada`);
            alert("Calle eliminada exitosamente");
        }
    } else if (edificio) {
        const confirmacion = confirm(`¿Eliminar el edificio "${edificio.label}"?`);
        if (!confirmacion) return;

        const index = window.edificios.findIndex(e => e === edificio);
        if (index !== -1) {
            // Eliminar edificio
            window.edificios.splice(index, 1);

            // Eliminar de simulación actual
            simulacionActual.edificios = simulacionActual.edificios.filter(e => e.label !== edificio.label);

            // Limpiar selección
            window.edificioSeleccionado = null;

            // Actualizar selector
            actualizarSelectorEdificios();

            // Renderizar
            if (window.renderizarCanvas) {
                window.renderizarCanvas();
            }

            console.log(`🗑️ Edificio "${edificio.label}" eliminado`);
            alert("Edificio eliminado exitosamente");
        }
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
        conexiones: window.conexiones ? window.conexiones.map(c => {
            // Encontrar los índices de las calles origen y destino
            const origenIdx = window.calles.findIndex(calle => calle === c.origen);
            const destinoIdx = window.calles.findIndex(calle => calle === c.destino);

            return {
                origenIdx,
                destinoIdx,
                tipo: c.tipo === 'lineal' ? 'LINEAL' : (c.tipo === 'incorporacion' ? 'INCORPORACION' : 'PROBABILISTICA'),
                detalles: [{
                    carrilOrigen: c.carrilOrigen,
                    carrilDestino: c.carrilDestino,
                    posOrigen: c.posOrigen,
                    posDestino: c.posDestino,
                    probabilidad: c.probabilidadTransferencia
                }]
            };
        }) : [],
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

            // Cargar calles (silenciosamente, sin alertas individuales)
            let callesExitosas = 0;
            let callesFallidas = 0;

            datosSimulacion.calles.forEach(calleData => {
                const exito = agregarCalle(
                    calleData.nombre,
                    calleData.tamano,
                    calleData.tipo.toUpperCase(),
                    calleData.x,
                    calleData.y,
                    calleData.angulo,
                    calleData.probabilidadGeneracion,
                    calleData.carriles,
                    calleData.probabilidadSaltoDeCarril,
                    true  // silencioso = true
                );

                if (exito) {
                    callesExitosas++;
                    // Restaurar vértices si existen
                    if (calleData.vertices && calleData.vertices.length > 0) {
                        const calleCreada = window.calles[window.calles.length - 1];
                        if (calleCreada) {
                            calleCreada.vertices = calleData.vertices;
                            calleCreada.esCurva = calleData.esCurva || false;
                        }
                    }
                } else {
                    callesFallidas++;
                }
            });

            // Cargar edificios si existen
            if (datosSimulacion.edificios && Array.isArray(datosSimulacion.edificios)) {
                window.edificios = datosSimulacion.edificios;
            }

            // Cargar conexiones (en segundo paso para asegurar que las calles existan)
            if (datosSimulacion.conexiones && Array.isArray(datosSimulacion.conexiones)) {
                setTimeout(() => {
                    // Asegurarse de que la clase ConexionCA y los tipos estén disponibles
                    if (!window.ConexionCA || !window.TIPOS_CONEXION) {
                        console.error("❌ ConexionCA o TIPOS_CONEXION no están disponibles");
                        return;
                    }

                    const conexionesCreadas = [];

                    // Crear cada conexión individualmente desde los detalles del JSON
                    datosSimulacion.conexiones.forEach(conexionData => {
                        const origen = window.calles[conexionData.origenIdx];
                        const destino = window.calles[conexionData.destinoIdx];

                        if (!origen || !destino) {
                            console.warn(`⚠️ Conexión omitida: calles no encontradas`);
                            return;
                        }

                        // Verificar que haya detalles
                        if (!conexionData.detalles || conexionData.detalles.length === 0) {
                            console.warn(`⚠️ Conexión omitida: no hay detalles`);
                            return;
                        }

                        // Mapear tipo string a constante
                        let tipoConexion = window.TIPOS_CONEXION.LINEAL;
                        if (conexionData.tipo === "INCORPORACION") {
                            tipoConexion = window.TIPOS_CONEXION.INCORPORACION;
                        } else if (conexionData.tipo === "PROBABILISTICA") {
                            tipoConexion = window.TIPOS_CONEXION.PROBABILISTICA;
                        }

                        // Crear UNA conexión por cada detalle guardado
                        conexionData.detalles.forEach(detalle => {
                            // Crear instancia de ConexionCA directamente con los datos exactos del JSON
                            const nuevaConexion = new window.ConexionCA(
                                origen,
                                destino,
                                detalle.carrilOrigen,
                                detalle.carrilDestino,
                                detalle.posOrigen !== undefined ? detalle.posOrigen : -1,
                                detalle.posDestino !== undefined ? detalle.posDestino : 0,
                                detalle.probabilidad !== undefined ? detalle.probabilidad : 1.0,
                                tipoConexion
                            );

                            // Agregar a la lista temporal
                            conexionesCreadas.push(nuevaConexion);

                            console.log(`📥 Conexión cargada: ${origen.nombre}[C${detalle.carrilOrigen}] → ${destino.nombre}[C${detalle.carrilDestino}] (${conexionData.tipo})`);
                        });
                    });

                    // Registrar todas las conexiones creadas
                    if (typeof window.registrarConexiones === 'function') {
                        window.registrarConexiones(conexionesCreadas);
                    }

                    // Agregar a window.conexiones
                    if (!window.conexiones) {
                        window.conexiones = [];
                    }
                    window.conexiones.push(...conexionesCreadas);

                    console.log(`✅ Total de conexiones cargadas: ${conexionesCreadas.length}`);

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

            // Mostrar resumen de la carga
            let mensaje = `✅ Simulación "${datosSimulacion.nombre}" cargada exitosamente\n\n`;
            mensaje += `📊 Resumen:\n`;
            mensaje += `  • Calles: ${callesExitosas} cargadas`;
            if (callesFallidas > 0) {
                mensaje += ` (${callesFallidas} fallidas)`;
            }
            mensaje += `\n  • Edificios: ${window.edificios ? window.edificios.length : 0} cargados\n`;
            mensaje += `  • Conexiones: ${datosSimulacion.conexiones ? datosSimulacion.conexiones.length : 0} configuradas`;

            alert(mensaje);

            console.log(`✅ Simulación "${datosSimulacion.nombre}" cargada completamente`);

        } catch (error) {
            console.error("❌ Error al cargar simulación:", error);
            alert(`❌ Error al cargar simulación: ${error.message}`);
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

    // Limpiar edificios
    if (window.edificios) {
        window.edificios.length = 0;
    }

    // Limpiar selección
    window.calleSeleccionada = null;
    window.edificioSeleccionado = null;

    // Actualizar selectores
    actualizarSelectorCalles();
    actualizarSelectorEdificios();

    // Renderizar
    if (window.renderizarCanvas) {
        window.renderizarCanvas();
    }

    console.log("🧹 Simulación limpiada (calles, conexiones, intersecciones y edificios)");
}

// ==================== GESTIÓN DE CONEXIONES ====================

let conexionEditandoIndex = -1;
let handlerConfirmarEdicion = null; // Variable global para el handler del botón confirmar
let handlerCambioTipo = null; // Variable global para el handler del select tipo

// Toggle para mostrar/ocultar lista de conexiones
function toggleListaConexiones() {
    const container = document.getElementById('listaConexionesContainer');
    const btn = document.getElementById('btnMostrarListaConexiones');

    if (container.style.display === 'none') {
        actualizarListaConexiones();
        container.style.display = 'block';
        btn.textContent = '🔼 Ocultar Conexiones';
    } else {
        container.style.display = 'none';
        btn.textContent = '📋 Ver Conexiones Existentes';
    }
}

// Actualizar la lista de conexiones en el UI
function actualizarListaConexiones() {
    const listaDiv = document.getElementById('listaConexiones');
    listaDiv.innerHTML = '';

    if (!window.conexiones || window.conexiones.length === 0) {
        listaDiv.innerHTML = '<div class="list-group-item text-muted text-center">No hay conexiones creadas</div>';
        return;
    }

    window.conexiones.forEach((conexion, index) => {
        if (!conexion || !conexion.origen || !conexion.destino) return;

        const origenNombre = conexion.origen.nombre || `Calle ${index}`;
        const destinoNombre = conexion.destino.nombre || `Calle ${index}`;

        let tipoIcono = '🟢';
        let tipoTexto = 'Lineal';
        if (conexion.tipo === 'incorporacion') {
            tipoIcono = '🟠';
            tipoTexto = 'Incorporación';
        } else if (conexion.tipo === 'probabilistica') {
            tipoIcono = '🟣';
            tipoTexto = 'Probabilística';
        }

        const item = document.createElement('div');
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';

        let detallesConexion = `${tipoIcono} <strong>${origenNombre}</strong> [C${conexion.carrilOrigen + 1}] → <strong>${destinoNombre}</strong> [C${conexion.carrilDestino + 1}]`;

        if (conexion.tipo === 'probabilistica') {
            const prob = Math.round(conexion.probabilidadTransferencia * 100);
            detallesConexion += ` <span class="badge bg-secondary">${prob}%</span>`;
        }

        item.innerHTML = `
            <div class="small">${detallesConexion}</div>
            <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-warning btn-sm" onclick="editarConexion(${index})" title="Editar">
                    ✏️
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="eliminarConexion(${index})" title="Eliminar">
                    🗑️
                </button>
            </div>
        `;

        listaDiv.appendChild(item);
    });

    console.log(`📋 Lista de conexiones actualizada: ${window.conexiones.length} conexiones`);
}

// Editar una conexión existente
function editarConexion(index) {
    if (!window.conexiones || index < 0 || index >= window.conexiones.length) {
        alert('❌ Conexión no encontrada');
        return;
    }

    const conexion = window.conexiones[index];
    conexionEditandoIndex = index;

    // Mostrar información de la conexión
    const infoSpan = document.getElementById('editConexionInfo');
    infoSpan.textContent = `${conexion.origen.nombre} → ${conexion.destino.nombre}`;

    // Configurar tipo de conexión
    const selectTipo = document.getElementById('editSelectTipoConexion');
    let tipo = 'LINEAL';
    if (conexion.tipo === 'incorporacion') tipo = 'INCORPORACION';
    else if (conexion.tipo === 'probabilistica') tipo = 'PROBABILISTICA';
    selectTipo.value = tipo;

    // Mostrar campos según tipo
    const camposIncorp = document.getElementById('editCamposIncorporacion');
    const camposProb = document.getElementById('editCamposProbabilistica');

    camposIncorp.style.display = 'none';
    camposProb.style.display = 'none';

    if (tipo === 'INCORPORACION') {
        camposIncorp.style.display = 'block';
        document.getElementById('editInputCarrilDestino').value = conexion.carrilDestino;
        document.getElementById('editInputPosInicial').value = conexion.posDestino || 0;
    } else if (tipo === 'PROBABILISTICA') {
        camposProb.style.display = 'block';
        document.getElementById('editInputCarrilOrigen').value = conexion.carrilOrigen;
        document.getElementById('editInputCarrilDestinoProb').value = conexion.carrilDestino;
        document.getElementById('editInputProbabilidad').value = conexion.probabilidadTransferencia;
    }

    // Configurar evento de cambio de tipo
    // Remover handler anterior si existe
    if (handlerCambioTipo !== null) {
        selectTipo.removeEventListener('change', handlerCambioTipo);
    }

    // Crear y guardar el nuevo handler
    handlerCambioTipo = function() {
        camposIncorp.style.display = this.value === 'INCORPORACION' ? 'block' : 'none';
        camposProb.style.display = this.value === 'PROBABILISTICA' ? 'block' : 'none';
    };

    selectTipo.addEventListener('change', handlerCambioTipo);

    // Configurar botón de confirmación
    const btnConfirmar = document.getElementById('btnConfirmarEditarConexion');

    // Remover el handler anterior si existe
    if (handlerConfirmarEdicion !== null) {
        btnConfirmar.removeEventListener('click', handlerConfirmarEdicion);
    }

    // Crear y guardar el nuevo handler
    handlerConfirmarEdicion = function() {
        guardarCambiosConexion(index);
    };

    // Agregar el nuevo handler
    btnConfirmar.addEventListener('click', handlerConfirmarEdicion);

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarConexion'));
    modal.show();
}

// Guardar cambios en una conexión (modifica directamente la conexión existente)
function guardarCambiosConexion(index) {
    if (!window.conexiones || index < 0 || index >= window.conexiones.length) {
        alert('❌ Error al guardar cambios');
        return;
    }

    const conexion = window.conexiones[index];
    const tipoNuevo = document.getElementById('editSelectTipoConexion').value;

    // Guardar carril origen actual para mover en conexionesSalida si cambia
    const carrilOrigenAntiguo = conexion.carrilOrigen;

    // Extraer valores del formulario según el tipo
    if (tipoNuevo === 'PROBABILISTICA') {
        const prob = parseFloat(document.getElementById('editInputProbabilidad').value);
        const carrilOrigen = parseInt(document.getElementById('editInputCarrilOrigen').value);
        const carrilDestino = parseInt(document.getElementById('editInputCarrilDestinoProb').value);

        if (isNaN(prob) || prob < 0 || prob > 1) {
            alert('❌ La probabilidad debe estar entre 0 y 1');
            return;
        }
        if (isNaN(carrilOrigen) || isNaN(carrilDestino)) {
            alert('❌ Los carriles deben ser números válidos');
            return;
        }

        // Validar carriles
        if (carrilOrigen < 0 || carrilOrigen >= conexion.origen.carriles) {
            alert(`❌ El carril origen debe estar entre 0 y ${conexion.origen.carriles - 1}`);
            return;
        }
        if (carrilDestino < 0 || carrilDestino >= conexion.destino.carriles) {
            alert(`❌ El carril destino debe estar entre 0 y ${conexion.destino.carriles - 1}`);
            return;
        }

        // Modificar propiedades directamente
        conexion.tipo = window.TIPOS_CONEXION.PROBABILISTICA;
        conexion.carrilOrigen = carrilOrigen;
        conexion.carrilDestino = carrilDestino;
        conexion.probabilidadTransferencia = prob;

    } else if (tipoNuevo === 'INCORPORACION') {
        const carrilDestino = parseInt(document.getElementById('editInputCarrilDestino').value);
        const posInicial = parseInt(document.getElementById('editInputPosInicial').value);

        if (isNaN(carrilDestino) || isNaN(posInicial)) {
            alert('❌ Valores inválidos para incorporación');
            return;
        }
        if (carrilDestino < 0 || carrilDestino >= conexion.destino.carriles) {
            alert(`❌ El carril destino debe estar entre 0 y ${conexion.destino.carriles - 1}`);
            return;
        }

        // Modificar propiedades directamente
        conexion.tipo = window.TIPOS_CONEXION.INCORPORACION;
        conexion.carrilDestino = carrilDestino;
        conexion.posDestino = posInicial;
        conexion.probabilidadTransferencia = 1.0;

    } else if (tipoNuevo === 'LINEAL') {
        // Para conexión lineal, los carriles permanecen iguales
        conexion.tipo = window.TIPOS_CONEXION.LINEAL;
        conexion.probabilidadTransferencia = 1.0;
        conexion.posDestino = 0;
    }

    // Si cambió el carril origen, mover la conexión en conexionesSalida
    if (carrilOrigenAntiguo !== conexion.carrilOrigen) {
        const origen = conexion.origen;

        // Remover del carril antiguo
        if (origen.conexionesSalida && origen.conexionesSalida[carrilOrigenAntiguo]) {
            const idx = origen.conexionesSalida[carrilOrigenAntiguo].indexOf(conexion);
            if (idx !== -1) {
                origen.conexionesSalida[carrilOrigenAntiguo].splice(idx, 1);
            }
        }

        // Agregar al nuevo carril
        if (!origen.conexionesSalida[conexion.carrilOrigen]) {
            origen.conexionesSalida[conexion.carrilOrigen] = [];
        }
        origen.conexionesSalida[conexion.carrilOrigen].push(conexion);
    }

    // Reinicializar intersecciones
    if (window.inicializarIntersecciones) {
        window.inicializarIntersecciones();
    }
    if (window.construirMapaIntersecciones) {
        window.construirMapaIntersecciones();
    }

    // Actualizar vista
    actualizarListaConexiones();
    if (window.renderizarCanvas) {
        window.renderizarCanvas();
    }

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarConexion'));
    if (modal) modal.hide();

    // Limpiar los handlers globales
    const btnConfirmar = document.getElementById('btnConfirmarEditarConexion');
    const selectTipo = document.getElementById('editSelectTipoConexion');

    if (handlerConfirmarEdicion !== null) {
        btnConfirmar.removeEventListener('click', handlerConfirmarEdicion);
        handlerConfirmarEdicion = null;
    }

    if (handlerCambioTipo !== null) {
        selectTipo.removeEventListener('change', handlerCambioTipo);
        handlerCambioTipo = null;
    }

    console.log(`✏️ Conexión ${index} editada: ${conexion.origen.nombre}[${conexion.carrilOrigen}] → ${conexion.destino.nombre}[${conexion.carrilDestino}] (${tipoNuevo})`);
    alert('✅ Cambios aplicados correctamente a la simulación.');
}

// Eliminar una conexión (aplica cambios inmediatamente)
function eliminarConexion(index) {
    if (!window.conexiones || index < 0 || index >= window.conexiones.length) {
        alert('❌ Conexión no encontrada');
        return;
    }

    const conexion = window.conexiones[index];
    const confirmacion = confirm(`¿Eliminar conexión de "${conexion.origen.nombre}" a "${conexion.destino.nombre}"?`);

    if (!confirmacion) return;

    // Eliminar de conexionesSalida de la calle origen
    if (conexion.origen.conexionesSalida && conexion.origen.conexionesSalida[conexion.carrilOrigen]) {
        const idx = conexion.origen.conexionesSalida[conexion.carrilOrigen].indexOf(conexion);
        if (idx !== -1) {
            conexion.origen.conexionesSalida[conexion.carrilOrigen].splice(idx, 1);
        }
    }

    // Remover de window.conexiones
    window.conexiones.splice(index, 1);

    // Reinicializar intersecciones
    if (window.inicializarIntersecciones) {
        window.inicializarIntersecciones();
    }
    if (window.construirMapaIntersecciones) {
        window.construirMapaIntersecciones();
    }

    // Actualizar vista
    actualizarListaConexiones();
    if (window.renderizarCanvas) {
        window.renderizarCanvas();
    }

    console.log(`🗑️ Conexión ${index} eliminada de la simulación`);
    alert('✅ Conexión eliminada correctamente.');
}


// ==================== EXPONER FUNCIONES GLOBALMENTE ====================

window.inicializarConstructor = inicializarConstructor;
window.agregarCalle = agregarCalle;
window.guardarSimulacion = guardarSimulacion;
window.cargarSimulacion = cargarSimulacion;
window.nuevaSimulacion = nuevaSimulacion;
window.simulacionActual = simulacionActual;

// Exponer funciones de gestión de conexiones
window.toggleListaConexiones = toggleListaConexiones;
window.actualizarListaConexiones = actualizarListaConexiones;
window.editarConexion = editarConexion;
window.eliminarConexion = eliminarConexion;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarConstructor);
} else {
    // Si ya se cargó, inicializar directamente
    setTimeout(inicializarConstructor, 500);
}

console.log("🏗️ Constructor.js cargado");
