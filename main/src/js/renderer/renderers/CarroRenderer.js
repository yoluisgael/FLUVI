/**
 * CarroRenderer.js - Renderizador de vehículos
 * Maneja la visualización y actualización eficiente de sprites de carros
 */

class CarroRenderer {
    constructor(sceneManager, assetLoader) {
        this.scene = sceneManager;
        this.assets = assetLoader;
        this.celda_tamano = window.celda_tamano || 5;

        // Object pool para reutilizar sprites
        this.spritePool = [];
        this.maxPoolSize = 1000;
    }

    renderAll(calles) {
        calles.forEach(calle => {
            this.renderCalleVehiculos(calle);
        });

        // Limpiar sprites de carros que ya no existen
        this.cleanupUnusedSprites(calles);
    }

    updateAll(calles) {
        // Método más eficiente para actualizaciones frame-by-frame
        calles.forEach(calle => {
            this.updateCalleVehiculos(calle);
        });
    }

    renderCalleVehiculos(calle) {
        if (!calle.arreglo) return;

        for (let carril = 0; carril < calle.carriles; carril++) {
            for (let indice = 0; indice < calle.tamano; indice++) {
                this.createOrUpdateCarroSprite(calle, carril, indice);
            }
        }
    }

    updateCalleVehiculos(calle) {
        if (!calle.arreglo) return;

        // Solo actualizar posiciones/rotaciones sin recrear sprites
        for (let carril = 0; carril < calle.carriles; carril++) {
            for (let indice = 0; indice < calle.tamano; indice++) {
                const id = this.getCarroId(calle, carril, indice);
                const tipo = calle.arreglo[carril][indice];

                if (tipo === 0) {
                    // Eliminar sprite si existe
                    this.removeCarroSprite(id);
                } else {
                    // Actualizar sprite existente o crear nuevo
                    this.createOrUpdateCarroSprite(calle, carril, indice);
                }
            }
        }
    }

    createOrUpdateCarroSprite(calle, carril, indice) {
        const id = this.getCarroId(calle, carril, indice);
        const tipo = calle.arreglo[carril][indice];

        if (tipo === 0) {
            // No hay vehículo
            this.removeCarroSprite(id);
            return;
        }

        // Obtener coordenadas globales
        const coords = calle.esCurva && window.obtenerCoordenadasGlobalesCeldaConCurva
            ? window.obtenerCoordenadasGlobalesCeldaConCurva(calle, carril, indice)
            : this.obtenerCoordenadasBasicas(calle, carril, indice);

        let sprite = this.scene.carroSprites.get(id);

        if (!sprite) {
            // Crear nuevo sprite (desde pool si es posible)
            sprite = this.acquireSprite();
            const texture = this.assets.getTexture(`carro${tipo}`);
            sprite.texture = texture;
            sprite.anchor.set(0.5);
            sprite.width = this.celda_tamano;
            sprite.height = this.celda_tamano;
            sprite.zIndex = 1; // Sobre las calles

            this.scene.carroSprites.set(id, sprite);
            this.scene.getLayer('vehicles').addChild(sprite);
        }

        // Actualizar posición y rotación
        sprite.x = coords.x;
        sprite.y = coords.y;
        sprite.rotation = CoordinateConverter.degreesToRadians(coords.angulo || calle.angulo);
        sprite.visible = true;
    }

    obtenerCoordenadasBasicas(calle, carril, indice) {
        const angle = -calle.angulo * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const localX = indice * this.celda_tamano + this.celda_tamano / 2;
        const localY = carril * this.celda_tamano + this.celda_tamano / 2;

        return {
            x: calle.x + (localX * cos - localY * sin),
            y: calle.y + (localX * sin + localY * cos),
            angulo: calle.angulo
        };
    }

    removeCarroSprite(id) {
        const sprite = this.scene.carroSprites.get(id);
        if (sprite) {
            this.releaseSprite(sprite);
            this.scene.carroSprites.delete(id);
        }
    }

    cleanupUnusedSprites(calles) {
        // Construir set de IDs válidos
        const validIds = new Set();
        calles.forEach(calle => {
            if (!calle.arreglo) return;

            for (let carril = 0; carril < calle.carriles; carril++) {
                for (let indice = 0; indice < calle.tamano; indice++) {
                    if (calle.arreglo[carril][indice] !== 0) {
                        const id = this.getCarroId(calle, carril, indice);
                        validIds.add(id);
                    }
                }
            }
        });

        // Eliminar sprites que ya no son válidos
        const idsToRemove = [];
        this.scene.carroSprites.forEach((sprite, id) => {
            if (!validIds.has(id)) {
                idsToRemove.push(id);
            }
        });

        idsToRemove.forEach(id => this.removeCarroSprite(id));
    }

    getCarroId(calle, carril, indice) {
        return `${calle.nombre}_${carril}_${indice}`;
    }

    // Object pooling para performance
    acquireSprite() {
        if (this.spritePool.length > 0) {
            return this.spritePool.pop();
        }
        return new PIXI.Sprite();
    }

    releaseSprite(sprite) {
        sprite.visible = false;
        sprite.parent?.removeChild(sprite);

        if (this.spritePool.length < this.maxPoolSize) {
            this.spritePool.push(sprite);
        } else {
            sprite.destroy();
        }
    }

    clearAll() {
        this.scene.carroSprites.forEach((sprite, id) => {
            this.releaseSprite(sprite);
        });
        this.scene.carroSprites.clear();
    }
}

window.CarroRenderer = CarroRenderer;
console.log('✓ CarroRenderer cargado');
