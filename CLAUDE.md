# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FLUVI is a traffic simulator based on Dynamic Discrete Systems. This is a web-based application that simulates traffic flow on customizable street networks with real-time visualization and interactive controls.

## Architecture

### Core Components

- **main/index.html**: The main HTML interface with Bootstrap 5 for responsive design. Contains accordion-based controls for street parameter modification and a canvas-based simulation area.

- **main/trafico.js**: The core simulation engine (~70KB) containing:
  - Canvas-based rendering system with main simulator and minimap
  - Traffic rule engine using discrete rules for car movement
  - Street/intersection management system
  - Real-time parameter modification system
  - Zoom/pan controls for the simulation view
  - Car generation and lane-changing probability controls

- **main/estilos.css**: Styling for the canvas container and control interface
- **main/minimapa.css**: Specific styles for the minimap overlay

### Key Technical Details

#### Simulation Engine
- Uses HTML5 Canvas for rendering with 5px cell size (`celda_tamano = 5`)
- Implements cellular automata-like traffic rules via a rules object
- Supports dynamic street parameter modification during runtime
- Features intersection management with priority systems

#### User Interface
- Bootstrap 5-based responsive design
- Accordion interface for parameter controls
- Canvas control bar with pause/resume, step-by-step execution, and speed controls
- Real-time sliders for velocity and generation probability
- Street selection dropdown for individual parameter modification

#### Visual Assets
- **main/carro.png**: Car sprite image (~365KB)
- **main/carretera.png**: Road texture image
- Static building elements for visual context

## Development Workflow

### Running the Application
Since this is a client-side web application with no build process:

1. Open `main/index.html` directly in a web browser, or
2. Serve the `main/` directory using a local web server:
   ```bash
   cd main
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

### Project Structure
```
TT/
├── main/                    # Application source code
│   ├── index.html          # Main application entry point
│   ├── trafico.js          # Core simulation logic
│   ├── estilos.css         # Main styles
│   ├── minimapa.css        # Minimap styles
│   ├── carro.png           # Car sprite
│   └── carretera.png       # Road texture
├── README.md               # Project description
└── LICENSE                 # MIT License
```

### Working with the Simulator

#### Key Variables and Systems
- `calles[]`: Array containing street definitions and parameters
- `intersecciones[]`: Intersection management system
- `reglas{}`: Traffic movement rules object
- `escala`, `offsetX`, `offsetY`: Viewport transformation variables
- `probabilidadGeneracionGeneral`: Global car generation probability

#### Parameter Modification System
The application allows real-time modification of:
- `probabilidadGeneracion`: Car generation probability per street
- `probabilidadSaltoDeCarril`: Lane-changing probability per street
- Global simulation speed and generation rates

## Git Information

- **Current branch**: cambios-gael
- **Main branch**: (no main branch configured)
- **Recent development**: Focus on Google Maps-like street similarity, traffic generation improvements, and intersection handling

## Notes

- No package.json or build system - this is a pure client-side web application
- No testing framework currently configured
- Uses external CDN resources (Bootstrap 5)
- MIT Licensed by Gael Molina (2025)