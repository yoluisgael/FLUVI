# FLUVI - Simulador de Tráfico Vehicular

Sistema de simulación de tráfico vehicular basado en autómatas celulares para el análisis y optimización del flujo vehicular en vialidades cercanas al IPN - ESCOM.

## Requisitos

### Software Necesario
- **Python 3.x**: Para ejecutar el servidor HTTP local
- **Navegador Web Moderno**: Chrome, Firefox, Safari, Edge (últimas versiones)
- **WebGL**: Para aceleración GPU (opcional, fallback a Canvas 2D disponible)
- **Conexión a Internet**: Para cargar PixiJS desde CDN
- **JavaScript Habilitado**: Requerido para el funcionamiento

### ¿Por qué se necesita un servidor local?

WebGL y la carga de recursos (texturas, imágenes) requieren que la aplicación se ejecute desde un servidor HTTP debido a las políticas de seguridad CORS (Cross-Origin Resource Sharing) de los navegadores. **No es posible abrir el archivo `index.html` directamente** desde el sistema de archivos (`file://`) para que WebGL funcione correctamente.

## Inicio Rápido

### Paso 1: Iniciar el Servidor Local

**Opción A - Windows (Recomendado):**
```bash
# Navega a la carpeta main/
cd main

# Ejecuta el archivo .bat
INICIAR_SERVIDOR.bat
```

**Opción B - Cualquier Sistema Operativo:**
```bash
# Navega a la carpeta main/
cd main

# Ejecuta el servidor Python directamente
python servidor.py
```

El servidor se iniciará en el puerto **8000** y verás:
```
============================================================
SERVIDOR WEB PARA FLUVI - SIMULADOR DE TRAFICO
============================================================

Servidor iniciado correctamente!

Abre tu navegador y ve a:
   http://localhost:8000
   http://127.0.0.1:8000
```

### Paso 2: Abrir en el Navegador

1. Con el servidor ejecutándose, abre tu navegador
2. Navega a: **http://localhost:8000**
3. La simulación cargará automáticamente:
   - ✅ Inicialización de PixiJS con **WebGL habilitado**
   - ✅ Carga de texturas y assets desde `assets/images/`
   - ✅ Renderizado de la escena inicial con aceleración GPU
   - ✅ Sistema de capas activado

### Paso 3: Usar la Aplicación

Usa el panel lateral para:
- 🎛️ Configurar parámetros de simulación
- ✏️ Activar/desactivar modo de edición
- 📊 Ver métricas en tiempo real
- 💾 Exportar/importar configuraciones

**Controles de Cámara:**
- **Scroll**: Zoom in/out
- **Arrastre**: Pan (mover cámara)

**Modo Edición:**
- **SHIFT + Arrastre**: Mover calles
- **Click en calle/edificio**: Ver información
- **Handles** (círculos): Mover y rotar calles
- **Z**: Toggle modo edición de vértices (activar/desactivar)
  - Cuando está activo, arrastra cualquier vértice para crear curvas
  - Presiona Z nuevamente para desactivar el modo

**Atajos de Teclado:**
- **Ctrl+B**: Ocultar/mostrar panel lateral (sidebar)
- **Enter**: Aplicar cambios en el modal de fecha/hora (cuando los campos están enfocados)

### Detener el Servidor

Para detener el servidor, presiona **Ctrl+C** en la terminal donde se está ejecutando.

## Solución de Problemas

### ❌ "El puerto 8000 ya está en uso"
**Solución:** Otro proceso está usando el puerto 8000
- Cierra otras instancias del servidor
- O modifica `servidor.py` para usar otro puerto (ej: 8080, 3000)

### ❌ "WebGL no está disponible"
**Solución:** Tu navegador/GPU no soporta WebGL
- El sistema automáticamente usará Canvas 2D como fallback
- Verás el mensaje: "⚠️ WebGL no disponible, usando Canvas 2D renderer..."
- La aplicación funcionará, pero con menor rendimiento

### ❌ "No se cargan las texturas"
**Solución:** Estás abriendo `index.html` directamente con `file://`
- **Debes usar el servidor local** para que CORS permita cargar las imágenes
- Ejecuta `INICIAR_SERVIDOR.bat` y abre `http://localhost:8000`

### ❌ "Python no se reconoce como comando"
**Solución:** Python no está instalado o no está en el PATH
- Descarga Python desde: https://www.python.org/downloads/
- Durante la instalación, marca "Add Python to PATH"
- Reinicia la terminal después de instalar

### ✅ Verificar que WebGL está funcionando
Abre la consola del navegador (F12) y busca:
```
✅ WebGL disponible, usando aceleración GPU
✅ PixiApp inicializado correctamente
```

Si ves estos mensajes, **PixiJS está usando WebGL correctamente**.

## Estructura del Proyecto

```
FLUVI/
├── main/
│   ├── index.html                         # Punto de entrada principal
│   ├── INICIAR_SERVIDOR.bat              # Script para iniciar servidor (Windows)
│   ├── servidor.py                        # Servidor HTTP local (Python)
│   ├── docs/                              # Documentación del proyecto
│   │   └── CONSTRUCTOR.md                 # Documentación del constructor de mapas
│   └── src/
│       ├── js/
│       │   ├── core/                      # Lógica central de simulación
│       │   │   ├── trafico.js             # Motor principal de simulación y autómatas celulares
│       │   │   ├── tiempo.js              # Sistema de tiempo virtual (día/hora)
│       │   │   ├── graficas.js            # Sistema de métricas (densidad, flujo, velocidad)
│       │   │   ├── curvas.js              # Sistema de curvas y vértices en calles
│       │   │   └── ClickActionManager.js  # Gestor de clicks e interacciones
│       │   ├── renderer/                  # Sistema de renderizado con PixiJS
│       │   │   ├── PixiApp.js             # Aplicación principal de PixiJS (Singleton)
│       │   │   ├── SceneManager.js        # Gestor de escena y capas (Scene Graph)
│       │   │   ├── CameraController.js    # Sistema de cámara (zoom, pan)
│       │   │   ├── DayNightCycle.js       # Ciclo día/noche (colores de fondo)
│       │   │   ├── EditorHandles.js       # Handles de edición de calles
│       │   │   ├── renderers/             # Renderizadores especializados
│       │   │   │   ├── CalleRenderer.js   # Renderizado de calles
│       │   │   │   ├── CarroRenderer.js   # Renderizado de vehículos
│       │   │   │   ├── EdificioRenderer.js # Renderizado de edificios
│       │   │   │   ├── ConexionRenderer.js # Renderizado de conexiones
│       │   │   │   ├── UIRenderer.js      # Renderizado de UI (etiquetas)
│       │   │   │   └── MinimapRenderer.js # Renderizado del minimapa
│       │   │   └── utils/                 # Utilidades de renderizado
│       │   │       ├── AssetLoader.js     # Cargador de texturas y assets
│       │   │       └── CoordinateConverter.js # Conversión de coordenadas
│       │   └── ui/                        # Módulos de interfaz de usuario
│       │       ├── darkMode.js            # Sistema de modo oscuro
│       │       ├── loadingSystem.js       # Sistema de carga con progreso
│       │       ├── tooltips.js            # Inicialización de tooltips Bootstrap
│       │       ├── modalFixes.js          # Correcciones para modales
│       │       ├── consoleControl.js      # Control de logs de consola
│       │       ├── sidebarToggle.js       # Toggle del sidebar (Ctrl+B)
│       │       ├── infoBar.js             # Barra de información en tiempo real
│       │       ├── timeControl.js         # Control de fecha y hora del simulador
│       │       ├── editor.js              # Editor visual de calles
│       │       ├── constructor.js         # Constructor de mapas
│       │       └── etiquetas.js           # Sistema de etiquetas
│       └── css/                           # Hojas de estilo
│           ├── estilos.css                # Estilos principales
│           └── minimapa.css               # Estilos del minimapa
├── assets/                                # Recursos estáticos
│   └── images/                            # Imágenes y texturas
│       ├── vehicles/                      # Sprites de vehículos (PNG)
│       ├── buildings/                     # Texturas de edificios (PNG)
│       ├── roads/                         # Texturas de carreteras (PNG)
│       └── objects/                       # Objetos varios (PNG)
└── README.md                              # Este archivo
```

## Características Principales

### Simulación de Tráfico
- **Autómatas Celulares**: Implementación de Regla 184 modificada
- **Multi-carril**: Soporte para múltiples carriles con cambios de carril dinámicos
- **Intersecciones**: Detección y resolución de colisiones con sistema de prioridad
- **Conexiones**: Tres tipos de conexiones (lineal, incorporación, probabilística)
- **Sistema de Tiempo Virtual**: Simulación de días de la semana y horarios con avance dinámico
- **Multiplicador de Tráfico Dinámico**: Generación de vehículos que varía según día y hora (horas pico, valle, etc.)
- **Control Manual de Fecha/Hora**: Capacidad de modificar el tiempo simulado en cualquier momento

### Interfaz de Usuario
- **Editor Visual**: Arrastra y rota calles con handles interactivos
- **Constructor de Mapas**: Crea simulaciones personalizadas desde cero
- **Barra de Información en Tiempo Real**: Muestra generación, población de vehículos, hora simulada, tiempo por frame y multiplicador de tráfico
- **Control de Fecha y Hora**: Interfaz intuitiva para cambiar el día y hora del simulador con vista previa
- **Métricas en Tiempo Real**: Gráficas de densidad, flujo y velocidad
- **Minimapa**: Vista general del área de simulación
- **Modo Oscuro**: Toggle entre tema claro y oscuro con persistencia
- **Control de Sidebar**: Oculta/muestra el panel lateral con Ctrl+B

### Funcionalidades Avanzadas
- **Calles Curvas**: Sistema de vértices con interpolación angular
- **Tooltips Interactivos**: Información al pasar el cursor sobre calles y edificios
- **Arrastre con SHIFT**: Mueve calles fácilmente en modo edición
- **Handles de Edición**: Controles visuales para mover y rotar calles
- **Ciclo Día/Noche**: Cambio dinámico de colores de fondo según la hora simulada
- **Exportar/Importar**: Guarda y carga simulaciones en formato JSON
- **Renderizado por Capas**: Sistema de z-index para orden correcto de visualización
- **Cámara Interactiva**: Zoom con scroll y pan arrastrando el canvas

## Barra de Información (Info Bar)

La barra de información en tiempo real muestra métricas clave de la simulación en la parte superior de la pantalla:

### Generación
- **Descripción**: Contador de iteraciones del autómata celular (frames de simulación)
- **Formato**: Número entero con separadores de miles
- **Uso**: Indica cuántos pasos de simulación se han ejecutado desde el inicio

### Vehículos
- **Descripción**: Total de vehículos activos en todas las calles
- **Cálculo**: Cuenta todas las celdas con valores 1-6 (tipos de vehículos)
- **Formato**: Número entero con separadores de miles
- **Uso**: Monitorea la población vehicular en tiempo real

### Hora
- **Descripción**: Tiempo simulado actual (día, hora, minutos, segundos)
- **Formato**: `Día HH:MM:SS` (ej: "Lunes 14:35:42")
- **Sistema**: Tiempo virtual sincronizado con el multiplicador de tráfico
- **Control**: Modificable desde "Configuración de Escenarios" con interfaz modal

### Tiempo/Frame
- **Descripción**: Tiempo simulado que representa cada frame/generación
- **Formato**: Número decimal en segundos (ej: "0.512s")
- **Uso**: Indica cuánto tiempo simulado avanza en cada paso de simulación

### Multiplicador de Generación de Vehículos por Hora
- **Descripción**: Factor dinámico que modifica la tasa de generación de vehículos
- **Formato**: Número decimal con una cifra decimal + símbolo "×" (ej: "1.5×")
- **Rango**: Varía según el día de la semana y la hora del día
- **Sistema**: Basado en perfiles de tráfico realistas (hora pico, hora valle)
- **Uso**: Simula patrones de tráfico reales con mayor generación en horas pico

### Control de Fecha y Hora del Simulador

El sistema permite modificar manualmente la fecha y hora del simulador mediante una interfaz modal intuitiva:

**Ubicación**: Configuración de Escenarios → Control de Fecha y Hora

**Características**:
- Selector de día de la semana (Domingo a Sábado)
- Inputs numéricos para hora (0-23) y minutos (0-59)
- Vista previa en tiempo real del tiempo seleccionado
- Validación automática de rangos
- Aplicación con Enter o botón de confirmación
- Sincronización perfecta entre sidebar y barra de información
- Invalidación del cache de multiplicador al cambiar fecha/hora

**Uso**:
1. Click en "Abrir Configurador de Tiempo"
2. Selecciona día, hora y minutos deseados
3. Verifica la vista previa
4. Click en "✅ Confirmar y Aplicar"
5. El simulador ajusta inmediatamente el tiempo virtual

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

### Motor Gráfico
- **PixiJS v7+**: Motor de renderizado 2D de alto rendimiento
  - Renderizado acelerado por GPU mediante WebGL
  - Fallback automático a Canvas 2D si WebGL no está disponible
  - Scene Graph con sistema de capas (layers) y z-index
  - Sistema de sprites y texturas optimizado
  - Eventos interactivos nativos en objetos 2D
  - Pool de objetos para mejor gestión de memoria

### Arquitectura de Renderizado
- **PixiApp**: Singleton que gestiona el ciclo de vida de PixiJS
- **SceneManager**: Administra capas, sprites y el Scene Graph
  - Capas: background, streets, connections, vehicles, buildings, ui, debug
  - Tracking de sprites por tipo (calles, vehículos, edificios, conexiones)
  - Sistema de actualización selectiva para optimización
- **CameraController**: Gestión de zoom, pan y transformaciones de vista
- **Renderizadores Especializados**:
  - `CalleRenderer`: Renderizado de calles con texturas y orientación
  - `CarroRenderer`: Renderizado de vehículos con animación
  - `EdificioRenderer`: Renderizado de edificios con texturas
  - `ConexionRenderer`: Renderizado de conexiones entre calles
  - `UIRenderer`: Renderizado de etiquetas y elementos de UI
  - `MinimapRenderer`: Vista general del mapa
- **AssetLoader**: Carga asíncrona de texturas desde `assets/images/`
- **DayNightCycle**: Sistema de ciclo día/noche con interpolación de colores

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**: Tecnologías web modernas
- **Bootstrap 5**: Framework de UI para interfaz responsive
- **Chart.js**: Visualización de gráficas de métricas en tiempo real

### Simulación
- **Autómatas Celulares**: Motor de simulación basado en Regla 184 modificada
- **Sistema Multi-carril**: Lógica de cambio de carril y prioridades
- **Detección de Colisiones**: Sistema de intersecciones y resolución

## Arquitectura Técnica

### Arquitectura Modular de JavaScript

El proyecto utiliza una arquitectura modular con scripts separados por responsabilidad:

**Módulos Core (`src/js/core/`)**:
- `trafico.js`: Motor principal de simulación con autómatas celulares, control de velocidad y generación de vehículos
- `tiempo.js`: Sistema de tiempo virtual con soporte para días de la semana, horas, minutos y segundos. Incluye perfiles de multiplicador de tráfico por día/hora
- `graficas.js`: Recolección y cálculo de métricas (densidad, flujo, velocidad, entropía)
- `curvas.js`: Sistema de curvas Bézier para calles con interpolación angular
- `ClickActionManager.js`: Gestión centralizada de eventos de click e interacciones

**Módulos UI (`src/js/ui/`)**:
- `infoBar.js`: Sistema de información en tiempo real que actualiza la barra superior con generación, población, hora simulada, tiempo/frame y multiplicador
- `timeControl.js`: Control modal para modificar fecha y hora del simulador con sincronización perfecta
- `darkMode.js`: Toggle de modo oscuro con persistencia en localStorage
- `loadingSystem.js`: Pantalla de carga con barra de progreso durante inicialización
- `tooltips.js`: Inicialización de tooltips de Bootstrap 5 en elementos UI
- `modalFixes.js`: Correcciones para advertencias de accesibilidad en modales
- `consoleControl.js`: Sistema de activación/desactivación de logs de consola
- `sidebarToggle.js`: Control del panel lateral con atajo Ctrl+B y redimensionamiento de canvas
- `editor.js`: Editor visual de calles con modo de edición de vértices (toggle con tecla Z)
- `constructor.js`: Constructor interactivo de mapas desde cero
- `etiquetas.js`: Sistema de tooltips informativos sobre calles y edificios

**Módulos Renderer (`src/js/renderer/`)**:
- `PixiApp.js`: Singleton que maneja el ciclo de vida de PixiJS (WebGL/Canvas2D)
- `SceneManager.js`: Gestión de scene graph con sistema de capas y z-index
- `CameraController.js`: Control de cámara con zoom (scroll) y pan (arrastre)
- `DayNightCycle.js`: Interpolación de colores de fondo según hora simulada
- `EditorHandles.js`: Handles visuales para mover y rotar calles en modo edición
- Renderizadores especializados en `renderers/`: Cada tipo de objeto (calles, vehículos, edificios, conexiones, UI, minimapa) tiene su propio renderizador
- Utilidades en `utils/`: Carga de assets y conversión de coordenadas

**Beneficios de la Arquitectura Modular**:
- ✅ **Separación de Responsabilidades**: Cada módulo tiene una función específica y bien definida
- ✅ **Mantenibilidad**: Cambios en un módulo no afectan a otros
- ✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades sin modificar código existente
- ✅ **Reutilización**: Módulos pueden ser reutilizados en otros proyectos
- ✅ **Testing**: Cada módulo puede ser probado independientemente
- ✅ **Debugging**: Más fácil localizar y corregir errores
- ✅ **Colaboración**: Múltiples desarrolladores pueden trabajar en paralelo

### Flujo de Inicialización

1. **Carga de PixiJS**: Se carga la librería PixiJS desde CDN
2. **Inicialización de PixiApp**: Singleton que crea la aplicación PixiJS
   - Intenta usar WebGL con aceleración GPU
   - Si falla, usa Canvas 2D como fallback
   - Reemplaza el canvas HTML5 tradicional
3. **Carga de Assets**: `AssetLoader` carga todas las texturas de manera asíncrona
4. **Creación de Scene Graph**: `SceneManager` crea las capas de renderizado
5. **Inicialización de Renderizadores**: Se crean todos los renderizadores especializados
6. **Setup de Cámara**: `CameraController` configura zoom y pan
7. **Inicio del Loop**: PixiJS inicia el loop de renderizado automático

### Sistema de Capas (Z-Index)

```
Layer Debug (z: 40)      → Vértices, intersecciones (modo debug)
Layer UI (z: 30)         → Etiquetas, handles de edición
Layer Buildings (z: 25)  → Edificios
Layer Vehicles (z: 20)   → Vehículos (animados)
Layer Connections (z: 15) → Líneas de conexión entre calles
Layer Streets (z: 10)    → Calles con texturas
Layer Background (z: 0)  → Fondo (color sólido)
```

### Ciclo de Renderizado

```javascript
// Cada frame (60 FPS típico):
PixiApp.ticker → SceneManager.update(delta) → {
  1. Actualizar color de fondo (DayNightCycle)
  2. Actualizar vehículos (CarroRenderer)
  3. Actualizar etiquetas si cambia estado
  4. Actualizar conexiones si cambia estado
  5. Actualizar vértices si cambia estado
  6. PixiJS renderiza automáticamente el scene graph
}
```

### Optimizaciones Implementadas

- **Renderizado Selectivo**: Solo se actualizan sprites cuando cambian sus datos
- **Pooling de Sprites**: Reutilización de objetos para evitar garbage collection
- **Actualización por Estado**: Etiquetas, conexiones y vértices solo se renderizan cuando cambian
- **Dirty Flags**: Sistema de banderas para detectar cambios
- **Batch Rendering**: PixiJS agrupa sprites similares en una sola llamada de dibujo (WebGL)
- **Texture Atlas**: Texturas combinadas para reducir cambios de estado en GPU

### Interactividad

El sistema usa eventos nativos de PixiJS:
- **pointerdown/pointerup**: Clicks en objetos
- **pointermove**: Movimiento del mouse sobre objetos
- **pointerover/pointerout**: Hover para tooltips
- **Capture Phase**: CameraController intercepta eventos antes que PixiJS para pan/zoom

### Compatibilidad

- **WebGL**: Aceleración GPU completa (preferido)
- **Canvas 2D**: Fallback automático si WebGL no está disponible
- **Multi-plataforma**: Funciona en todos los navegadores modernos
- **Responsive**: Se adapta al tamaño de la ventana

### Beneficios del Uso de PixiJS

**Rendimiento:**
- ✅ **60 FPS** con cientos de vehículos simultáneos
- ✅ **Aceleración GPU** vía WebGL para renderizado de alta velocidad
- ✅ **Batch rendering** automático reduce llamadas de dibujo en 90%
- ✅ **Sprites cacheados** evitan recálculos innecesarios

**Desarrollo:**
- ✅ **Scene Graph** simplifica la gestión de objetos 2D
- ✅ **Eventos nativos** en sprites eliminan cálculos manuales de colisión
- ✅ **API moderna** con soporte para ES6+
- ✅ **Debugging integrado** con DevTools de navegador

**Mantenibilidad:**
- ✅ **Separación de responsabilidades** con renderizadores especializados
- ✅ **Código modular** fácil de extender y mantener
- ✅ **Sistema de capas** clarifica el orden de renderizado
- ✅ **Documentación completa** de PixiJS disponible

## Documentación

- Ver `docs/CONSTRUCTOR.md` para usar el constructor de mapas
- Arquitectura de renderizado: `src/js/renderer/`
- Documentación de PixiJS: https://pixijs.com/

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
