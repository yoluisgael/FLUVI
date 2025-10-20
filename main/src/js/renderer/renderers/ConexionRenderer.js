/**
 * ConexionRenderer.js - Renderizador de conexiones
 * Maneja la visualización de líneas de conexión entre calles
 */

class ConexionRenderer {
    constructor(sceneManager, assetLoader) {
        this.scene = sceneManager;
        this.assets = assetLoader;
    }

    renderAll(conexiones) {
        if (!conexiones || !window.mostrarConexiones) return;

        // Solo renderizar si no están ya renderizadas
        if (this.scene.conexionGraphics.size > 0) return;

        // Limpiar conexiones anteriores (por si acaso)
        this.clearAll();

        conexiones.forEach(conexion => {
            this.renderConexion(conexion);
        });
    }

    renderConexion(conexion) {
        // Calcular posición de origen
        const posOrig = conexion.posOrigen === -1 ? conexion.origen.tamano - 1 : conexion.posOrigen;

        // Calcular coordenadas del origen
        let coordOrigen;
        if (conexion.origen.esCurva && conexion.origen.vertices && conexion.origen.vertices.length > 0) {
            if (typeof window.obtenerCoordenadasGlobalesCeldaConCurva === 'function') {
                coordOrigen = window.obtenerCoordenadasGlobalesCeldaConCurva(conexion.origen, conexion.carrilOrigen, posOrig);
            } else if (typeof window.obtenerCoordenadasGlobalesCelda === 'function') {
                coordOrigen = window.obtenerCoordenadasGlobalesCelda(conexion.origen, conexion.carrilOrigen, posOrig);
            } else {
                console.warn('No se encontró función para calcular coordenadas');
                return;
            }
        } else {
            if (typeof window.obtenerCoordenadasGlobalesCelda === 'function') {
                coordOrigen = window.obtenerCoordenadasGlobalesCelda(conexion.origen, conexion.carrilOrigen, posOrig);
            } else {
                console.warn('No se encontró función para calcular coordenadas');
                return;
            }
        }

        // Calcular coordenadas del destino
        let coordDestino;
        if (conexion.destino.esCurva && conexion.destino.vertices && conexion.destino.vertices.length > 0) {
            if (typeof window.obtenerCoordenadasGlobalesCeldaConCurva === 'function') {
                coordDestino = window.obtenerCoordenadasGlobalesCeldaConCurva(conexion.destino, conexion.carrilDestino, conexion.posDestino);
            } else if (typeof window.obtenerCoordenadasGlobalesCelda === 'function') {
                coordDestino = window.obtenerCoordenadasGlobalesCelda(conexion.destino, conexion.carrilDestino, conexion.posDestino);
            } else {
                console.warn('No se encontró función para calcular coordenadas');
                return;
            }
        } else {
            if (typeof window.obtenerCoordenadasGlobalesCelda === 'function') {
                coordDestino = window.obtenerCoordenadasGlobalesCelda(conexion.destino, conexion.carrilDestino, conexion.posDestino);
            } else {
                console.warn('No se encontró función para calcular coordenadas');
                return;
            }
        }

        const x1 = coordOrigen.x;
        const y1 = coordOrigen.y;
        const x2 = coordDestino.x;
        const y2 = coordDestino.y;

        const graphics = new PIXI.Graphics();

        // Determinar color según tipo
        let color;
        if (conexion.bloqueada) {
            color = 0xFF3333; // Rojo para bloqueadas
        } else if (conexion.tipo === 'probabilistica') {
            color = 0x9966FF; // Morado para probabilísticas
        } else if (conexion.tipo === 'incorporacion') {
            color = 0xFF8C00; // Naranja para incorporación
        } else {
            color = 0x6BFF8B; // Verde para lineales
        }

        const lineWidth = conexion.bloqueada ? 1.5 : 1;

        // Dibujar línea con patrón según tipo
        if (conexion.tipo === 'probabilistica') {
            // Línea punteada para probabilísticas
            this.drawDashedLine(graphics, x1, y1, x2, y2, color, lineWidth, [3, 3]);
        } else if (conexion.tipo === 'incorporacion') {
            // Línea con guiones para incorporación
            this.drawDashedLine(graphics, x1, y1, x2, y2, color, lineWidth, [5, 3]);
        } else if (conexion.bloqueada) {
            // Línea punteada corta para bloqueadas
            this.drawDashedLine(graphics, x1, y1, x2, y2, color, lineWidth, [2, 2]);
        } else {
            // Línea sólida
            graphics.lineStyle(lineWidth, color, 0.8);
            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
        }

        // Dibujar flecha al final
        this.drawArrow(graphics, x1, y1, x2, y2, color);

        // Agregar a la capa de conexiones
        this.scene.getLayer('connections').addChild(graphics);
        this.scene.conexionGraphics.set(conexion, graphics);
    }

    // Método auxiliar para dibujar líneas punteadas
    drawDashedLine(graphics, x1, y1, x2, y2, color, lineWidth, dashPattern) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dashLength = dashPattern[0];
        const gapLength = dashPattern[1];
        const totalPattern = dashLength + gapLength;
        const numSegments = Math.floor(distance / totalPattern);

        graphics.lineStyle(lineWidth, color, 0.8);

        for (let i = 0; i < numSegments; i++) {
            const startRatio = (i * totalPattern) / distance;
            const endRatio = (i * totalPattern + dashLength) / distance;

            const startX = x1 + dx * startRatio;
            const startY = y1 + dy * startRatio;
            const endX = x1 + dx * endRatio;
            const endY = y1 + dy * endRatio;

            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
        }
    }

    drawArrow(graphics, x1, y1, x2, y2, color) {
        const headLength = 6; // Longitud de la punta de la flecha (reducida)
        const angle = Math.atan2(y2 - y1, x2 - x1);

        // Punta de la flecha (triángulo pequeño)
        graphics.lineStyle(1, color, 0.8);
        graphics.beginFill(color, 0.8);
        graphics.moveTo(x2, y2);
        graphics.lineTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
        );
        graphics.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
        );
        graphics.lineTo(x2, y2);
        graphics.endFill();
    }

    clearAll() {
        this.scene.conexionGraphics.forEach((graphics, conexion) => {
            graphics.destroy();
        });
        this.scene.conexionGraphics.clear();
        this.scene.getLayer('connections').removeChildren();
    }
}

window.ConexionRenderer = ConexionRenderer;
console.log('✓ ConexionRenderer cargado');
