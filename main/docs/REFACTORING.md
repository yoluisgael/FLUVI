# 📋 Instrucciones de Refactorización de trafico.js

## ✅ Archivos Creados

Se han creado 2 archivos nuevos para modularizar el código:

1. **curvas.js** (～300 líneas) - Sistema de curvas y vértices
2. **etiquetas.js** (～250 líneas) - Sistema de etiquetas de calles

## 🗑️ Código a Eliminar de trafico.js

Para completar la refactorización, debes **eliminar** las siguientes secciones de `trafico.js`:

### 1. Sistema de Curvas y Vértices (Líneas aproximadas 303-538)

Eliminar desde:
```javascript
function inicializarVertices(calle) {
```

Hasta (inclusive):
```javascript
}
```
Después de `obtenerCoordenadasGlobalesCeldaConCurva()`

**Funciones a eliminar:**
- `inicializarVertices()`
- `calcularPosicionVertice()`
- `obtenerAnguloEnPunto()`
- `actualizarAnguloVertice()`
- `actualizarVerticePorArrastre()`
- `detectarVerticeEnPosicion()`
- `obtenerCoordenadasGlobalesCeldaConCurva()`
- `calcularCentroCalleCurva()`
- `calcularPuntoFinalCalleCurva()`

**Variables globales a eliminar:**
- `let verticeSeleccionado = null;`
- `let controlandoVertice = false;`

### 2. Sistema de Etiquetas (Líneas aproximadas 1477-1720)

Eliminar desde:
```javascript
// ============ SISTEMA DE ETIQUETAS DE CALLES ============
```

Hasta (inclusive):
```javascript
// ============ FIN SISTEMA DE ETIQUETAS ============
```

**Funciones a eliminar:**
- `esColorOscuro()`
- `obtenerColorTextoSegunFondo()`
- `calcularPosicionEnCalle()`
- `calcularOffsetExterno()`
- `dibujarEtiquetasCalles()`
- `dibujarEtiquetaRecta()`
- `dibujarEtiquetaSiguiendoCurva()`

## ✅ Verificaciones Importantes

### Antes de eliminar, asegúrate de:

1. ✅ Los archivos `curvas.js` y `etiquetas.js` están creados
2. ✅ El archivo `index.html` tiene los nuevos scripts cargados en el orden correcto:
   ```html
   <script src="curvas.js"></script>
   <script src="etiquetas.js"></script>
   <script src="trafico.js"></script>
   ```

### Orden de carga de scripts (MUY IMPORTANTE):

El orden DEBE ser:
1. `curvas.js` - Define funciones que usan otros módulos
2. `etiquetas.js` - Usa funciones de curvas.js
3. `trafico.js` - Archivo principal, usa todos los módulos
4. `editor.js` - Editor visual
5. `constructor.js` - Constructor de mapas

## 🔍 Cómo Eliminar el Código

### Opción 1: Manual con Editor
1. Abre `trafico.js` en tu editor
2. Busca las funciones listadas arriba
3. Elimínalas una por una verificando los números de línea

### Opción 2: Buscar por Comentario
Busca estos comentarios y elimina todo el bloque:
- Para curvas: Busca `function inicializarVertices` hasta encontrar `calcularPuntoFinalCalleCurva`
- Para etiquetas: Busca `// ============ SISTEMA DE ETIQUETAS` hasta `// ============ FIN SISTEMA DE ETIQUETAS`

## 📊 Resultado Esperado

**Antes de refactorizar:**
- trafico.js: ～3323 líneas

**Después de refactorizar:**
- trafico.js: ～2773 líneas (-550 líneas)
- curvas.js: ～300 líneas
- etiquetas.js: ～250 líneas

**Total:** El código sigue siendo el mismo, solo mejor organizado.

## 🧪 Pruebas Después de Refactorizar

1. Recarga la página (F5) y verifica:
   - ✅ La simulación se inicia correctamente
   - ✅ Las etiquetas de calles se muestran
   - ✅ Las curvas funcionan correctamente
   - ✅ Los vértices se pueden arrastrar
   - ✅ No hay errores en la consola del navegador

2. Prueba funcionalidades específicas:
   - Activa curvas en una calle
   - Arrastra un vértice
   - Muestra/oculta etiquetas
   - Verifica que las etiquetas siguen las curvas

## ⚠️ Notas Importantes

- **NO elimines** las llamadas a estas funciones, solo las definiciones
- Las funciones ahora están en `curvas.js` y `etiquetas.js`
- Si encuentras errores, verifica que los scripts estén en el orden correcto en `index.html`

## 🎯 Beneficios de esta Refactorización

✅ **Organización:** Código separado por funcionalidad
✅ **Mantenibilidad:** Más fácil encontrar y corregir bugs
✅ **Escalabilidad:** Puedes agregar más módulos sin que trafico.js crezca
✅ **Legibilidad:** Archivos más pequeños y enfocados
✅ **Troubleshooting:** Más fácil identificar dónde está un problema

---

**¿Necesitas ayuda?** Si encuentras algún error después de la refactorización, verifica:
1. Orden de los scripts en index.html
2. Que no hayas eliminado llamadas a funciones, solo definiciones
3. Consola del navegador (F12) para ver mensajes de error específicos
