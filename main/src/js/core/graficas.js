// ==================== SISTEMA DE MÉTRICAS Y GRÁFICAS ====================
// Este módulo contiene toda la funcionalidad relacionada con el cálculo,
// almacenamiento, visualización y exportación de métricas de tráfico

// ==================== VARIABLES GLOBALES ====================

// Historial de métricas con límite de 50 puntos de datos
const metricsHistory = {
    timestamps: [],
    density: [],
    netGeneration: [], // Tasa de cambio de población (antes "flow")
    throughput: [], // Flujo vehicular real (Q = k × v)
    speed: [],
    maxDataPoints: 50
};

// Variables auxiliares para el cálculo de flujo vehicular
let previousCarCount = 0;
let flowMeasureInterval = 1000;
let lastFlowMeasure = Date.now();
let lastFlowValue = 0; // Almacena el último flujo calculado para evitar parpadeos

// Instancias de Chart.js para cada gráfica
let densityChartInstance = null;
let throughputChartInstance = null;
let netGenerationChartInstance = null;
let speedChartInstance = null;

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
 * @returns {Object} Objeto con densidad, flujo, velocidad y total de vehículos
 */
function calculateMetrics() {
    let totalCars = 0;
    let totalCells = 0;
    let carsInMotion = 0;

    // Acceder a la variable global 'calles' definida en trafico.js
    if (!window.calles) {
        console.warn('No se encontró la variable global calles');
        return {
            density: 0,
            flow: 0,
            speed: 0,
            totalCars: 0
        };
    }

    window.calles.forEach(calle => {
        for (let c = 0; c < calle.carriles; c++) {
            totalCells += calle.tamano;
            for (let i = 0; i < calle.tamano; i++) {
                if (calle.arreglo[c][i] > 0) { // Cambiado de === 1 a > 0 para contar todos los tipos de vehículos (1-6)
                    totalCars++;
                    const nextIndex = (i + 1) % calle.tamano;
                    if (calle.arreglo[c][nextIndex] === 0) {
                        carsInMotion++;
                    }
                }
            }
        }
    });

    // Calcular densidad como porcentaje de ocupación
    const density = totalCells > 0 ? (totalCars / totalCells) * 100 : 0;

    // Calcular tasa de cambio neta de población (antes llamado "flujo")
    const now = Date.now();
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
        totalCars: totalCars
    };
}

/**
 * Actualiza el historial de métricas con nuevos datos
 * @param {Object} metrics - Métricas calculadas
 */
function updateMetricsHistory(metrics) {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' +
                    now.getMinutes().toString().padStart(2, '0') + ':' +
                    now.getSeconds().toString().padStart(2, '0');

    metricsHistory.timestamps.push(timeStr);
    metricsHistory.density.push(parseFloat(metrics.density));
    metricsHistory.netGeneration.push(parseFloat(metrics.netGeneration));
    metricsHistory.throughput.push(parseFloat(metrics.throughput));
    metricsHistory.speed.push(parseFloat(metrics.speed));

    // Limitar el historial al número máximo de puntos de datos
    if (metricsHistory.timestamps.length > metricsHistory.maxDataPoints) {
        metricsHistory.timestamps.shift();
        metricsHistory.density.shift();
        metricsHistory.netGeneration.shift();
        metricsHistory.throughput.shift();
        metricsHistory.speed.shift();
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

    console.log('✅ Gráficas de Chart.js inicializadas correctamente');
}

/**
 * Actualiza los datos de las cuatro gráficas
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
}

/**
 * Actualiza los colores de las gráficas según el modo oscuro/claro
 * @param {boolean} modoOscuro - true para modo oscuro, false para modo claro
 */
function actualizarColoresGraficas(modoOscuro) {
    if (!densityChartInstance || !throughputChartInstance || !netGenerationChartInstance || !speedChartInstance) return;

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
}

// ==================== FUNCIONES DE EXPORTACIÓN DE MÉTRICAS ====================

/**
 * Exporta las métricas a formato CSV
 */
function descargarMetricasCSV() {
    if (metricsHistory.timestamps.length === 0) {
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

    // Calcular estadísticas
    const densityStats = calcularEstadisticas(metricsHistory.density);
    const throughputStats = calcularEstadisticas(metricsHistory.throughput);
    const netGenStats = calcularEstadisticas(metricsHistory.netGeneration);
    const speedStats = calcularEstadisticas(metricsHistory.speed);

    // Encabezado de datos
    let csvContent = 'Timestamp,Density (%),Throughput (veh/s),Net Generation (veh/s),Speed (% movement)\n';

    // Datos de series temporales
    for (let i = 0; i < metricsHistory.timestamps.length; i++) {
        csvContent += `${metricsHistory.timestamps[i]},${metricsHistory.density[i]},${metricsHistory.throughput[i]},${metricsHistory.netGeneration[i]},${metricsHistory.speed[i]}\n`;
    }

    // Agregar línea en blanco y sección de estadísticas
    csvContent += '\n';
    csvContent += 'STATISTICS\n';
    csvContent += 'Metric,Average,Minimum,Maximum\n';
    csvContent += `Density (%),${densityStats.avg},${densityStats.min},${densityStats.max}\n`;
    csvContent += `Throughput (veh/s),${throughputStats.avg},${throughputStats.min},${throughputStats.max}\n`;
    csvContent += `Net Generation (veh/s),${netGenStats.avg},${netGenStats.min},${netGenStats.max}\n`;
    csvContent += `Speed (% movement),${speedStats.avg},${speedStats.min},${speedStats.max}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const fileName = `metricas_trafico_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Métricas exportadas a CSV: ${fileName}`);
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

    const data = {
        metadata: {
            version: '2.0',
            exportDate: new Date().toISOString(),
            simulationName: 'FLUVI Traffic Simulation',
            totalDataPoints: metricsHistory.timestamps.length,
            metricsDescription: {
                density: 'Porcentaje de celdas ocupadas',
                throughput: 'Flujo vehicular real (Q = Densidad × Velocidad) en veh/s',
                netGeneration: 'Tasa de cambio neta de población vehicular en veh/s',
                speed: 'Porcentaje de vehículos en movimiento'
            }
        },
        metrics: {
            timestamps: metricsHistory.timestamps,
            density: metricsHistory.density,
            throughput: metricsHistory.throughput,
            netGeneration: metricsHistory.netGeneration,
            speed: metricsHistory.speed
        },
        statistics: {
            density: calcularEstadisticas(metricsHistory.density),
            throughput: calcularEstadisticas(metricsHistory.throughput),
            netGeneration: calcularEstadisticas(metricsHistory.netGeneration),
            speed: calcularEstadisticas(metricsHistory.speed)
        }
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const fileName = `metricas_trafico_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.json`;

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
    if (metricsHistory.timestamps.length === 0) {
        alert('No hay métricas para limpiar.');
        return;
    }

    if (confirm('¿Estás seguro de que deseas limpiar todas las métricas? Esta acción no se puede deshacer.')) {
        metricsHistory.timestamps = [];
        metricsHistory.density = [];
        metricsHistory.throughput = [];
        metricsHistory.netGeneration = [];
        metricsHistory.speed = [];

        updateCharts();

        console.log('Métricas limpiadas exitosamente');
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
