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

        // Limpiar conexiones anteriores
        this.clearAll();

        conexiones.forEach(conexion => {
            this.renderConexion(conexion);
        });
    }

    renderConexion(conexion) {
        const graphics = new PIXI.Graphics();

        // Determinar color según tipo
        let color;
        switch (conexion.tipo) {
            case 'lineal':
                color = 0x00FF00; // Verde
                break;
            case 'incorporacion':
                color = 0xFFA500; // Naranja
                break;
            case 'probabilistica':
                color = 0x9370DB; // Morado
                break;
            default:
                color = 0x0000FF; // Azul por defecto
        }

        // Dibujar línea
        graphics.lineStyle(2, color, 0.8);
        graphics.moveTo(conexion.x1, conexion.y1);
        graphics.lineTo(conexion.x2, conexion.y2);

        // Dibujar flecha al final
        this.drawArrow(graphics, conexion.x1, conexion.y1, conexion.x2, conexion.y2, color);

        // Agregar a la capa de conexiones
        this.scene.getLayer('connections').addChild(graphics);
        this.scene.conexionGraphics.set(conexion, graphics);
    }

    drawArrow(graphics, x1, y1, x2, y2, color) {
        const headLength = 15; // Longitud de la punta de la flecha
        const angle = Math.atan2(y2 - y1, x2 - x1);

        // Punta de la flecha
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
