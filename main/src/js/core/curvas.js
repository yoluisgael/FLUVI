// ============================================================================
// CURVAS.JS - Sistema de Curvas y Vértices para Calles
// ============================================================================
// Este módulo maneja todo lo relacionado con las curvas de las calles:
// - Inicialización de vértices
// - Cálculo de posiciones con curvas
// - Interpolación de ángulos
// - Arrastre y actualización de vértices

// Variables globales para el control de vértices
let verticeSeleccionado = null;
let controlandoVertice = false;

// Inicializar vértices en una calle
function inicializarVertices(calle) {
    if (calle.tipo !== TIPOS.CONEXION) return;

    calle.vertices = [];
    const segmentoSize = 10; // Cada 10 celdas
    const numSegmentos = Math.floor(calle.tamano / segmentoSize);

    // Crear vértices en los puntos de división
    for (let i = 0; i <= numSegmentos; i++) {
        const indiceCelda = Math.min(i * segmentoSize, calle.tamano - 1);

        calle.vertices.push({
            indiceCelda: indiceCelda,
            anguloOffset: 0, // Desviación angular respecto al ángulo base (±40° máx)
            // Posición se calculará dinámicamente
        });
    }

    // ASEGURAR que siempre haya un vértice al final
    const ultimaCelda = calle.tamano - 1;
    const ultimoVertice = calle.vertices[calle.vertices.length - 1];

    if (ultimoVertice.indiceCelda !== ultimaCelda) {
        calle.vertices.push({
            indiceCelda: ultimaCelda,
            anguloOffset: 0,
        });
    }

    //console.log(`✨ Inicializados ${calle.vertices.length} vértices (puntos de curvatura) para ${calle.nombre}: [0, cada 10, ${ultimaCelda}]`);
}

// Función para calcular la posición de un vértice en coordenadas mundo
function calcularPosicionVertice(calle, vertice) {
    // Si la calle tiene curvas activas, usar la función de coordenadas con curva
    if (calle.esCurva && calle.vertices && calle.vertices.length >= 2) {
        const carrilCentral = Math.floor(calle.carriles / 2);
        const coordenadas = obtenerCoordenadasGlobalesCeldaConCurva(calle, carrilCentral, vertice.indiceCelda);
        return {
            x: coordenadas.x,
            y: coordenadas.y
        };
    }

    // Para calles rectas, usar cálculo tradicional
    const localX = vertice.indiceCelda * celda_tamano;
    const localY = (calle.carriles * celda_tamano) / 2;

    // Aplicar rotación base de la calle
    const anguloBase = -calle.angulo * Math.PI / 180;
    const cos = Math.cos(anguloBase);
    const sin = Math.sin(anguloBase);

    const rotadoX = localX * cos - localY * sin;
    const rotadoY = localX * sin + localY * cos;

    return {
        x: calle.x + rotadoX,
        y: calle.y + rotadoY
    };
}

// Función para obtener el ángulo efectivo en un punto específico de la calle
function obtenerAnguloEnPunto(calle, indiceCelda) {
    if (!calle.esCurva || !calle.vertices || calle.vertices.length < 2) {
        return calle.angulo;
    }

    // Encontrar entre qué vértices está la celda
    let verticeInicio = null;
    let verticeFin = null;
    let indiceInicio = -1;

    for (let i = 0; i < calle.vertices.length - 1; i++) {
        if (indiceCelda >= calle.vertices[i].indiceCelda &&
            indiceCelda <= calle.vertices[i + 1].indiceCelda) {
            verticeInicio = calle.vertices[i];
            verticeFin = calle.vertices[i + 1];
            indiceInicio = i;
            break;
        }
    }

    if (!verticeInicio || !verticeFin) {
        return calle.angulo;
    }

    // Interpolación lineal del ángulo offset entre vértices
    const rangoIndices = verticeFin.indiceCelda - verticeInicio.indiceCelda;
    if (rangoIndices === 0) return calle.angulo + verticeInicio.anguloOffset;

    const t = (indiceCelda - verticeInicio.indiceCelda) / rangoIndices;
    const anguloOffset = verticeInicio.anguloOffset +
                         t * (verticeFin.anguloOffset - verticeInicio.anguloOffset);

    return calle.angulo + anguloOffset;
}

// Actualizar el ángulo de un vértice con validación
function actualizarAnguloVertice(calle, indiceVertice, nuevoAnguloOffset) {
    if (indiceVertice < 0 || indiceVertice >= calle.vertices.length) return false;

    // Limitar a ±40 grados
    nuevoAnguloOffset = Math.max(-40, Math.min(40, nuevoAnguloOffset));

    // Validar diferencia con vértice anterior
    if (indiceVertice > 0) {
        const anguloAnterior = calle.vertices[indiceVertice - 1].anguloOffset;
        const diferencia = Math.abs(nuevoAnguloOffset - anguloAnterior);

        if (diferencia > 40) {
            // Ajustar para mantener máximo 40° de diferencia
            if (nuevoAnguloOffset > anguloAnterior) {
                nuevoAnguloOffset = anguloAnterior + 40;
            } else {
                nuevoAnguloOffset = anguloAnterior - 40;
            }
        }
    }

    // Validar diferencia con vértice siguiente
    if (indiceVertice < calle.vertices.length - 1) {
        const anguloSiguiente = calle.vertices[indiceVertice + 1].anguloOffset;
        const diferencia = Math.abs(nuevoAnguloOffset - anguloSiguiente);

        if (diferencia > 40) {
            // Ajustar para mantener máximo 40° de diferencia
            if (nuevoAnguloOffset > anguloSiguiente) {
                nuevoAnguloOffset = anguloSiguiente + 40;
            } else {
                nuevoAnguloOffset = anguloSiguiente - 40;
            }
        }
    }

    calle.vertices[indiceVertice].anguloOffset = nuevoAnguloOffset;

    // OPTIMIZACIÓN: Invalidar caché de coordenadas cuando se modifica un vértice
    if (calle._coordenadasCache) {
        calle._coordenadasCache = null;
        //console.log(`🔄 Caché de coordenadas invalidado para ${calle.nombre}`);
    }

    return true;
}

// Calcula el ángulo basado en distancia perpendicular al eje de la calle
function actualizarVerticePorArrastre(calle, indiceVertice, mouseX, mouseY) {
    // OPTIMIZACIÓN: console.log comentado para mejorar rendimiento (loop crítico durante arrastre)
    // console.log(`🔧 actualizarVerticePorArrastre llamado:`);
    // console.log(`   Calle: ${calle.nombre}, Índice: ${indiceVertice}`);
    // console.log(`   Mouse: (${mouseX.toFixed(2)}, ${mouseY.toFixed(2)})`);

    if (indiceVertice < 0 || indiceVertice >= calle.vertices.length) {
        console.error(`❌ Índice de vértice inválido: ${indiceVertice}, total vértices: ${calle.vertices.length}`);
        return false;
    }

    const vertice = calle.vertices[indiceVertice];
    const posActual = calcularPosicionVertice(calle, vertice);

    // console.log(`   Posición vértice: (${posActual.x.toFixed(2)}, ${posActual.y.toFixed(2)})`);

    // Vector desde posición del vértice al mouse
    const dx = mouseX - posActual.x;
    const dy = mouseY - posActual.y;

    // console.log(`   Vector dx,dy: (${dx.toFixed(2)}, ${dy.toFixed(2)})`);

    // Calcular ángulo base de la calle en radianes
    const anguloBaseRad = -calle.angulo * Math.PI / 180;

    // Vector perpendicular al eje de la calle (dirección positiva = izquierda)
    const perpX = -Math.sin(anguloBaseRad);
    const perpY = Math.cos(anguloBaseRad);

    // console.log(`   Vector perpendicular: (${perpX.toFixed(2)}, ${perpY.toFixed(2)})`);

    // Proyección del mouse sobre el eje perpendicular (distancia lateral)
    const distanciaPerp = dx * perpX + dy * perpY;

    // console.log(`   Distancia perpendicular: ${distanciaPerp.toFixed(2)}`);

    // Convertir distancia perpendicular a ángulo
    // Usamos una escala: cada 50 píxeles = 40 grados
    const escalaDistancia = 50; // píxeles para llegar al máximo
    let nuevoOffset = (distanciaPerp / escalaDistancia) * 40;

    // console.log(`   Nuevo offset calculado: ${nuevoOffset.toFixed(2)}°`);

    // Limitar a ±40 grados
    nuevoOffset = Math.max(-40, Math.min(40, nuevoOffset));

    // console.log(`   Nuevo offset limitado: ${nuevoOffset.toFixed(2)}°`);

    // Aplicar con validación
    const resultado = actualizarAnguloVertice(calle, indiceVertice, nuevoOffset);
    // console.log(`   Resultado de actualizarAnguloVertice: ${resultado}`);

    return resultado;
}

// Detectar si el mouse está sobre un vértice
function detectarVerticeEnPosicion(worldX, worldY) {
    if (!calleSeleccionada || !calleSeleccionada.esCurva) return null;

    const umbralDistancia = 15 / escala; // Radio de detección ajustado por zoom

    for (let i = 0; i < calleSeleccionada.vertices.length; i++) {
        const vertice = calleSeleccionada.vertices[i];
        const pos = calcularPosicionVertice(calleSeleccionada, vertice);

        const dist = Math.sqrt(
            Math.pow(worldX - pos.x, 2) +
            Math.pow(worldY - pos.y, 2)
        );

        if (dist < umbralDistancia) {
            return { indice: i, vertice: vertice, pos: pos };
        }
    }

    return null;
}

// OPTIMIZACIÓN CRÍTICA: Precalcular coordenadas de curva para evitar O(n²)
// Sin caché: ~49,500,000 operaciones trigonométricas/segundo con 16,500 vehículos a 60 FPS
// Con caché: ~0 operaciones (solo consulta)
function precalcularCoordenadasCurva(calle) {
    if (!calle.esCurva || !calle.vertices || calle.vertices.length < 2) {
        calle._coordenadasCache = null;
        return;
    }

    // Crear caché para todos los índices del eje central (carril medio)
    calle._coordenadasCache = new Array(calle.tamano);

    let posX = calle.x;
    let posY = calle.y;
    let anguloActual = calle.angulo;

    // Precalcular posiciones para el eje central (carril 0)
    for (let i = 0; i < calle.tamano; i++) {
        const anguloEnPunto = obtenerAnguloEnPunto(calle, i);

        if (i > 0) {
            // Mover en la dirección del ángulo actual
            const anguloRad = -anguloEnPunto * Math.PI / 180;
            posX += Math.cos(anguloRad) * celda_tamano;
            posY += Math.sin(anguloRad) * celda_tamano;
        }

        anguloActual = anguloEnPunto;

        // Guardar en caché
        calle._coordenadasCache[i] = {
            x: posX,
            y: posY,
            angulo: anguloActual,
            anguloRad: -anguloActual * Math.PI / 180
        };
    }

    //console.log(`✅ Caché de coordenadas precalculado para ${calle.nombre} (${calle.tamano} celdas)`);
}

// Función para calcular coordenadas de una celda con curvas (usando caché)
function obtenerCoordenadasGlobalesCeldaConCurva(calle, carril, indice) {
    if (!calle.esCurva || !calle.vertices || calle.vertices.length < 2) {
        return obtenerCoordenadasGlobalesCelda(calle, carril, indice);
    }

    // OPTIMIZACIÓN: Usar caché precalculado
    if (!calle._coordenadasCache) {
        precalcularCoordenadasCurva(calle);
    }

    // Consulta O(1) en vez de loop O(n)
    const cached = calle._coordenadasCache[indice];
    if (!cached) {
        // Fallback para índices fuera de rango
        return obtenerCoordenadasGlobalesCelda(calle, carril, indice);
    }

    // Ajustar por carril (perpendicular a la dirección)
    const perpX = -Math.sin(cached.anguloRad);
    const perpY = Math.cos(cached.anguloRad);

    const offsetCarril = (carril - (calle.carriles - 1) / 2) * celda_tamano;

    return {
        x: cached.x + perpX * offsetCarril + Math.cos(cached.anguloRad) * celda_tamano / 2,
        y: cached.y + perpY * offsetCarril + Math.sin(cached.anguloRad) * celda_tamano / 2,
        angulo: cached.angulo
    };
}

// Función para calcular el centro de una calle con curvas
function calcularCentroCalleCurva(calle) {
    if (!calle.esCurva || !calle.vertices || calle.vertices.length < 2) {
        // Para calles rectas, usar el cálculo tradicional
        return {
            x: calle.x + (calle.tamano * celda_tamano / 2) * Math.cos(-calle.angulo * Math.PI / 180),
            y: calle.y + (calle.tamano * celda_tamano / 2) * Math.sin(-calle.angulo * Math.PI / 180)
        };
    }

    // Para calles curvas, usar el punto medio real de la curva
    const indiceMedio = Math.floor(calle.tamano / 2);
    const carrilCentral = Math.floor(calle.carriles / 2);
    const coordenadas = obtenerCoordenadasGlobalesCeldaConCurva(calle, carrilCentral, indiceMedio);

    return {
        x: coordenadas.x,
        y: coordenadas.y
    };
}

// Función para calcular el punto final de una calle con curvas (para handle de rotación)
function calcularPuntoFinalCalleCurva(calle) {
    if (!calle.esCurva || !calle.vertices || calle.vertices.length < 2) {
        // Para calles rectas, usar el cálculo tradicional
        return {
            x: calle.x + (calle.tamano * celda_tamano) * Math.cos(-calle.angulo * Math.PI / 180),
            y: calle.y + (calle.tamano * celda_tamano) * Math.sin(-calle.angulo * Math.PI / 180)
        };
    }

    // Para calles curvas, usar la última celda real de la curva
    const ultimoIndice = calle.tamano - 1;
    const carrilCentral = Math.floor(calle.carriles / 2);
    const coordenadas = obtenerCoordenadasGlobalesCeldaConCurva(calle, carrilCentral, ultimoIndice);

    return {
        x: coordenadas.x,
        y: coordenadas.y
    };
}

// Exponer funciones globalmente para PixiJS
window.inicializarVertices = inicializarVertices;
window.calcularPosicionVertice = calcularPosicionVertice;
window.obtenerAnguloEnPunto = obtenerAnguloEnPunto;
window.actualizarAnguloVertice = actualizarAnguloVertice;
window.actualizarVerticePorArrastre = actualizarVerticePorArrastre;
window.detectarVerticeEnPosicion = detectarVerticeEnPosicion;
window.obtenerCoordenadasGlobalesCeldaConCurva = obtenerCoordenadasGlobalesCeldaConCurva;
window.calcularCentroCalleCurva = calcularCentroCalleCurva;
window.calcularPuntoFinalCalleCurva = calcularPuntoFinalCalleCurva;
window.precalcularCoordenadasCurva = precalcularCoordenadasCurva; // OPTIMIZACIÓN: Caché de coordenadas

console.log('✓ curvas.js cargado y funciones expuestas globalmente');
