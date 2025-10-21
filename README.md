# FLUVI - Simulador de Tráfico Vehicular

Sistema de simulación de tráfico vehicular basado en autómatas celulares para el análisis y optimización del flujo vehicular en vialidades cercanas al IPN - ESCOM.

## Inicio Rápido

1. Abre `index.html` en tu navegador web
2. La simulación se cargará automáticamente
3. Usa el panel lateral para configurar calles y métricas

## Estructura del Proyecto

```
FLUVI/
├── index.html                         # Punto de entrada principal
├── docs/                              # Documentación del proyecto
│   └── CONSTRUCTOR.md                 # Documentación del constructor de mapas
├── src/                               # Código fuente
│   ├── js/                            # Módulos JavaScript
│   │   ├── core/                      # Lógica central de simulación
│   │   │   ├── trafico.js             # Motor principal de simulación
│   │   │   ├── graficas.js            # Módulo de  métricas
│   │   │   └── curvas.js              # Sistema de curvas en calles
│   │   └── ui/                        # Módulos de interfaz de usuario
│   │       ├── editor.js              # Editor visual de calles
│   │       ├── constructor.js         # Constructor de mapas
│   │       └── etiquetas.js           # Sistema de etiquetas
│   └── css/                           # Hojas de estilo
│       ├── estilos.css                # Estilos principales
│       └── minimapa.css               # Estilos del minimapa
├── assets/                            # Recursos estáticos
│   └── images/                        # Imágenes y texturas
│       ├── vehicles/                  # Sprites de vehículos
│       ├── buildings/                 # Texturas de edificios
│       ├── roads/                     # Texturas de carreteras
│       └── objects/                   # Objetos varios
```

## Características Principales

### Simulación de Tráfico
- **Autómatas Celulares**: Implementación de Regla 184 modificada
- **Multi-carril**: Soporte para múltiples carriles con cambios de carril dinámicos
- **Intersecciones**: Detección y resolución de colisiones con sistema de prioridad
- **Conexiones**: Tres tipos de conexiones (lineal, incorporación, probabilística)

### Interfaz de Usuario
- **Editor Visual**: Arrastra y rota calles con handles interactivos
- **Constructor de Mapas**: Crea simulaciones personalizadas desde cero
- **Métricas en Tiempo Real**: Gráficas de densidad, flujo y velocidad
- **Minimapa**: Vista general del área de simulación

### Funcionalidades Avanzadas
- **Calles Curvas**: Sistema de vértices con interpolación angular
- **Tooltips**: Información al pasar el cursor sobre calles y edificios
- **Arrastre con SHIFT**: Mueve calles fácilmente en modo edición
- **Exportar/Importar**: Guarda y carga simulaciones en formato JSON

## Métricas del Sistema

### Densidad (%)
- `<15%` - Muy baja
- `15-25%` - Baja
- `25-45%` - Moderada
- `45-60%` - Buena ocupación
- `60-75%` - Alta
- `75-85%` - Muy alta
- `≥85%` - Crítica

### Velocidad (%)
- `<15%` - Detenido
- `15-30%` - Lento
- `30-50%` - Moderado
- `50-70%` - Fluido
- `70-80%` - Muy fluido
- `≥80%` - Excelente

### Flujo Vehicular (veh/s)
- `<0.8` - Muy bajo
- `0.8-2.0` - Bajo
- `2.0-3.0` - Moderado
- `3.0-4.0` - Bueno
- `4.0-4.5` - Alto
- `≥4.5` - Excelente

### Tasa de Cambio (veh/s)
- `<-3` - Decrecimiento rápido
- `-3 a -1` - Decrecimiento lento
- `-1 a 1` - Estable
- `1 a 3` - Crecimiento lento
- `3 a 6` - Crecimiento moderado
- `≥6` - Crecimiento rápido

### Entropía de Shannon (bits)

Métrica que mide la **diversidad de reglas/transiciones** aplicadas en el autómata celular en cada paso de tiempo.

#### Fórmula
```
H = -Σ(p_i × log₂(p_i))
```

Donde `p_i` es la probabilidad empírica (frecuencia relativa) de cada regla:

```
p_i = (cantidad de veces que se usó la regla i) / (total de celdas)
```

#### Reglas/Transiciones Medidas

| ID | Regla | Transición | Descripción |
|----|-------|-----------|-------------|
| 0 | **STAY_EMPTY** | 0→0 | Celda permanece vacía |
| 1 | **ADVANCE** | 0→V | Vehículo avanza desde celda anterior |
| 2 | **STOPPED** | V→V | Vehículo se detiene/permanece en su posición |
| 3 | **MOVE_OUT** | V→0 | Vehículo sale de la celda |
| 4 | **SPAWN** | 0→V | Vehículo generado (aparece sin venir de celda anterior) |

**Nota**: V = vehículo (tipos 1-6), 0 = celda vacía

#### Interpretación de Valores

- **0 bits**: Sistema estático (una sola regla activa)
  - Ejemplo: Todas las celdas vacías o todos los vehículos detenidos
- **~1 bit**: Baja diversidad (predomina una o dos reglas)
  - Ejemplo: Mayormente vehículos detenidos con pocos avances
- **1.5-2 bits**: Diversidad moderada (mezcla balanceada de reglas)
  - Ejemplo: Sistema con flujo variado: algunos avanzan, otros se detienen
- **2.322 bits**: Máximo teórico (distribución uniforme de las 5 reglas)
  - Ejemplo: Todas las reglas se aplican con igual frecuencia

#### Rangos de Clasificación

- `<0.5` - Homogéneo (sistema muy simple)
- `0.5-1.0` - Baja diversidad
- `1.0-1.5` - Diversidad moderada-baja
- `1.5-2.0` - Diversidad moderada-alta
- `≥2.0` - Alta diversidad (sistema muy dinámico)

### Estados del Sistema

#### 🔴 COLAPSO
- **Condición**: `density >80% && speed <15%`
- **Descripción**: Las calles están severamente congestionadas y casi paralizadas
- **Throughput típico**: 0-1 veh/s
- **Acción requerida**: Reducir generación o mejorar salidas

#### 🟢 ÓPTIMO
- **Condición**: `throughput ≥2.5 && density 25-60% && speed ≥50%`
- **Descripción**: Máxima eficiencia del sistema: buen balance entre densidad y velocidad
- **Throughput típico**: 2.5-5 veh/s
- **Característica**: Sistema funcionando al máximo rendimiento

#### 🟠 CONGESTIONADO
- **Condición**: `density >65% && speed <35%`
- **Descripción**: Alta densidad vehicular con movimiento lento
- **Throughput típico**: 1-2 veh/s
- **Advertencia**: Riesgo de colapso si aumenta densidad

#### 🔵 SUB-UTILIZADO
- **Condición**: `density <25% && throughput <1.5`
- **Descripción**: Baja ocupación de las calles, capacidad disponible
- **Throughput típico**: 0-1.5 veh/s
- **Recomendación**: Considerar aumentar generación para aprovechar capacidad

#### 🟡 MODERADO
- **Condición**: Otras combinaciones
- **Descripción**: Condiciones de tráfico aceptables con margen de mejora
- **Throughput típico**: Variable
- **Característica**: Estado por defecto, funcional pero mejorable

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Canvas API**: Renderizado de gráficos
- **Bootstrap 5**: Framework de UI
- **Chart.js**: Visualización de métricas

## Documentación

- Ver `docs/CONSTRUCTOR.md` para usar el constructor de mapas

## Créditos

**Desarrolladores:**
- Connor Urbano Mendoza
- Luis Gael Molina Figueroa
- Denisse Marques Morales

**Directores:**
- Juárez Martínez Genaro
- Maldonado Castillo Idalia

**Institución:**
Instituto Politécnico Nacional (IPN)
Escuela Superior de Cómputo (ESCOM)

## Versión

1.0.0 - 2025

---

**FLUVI** - Sistema de Gestión del Flujo Vehicular en Vialidades
