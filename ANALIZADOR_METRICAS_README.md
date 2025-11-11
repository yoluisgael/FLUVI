# 📊 Analizador de Métricas FLUVI

## Descripción

El **Analizador de Métricas** es una funcionalidad avanzada integrada en FLUVI que permite analizar archivos CSV de métricas exportados desde el simulador utilizando **Python** directamente en el navegador mediante **Pyodide**.

## 🎯 Características

- ✅ **Análisis completo de métricas**: Densidad, Flujo, Velocidad, Entropía
- ✅ **Clasificación de estados de tráfico** según criterios FLUVI
- ✅ **Visualizaciones avanzadas** con matplotlib y seaborn
- ✅ **3 gráficas generadas automáticamente**:
  1. **Análisis Temporal**: Evolución de métricas a lo largo del tiempo
  2. **Diagrama Fundamental**: Relación Entropía-Densidad-Flujo
  3. **Distribuciones**: Histogramas y boxplots de Densidad y Flujo
- ✅ **Descarga de imágenes**: Individual o todas en ZIP
- ✅ **Sin backend necesario**: Todo se ejecuta en el navegador

## 📁 Estructura de Archivos

```
FLUVI/
├── main/
│   ├── index.html                      # HTML principal (modificado)
│   └── src/
│       ├── python/
│       │   └── analizador.py           # ⭐ Script Python del analizador
│       └── js/
│           └── ui/
│               └── analizadorMetricas.js  # ⭐ Módulo JavaScript
```

## 🚀 Cómo Usar

### 1. Exportar Métricas desde FLUVI

1. Ejecuta una simulación en FLUVI
2. En el panel de control, ve a **"Métricas en Tiempo Real"**
3. Haz clic en **"Descargar CSV"**
4. Guarda el archivo (ej: `metricas_trafico_Lunes_08h16m.csv`)

### 2. Analizar las Métricas

1. En el mismo panel de métricas, haz clic en el nuevo botón **"Analizar Métricas"** (botón azul)
2. Se abrirá un modal con título **"📊 Analizador de Métricas (Python)"**
3. Haz clic en **"📤 Cargar archivo CSV"**
4. Selecciona tu archivo CSV exportado previamente
5. Espera mientras el sistema:
   - Carga Pyodide (primera vez: ~30-60 segundos)
   - Instala paquetes Python (pandas, numpy, matplotlib, scipy, sklearn, seaborn)
   - Procesa tus datos
   - Genera las visualizaciones

### 3. Ver y Descargar Resultados

Una vez completado el análisis:

- **Navega** entre las 3 pestañas para ver cada gráfica
- **Descarga imagen actual**: Descarga solo la gráfica visible
- **Descarga todas las imágenes**: Crea un ZIP con las 3 gráficas

## 📊 Gráficas Generadas

### 1. Análisis Temporal
Muestra 4 subgráficas:
- Densidad vs Tiempo
- Flujo vs Tiempo
- Velocidad vs Tiempo
- Estados de Tráfico clasificados (Sub-utilizado, Moderado, Óptimo, Congestionado, Colapso)

### 2. Diagrama Fundamental del Tráfico
- Scatter plot: Entropía vs Densidad
- Color representa el Flujo vehicular
- Basado en la ecuación fundamental del tráfico

### 3. Distribuciones y Correlaciones
- Histograma de Densidad
- Histograma de Flujo
- Boxplot de Densidad
- Boxplot de Flujo

## 🔧 Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Pyodide** | v0.24.1 | Python en WebAssembly |
| **Pandas** | - | Procesamiento de datos |
| **NumPy** | - | Cálculos numéricos |
| **Matplotlib** | - | Generación de gráficas |
| **Seaborn** | - | Visualizaciones estadísticas |
| **SciPy** | - | Análisis estadístico |
| **Scikit-learn** | - | Clustering (opcional) |
| **JSZip** | v3.10.1 | Creación de archivos ZIP |

## ⚙️ Funcionamiento Técnico

### Flujo de Datos

```
CSV File → FileReader API → Python (Pyodide) → Análisis → Matplotlib → Base64 PNG → HTML <img>
```

### Proceso Detallado

1. **Carga del CSV**: JavaScript lee el archivo usando FileReader API
2. **Inicialización de Pyodide**: Descarga Python compilado a WebAssembly (solo primera vez)
3. **Instalación de paquetes**: Pyodide instala pandas, numpy, matplotlib, etc.
4. **Ejecución del script**: Se carga y ejecuta `analizador.py`
5. **Procesamiento**:
   - Limpieza de datos
   - Cálculo de métricas avanzadas
   - Clasificación de estados de tráfico
   - Detección de días de la semana
6. **Generación de gráficas**: Matplotlib crea las imágenes en memoria
7. **Conversión a Base64**: Las imágenes PNG se convierten a data URLs
8. **Renderizado**: Las imágenes se muestran en el modal

## 📝 Formato del CSV

El CSV debe tener esta estructura:

```csv
# METADATA
# Tiempo Virtual: Lunes 07:00:10
# Fecha Real: 2024-11-10 15:30:45
# Perfil Dinámico: Activo
# Total Mediciones: 1234

# METRICAS
Marca de Tiempo,Densidad (%),Flujo (veh/s),Tasa Cambio Neta,Velocidad Promedio (%),Entropía (bits)
00:00:00,1.23,0.45,0.12,85.67,2.34
00:00:05,1.45,0.52,0.08,87.23,2.41
...
```

## 🐛 Solución de Problemas

### Problema: "Error al cargar Python"
**Solución**: Verifica tu conexión a internet. Pyodide se descarga desde CDN.

### Problema: "Error durante el análisis"
**Solución**: Asegúrate de que el CSV tenga el formato correcto exportado desde FLUVI.

### Problema: Tarda mucho en cargar
**Solución**: Es normal la primera vez (30-60 segundos). Las siguientes cargas son mucho más rápidas.

### Problema: No se pueden descargar todas las imágenes en ZIP
**Solución**: Si JSZip falla, el sistema descargará las 3 imágenes por separado automáticamente.

## 🔒 Privacidad y Seguridad

- ✅ **100% Local**: Todo el procesamiento ocurre en tu navegador
- ✅ **Sin servidor**: No se envían datos a ningún servidor externo
- ✅ **Datos privados**: Tus métricas nunca salen de tu computadora
- ✅ **Sin instalación**: No requiere Python instalado en tu sistema

## 📌 Notas Importantes

1. **Primera carga**: La primera vez que uses el analizador tardará ~30-60 segundos en descargar e inicializar Pyodide
2. **Cargas posteriores**: Pyodide se mantiene en caché, las siguientes cargas son instantáneas
3. **Memoria**: Archivos CSV muy grandes (>100MB) pueden causar problemas de memoria
4. **Compatibilidad**: Requiere un navegador moderno con soporte para WebAssembly (Chrome 57+, Firefox 52+, Safari 11+, Edge 16+)

## 🎓 Para Desarrolladores

### Modificar el Análisis

Para personalizar el análisis, edita el archivo `src/python/analizador.py`:

```python
class AnalizadorTraficoFLUVI:
    def ejecutar_analisis_completo(self):
        # Agrega tus propios análisis aquí
        self.mi_nuevo_analisis()
        ...
```

### Agregar Nuevas Gráficas

1. Crea una nueva función en `analizador.py` que retorne una imagen en base64
2. Agrega la imagen al diccionario `imagenes` en `generar_visualizaciones()`
3. Actualiza `analizadorMetricas.js` para mostrar la nueva imagen en el modal

## 📚 Referencias

- [Pyodide Documentation](https://pyodide.org/)
- [Matplotlib Documentation](https://matplotlib.org/)
- [Pandas Documentation](https://pandas.pydata.org/)

## 👥 Autor

Desarrollado como parte del proyecto FLUVI (Framework para Límites Urbanos de Velocidad e Intervenciones)

---

**¿Preguntas o problemas?** Abre un issue en el repositorio del proyecto.
