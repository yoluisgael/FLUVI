const canvas = document.getElementById("simuladorCanvas");
const ctx = canvas.getContext("2d");

// Constantes de intersecciones

let intersecciones = []; 
const celdasIntersectadas = new Set();
let mapaIntersecciones = new Map(); 

let prioridadPar = true;

// Ajustar tamaño inicial del canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Reglas de tráfico
const reglas = {
    "0,0,0": 0, "0,0,1": 0, "0,1,0": 0, "0,1,1": 1,
    "1,0,0": 1, "1,0,1": 1, "1,1,0": 0, "1,1,1": 1
};

// Variables para el modificador de calles
const selectCalle = document.getElementById("selectCalle");
const inputProbabilidadGeneracion = document.getElementById("inputProbabilidadGeneracion");
const inputProbabilidadSalto = document.getElementById("inputProbabilidadSalto");
const btnActualizarCalle = document.getElementById("btnActualizarCalle");

let animationId; // Variable para guardar el ID de la animación
let tiempoAnterior = 0;
const intervaloDeseado = 500; // Intervalo en milisegundos (100ms = 10 actualizaciones por segundo)

// Configuración
let calles = [];
let conexiones = [];
const celda_tamano = 5;
let escala = 1;
let offsetX = 0, offsetY = 0;
let isDragging = false, startX, startY;
let lastTouchX, lastTouchY;
let calleSeleccionada = null; // Variable para almacenar la calle seleccionada

// Cargar la imagen del carro
const carroImg = new Image();
carroImg.src = "carro.png";

// Cargar la imagen del carretera
const carreteraImg = new Image();
carreteraImg.src = "carretera.png";

// Lista de edificios estáticos
const edificios = [
    { x: 400, y: 100, width: 30, height: 41, color: "green", angle: 10 },
    { x: 500, y: 150, width: 50, height: 60, color: "green", angle: -15 },
    { x: 600, y: 180, width: 40, height: 55, color: "green", angle: 5 }
];

// Obtener el contexto del minimapa
const minimapaCanvas = document.getElementById("minimapa");
const minimapaCtx = minimapaCanvas.getContext("2d");

// Función para dibujar el minimapa (con los cambios anteriores)
function dibujarMinimapa() {
    // Ajustar el tamaño del minimapa según la escala del canvas principal
    const minimapaEscala = 0.1; 
    const minimapaAncho = canvas.width * minimapaEscala + 150;
    const minimapaAlto = canvas.height * minimapaEscala + 100;
    minimapaCanvas.width = minimapaAncho;
    minimapaCanvas.height = minimapaAlto;

    // Calcular las coordenadas del viewport visible
    const viewport = calcularViewportVisible();

    // Centrar el minimapa en el viewport visible
    const centroX = viewport.x + viewport.ancho / 2;
    const centroY = viewport.y + viewport.alto / 2;

    // Ajustar el desplazamiento del minimapa
    const minimapaOffsetX = minimapaAncho / 2 - centroX * minimapaEscala;
    const minimapaOffsetY = minimapaAlto / 2 - centroY * minimapaEscala;

    // Limpiar el minimapa
    minimapaCtx.clearRect(0, 0, minimapaAncho, minimapaAlto);
    // Dibujar el fondo del minimapa
    minimapaCtx.fillStyle = "#767878"; // Color de fondo gris claro
    
    minimapaCtx.fillRect(0, 0, minimapaAncho, minimapaAlto);
    // Aplicar el desplazamiento al minimapa
    minimapaCtx.save();
    minimapaCtx.translate(minimapaOffsetX, minimapaOffsetY);

    // Dibujar las calles en el minimapa (ajustar la escala)
    calles.forEach(calle => {
        minimapaCtx.save();
        minimapaCtx.translate(calle.x * minimapaEscala, calle.y * minimapaEscala);
        minimapaCtx.rotate(-calle.angulo * Math.PI / 180);
        minimapaCtx.fillStyle = "black";
        minimapaCtx.fillRect(0, 0, calle.tamano * celda_tamano * minimapaEscala, calle.carriles * celda_tamano * minimapaEscala);
        minimapaCtx.restore();
    });

    // Dibujar el rectángulo de la vista
    minimapaCtx.strokeStyle = "red";
    minimapaCtx.strokeRect(viewport.x * minimapaEscala, viewport.y * minimapaEscala, viewport.ancho * minimapaEscala, viewport.alto * minimapaEscala);

    minimapaCtx.restore();
}

/*Evento para guardar la calle seleccionada
selectCalle.addEventListener("change", () => {
    const calleIndex = selectCalle.value;
    if (calleIndex !== "") {
        calleSeleccionada = calles[calleIndex];
    } else {
        calleSeleccionada = null;
    }
    renderizarCanvas();
});*/
// Evento para guardar la calle seleccionada y mostrar valores en los inputs
selectCalle.addEventListener("change", () => {
    const calleIndex = selectCalle.value;
    if (calleIndex !== "") {
        calleSeleccionada = calles[calleIndex];

        // Mostrar valores actuales en los inputs
        inputProbabilidadGeneracion.value = calleSeleccionada.probabilidadGeneracion * 100; // Conversión a porcentaje
        inputProbabilidadSalto.value = calleSeleccionada.probabilidadSaltoDeCarril * 100; // Conversión a porcentaje
    } else {
        calleSeleccionada = null;
    }
    renderizarCanvas();
});

// Función para crear una calle con posición, ángulo y tamaño
function crearCalle(nombre, tamano, tipoInicio, tipoFinal, x, y, angulo, probabilidadGeneracion, carriles = 1, probabilidadSaltoDeCarril = 0.05) {
    let calle = {
        nombre:nombre,
        tamano: tamano,
        tipoInicio: tipoInicio,
        tipoFinal: tipoFinal,
        probabilidadGeneracion: probabilidadGeneracion,
        arreglo: [], // Inicializamos como un array vacío
        x: x * celda_tamano,
        y: y * celda_tamano,
        angulo: angulo,
        carriles: carriles, // Añadimos el número de carriles
        probabilidadSaltoDeCarril: probabilidadSaltoDeCarril, // Agregar la probabilidad de salto de carril a la calle
    };

    // Creamos la matriz (arreglo 2D)
    for (let i = 0; i < carriles; i++) {
        calle.arreglo.push(new Array(tamano).fill(0));
    }

    // Inicialización del generador (si aplica)
    if (tipoInicio === "generador") {
        for (let i = 0; i < carriles; i++) {
            for (let j = 0; j < tamano; j++) {
                calle.arreglo[i][j] = Math.random() < 0.1 ? 1 : 0; // Carros iniciales al azar en cada carril
            }
        }
    }

    calles.push(calle);
    return calle;
}

/**
 * Calcula las coordenadas globales del CENTRO de una celda específica.
 * @param {object} calle El objeto calle.
 * @param {number} carril El índice del carril.
 * @param {number} indice El índice de la celda dentro del carril.
 * @returns {{x: number, y: number}} Coordenadas globales del centro de la celda.
 */
function obtenerCoordenadasGlobalesCelda(calle, carril, indice) {
    // Centro de la celda en coordenadas locales de la calle (relativo a calle.x, calle.y)
    // El origen local (0,0) para la rotación lo consideramos en la esquina superior izquierda de la calle.
    const localX = (indice + 0.5) * celda_tamano; // Centro horizontal de la celda
    const localY = (carril + 0.5) * celda_tamano; // Centro vertical de la celda

    // Rotar el punto local alrededor del origen local (0,0)
    const anguloRad = -calle.angulo * Math.PI / 180; // Negativo porque la rotación del canvas es horaria
    const cos = Math.cos(anguloRad);
    const sin = Math.sin(anguloRad);
    const rotadoX = localX * cos - localY * sin;
    const rotadoY = localX * sin + localY * cos;

    // Trasladar a la posición global de la esquina de la calle
    return {
        x: rotadoX + calle.x,
        y: rotadoY + calle.y
    };
}

// Calcula la distancia euclidiana entre dos puntos.
function distancia(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Detecta y almacena las intersecciones entre celdas de diferentes calles.
function inicializarIntersecciones() {
    console.log("Inicializando detección de intersecciones...");
    intersecciones = []; // Limpiar array por si se llama de nuevo
    celdasIntersectadas.clear(); // Limpiar el set de control

    // Umbral de distancia para considerar una intersección (puede requerir ajuste)
    // Si los centros están más cerca que esto, se consideran intersectados.
    // Usar el tamaño de la celda es un buen punto de partida.
    const umbralDistancia = celda_tamano;

    // Iterar por cada par único de calles
    for (let j = 0; j < calles.length; j++) {
        const calle1 = calles[j];
        for (let k = j + 1; k < calles.length; k++) { // j + 1 para evitar comparar consigo misma y pares duplicados
            const calle2 = calles[k];

            // Iterar por cada celda de la calle 1
            for (let c1 = 0; c1 < calle1.carriles; c1++) {
                for (let i1 = 0; i1 < calle1.tamano; i1++) {
                    const idCelda1 = `${j}-${c1}-${i1}`; // ID único para la celda 1

                    // Si esta celda ya es parte de una intersección, saltarla
                    if (celdasIntersectadas.has(idCelda1)) {
                        continue;
                    }

                    const centro1 = obtenerCoordenadasGlobalesCelda(calle1, c1, i1);

                    // Iterar por cada celda de la calle 2
                    for (let c2 = 0; c2 < calle2.carriles; c2++) {
                        for (let i2 = 0; i2 < calle2.tamano; i2++) {
                            const idCelda2 = `${k}-${c2}-${i2}`; // ID único para la celda 2

                            // Si esta celda ya es parte de una intersección, saltarla
                            if (celdasIntersectadas.has(idCelda2)) {
                                continue;
                            }

                            const centro2 = obtenerCoordenadasGlobalesCelda(calle2, c2, i2);

                            // Comprobar si los centros de las celdas están lo suficientemente cerca
                            if (distancia(centro1, centro2) < umbralDistancia) {
                                // ¡Intersección encontrada!
                                const nuevaInterseccion = {
                                    calle1: calle1,       // Referencia al objeto calle1
                                    calle1Index: j,       // Índice de calle1 en el array `calles`
                                    carril1: c1,          // Índice del carril en calle1
                                    indice1: i1,          // Índice de la celda en el carril de calle1
                                    calle2: calle2,       // Referencia al objeto calle2
                                    calle2Index: k,       // Índice de calle2
                                    carril2: c2,          // Índice del carril en calle2
                                    indice2: i2,          // Índice de la celda en el carril de calle2
                                    // Coordenada aproximada de la intersección (punto medio)
                                    coords: { x: (centro1.x + centro2.x) / 2, y: (centro1.y + centro2.y) / 2 }
                                };
                                intersecciones.push(nuevaInterseccion);

                                // Marcar ambas celdas como intersectadas para asegurar la relación 1 a 1
                                celdasIntersectadas.add(idCelda1);
                                celdasIntersectadas.add(idCelda2);

                                console.log(`Intersección: Calle ${j}[${c1},${i1}] (${calle1.nombre}) con Calle ${k}[${c2},${i2}] (${calle2.nombre})`);
                            }
                        }
                    }
                }
            }
        }
    }
    console.log(`Detección finalizada. ${intersecciones.length} intersecciones encontradas.`);

}


// Construye un mapa de búsqueda rápida para intersecciones a partir del array intersecciones
function construirMapaIntersecciones() {
    mapaIntersecciones.clear(); // Limpiar por si se llama de nuevo
    intersecciones.forEach(inter => {
        // Crear IDs únicos para cada celda de la intersección
        const id1 = `${inter.calle1Index}-${inter.carril1}-${inter.indice1}`;
        const id2 = `${inter.calle2Index}-${inter.carril2}-${inter.indice2}`;

        // Guardar la referencia cruzada en el mapa
        // Clave: ID de celda 1 -> Valor: Info de celda 2
        mapaIntersecciones.set(id1, {
            calle: inter.calle2, // Referencia al objeto de la otra calle
            carril: inter.carril2,
            indice: inter.indice2
        });
        // Clave: ID de celda 2 -> Valor: Info de celda 1
        mapaIntersecciones.set(id2, {
            calle: inter.calle1, // Referencia al objeto de la otra calle
            carril: inter.carril1,
            indice: inter.indice1
        });
    });
    console.log(`Mapa de lookup de intersecciones construido con ${mapaIntersecciones.size} entradas.`);
}

// Regresa un carro en caso de haber dos en la misma intersecciión
function checarIntersecciones() {
    intersecciones.forEach(inter => {
        const { calle1Index, carril1, indice1, calle2Index, carril2, indice2 } = inter;

        // Acceder a las calles y sus arreglos ACTUALIZADOS
        const calle1 = calles[calle1Index];
        const calle2 = calles[calle2Index];

        // Validar acceso a datos necesarios
        if (!calle1?.arreglo?.[carril1]?.[indice1] === undefined ||
            !calle2?.arreglo?.[carril2]?.[indice2] === undefined) {
             return; // Saltar si algo no existe
        }

        const estadoActualI1 = calle1.arreglo[carril1][indice1];
        const estadoActualI2 = calle2.arreglo[carril2][indice2];

        // ¿Conflicto detectado AHORA?
        if (estadoActualI1 === 1 && estadoActualI2 === 1) {
            if (prioridadPar) {
                callePerdedora = calle2; carrilPerdedor = carril2; indicePerdedor = indice2;
            } else {
                callePerdedora = calle1; carrilPerdedor = carril1; indicePerdedor = indice1;
            }

            // Aplicar "Regreso" directamente sobre callePerdedora.arreglo
            // 1. Poner celda de intersección del perdedor a 0
            callePerdedora.arreglo[carrilPerdedor][indicePerdedor] = 0;

            // 2. Poner celda ANTERIOR del perdedor a 1 (si existe)
            let indiceAnteriorPerdedor = indicePerdedor - 1;
            if (indiceAnteriorPerdedor >= 0) {
                 if (callePerdedora.arreglo[carrilPerdedor]?.[indiceAnteriorPerdedor] !== undefined) {
                     callePerdedora.arreglo[carrilPerdedor][indiceAnteriorPerdedor] = 1;
                 } else {
                 }
            }
        }
    });
}

// Función para conectar dos calles
function conexion_calle_de_2(calle1, calle2) {
    if (calle1.tipoFinal === "conexion" && calle2.tipoInicio === "conexion"
     && calle1.carriles === calle2.carriles) { //Verificar que tengan el mismo numero de carriles
        conexiones.push({ origen: calle1, destino: calle2 });
    } else {
        console.error("Las calles no son compatibles para conexión.");
    }
}

function actualizarCalle(calle, calleIndex) {
    let nuevaCalle = [];
    for (let c = 0; c < calle.carriles; c++) {
        nuevaCalle.push([...calle.arreglo[c]]); // Copia profunda
    }

    if (calle.tipoInicio === "generador") {
        for (let c = 0; c < calle.carriles; c++) {
            if (Math.random() < calle.probabilidadGeneracion) {
                //Aplicar una semi-regla
                let reglaKey = `1,${calle.arreglo[c][0]},${calle.arreglo[c][1]}`;
                nuevaCalle[c][0] = reglas[reglaKey];
            } else {
                nuevaCalle[c][0] = 0;
            }
        }
    }

    for (let c = 0; c < calle.carriles; c++) {
        if (!calle.arreglo?.[c] || !nuevaCalle?.[c] || calle.arreglo[c].length !== calle.tamano) continue;
        if (calle.tamano <= 1) continue;

       for (let i = 1; i < calle.tamano; i++) {
           let izquierda = calle.arreglo[c][i - 1];
           let actual = calle.arreglo[c][i];
           let derecha = (i < calle.tamano - 1 && calle.arreglo[c]?.[i + 1] !== undefined) ? calle.arreglo[c][i + 1] : 0;

           const idCeldaActual = `${calleIndex}-${c}-${i}`;
           const infoIntersec = mapaIntersecciones.get(idCeldaActual);
           if (infoIntersec) {
               derecha = infoIntersec.calle.arreglo[infoIntersec.carril][infoIntersec.indice];
           }

           let reglaKey = `${izquierda},${actual},${derecha}`;
           nuevaCalle[c][i] = reglas[reglaKey];
       }
   }

    calle.arreglo = nuevaCalle;
}

function cambioCarril(calle){
    for (let c = 0; c < calle.carriles; c++) {
        for (let i = 1; i < calle.tamano; i++) {
            let actual = calle.arreglo[c][i]; 
            if (actual === 1) {
                if (Math.random() < calle.probabilidadSaltoDeCarril) {
                    let cambio = Math.random() > 0.5 ? 1 : -1;
                    if (c + cambio < 0 || c + cambio >= calle.carriles ||
                        calle.arreglo[c+cambio][i] === 1) continue;
                    calle.arreglo[c][i] = 0;
                    calle.arreglo[c+cambio][i] = 1;
                }
            }
        }
    }
}

// Dibujar edificios
function dibujarEdificios() {
    edificios.forEach(edificio => {
        ctx.save();
        ctx.translate(edificio.x, edificio.y);
        ctx.rotate(edificio.angle * Math.PI / 180);
        ctx.fillStyle = edificio.color;
        ctx.fillRect(-edificio.width / 2, -edificio.height / 2, edificio.width, edificio.height);
        ctx.restore();
    });
}

// Dibujar el fondo del canvas
function dibujarFondo() {
    ctx.fillStyle = "#c6cbcd"; // Color de fondo personalizado (verde oscuro)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function dibujarCalles() {
    calles.forEach(calle => {
        ctx.save();
        ctx.translate(calle.x, calle.y);
        ctx.rotate(-calle.angulo * Math.PI / 180);

        // Dibujar carriles
        for (let c = 0; c < calle.carriles; c++) {
            // Dibujar imagen de la carretera para cada carril
             for (let i = 0; i < calle.tamano; i++) {
                ctx.drawImage(carreteraImg, i * celda_tamano, c * celda_tamano, celda_tamano, celda_tamano);
            }
        }
        // Dibujar rectángulo amarillo si la calle está seleccionada
        if (calleSeleccionada && calle.nombre === calleSeleccionada.nombre) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, calle.tamano * celda_tamano, calle.carriles * celda_tamano); // Modificado para abarcar todos los carriles
        }
        ctx.restore();
    });
}

function dibujarCarros() {
    calles.forEach(calle => {
        ctx.save();
        ctx.translate(calle.x, calle.y);
        ctx.rotate(-calle.angulo * Math.PI / 180);

        // Dibujar carriles
        for (let c = 0; c < calle.carriles; c++) {
            calle.arreglo[c].forEach((celda, i) => {
                if (celda === 1) {
                    // Dibujar el carro en el carril y posición correctos
                    ctx.drawImage(carroImg, i * celda_tamano, c * celda_tamano, celda_tamano, celda_tamano);
                }
            });
        }
        ctx.restore();
    });
}

function dibujarInterseccionesDetectadas() {
    ctx.save();
    // Usar el estado de transformación actual (zoom/pan)
    // ctx.setTransform(escala, 0, 0, escala, offsetX, offsetY); // No es necesario si se llama después de aplicar la transformación en renderizarCanvas
  
    ctx.fillStyle = "rgba(255, 0, 255, 0.5)"; // Magenta semi-transparente
    const radio = celda_tamano / 2; // Un pequeño radio para el marcador
  
    intersecciones.forEach(inter => {
        // Dibujar un círculo en el punto medio calculado de la intersección
        ctx.beginPath();
        ctx.arc(inter.coords.x, inter.coords.y, radio, 0, 2 * Math.PI);
        ctx.fill();
    });
    ctx.restore();
  }

// Renderizar canvas
function renderizarCanvas() {
    ctx.fillStyle = "#c6cbcd"; // Color de fondo personalizado (gris oscuro)

    // Restablecer la transformación antes de limpiar
    ctx.setTransform(1, 0, 0, 1, 0, 0);


    ctx.clearRect(0, 0, canvas.width, canvas.height); //Soluciona problema de tilling
    ctx.fillRect(0, 0, canvas.width, canvas.height); //Rellena el esapcio

    // Aplicar la transformación de escala y desplazamiento
    ctx.setTransform(escala, 0, 0, escala, offsetX, offsetY);
    //dibujarFondo();    // Dibuja el fondo personalizado
    dibujarEdificios();
    dibujarCalles();
    dibujarCarros();
    dibujarInterseccionesDetectadas();
    // Dibujar el minimapa después de renderizar el canvas principal
    dibujarMinimapa();
}

// Función para calcular el viewport visible
function calcularViewportVisible() {
    const vistaX = -offsetX / escala;
    const vistaY = -offsetY / escala;
    const vistaAncho = canvas.width / escala;
    const vistaAlto = canvas.height / escala;
    return { x: vistaX, y: vistaY, ancho: vistaAncho, alto: vistaAlto };
}

// Iniciar la simulación
function iniciarSimulacion() {

    // Calles con posiciones ajustadas
    
    const Avenida_Juan_de_Dios_Batiz = crearCalle("Av. Juan de Dios Batiz", 422, "generador", "devorador", 210, 110, 0, 0.2,3,0.01);
    const Avenida_Miguel_Othon_de_Mendizabal = crearCalle("Av. Miguel Othon de Mendizabal",277, "generador", "conexion", 108, 192, 39, 0.2,3,0.02);
    const Avenida_Miguel_Bernard = crearCalle("Av. Miguel Bernard",148, "conexion", "devorador", 324, 17, -39, 0.2,3,0.01);
    const Avenida_Cien_Metros = crearCalle("Av. Cien Metros", 250, "generador", "devorador", 134, 115, -73, 0.2,3,0.01);
    const Avenida_IPN = crearCalle("Av. IPN", 305, "generador", "devorador", 489, 50, -90, 0.2,2,0.01);
    const Avenida_Guanajuato = crearCalle("Av. Guanajuato", 150, "generador", "devorador", 192, 305, 0, 0.2,1,0.01);
    const Avenida_Montevideo = crearCalle("Av. Montevideo", 330, "generador", "devorador", 200, 333, 0, 0.2,3,0.01);
    const Avenida_Otavalo = crearCalle("Av. Otavalo", 210, "generador", "devorador", 342, 292, 0, 0.2,1,0.01);
    const Avenida_17_de_mayo = crearCalle("Av. 17 de mayo", 92, "generador", "devorador", 313, 353, 90, 0.2,1,0.01);
    const Calle_Luis_Enrique_Erro_1 = crearCalle("Calle Luis Enrique Erro 1", 220, "generador", "conexion", 342, 306, 90, 0.2,2,0.01);
    const Calle_Luis_Enrique_Erro_2 = crearCalle("Calle Luis Enrique Erro 2", 41, "conexion", "devorador", 342, 86, 55, 0.2,2,0.01);
    const Calle_Miguel_Anda_y_Barredo = crearCalle("Calle Miguel Anda y Barredo", 153, "generador", "devorador", 415, 264, 90, 0.2,1,0.01);
    const Avenida_Wilfrido_Massieu_1 = crearCalle("Av. Wilfrido Massieu 1", 152, "generador", "conexion", 488, 265, 180, 0.2,2,0.01);
    const Avenida_Wilfrido_Massieu_2 = crearCalle("Av. Wilfrido Massieu 2", 164, "conexion", "devorador", 336, 265, 173, 0.2,2,0.01);
    const Avenida_Sierravista = crearCalle("Av. Sierravista", 61, "generador", "devorador", 541, 185, 150, 0.2,1,0.01);
    const Avenida_Lindavista = crearCalle("Av. Lindavista", 60, "generador", "devorador", 541, 230, 152, 0.2,1,0.01);
    const Avenida_Buenavista = crearCalle("Av. Buenavista", 60, "generador", "devorador", 540, 293, 152, 0.2,1,0.01);
    
    
    // Conectar calles
    conexion_calle_de_2(Avenida_Wilfrido_Massieu_1, Avenida_Wilfrido_Massieu_2);
    conexion_calle_de_2(Avenida_Miguel_Othon_de_Mendizabal, Avenida_Miguel_Bernard);
    conexion_calle_de_2(Calle_Luis_Enrique_Erro_1, Calle_Luis_Enrique_Erro_2);

    // Llenar el select con las calles
    calles.forEach(calle => {
        let option = document.createElement("option");
        option.value = calles.indexOf(calle); // Usar el índice como valor
        option.textContent = calle.nombre; // Usar el nombre de la calle
        selectCalle.appendChild(option);
    });

    //Detectar e inicializar intersecciones físicas
    inicializarIntersecciones();
    //Construir mapa de búsqueda rápida
    construirMapaIntersecciones();

    // Evento para actualizar la probabilidad al hacer clic en el botón
    btnActualizarCalle.addEventListener("click", () => {
        const calleIndex = selectCalle.value;
        const nuevaProbabilidad = parseFloat(inputProbabilidadGeneracion.value/100);
        const nuevaProbabilidadSalto = parseFloat(inputProbabilidadSalto.value/100);

        if (calleIndex !== "" && (!isNaN(nuevaProbabilidad)||!isNaN(nuevaProbabilidadSalto)) ) {
            calles[calleIndex].probabilidadGeneracion = nuevaProbabilidad;
            calles[calleIndex].probabilidadSaltoDeCarril = nuevaProbabilidadSalto;
        }
    });

    function animate(tiempoActual) {
        if (!tiempoAnterior) tiempoAnterior = tiempoActual;
        const tiempoTranscurrido = tiempoActual - tiempoAnterior;

        if (tiempoTranscurrido >= intervaloDeseado) {
            calles.forEach((calle, index) => {
                 actualizarCalle(calle, index);
            });

            calles.forEach(cambioCarril);
            checarIntersecciones();
            conexiones.forEach(({ origen, destino }) => {
                for(let c = 0; c < origen.carriles; c++){ //Iterar sobre los carriles
                    destino.arreglo[c][0] = origen.arreglo[c][origen.tamano - 1];
                }
            });

            renderizarCanvas();

            prioridadPar = !prioridadPar; // Cambiar prioridad de intersecciones
            tiempoAnterior = tiempoActual; // Reiniciar el contador

        }

        animationId = requestAnimationFrame(animate);
    }

    animate(); // Iniciar la animación
}

// --- Zoom y Desplazamiento ---
canvas.addEventListener("wheel", event => {
    event.preventDefault();
    escala *= event.deltaY < 0 ? 1.4 : 0.9;
    renderizarCanvas();
});

canvas.addEventListener("mousedown", event => {
    isDragging = true;
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;
});

canvas.addEventListener("mousemove", event => {
    if (isDragging) {
        offsetX = (event.clientX - startX);
        offsetY = (event.clientY - startY);
        renderizarCanvas();
    }
});

canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mouseleave", () => isDragging = false);

canvas.addEventListener("touchstart", event => {
    lastTouchX = event.touches[0].clientX;
    lastTouchY = event.touches[0].clientY;
});

canvas.addEventListener("touchmove", event => {
    event.preventDefault();
    offsetX += (event.touches[0].clientX - lastTouchX);
    offsetY += (event.touches[0].clientY - lastTouchY);
    lastTouchX = event.touches[0].clientX;
    lastTouchY = event.touches[0].clientY;
    renderizarCanvas();
});

minimapaCanvas.addEventListener("click", (event) => {
    const rect = minimapaCanvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const viewport = calcularViewportVisible();
    const centroX = (viewport.x + viewport.ancho / 2);
    const centroY = (viewport.y + viewport.alto / 2);
    const minimapaEscala = 0.1; // Asegúrate de que este valor sea el mismo que usas para dibujar el minimapa
    const minimapaAncho = canvas.width * minimapaEscala;
    const minimapaAlto = canvas.height * minimapaEscala;
    const minimapaOffsetX = minimapaAncho / 2 - centroX * minimapaEscala;
    const minimapaOffsetY = minimapaAlto / 2 - centroY * minimapaEscala;

    const mapaX = (clickX - minimapaOffsetX) / minimapaEscala;
    const mapaY = (clickY-10 - minimapaOffsetY) / minimapaEscala;

    offsetX = -(mapaX * escala - canvas.width / 2);
    offsetY = -(mapaY * escala - canvas.height / 2);

    renderizarCanvas();
});

// Ajustar tamaño del canvas si cambia la ventana
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderizarCanvas();
});

iniciarSimulacion();