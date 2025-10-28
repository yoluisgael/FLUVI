// ==================== SISTEMA DE TIEMPO VIRTUAL ====================
// Este módulo implementa un reloj virtual para la simulación de tráfico
// con perfiles dinámicos de probabilidad según día de la semana y hora

// ==================== VARIABLES DE ESTADO DEL TIEMPO ====================

// Constante física: cuánto tiempo simulado avanza por cada paso de simulación
// Basado en que cada celda representa 5 metros y velocidad urbana típica ~35 km/h (9.7 m/s)
// Tiempo para avanzar 5m a 9.7 m/s ≈ 0.5 segundos
// Usamos 2.0 segundos por paso para que el tiempo avance perceptiblemente
const SEGUNDOS_POR_PASO = 2.0;

let configuracionTiempo = {
    activo: true,                    // Si el sistema de tiempo está activo
    diaActual: 1,                    // 0=Domingo, 1=Lunes, ..., 6=Sábado
    horaActual: 7,                   // 0-23
    minutoActual: 0,                 // 0-59
    segundoActual: 0,                // 0-59
    usarPerfiles: true               // Si se aplican los perfiles de tráfico
};

// Cache para el multiplicador actual (optimización)
let multiplicadorCache = {
    valor: 1.0,
    ultimaHora: -1,
    ultimoDia: -1
};

// ==================== PERFILES DE TRÁFICO POR DÍA Y HORA ====================

/**
 * Perfiles de tráfico para cada día de la semana
 * Cada perfil contiene 24 valores (uno por hora) con el multiplicador de probabilidad
 * Los valores representan cuánto se multiplica la probabilidad de generación base
 */
const PERFILES_TRAFICO = {
    // Lunes a Viernes: Días laborales
    1: [ // Lunes
        0.2, 0.2, 0.2, 0.2, 0.2, 0.2,  // 00-05: Madrugada
        0.3, 1.5, 1.5, 0.8, 0.8, 0.8,  // 06-11: Pico mañana (07-09)
        1.0, 1.0, 0.9, 0.7, 0.7, 0.7,  // 12-17: Mediodía y tarde
        1.6, 1.6, 1.3, 0.5, 0.4, 0.3   // 18-23: Pico tarde (18-20)
    ],
    2: [ // Martes
        0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
        0.3, 1.5, 1.5, 0.8, 0.8, 0.8,
        1.0, 1.0, 0.9, 0.7, 0.7, 0.7,
        1.6, 1.6, 1.3, 0.5, 0.4, 0.3
    ],
    3: [ // Miércoles
        0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
        0.3, 1.5, 1.5, 0.8, 0.8, 0.8,
        1.0, 1.0, 0.9, 0.7, 0.7, 0.7,
        1.6, 1.6, 1.3, 0.5, 0.4, 0.3
    ],
    4: [ // Jueves
        0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
        0.3, 1.5, 1.5, 0.8, 0.8, 0.8,
        1.0, 1.0, 0.9, 0.7, 0.7, 0.7,
        1.6, 1.6, 1.3, 0.5, 0.4, 0.3
    ],
    5: [ // Viernes
        0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
        0.3, 1.5, 1.5, 0.8, 0.8, 0.8,
        1.0, 1.0, 0.9, 0.7, 0.7, 0.7,
        1.7, 1.7, 1.4, 0.7, 0.5, 0.4   // Viernes tarde más tráfico
    ],
    6: [ // Sábado
        0.3, 0.3, 0.3, 0.3, 0.3, 0.3,  // 00-05
        0.3, 0.3, 0.4, 0.5, 0.8, 0.8,  // 06-11: Más actividad tarde
        0.8, 0.9, 0.9, 1.1, 1.1, 1.1,  // 12-17: Pico tarde sábado
        1.1, 1.0, 0.8, 0.6, 0.5, 0.4   // 18-23
    ],
    0: [ // Domingo
        0.2, 0.2, 0.2, 0.2, 0.2, 0.2,  // 00-05
        0.2, 0.2, 0.3, 0.3, 0.4, 0.6,  // 06-11: Tranquilo
        0.6, 0.7, 0.7, 0.7, 0.7, 0.6,  // 12-17: Actividad moderada
        0.6, 0.5, 0.4, 0.3, 0.3, 0.2   // 18-23: Calmado
    ]
};

// Nombres de los días para display
const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// ==================== FUNCIONES DE TIEMPO ====================

/**
 * Avanza el tiempo virtual un paso constante
 * Cada llamada avanza SEGUNDOS_POR_PASO segundos simulados
 * El slider de velocidad solo afecta qué tan rápido se ejecutan los pasos, no el tiempo que representan
 * Debe llamarse en cada paso de simulación
 */
function avanzarTiempo() {
    if (!configuracionTiempo.activo) return;
    if (window.isPaused) return; // Solo avanzar si la simulación está corriendo

    // Avanzar tiempo de forma constante: cada paso = SEGUNDOS_POR_PASO segundos simulados
    configuracionTiempo.segundoActual += SEGUNDOS_POR_PASO;

    // Normalizar segundos -> minutos
    if (configuracionTiempo.segundoActual >= 60) {
        const minutosExtras = Math.floor(configuracionTiempo.segundoActual / 60);
        configuracionTiempo.segundoActual = configuracionTiempo.segundoActual % 60;
        configuracionTiempo.minutoActual += minutosExtras;
    }

    // Normalizar minutos -> horas
    if (configuracionTiempo.minutoActual >= 60) {
        const horasExtras = Math.floor(configuracionTiempo.minutoActual / 60);
        configuracionTiempo.minutoActual = configuracionTiempo.minutoActual % 60;
        configuracionTiempo.horaActual += horasExtras;
    }

    // Normalizar horas -> días
    if (configuracionTiempo.horaActual >= 24) {
        const diasExtras = Math.floor(configuracionTiempo.horaActual / 24);
        configuracionTiempo.horaActual = configuracionTiempo.horaActual % 24;
        configuracionTiempo.diaActual = (configuracionTiempo.diaActual + diasExtras) % 7;

        // Invalidar cache al cambiar de día
        multiplicadorCache.ultimoDia = -1;
    }
}

/**
 * Obtiene el multiplicador de tráfico actual según día y hora
 * Usa interpolación lineal entre horas para transiciones suaves
 * @returns {number} Multiplicador de probabilidad (0.2 - 2.0)
 */
function obtenerMultiplicadorTrafico() {
    if (!configuracionTiempo.usarPerfiles) return 1.0;

    const dia = configuracionTiempo.diaActual;
    const hora = Math.floor(configuracionTiempo.horaActual);
    const minutos = configuracionTiempo.minutoActual;

    // Usar cache si la hora no ha cambiado (optimización)
    if (multiplicadorCache.ultimaDia === dia && multiplicadorCache.ultimaHora === hora) {
        return multiplicadorCache.valor;
    }

    const perfil = PERFILES_TRAFICO[dia];
    if (!perfil) return 1.0;

    // Multiplicador base de la hora actual
    const multActual = perfil[hora];

    // Multiplicador de la siguiente hora (para interpolación)
    const horaSiguiente = (hora + 1) % 24;
    const multSiguiente = perfil[horaSiguiente];

    // Interpolación lineal basada en los minutos
    const factor = minutos / 60;
    const multiplicador = multActual + (multSiguiente - multActual) * factor;

    // Actualizar cache
    multiplicadorCache.valor = multiplicador;
    multiplicadorCache.ultimaHora = hora;
    multiplicadorCache.ultimaDia = dia;

    return multiplicador;
}

/**
 * Obtiene el nombre del día actual
 * @returns {string} Nombre del día en español
 */
function obtenerDiaString() {
    return NOMBRES_DIAS[configuracionTiempo.diaActual];
}

/**
 * Obtiene timestamp virtual completo para display
 * @returns {string} Formato: "Lunes 14:35:42"
 */
function obtenerTimestampVirtual() {
    const dia = obtenerDiaString();
    const horas = Math.floor(configuracionTiempo.horaActual).toString().padStart(2, '0');
    const minutos = Math.floor(configuracionTiempo.minutoActual).toString().padStart(2, '0');
    const segundos = Math.floor(configuracionTiempo.segundoActual).toString().padStart(2, '0');

    return `${dia} ${horas}:${minutos}:${segundos}`;
}

/**
 * Obtiene timestamp virtual corto para gráficas
 * @returns {string} Formato: "14:35:42"
 */
function obtenerTimestampCorto() {
    const horas = Math.floor(configuracionTiempo.horaActual).toString().padStart(2, '0');
    const minutos = Math.floor(configuracionTiempo.minutoActual).toString().padStart(2, '0');
    const segundos = Math.floor(configuracionTiempo.segundoActual).toString().padStart(2, '0');

    return `${horas}:${minutos}:${segundos}`;
}

/**
 * Obtiene timestamp completo con día para exportación
 * @returns {string} Formato: "Lunes 14:35:42"
 */
function obtenerTimestampExportacion() {
    return obtenerTimestampVirtual();
}

/**
 * Obtiene el tiempo virtual en milisegundos (para cálculos de diferencias)
 * @returns {number} Milisegundos virtuales desde domingo 00:00:00
 */
function obtenerMillisVirtuales() {
    const dias = configuracionTiempo.diaActual;
    const horas = configuracionTiempo.horaActual;
    const minutos = configuracionTiempo.minutoActual;
    const segundos = configuracionTiempo.segundoActual;

    return ((dias * 24 + horas) * 60 + minutos) * 60 * 1000 + segundos * 1000;
}

/**
 * Obtiene información sobre el próximo cambio significativo de tráfico
 * @returns {Object} {horaProxima, multiplicadorProximo, minutosRestantes, descripcion}
 */
function obtenerProximoCambio() {
    const dia = configuracionTiempo.diaActual;
    const horaActual = Math.floor(configuracionTiempo.horaActual);
    const perfil = PERFILES_TRAFICO[dia];

    if (!perfil) return null;

    const multActual = perfil[horaActual];

    // Buscar la siguiente hora con un cambio significativo (>0.3 diferencia)
    for (let i = 1; i <= 24; i++) {
        const horaBusqueda = (horaActual + i) % 24;
        const multBusqueda = perfil[horaBusqueda];

        if (Math.abs(multBusqueda - multActual) > 0.3) {
            const minutosRestantesHora = 60 - configuracionTiempo.minutoActual;
            const minutosRestantesTotal = minutosRestantesHora + (i - 1) * 60;

            let descripcion = '';
            if (multBusqueda > 1.3) {
                descripcion = 'Hora pico';
            } else if (multBusqueda < 0.5) {
                descripcion = 'Tráfico bajo';
            } else {
                descripcion = 'Tráfico moderado';
            }

            return {
                horaProxima: horaBusqueda,
                multiplicadorProximo: multBusqueda,
                minutosRestantes: Math.floor(minutosRestantesTotal),
                descripcion: descripcion
            };
        }
    }

    return null;
}

/**
 * Obtiene descripción del estado de tráfico actual
 * @returns {string} Descripción del multiplicador actual
 */
function obtenerDescripcionTrafico() {
    const mult = obtenerMultiplicadorTrafico();

    if (mult >= 1.5) return 'Hora pico';
    if (mult >= 1.2) return 'Tráfico alto';
    if (mult >= 0.8) return 'Tráfico moderado';
    if (mult >= 0.5) return 'Tráfico bajo';
    return 'Tráfico muy bajo';
}

/**
 * Reinicia el tiempo virtual a Lunes 00:00:00
 */
function reiniciarTiempo() {
    configuracionTiempo.diaActual = 1; // Lunes
    configuracionTiempo.horaActual = 7; // 7 AM (hora pico mañana)
    configuracionTiempo.minutoActual = 0;
    configuracionTiempo.segundoActual = 0;
    configuracionTiempo.ultimoTickReal = null;

    // Invalidar cache
    multiplicadorCache.ultimaDia = -1;
    multiplicadorCache.ultimaHora = -1;

    console.log('⏰ Tiempo virtual reiniciado a Lunes 07:00:00');
}

/**
 * Activa o desactiva el uso de perfiles de tráfico
 * @param {boolean} usar
 */
function togglePerfiles(usar) {
    configuracionTiempo.usarPerfiles = usar;
    multiplicadorCache.ultimaDia = -1; // Invalidar cache
    console.log(`⏰ Perfiles de tráfico: ${usar ? 'ACTIVADOS' : 'DESACTIVADOS'}`);
}

/**
 * Obtiene el perfil del día actual como array
 * @returns {Array<number>} Array de 24 multiplicadores
 */
function obtenerPerfilDiaActual() {
    return PERFILES_TRAFICO[configuracionTiempo.diaActual] || Array(24).fill(1.0);
}

// ==================== SERIALIZACIÓN JSON ====================

/**
 * Serializa la configuración de tiempo a JSON
 * @returns {Object} Objeto con la configuración
 */
function tiempoToJSON() {
    return {
        activo: configuracionTiempo.activo,
        diaActual: configuracionTiempo.diaActual,
        horaActual: Math.floor(configuracionTiempo.horaActual),
        minutoActual: Math.floor(configuracionTiempo.minutoActual),
        segundoActual: Math.floor(configuracionTiempo.segundoActual),
        usarPerfiles: configuracionTiempo.usarPerfiles,
        segundosPorPaso: SEGUNDOS_POR_PASO // Guardar la constante para referencia
    };
}

/**
 * Carga la configuración de tiempo desde JSON
 * @param {Object} data - Objeto con la configuración
 */
function tiempoFromJSON(data) {
    if (!data) {
        console.warn('⏰ No se encontró configuración de tiempo, usando valores por defecto');
        return;
    }

    configuracionTiempo.activo = data.activo !== undefined ? data.activo : true;
    configuracionTiempo.diaActual = data.diaActual || 1;
    configuracionTiempo.horaActual = data.horaActual || 7;
    configuracionTiempo.minutoActual = data.minutoActual || 0;
    configuracionTiempo.segundoActual = data.segundoActual || 0;
    configuracionTiempo.usarPerfiles = data.usarPerfiles !== undefined ? data.usarPerfiles : true;

    // Invalidar cache
    multiplicadorCache.ultimaDia = -1;
    multiplicadorCache.ultimaHora = -1;

    console.log(`⏰ Configuración de tiempo cargada: ${obtenerTimestampVirtual()}`);
    console.log(`⏰ Cada paso de simulación = ${SEGUNDOS_POR_PASO} segundo(s) simulado(s)`);
}

// ==================== EXPONER AL SCOPE GLOBAL ====================

window.configuracionTiempo = configuracionTiempo;
window.avanzarTiempo = avanzarTiempo;
window.obtenerMultiplicadorTrafico = obtenerMultiplicadorTrafico;
window.obtenerDiaString = obtenerDiaString;
window.obtenerTimestampVirtual = obtenerTimestampVirtual;
window.obtenerTimestampCorto = obtenerTimestampCorto;
window.obtenerTimestampExportacion = obtenerTimestampExportacion;
window.obtenerMillisVirtuales = obtenerMillisVirtuales;
window.obtenerProximoCambio = obtenerProximoCambio;
window.obtenerDescripcionTrafico = obtenerDescripcionTrafico;
window.reiniciarTiempo = reiniciarTiempo;
window.togglePerfiles = togglePerfiles;
window.obtenerPerfilDiaActual = obtenerPerfilDiaActual;
window.tiempoToJSON = tiempoToJSON;
window.tiempoFromJSON = tiempoFromJSON;
window.SEGUNDOS_POR_PASO = SEGUNDOS_POR_PASO;

console.log('✅ Módulo de tiempo virtual cargado correctamente');
console.log(`⏰ Configuración: ${SEGUNDOS_POR_PASO} segundo(s) simulado(s) por paso`);
