# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based **traffic simulation system** using cellular automata (CA) principles. The simulator models multi-lane streets with vehicles that follow CA rules, includes intersection detection, connection management between streets, lane-changing behavior, and real-time metrics visualization.

## Project Structure

```
T3/
├── index.html                           # Main entry point
├── docs/                                # Project documentation
│   ├── CLAUDE.md                       # This file - Claude Code guidance
│   ├── CONSTRUCTOR.md                  # Map constructor documentation
│   └── REFACTORING.md                  # Refactoring notes
├── src/                                 # Source code
│   ├── js/                             # JavaScript modules
│   │   ├── core/                       # Core simulation logic
│   │   │   ├── trafico.js             # Main simulation engine
│   │   │   └── curvas.js              # Street curves system
│   │   └── ui/                        # User interface modules
│   │       ├── editor.js              # Visual street editor
│   │       ├── constructor.js         # Map constructor
│   │       └── etiquetas.js           # Labels and annotations
│   └── css/                           # Stylesheets
│       ├── estilos.css                # Main styles
│       └── minimapa.css               # Minimap styles
├── assets/                            # Static resources
│   └── images/                        # Image assets
│       ├── vehicles/                  # Vehicle sprites (carro.png, carro2-6.png)
│       ├── buildings/                 # Building textures (ESCOM.png, CIC.png, etc.)
│       ├── roads/                     # Road textures (carretera.png)
│       └── objects/                   # Misc objects (cono.png)
└── .claude/                           # Claude Code configuration
```

## Architecture

### Core Components

1. **src/js/core/trafico.js** - Main simulation engine
   - Cellular automata traffic rules implementation
   - Multi-lane street system with generators, connections, and devourers (sinks)
   - Intersection detection and collision handling with priority system
   - Connection management (linear, merge/incorporation, probabilistic)
   - Canvas rendering with zoom/pan support
   - Real-time metrics calculation (density, flow, speed)
   - Minimap visualization

2. **src/js/ui/editor.js** - Visual street editor
   - Interactive street positioning and rotation
   - Drag-and-drop handles for moving and rotating streets
   - Edit mode with save/cancel functionality
   - Manual coordinate/angle input

3. **index.html** - UI structure
   - Bootstrap-based responsive layout
   - Sidebar control panel with street configuration
   - Chart.js graphs for real-time metrics
   - Main canvas for simulation visualization

4. **src/css/estilos.css / src/css/minimapa.css** - Styling

## Key Concepts

### Street Types (TIPOS)
- **GENERADOR**: Generates new vehicles at start position based on probability
- **CONEXION**: Standard street segment that transfers vehicles
- **DEVORADOR**: Absorbs vehicles at the end (sink)

### Connection Types (TIPOS_CONEXION)
- **LINEAL**: 1-to-1 lane connections between streets
- **INCORPORACION**: Multiple lanes merge into fewer lanes (e.g., 3→1)
- **PROBABILISTICA**: Probabilistic branching where vehicles choose paths based on probability

### Cellular Automata Rules
- Traffic rules defined in `reglas` object using pattern matching (left, center, right cells)
- Pattern format: `"left,center,right": nextState`
- Example: `"1,0,0": 1` means if left has car, center empty, right empty → center becomes 1

### Street Data Structure
Each street (`calle`) contains:
- `nombre`: Street name
- `tamano`: Length in cells
- `tipo`: GENERADOR/CONEXION/DEVORADOR
- `arreglo`: 2D array [lane][position] representing vehicle positions (0=empty, 1=vehicle)
- `carriles`: Number of lanes
- `x, y, angulo`: Position and rotation
- `probabilidadGeneracion`: Vehicle generation probability (for GENERADOR)
- `probabilidadSaltoDeCarril`: Lane-change probability
- `conexionesSalida`: Array of outgoing connections per lane
- `celulasEsperando`: Tracks cells waiting for blocked connections

### Coordinate System
- Streets are positioned using `x` and `y` coordinates (multiplied by `celda_tamano` internally)
- Streets can be rotated using `angulo` (degrees)
- Canvas supports zoom and pan transformations
- Cell positions calculated using rotation matrices: `obtenerCoordenadasGlobalesCelda()`

## Common Development Tasks

### Creating a New Street
```javascript
const myStreet = crearCalle(
    "Street Name",       // nombre
    100,                 // tamano (length in cells)
    TIPOS.CONEXION,      // tipo
    200,                 // x position
    150,                 // y position
    90,                  // angulo (rotation degrees)
    0.5,                 // probabilidadGeneracion (0-1)
    3,                   // carriles (lanes)
    0.02                 // probabilidadSaltoDeCarril (0-1)
);
```

### Creating Connections Between Streets
```javascript
// Linear connection (1-to-1 lanes)
const conexiones1 = crearConexionLineal(street1, street2);

// Merge connection (multiple lanes to one)
const conexiones2 = crearConexionIncorporacion(
    street1,     // origen
    street2,     // destino
    0,           // carrilDestino
    5            // posicionInicial in destination
);

// Probabilistic connection
const conexiones3 = crearConexionProbabilistica(
    street1,
    0,           // carrilOrigen
    street2,
    [
        { carrilDestino: 0, probabilidad: 0.3 },
        { carrilDestino: 1, probabilidad: 0.7 }
    ]
);

// Register all connections
registrarConexiones([...conexiones1, ...conexiones2, ...conexiones3]);
```

### Simulation Flow (paso function)
The simulation runs in this order each step:
1. Generate vehicles in GENERADOR streets
2. Attempt connection transfers
3. Apply lane changes (`cambioCarril`)
4. Apply CA rules (`actualizarCalle`)
5. Check intersections (`checarIntersecciones`)
6. Update metrics and render

### Working with Intersections
- Automatically detected during `inicializarIntersecciones()` based on cell distance
- Stored in `intersecciones` array and `mapaIntersecciones` Map for fast lookup
- Collision resolution alternates priority each step (`prioridadPar` flag)
- Losing vehicle returns to previous cell

## Running the Application

Simply open `index.html` in a web browser. No build step required.

The simulation auto-starts with predefined streets. Use the sidebar to:
- Select streets and modify their parameters
- Toggle pause/resume
- Control simulation speed
- Show/hide intersections and connections
- Enable edit mode for visual street positioning

## Important Implementation Notes

- Cell size is fixed at 5 pixels (`celda_tamano = 5`)
- Streets use internal position scaling: display coordinates = input * `celda_tamano`
- The CA rules prevent vehicles from overlapping using waiting cells (`celulasEsperando`)
- Connections can be positioned at specific cells using `posOrigen` and `posDestino` parameters
- The canvas uses transformation matrices for zoom/pan, so rendering coordinates require `escala` and `offsetX/offsetY`
- Images `carro.png` and `carretera.png` are loaded for vehicle and road textures

## Global Variables Exposed for Editor Integration
- `window.calles` - Array of all streets
- `window.calleSeleccionada` - Currently selected street
- `window.isPaused` - Simulation pause state
- `window.escala`, `window.offsetX`, `window.offsetY` - Canvas transformation state
- `window.renderizarCanvas()` - Function to redraw canvas
- `window.inicializarIntersecciones()` - Recalculate intersections

## Constructor de Mapas (constructor.js)

### Overview
The map constructor allows users to create, edit, save, and load custom traffic simulations from scratch.

### Key Features
1. **Create Streets**: Add custom streets with full parameter control
2. **Create Connections**: Connect streets with linear, merge, or probabilistic connections
3. **Save/Load**: Export and import simulations as JSON files
4. **Delete Streets**: Remove selected streets from the simulation

### Main Functions
- `agregarCalle(nombre, tamano, tipo, x, y, angulo, probGen, carriles, probSalto)` - Add a new street
- `mostrarDialogoNuevaCalle()` - Show dialog to create a new street
- `mostrarDialogoNuevaConexion()` - Show dialog to create a connection
- `guardarSimulacion()` - Save current simulation as JSON file
- `cargarSimulacion(event)` - Load simulation from JSON file
- `nuevaSimulacion()` - Clear current simulation and start fresh
- `eliminarCalleSeleccionada()` - Delete the currently selected street

### JSON File Format
Simulations are saved in JSON format containing:
- `version`: File format version (currently "1.0")
- `nombre`: Simulation name
- `fecha`: Creation/save timestamp
- `calles`: Array of street objects with all parameters
- `conexiones`: Array of connection definitions
- `edificios`: Array of building objects
- `vertices` and `esCurva`: Curve data if streets have custom curves

### Usage Workflow
1. Click "Nueva Simulación" to start fresh
2. Use "Agregar Calle" to create streets (prompts for all parameters)
3. Use "Agregar Conexión" to connect streets
4. Use "Modo Edición" to adjust positions visually
5. Use "Guardar Simulación" to export as JSON
6. Use "Cargar Simulación" to import saved JSON files

### Integration Points
- Uses exposed functions from `trafico.js`: `crearCalle`, `crearConexionLineal`, etc.
- Updates `window.calles` and `window.conexiones` arrays
- Calls `renderizarCanvas()` to update visualization
- Triggers `inicializarIntersecciones()` after loading

For detailed user instructions, see CONSTRUCTOR.md
