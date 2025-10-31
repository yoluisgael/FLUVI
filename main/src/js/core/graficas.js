// ==================== SISTEMA DE MÉTRICAS Y GRÁFICAS ====================
// Este módulo contiene toda la funcionalidad relacionada con el cálculo,
// almacenamiento, visualización y exportación de métricas de tráfico

// ==================== VARIABLES GLOBALES ====================

// Historial de métricas con límite de 50 puntos de datos (solo para gráficas)
const metricsHistory = {
    timestamps: [],
    density: [],
    netGeneration: [], // Tasa de cambio de población (antes "flow")
    throughput: [], // Flujo vehicular real (Q = k × v)
    speed: [],
    entropy: [], // Entropía de Shannon del autómata celular
    maxDataPoints: 50
};

// Historial COMPLETO de métricas sin límite (para exportación CSV)
const completeMetricsHistory = {
    timestamps: [],
    density: [],
    netGeneration: [],
    throughput: [],
    speed: [],
    entropy: []
};

// Variables auxiliares para el cálculo de flujo vehicular
let previousCarCount = 0;
let flowMeasureInterval = 1000;
let lastFlowMeasure = null; // Inicializar como null, se establecerá en primera medición
let lastFlowValue = 0; // Almacena el último flujo calculado para evitar parpadeos

// Estado anterior de las calles para calcular transiciones del autómata celular
let previousStreetStates = new Map();

// Instancias de Chart.js para cada gráfica
let densityChartInstance = null;
let throughputChartInstance = null;
let netGenerationChartInstance = null;
let speedChartInstance = null;
let entropyChartInstance = null;

// Contador para actualizar métricas cada 5 frames
let metricsUpdateCounter = 0;

// ==================== FUNCIONES DE INTERPRETACIÓN DE MÉTRICAS ====================

/**
 * Interpreta las métricas actuales y devuelve el estado del tráfico
 * @param {Object} metrics - Métricas calculadas (density, flow, speed)
 * @returns {Object} Estado interpretado con nivel, emoji, título, descripción y recomendaciones
 */
function interpretarMetricas(metrics) {
    const density = parseFloat(metrics.density);
    const throughput = parseFloat(metrics.throughput);
    const speed = parseFloat(metrics.speed);
    const netGeneration = parseFloat(metrics.netGeneration);

    // Determinar el estado del tráfico
    let estado = {
        nivel: '',
        emoji: '',
        color: '',
        titulo: '',
        descripcion: '',
        observaciones: [],
        clase: ''
    };

    // Análisis del estado del tráfico basado en la ecuación fundamental Q=k×v
    // Prioridad: 1) Colapso, 2) Óptimo (por throughput), 3) Congestionado, 4) Sub-utilizado, 5) Moderado

    if (density > 80 && speed < 15) {
        // COLAPSO CRÍTICO - Gridlock: alta densidad pero sin movimiento
        estado.nivel = 'COLAPSO';
        estado.emoji = '🔴';
        estado.color = '#dc3545';
        estado.titulo = 'COLAPSO DE TRÁFICO';
        estado.descripcion = 'Las calles están severamente congestionadas y casi paralizadas';
        estado.clase = 'status-critico';
        estado.observaciones = [
            'Densidad crítica detectada (>80%)',
            'Velocidad extremadamente baja (<15%)',
            `Flujo vehicular: ${throughput.toFixed(1)} veh/s - Casi nulo`,
            `Tasa cambio: ${netGeneration.toFixed(1)} veh/s - ${getNetGenerationLabel(netGeneration)}`,
            'Se requiere intervención: reducir generación o mejorar salidas'
        ];
    } else if (throughput >= 2.5 && density >= 25 && density <= 60 && speed >= 50) {
        // ÓPTIMO - Basado en THROUGHPUT alto con condiciones balanceadas
        // Zona de máxima eficiencia según ecuación fundamental
        estado.nivel = 'ÓPTIMO';
        estado.emoji = '🟢';
        estado.color = '#198754';
        estado.titulo = 'FLUJO ÓPTIMO';
        estado.descripcion = 'Máxima eficiencia del sistema: buen balance entre densidad y velocidad';
        estado.clase = 'status-optimo';
        estado.observaciones = [
            `Densidad en zona óptima (${density.toFixed(0)}%)`,
            `Velocidad fluida (${speed.toFixed(0)}%)`,
            `Flujo vehicular alto: ${throughput.toFixed(1)} veh/s`,
            `Tasa cambio: ${netGeneration.toFixed(1)} veh/s - ${getNetGenerationLabel(netGeneration)}`,
            'Sistema funcionando al máximo rendimiento'
        ];
    } else if (density > 65 && speed < 35) {
        // CONGESTIONADO - Alta densidad con velocidad reducida
        estado.nivel = 'CONGESTIONADO';
        estado.emoji = '🟠';
        estado.color = '#fd7e14';
        estado.titulo = 'TRÁFICO CONGESTIONADO';
        estado.descripcion = 'Alta densidad vehicular con movimiento lento';
        estado.clase = 'status-alto';
        estado.observaciones = [
            `Densidad alta (${density.toFixed(0)}%)`,
            `Velocidad reducida (${speed.toFixed(0)}%)`,
            `Flujo vehicular: ${throughput.toFixed(1)} veh/s - ${getThroughputLabel(throughput)}`,
            netGeneration > 2 ? `⚠ Población creciendo (${netGeneration.toFixed(1)} veh/s)` : 'Población estable',
            'Riesgo de colapso si aumenta densidad'
        ];
    } else if (density < 25 && throughput < 1.5) {
        // SUB-UTILIZADO - Baja densidad Y bajo flujo
        estado.nivel = 'SUB-UTILIZADO';
        estado.emoji = '🔵';
        estado.color = '#0d6efd';
        estado.titulo = 'SISTEMA SUB-UTILIZADO';
        estado.descripcion = 'Baja ocupación de las calles, capacidad disponible';
        estado.clase = 'status-bajo';
        estado.observaciones = [
            `Densidad muy baja (${density.toFixed(0)}%)`,
            `Flujo vehicular bajo: ${throughput.toFixed(1)} veh/s`,
            `Velocidad: ${speed.toFixed(0)}% - ${getSpeedLabel(speed)}`,
            netGeneration > 1 ? `Creciendo lentamente (${netGeneration.toFixed(1)} veh/s)` : 'Población estable',
            'Considerar aumentar generación para aprovechar capacidad'
        ];
    } else {
        // MODERADO - Condiciones aceptables pero no óptimas
        estado.nivel = 'MODERADO';
        estado.emoji = '🟡';
        estado.color = '#ffc107';
        estado.titulo = 'FLUJO MODERADO';
        estado.descripcion = 'Condiciones de tráfico aceptables con margen de mejora';
        estado.clase = 'status-moderado';
        estado.observaciones = [
            `Densidad: ${density.toFixed(0)}% - ${getDensityLabel(density)}`,
            `Velocidad: ${speed.toFixed(0)}% - ${getSpeedLabel(speed)}`,
            `Flujo vehicular: ${throughput.toFixed(1)} veh/s - ${getThroughputLabel(throughput)}`,
            `Tasa cambio: ${netGeneration.toFixed(1)} veh/s - ${getNetGenerationLabel(netGeneration)}`,
            throughput < 2.5 ? 'Puede optimizarse para aumentar flujo' : 'Sistema funcionando normalmente'
        ];
    }

    return estado;
}

/**
 * Actualiza el panel de interpretación en la interfaz
 * @param {Object} estado - Estado interpretado del tráfico
 * @param {Object} metrics - Métricas actuales
 */
function actualizarPanelInterpretacion(estado, metrics) {
    const panel = document.getElementById('statusPanel');
    if (!panel) return;

    const density = parseFloat(metrics.density);
    const throughput = parseFloat(metrics.throughput);
    const netGeneration = parseFloat(metrics.netGeneration);
    const speed = parseFloat(metrics.speed);

    // Actualizar clase del panel
    panel.className = 'status-panel ' + estado.clase;

    // Actualizar contenido
    panel.innerHTML = `
        <div class="status-header">
            <span class="status-emoji">${estado.emoji}</span>
            <span class="status-title">${estado.titulo}</span>
        </div>
        <div class="status-description">
            ${estado.descripcion}
        </div>
        <div class="status-metrics">
            <div class="metric-item">
                <span class="metric-label">Densidad:</span>
                <span class="metric-value">${density.toFixed(1)}%</span>
                <span class="metric-desc">→ ${getDensityLabel(density)}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Flujo vehicular:</span>
                <span class="metric-value">${throughput.toFixed(1)} veh/s</span>
                <span class="metric-desc">→ ${getThroughputLabel(throughput)}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Velocidad:</span>
                <span class="metric-value">${speed.toFixed(1)}%</span>
                <span class="metric-desc">→ ${getSpeedLabel(speed)}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Tasa cambio:</span>
                <span class="metric-value">${netGeneration.toFixed(1)} veh/s</span>
                <span class="metric-desc">→ ${getNetGenerationLabel(netGeneration)}</span>
            </div>
        </div>
        <div class="status-observations">
            <div class="observations-title">💡 ${estado.observaciones.length > 0 ? 'Observaciones:' : ''}</div>
            ${estado.observaciones.map(obs => `<div class="observation-item">• ${obs}</div>`).join('')}
        </div>
    `;
}

/**
 * Obtiene la etiqueta descriptiva para la densidad
 * Basado en teoría de tráfico: óptimo ~40-60%, crítico >85%
 */
function getDensityLabel(density) {
    if (density < 15) return 'Muy baja';
    if (density < 25) return 'Baja';
    if (density < 45) return 'Moderada';
    if (density < 60) return 'Buena ocupación';
    if (density < 75) return 'Alta';
    if (density < 85) return 'Muy alta';
    return 'Crítica';
}

/**
 * Obtiene la etiqueta descriptiva para la tasa de cambio neta (netGeneration)
 * Considera tanto crecimiento (+) como decrecimiento (-)
 */
function getNetGenerationLabel(netGen) {
    if (netGen < -3) return 'Decrecimiento rápido';
    if (netGen < -1) return 'Decrecimiento lento';
    if (netGen >= -1 && netGen <= 1) return 'Estable';
    if (netGen < 3) return 'Crecimiento lento';
    if (netGen < 6) return 'Crecimiento moderado';
    return 'Crecimiento rápido';
}

/**
 * Obtiene la etiqueta descriptiva para el throughput (flujo real Q=k×v)
 * Máximo práctico: ~4.0 veh/s (density=50% × speed=80% × 10)
 */
function getThroughputLabel(throughput) {
    if (throughput < 0.8) return 'Muy bajo';
    if (throughput < 2.0) return 'Bajo';
    if (throughput < 3.0) return 'Moderado';
    if (throughput < 4.0) return 'Bueno';
    if (throughput < 4.5) return 'Alto';
    return 'Excelente';
}

/**
 * Obtiene la etiqueta descriptiva para la velocidad
 * Ajustado para autómata celular con intersecciones (difícil alcanzar >80%)
 */
function getSpeedLabel(speed) {
    if (speed < 15) return 'Detenido';
    if (speed < 30) return 'Lento';
    if (speed < 50) return 'Moderado';
    if (speed < 70) return 'Fluido';
    if (speed < 80) return 'Muy fluido';
    return 'Excelente';
}

// ==================== FUNCIONES DE CÁLCULO DE MÉTRICAS ====================

/**
 * Calcula las métricas de tráfico actuales
 * @returns {Object} Objeto con densidad, flujo, velocidad, entropía y total de vehículos
 */
function calculateMetrics() {
    let totalCars = 0;
    let totalCells = 0;
    let carsInMotion = 0;

    // Contador de transiciones/reglas del autómata celular para entropía de Shannon
    // Tipos de transiciones:
    // 0: STAY_EMPTY (0→0) - celda permanece vacía
    // 1: ADVANCE (0→V desde V anterior) - vehículo avanza
    // 2: STOPPED (V→V sin V anterior) - vehículo se detiene
    // 3: MOVE_OUT (V→0) - vehículo sale de celda
    // 4: SPAWN (0→V sin V anterior) - vehículo aparece (generación)
    const transitionCount = new Array(5).fill(0);

    // Acceder a la variable global 'calles' definida en trafico.js
    if (!window.calles) {
        console.warn('No se encontró la variable global calles');
        return {
            density: 0,
            flow: 0,
            speed: 0,
            entropy: 0,
            totalCars: 0
        };
    }

    // Guardar estado actual y calcular transiciones
    const currentStates = new Map();

    window.calles.forEach((calle, calleIdx) => {
        for (let c = 0; c < calle.carriles; c++) {
            totalCells += calle.tamano;

            for (let i = 0; i < calle.tamano; i++) {
                const cellValue = calle.arreglo[c][i];
                const cellKey = `${calleIdx}-${c}-${i}`;

                // Guardar estado actual
                currentStates.set(cellKey, cellValue);

                // Contar vehículos
                if (cellValue > 0) {
                    totalCars++;
                    const nextIndex = (i + 1) % calle.tamano;
                    if (calle.arreglo[c][nextIndex] === 0) {
                        carsInMotion++;
                    }
                }

                // Calcular transiciones comparando con estado anterior
                const prevValue = previousStreetStates.get(cellKey) ?? 0;
                const prevCellKey = `${calleIdx}-${c}-${Math.max(0, i - 1)}`;
                const prevLeftValue = i > 0 ? (previousStreetStates.get(prevCellKey) ?? 0) : 0;

                // Clasificar la transición
                if (prevValue === 0 && cellValue === 0) {
                    // STAY_EMPTY: celda permanece vacía
                    transitionCount[0]++;
                } else if (prevValue === 0 && cellValue > 0) {
                    // Vehículo aparece en celda
                    if (prevLeftValue > 0) {
                        // ADVANCE: vehículo avanzó desde celda anterior
                        transitionCount[1]++;
                    } else {
                        // SPAWN: vehículo generado (apareció de la nada)
                        transitionCount[4]++;
                    }
                } else if (prevValue > 0 && cellValue > 0) {
                    // STOPPED: vehículo permanece en la misma celda
                    transitionCount[2]++;
                } else if (prevValue > 0 && cellValue === 0) {
                    // MOVE_OUT: vehículo salió de la celda
                    transitionCount[3]++;
                }
            }
        }
    });

    // Actualizar estado anterior para el siguiente paso
    previousStreetStates = currentStates;

    // Calcular densidad como porcentaje de ocupación
    const density = totalCells > 0 ? (totalCars / totalCells) * 100 : 0;

    // Calcular Entropía de Shannon basada en transiciones del autómata celular
    // H = -Σ(p_i * log2(p_i)) donde p_i es la proporción de cada tipo de transición
    let entropy = 0;
    if (totalCells > 0) {
        for (let i = 0; i < transitionCount.length; i++) {
            if (transitionCount[i] > 0) {
                const p_i = transitionCount[i] / totalCells;
                // Usar log2 = log(x) / log(2)
                entropy -= p_i * (Math.log(p_i) / Math.log(2));
            }
        }
    }

    // Calcular tasa de cambio neta de población (antes llamado "flujo")
    // Usar tiempo virtual si está disponible, de lo contrario usar tiempo real
    const now = window.obtenerMillisVirtuales ? window.obtenerMillisVirtuales() : Date.now();

    // Inicializar en primera medición
    if (lastFlowMeasure === null) {
        lastFlowMeasure = now;
    }

    const timeDiff = (now - lastFlowMeasure) / 1000;

    // Solo actualizar cada segundo, pero mantener el último valor calculado
    if (timeDiff >= 1) {
        lastFlowValue = Math.abs(totalCars - previousCarCount) / timeDiff;
        previousCarCount = totalCars;
        lastFlowMeasure = now;
    }

    // Calcular velocidad promedio como porcentaje de vehículos en movimiento
    const avgSpeed = totalCars > 0 ? (carsInMotion / totalCars) * 100 : 0;

    // Calcular throughput real usando la ecuación fundamental del tráfico
    // Q = k × v (Flujo = Densidad × Velocidad)
    // Donde:
    // - k (densidad) = vehículos / celdas totales
    // - v (velocidad) = fracción de vehículos en movimiento
    // - Factor de escala temporal: asumiendo ~10 updates/segundo en promedio
    const densityRatio = totalCells > 0 ? totalCars / totalCells : 0;
    const speedRatio = avgSpeed / 100; // Convertir porcentaje a fracción
    const temporalScaleFactor = 10; // Aproximación de frames de simulación por segundo
    const throughput = densityRatio * speedRatio * temporalScaleFactor;

    return {
        density: density.toFixed(2),
        netGeneration: lastFlowValue.toFixed(2), // Tasa de cambio de población
        throughput: throughput.toFixed(2), // Flujo vehicular real (Q = k × v)
        speed: avgSpeed.toFixed(2),
        entropy: entropy.toFixed(3), // Entropía de Shannon (bits)
        totalCars: totalCars
    };
}

/**
 * Actualiza el historial de métricas con nuevos datos
 * @param {Object} metrics - Métricas calculadas
 */
function updateMetricsHistory(metrics) {
    // Usar tiempo virtual si está disponible, de lo contrario usar tiempo real
    let timeStr;
    if (window.obtenerTimestampCorto) {
        timeStr = window.obtenerTimestampCorto();
    } else {
        const now = new Date();
        timeStr = now.getHours().toString().padStart(2, '0') + ':' +
                  now.getMinutes().toString().padStart(2, '0') + ':' +
                  now.getSeconds().toString().padStart(2, '0');
    }

    // Agregar al historial limitado (para gráficas)
    metricsHistory.timestamps.push(timeStr);
    metricsHistory.density.push(parseFloat(metrics.density));
    metricsHistory.netGeneration.push(parseFloat(metrics.netGeneration));
    metricsHistory.throughput.push(parseFloat(metrics.throughput));
    metricsHistory.speed.push(parseFloat(metrics.speed));
    metricsHistory.entropy.push(parseFloat(metrics.entropy));

    // Agregar al historial COMPLETO (sin límite, para exportación)
    completeMetricsHistory.timestamps.push(timeStr);
    completeMetricsHistory.density.push(parseFloat(metrics.density));
    completeMetricsHistory.netGeneration.push(parseFloat(metrics.netGeneration));
    completeMetricsHistory.throughput.push(parseFloat(metrics.throughput));
    completeMetricsHistory.speed.push(parseFloat(metrics.speed));
    completeMetricsHistory.entropy.push(parseFloat(metrics.entropy));

    // Limitar el historial de gráficas al número máximo de puntos de datos
    if (metricsHistory.timestamps.length > metricsHistory.maxDataPoints) {
        metricsHistory.timestamps.shift();
        metricsHistory.density.shift();
        metricsHistory.netGeneration.shift();
        metricsHistory.throughput.shift();
        metricsHistory.speed.shift();
        metricsHistory.entropy.shift();
    }
}

/**
 * Actualiza las métricas cada 5 frames para optimizar rendimiento
 * Esta función debe ser llamada desde el loop de simulación
 */
function updateMetrics() {
    metricsUpdateCounter++;

    if (metricsUpdateCounter % 5 === 0) {
        const metrics = calculateMetrics();
        updateMetricsHistory(metrics);
        updateCharts();

        // Interpretar métricas y actualizar panel de estado
        const estado = interpretarMetricas(metrics);
        actualizarPanelInterpretacion(estado, metrics);
    }
}

// ==================== FUNCIONES DE INICIALIZACIÓN Y ACTUALIZACIÓN DE GRÁFICAS ====================

/**
 * Inicializa las tres gráficas de Chart.js (densidad, flujo, velocidad)
 */
function initializeCharts() {
    if (!window.Chart) {
        console.error('Chart.js no está cargado');
        return;
    }

    // Configuración común para todas las gráficas
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Desactivar animaciones para mejor rendimiento en tiempo real
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 8,
                displayColors: false
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    maxTicksLimit: 6,
                    font: {
                        size: 10
                    }
                }
            },
            y: {
                display: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    // Gráfica de Densidad
    const densityCtx = document.getElementById('densityChart');
    if (densityCtx) {
        densityChartInstance = new Chart(densityCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '% Ocupación',
                    data: [],
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        padding: 12,
                        displayColors: false,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                return 'Densidad de Tráfico';
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                return [
                                    `${value.toFixed(1)}% de ocupación`,
                                    '',
                                    getDensityLabel(value),
                                    '',
                                    'Ideal: 30-60%',
                                    '>80% = Congestión'
                                ];
                            }
                        }
                    }
                },
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0,
                        max: 100,
                        ticks: {
                            ...commonOptions.scales.y.ticks,
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfica de Throughput (Flujo Vehicular Real Q=k×v)
    const throughputCtx = document.getElementById('throughputChart');
    if (throughputCtx) {
        throughputChartInstance = new Chart(throughputCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'veh/seg',
                    data: [],
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        padding: 12,
                        displayColors: false,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                return 'Flujo vehicular';
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                return [
                                    `${value.toFixed(1)} vehículos/seg`,
                                    '',
                                    getThroughputLabel(value),
                                    '',
                                    'Flujo = Densidad% × Velocidad%',
                                    '≥4.5 veh/s = Excelente',
                                    '2.5-4 veh/s = Óptimo',
                                    '<2 veh/s = Bajo'
                                ];
                            }
                        }
                    }
                },
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0,
                        suggestedMax: 6
                    }
                }
            }
        });
    }

    // Gráfica de Tasa de Cambio (Net Generation)
    const netGenCtx = document.getElementById('netGenerationChart');
    if (netGenCtx) {
        netGenerationChartInstance = new Chart(netGenCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'veh/seg',
                    data: [],
                    borderColor: '#fd7e14',
                    backgroundColor: 'rgba(253, 126, 20, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        padding: 12,
                        displayColors: false,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                return 'Tasa de Cambio';
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                return [
                                    `${value.toFixed(1)} vehículos/seg`,
                                    '',
                                    getNetGenerationLabel(value),
                                    '',
                                    'Cambio neto de población',
                                    '>6 veh/s = Crecimiento rápido',
                                    '<1 veh/s = Estable'
                                ];
                            }
                        }
                    }
                },
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0,
                        suggestedMax: 10
                    }
                }
            }
        });
    }

    // Gráfica de Velocidad
    const speedCtx = document.getElementById('speedChart');
    if (speedCtx) {
        speedChartInstance = new Chart(speedCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '% Movimiento',
                    data: [],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        padding: 12,
                        displayColors: false,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                return 'Velocidad Promedio';
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                return [
                                    `${value.toFixed(1)}% en movimiento`,
                                    '',
                                    getSpeedLabel(value),
                                    '',
                                    '>60% = Fluido',
                                    '<30% = Casi detenido'
                                ];
                            }
                        }
                    }
                },
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0,
                        max: 100,
                        ticks: {
                            ...commonOptions.scales.y.ticks,
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfica de Entropía de Shannon
    const entropyCtx = document.getElementById('entropyChart');
    if (entropyCtx) {
        entropyChartInstance = new Chart(entropyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'bits',
                    data: [],
                    borderColor: '#6f42c1',
                    backgroundColor: 'rgba(111, 66, 193, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        padding: 12,
                        displayColors: false,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                return 'Entropía de Shannon (AC)';
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                return [
                                    `${value.toFixed(3)} bits`,
                                    '',
                                    'Mide la diversidad de REGLAS',
                                    'aplicadas en el autómata celular',
                                    '',
                                    'Reglas medidas:',
                                    '• Celda vacía (permanece)',
                                    '• Vehículo avanza',
                                    '• Vehículo se detiene',
                                    '• Vehículo sale',
                                    '• Vehículo generado',
                                    '',
                                    'Máximo: 2.322 bits (5 reglas)',
                                    '0 bits = Una sola regla activa',
                                    'Alto = Reglas variadas'
                                ];
                            }
                        }
                    }
                },
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0,
                        max: 2.5,
                        ticks: {
                            ...commonOptions.scales.y.ticks,
                            callback: function(value) {
                                return value.toFixed(1) + ' bits';
                            }
                        }
                    }
                }
            }
        });
    }

    console.log('✅ Gráficas de Chart.js inicializadas correctamente');
}

/**
 * Actualiza los datos de las cinco gráficas
 */
function updateCharts() {
    if (!window.Chart) return;

    // Actualizar gráfica de densidad
    if (densityChartInstance) {
        densityChartInstance.data.labels = metricsHistory.timestamps;
        densityChartInstance.data.datasets[0].data = metricsHistory.density;
        densityChartInstance.update('none'); // 'none' evita animaciones
    }

    // Actualizar gráfica de throughput
    if (throughputChartInstance) {
        throughputChartInstance.data.labels = metricsHistory.timestamps;
        throughputChartInstance.data.datasets[0].data = metricsHistory.throughput;
        throughputChartInstance.update('none');
    }

    // Actualizar gráfica de tasa de cambio
    if (netGenerationChartInstance) {
        netGenerationChartInstance.data.labels = metricsHistory.timestamps;
        netGenerationChartInstance.data.datasets[0].data = metricsHistory.netGeneration;
        netGenerationChartInstance.update('none');
    }

    // Actualizar gráfica de velocidad
    if (speedChartInstance) {
        speedChartInstance.data.labels = metricsHistory.timestamps;
        speedChartInstance.data.datasets[0].data = metricsHistory.speed;
        speedChartInstance.update('none');
    }

    // Actualizar gráfica de entropía
    if (entropyChartInstance) {
        entropyChartInstance.data.labels = metricsHistory.timestamps;
        entropyChartInstance.data.datasets[0].data = metricsHistory.entropy;
        entropyChartInstance.update('none');
    }
}

/**
 * Actualiza los colores de las gráficas según el modo oscuro/claro
 * @param {boolean} modoOscuro - true para modo oscuro, false para modo claro
 */
function actualizarColoresGraficas(modoOscuro) {
    if (!densityChartInstance || !throughputChartInstance || !netGenerationChartInstance || !speedChartInstance || !entropyChartInstance) return;

    const gridColor = modoOscuro ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const tickColor = modoOscuro ? '#c0c0c0' : '#666';

    // Actualizar Densidad
    if (densityChartInstance) {
        densityChartInstance.options.scales.x.ticks.color = tickColor;
        densityChartInstance.options.scales.y.ticks.color = tickColor;
        densityChartInstance.options.scales.y.grid.color = gridColor;
        densityChartInstance.data.datasets[0].borderColor = modoOscuro ? '#5a9fd4' : '#0d6efd';
        densityChartInstance.data.datasets[0].backgroundColor = modoOscuro ? 'rgba(90, 159, 212, 0.2)' : 'rgba(13, 110, 253, 0.2)';
        densityChartInstance.update('none');
    }

    // Actualizar Throughput
    if (throughputChartInstance) {
        throughputChartInstance.options.scales.x.ticks.color = tickColor;
        throughputChartInstance.options.scales.y.ticks.color = tickColor;
        throughputChartInstance.options.scales.y.grid.color = gridColor;
        throughputChartInstance.data.datasets[0].borderColor = modoOscuro ? '#6dc98d' : '#198754';
        throughputChartInstance.data.datasets[0].backgroundColor = modoOscuro ? 'rgba(109, 201, 141, 0.1)' : 'rgba(25, 135, 84, 0.1)';
        throughputChartInstance.update('none');
    }

    // Actualizar Tasa de Cambio
    if (netGenerationChartInstance) {
        netGenerationChartInstance.options.scales.x.ticks.color = tickColor;
        netGenerationChartInstance.options.scales.y.ticks.color = tickColor;
        netGenerationChartInstance.options.scales.y.grid.color = gridColor;
        netGenerationChartInstance.data.datasets[0].borderColor = modoOscuro ? '#f5a76a' : '#fd7e14';
        netGenerationChartInstance.data.datasets[0].backgroundColor = modoOscuro ? 'rgba(245, 167, 106, 0.1)' : 'rgba(253, 126, 20, 0.1)';
        netGenerationChartInstance.update('none');
    }

    // Actualizar Velocidad
    if (speedChartInstance) {
        speedChartInstance.options.scales.x.ticks.color = tickColor;
        speedChartInstance.options.scales.y.ticks.color = tickColor;
        speedChartInstance.options.scales.y.grid.color = gridColor;
        speedChartInstance.data.datasets[0].borderColor = modoOscuro ? '#e8c888' : '#ffc107';
        speedChartInstance.data.datasets[0].backgroundColor = modoOscuro ? 'rgba(232, 200, 136, 0.1)' : 'rgba(255, 193, 7, 0.1)';
        speedChartInstance.update('none');
    }

    // Actualizar Entropía
    if (entropyChartInstance) {
        entropyChartInstance.options.scales.x.ticks.color = tickColor;
        entropyChartInstance.options.scales.y.ticks.color = tickColor;
        entropyChartInstance.options.scales.y.grid.color = gridColor;
        entropyChartInstance.data.datasets[0].borderColor = modoOscuro ? '#9d7dd3' : '#6f42c1';
        entropyChartInstance.data.datasets[0].backgroundColor = modoOscuro ? 'rgba(157, 125, 211, 0.2)' : 'rgba(111, 66, 193, 0.2)';
        entropyChartInstance.update('none');
    }
}

// ==================== FUNCIONES DE EXPORTACIÓN DE MÉTRICAS ====================

/**
 * Exporta las métricas a formato CSV (TODAS las medidas desde el inicio)
 */
function descargarMetricasCSV() {
    if (completeMetricsHistory.timestamps.length === 0) {
        alert('No hay métricas para exportar. Ejecuta la simulación primero.');
        return;
    }

    // Función auxiliar para calcular estadísticas
    const calcularEstadisticas = (arr) => {
        if (arr.length === 0) return { avg: 0, min: 0, max: 0 };
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        return { avg: avg.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) };
    };

    // Calcular estadísticas del historial COMPLETO
    const densityStats = calcularEstadisticas(completeMetricsHistory.density);
    const throughputStats = calcularEstadisticas(completeMetricsHistory.throughput);
    const netGenStats = calcularEstadisticas(completeMetricsHistory.netGeneration);
    const speedStats = calcularEstadisticas(completeMetricsHistory.speed);
    const entropyStats = calcularEstadisticas(completeMetricsHistory.entropy);

    // Metadata del tiempo virtual (en español)
    let csvContent = '';
    if (window.configuracionTiempo && window.obtenerTimestampVirtual) {
        csvContent += 'FLUVI - Simulador de Trafico - Exportacion de Metricas\n';
        csvContent += `Tiempo Virtual: ${window.obtenerTimestampVirtual()}\n`;
        csvContent += `Perfiles Dinamicos Activos: ${window.configuracionTiempo.usarPerfiles ? 'Si' : 'No'}\n`;
        csvContent += `Tiempo por Paso: ${window.SEGUNDOS_POR_PASO || 1.0} segundo(s) simulados\n`;
        csvContent += `Total de Mediciones: ${completeMetricsHistory.timestamps.length}\n`;
        csvContent += '\n';
    }

    // Encabezado de datos (en español)
    csvContent += 'Marca de Tiempo,Densidad (%),Flujo (veh/s),Generacion Neta (veh/s),Velocidad (% movimiento),Entropia (bits)\n';

    // Datos de series temporales (TODAS las medidas desde el inicio)
    for (let i = 0; i < completeMetricsHistory.timestamps.length; i++) {
        csvContent += `${completeMetricsHistory.timestamps[i]},${completeMetricsHistory.density[i]},${completeMetricsHistory.throughput[i]},${completeMetricsHistory.netGeneration[i]},${completeMetricsHistory.speed[i]},${completeMetricsHistory.entropy[i]}\n`;
    }

    // Agregar línea en blanco y sección de estadísticas (en español)
    csvContent += '\n';
    csvContent += 'ESTADISTICAS\n';
    csvContent += 'Metrica,Promedio,Minimo,Maximo\n';
    csvContent += `Densidad (%),${densityStats.avg},${densityStats.min},${densityStats.max}\n`;
    csvContent += `Flujo (veh/s),${throughputStats.avg},${throughputStats.min},${throughputStats.max}\n`;
    csvContent += `Generacion Neta (veh/s),${netGenStats.avg},${netGenStats.min},${netGenStats.max}\n`;
    csvContent += `Velocidad (% movimiento),${speedStats.avg},${speedStats.min},${speedStats.max}\n`;
    csvContent += `Entropia (bits),${entropyStats.avg},${entropyStats.min},${entropyStats.max}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generar nombre de archivo con tiempo virtual si está disponible
    let fileName;
    if (window.configuracionTiempo && window.obtenerDiaString) {
        const dia = window.obtenerDiaString();
        const hora = Math.floor(window.configuracionTiempo.horaActual).toString().padStart(2, '0');
        const minuto = Math.floor(window.configuracionTiempo.minutoActual).toString().padStart(2, '0');
        fileName = `metricas_trafico_${dia}_${hora}h${minuto}m.csv`;
    } else {
        const now = new Date();
        fileName = `metricas_trafico_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.csv`;
    }

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✅ Métricas exportadas a CSV: ${fileName} (${completeMetricsHistory.timestamps.length} mediciones)`);
}

/**
 * Exporta las métricas a formato JSON
 */
function descargarMetricasJSON() {
    if (metricsHistory.timestamps.length === 0) {
        alert('No hay métricas para exportar. Ejecuta la simulación primero.');
        return;
    }

    const calcularEstadisticas = (arr) => {
        if (arr.length === 0) return { avg: 0, min: 0, max: 0 };
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        return { avg: avg.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) };
    };

    // Construir metadata con información de tiempo virtual
    const metadata = {
        version: '2.2',
        exportDate: new Date().toISOString(),
        simulationName: 'FLUVI Traffic Simulation',
        totalDataPoints: metricsHistory.timestamps.length,
        metricsDescription: {
            density: 'Porcentaje de celdas ocupadas',
            throughput: 'Flujo vehicular real (Q = Densidad × Velocidad) en veh/s',
            netGeneration: 'Tasa de cambio neta de población vehicular en veh/s',
            speed: 'Porcentaje de vehículos en movimiento',
            entropy: 'Entropía de Shannon del autómata celular en bits (mide diversidad de reglas/transiciones aplicadas: vacío, avanzar, detenerse, salir, generar)'
        }
    };

    // Agregar información de tiempo virtual si está disponible
    if (window.configuracionTiempo && window.obtenerTimestampVirtual) {
        metadata.virtualTime = {
            currentTime: window.obtenerTimestampVirtual(),
            day: window.obtenerDiaString(),
            hour: Math.floor(window.configuracionTiempo.horaActual),
            minute: Math.floor(window.configuracionTiempo.minutoActual),
            second: Math.floor(window.configuracionTiempo.segundoActual),
            profilesActive: window.configuracionTiempo.usarPerfiles,
            secondsPerStep: window.SEGUNDOS_POR_PASO || 1.0,
            currentMultiplier: window.obtenerMultiplicadorTrafico ? window.obtenerMultiplicadorTrafico() : 1.0,
            trafficDescription: window.obtenerDescripcionTrafico ? window.obtenerDescripcionTrafico() : 'Unknown'
        };
    }

    const data = {
        metadata: metadata,
        metrics: {
            timestamps: metricsHistory.timestamps,
            density: metricsHistory.density,
            throughput: metricsHistory.throughput,
            netGeneration: metricsHistory.netGeneration,
            speed: metricsHistory.speed,
            entropy: metricsHistory.entropy
        },
        statistics: {
            density: calcularEstadisticas(metricsHistory.density),
            throughput: calcularEstadisticas(metricsHistory.throughput),
            netGeneration: calcularEstadisticas(metricsHistory.netGeneration),
            speed: calcularEstadisticas(metricsHistory.speed),
            entropy: calcularEstadisticas(metricsHistory.entropy)
        }
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generar nombre de archivo con tiempo virtual si está disponible
    let fileName;
    if (window.configuracionTiempo && window.obtenerDiaString) {
        const dia = window.obtenerDiaString();
        const hora = Math.floor(window.configuracionTiempo.horaActual).toString().padStart(2, '0');
        const minuto = Math.floor(window.configuracionTiempo.minutoActual).toString().padStart(2, '0');
        fileName = `metricas_trafico_${dia}_${hora}h${minuto}m.json`;
    } else {
        const now = new Date();
        fileName = `metricas_trafico_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.json`;
    }

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Métricas exportadas a JSON: ${fileName}`);
}

/**
 * Limpia el historial de métricas y actualiza las gráficas
 */
function limpiarMetricas() {
    if (completeMetricsHistory.timestamps.length === 0) {
        alert('No hay métricas para limpiar.');
        return;
    }

    if (confirm('¿Estás seguro de que deseas limpiar todas las métricas? Esta acción no se puede deshacer.')) {
        // Limpiar historial de gráficas
        metricsHistory.timestamps = [];
        metricsHistory.density = [];
        metricsHistory.throughput = [];
        metricsHistory.netGeneration = [];
        metricsHistory.speed = [];
        metricsHistory.entropy = [];

        // Limpiar historial COMPLETO
        completeMetricsHistory.timestamps = [];
        completeMetricsHistory.density = [];
        completeMetricsHistory.throughput = [];
        completeMetricsHistory.netGeneration = [];
        completeMetricsHistory.speed = [];
        completeMetricsHistory.entropy = [];

        updateCharts();

        console.log('✅ Métricas limpiadas exitosamente (historial completo y gráficas)');
        alert('Métricas limpiadas exitosamente');
    }
}

// ==================== INICIALIZACIÓN AL CARGAR LA PÁGINA ====================

window.addEventListener('load', () => {
    if (window.Chart) {
        initializeCharts();
    } else {
        console.error('Chart.js no se cargó correctamente');
    }
});

// ==================== EVENT LISTENERS PARA BOTONES DE EXPORTACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
    // Botón para descargar CSV
    const btnDescargarCSV = document.getElementById('btnDescargarCSV');
    if (btnDescargarCSV) {
        btnDescargarCSV.addEventListener('click', descargarMetricasCSV);
    }

    // Botón para descargar JSON
    const btnDescargarJSON = document.getElementById('btnDescargarJSON');
    if (btnDescargarJSON) {
        btnDescargarJSON.addEventListener('click', descargarMetricasJSON);
    }

    // Botón para limpiar métricas
    const btnLimpiarMetricas = document.getElementById('btnLimpiarMetricas');
    if (btnLimpiarMetricas) {
        btnLimpiarMetricas.addEventListener('click', limpiarMetricas);
    }

    // Botón para abrir modal de mapa de calor
    const btnMapaCalor = document.getElementById('btnMapaCalor');
    if (btnMapaCalor) {
        btnMapaCalor.addEventListener('click', () => {
            if (!window.heatmapModal) {
                mostrarError('Error', 'El módulo de mapa de calor no está cargado');
                return;
            }

            // Abrir el modal (se renderiza una sola vez al abrirse)
            window.heatmapModal.open();
            console.log('🌡️ Abriendo modal de mapa de calor');
        });
    }
});

// ==================== EXPONER FUNCIONES AL SCOPE GLOBAL ====================

// Exponer funciones necesarias para ser llamadas desde otros módulos
window.updateMetrics = updateMetrics;
window.actualizarColoresGraficas = actualizarColoresGraficas;
window.initializeCharts = initializeCharts;
window.updateCharts = updateCharts;
window.descargarMetricasCSV = descargarMetricasCSV;
window.descargarMetricasJSON = descargarMetricasJSON;
window.limpiarMetricas = limpiarMetricas;
