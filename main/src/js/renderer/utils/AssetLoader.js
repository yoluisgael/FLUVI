/**
 * AssetLoader.js - Carga de recursos gráficos
 * Gestiona la carga de texturas y sprites para PixiJS
 */

class AssetLoader {
    constructor() {
        this.textures = new Map();
        this.isLoaded = false;
    }

    async loadAssets() {
        console.log('📦 Cargando assets del motor gráfico...');

        const assets = [
            // Texturas de calles
            { name: 'carretera', url: 'assets/images/roads/carretera.png' },

            // Vehículos (6 tipos)
            { name: 'carro1', url: 'assets/images/vehicles/carro.png' },
            { name: 'carro2', url: 'assets/images/vehicles/carro2.png' },
            { name: 'carro3', url: 'assets/images/vehicles/carro3.png' },
            { name: 'carro4', url: 'assets/images/vehicles/carro4.png' },
            { name: 'carro5', url: 'assets/images/vehicles/carro5.png' },
            { name: 'carro6', url: 'assets/images/vehicles/carro6.png' },

            // Edificios
            { name: 'cono', url: 'assets/images/objects/cono.png' },
            { name: 'escom', url: 'assets/images/buildings/ESCOM.png' },
            { name: 'cic', url: 'assets/images/buildings/CIC.png' },
            { name: 'cfie', url: 'assets/images/buildings/C.F.I.E.png' },
            { name: 'planetario', url: 'assets/images/buildings/planetario.png' }
        ];

        try {
            for (const asset of assets) {
                const texture = await PIXI.Assets.load(asset.url);
                this.textures.set(asset.name, texture);
                console.log(`  ✓ ${asset.name}`);
            }

            this.isLoaded = true;
            console.log('✅ Todos los assets del motor gráfico cargados');
        } catch (error) {
            console.error('❌ Error cargando assets:', error);
            throw error;
        }
    }

    getTexture(name) {
        if (!this.textures.has(name)) {
            console.warn(`⚠️ Textura no encontrada: ${name}`);
            return PIXI.Texture.WHITE; // Fallback
        }
        return this.textures.get(name);
    }

    hasTexture(name) {
        return this.textures.has(name);
    }
}

window.AssetLoader = AssetLoader;
console.log('✓ AssetLoader cargado');
