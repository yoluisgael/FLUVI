const canvas = document.getElementById("simuladorCanvas");
const ctx = canvas.getContext("2d");

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
const inputProbabilidad = document.getElementById("inputProbabilidad");
const btnActualizarCalle = document.getElementById("btnActualizarCalle");

let animationId; // Variable para guardar el ID de la animación
let tiempoAnterior = 0;
const intervaloDeseado = 60; // Intervalo en milisegundos (100ms = 10 actualizaciones por segundo)

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

// Evento para guardar la calle seleccionada
selectCalle.addEventListener("change", () => {
    const calleIndex = selectCalle.value;
    if (calleIndex !== "") {
        calleSeleccionada = calles[calleIndex];
    } else {
        calleSeleccionada = null;
    }
    renderizarCanvas();
});

// Función para crear una calle con posición, ángulo y tamaño
function crearCalle(nombre, tamano, tipoInicio, tipoFinal, x, y, angulo, probabilidadGeneracion, carriles = 1) {
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
        carriles: carriles // Añadimos el número de carriles
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

// Función para conectar dos calles
function conexion_calle_de_2(calle1, calle2) {
    if (calle1.tipoFinal === "conexion" && calle2.tipoInicio === "conexion"
     && calle1.carriles === calle2.carriles) { //Verificar que tengan el mismo numero de carriles
        conexiones.push({ origen: calle1, destino: calle2 });
    } else {
        console.error("Las calles no son compatibles para conexión.");
    }
}

function actualizarCalle(calle) {
    let nuevaCalle = [];
    for (let c = 0; c < calle.carriles; c++) {
        nuevaCalle.push([...calle.arreglo[c]]); // Copia profunda del carril actual
    }

    if (calle.tipoInicio === "generador") {
        for (let c = 0; c < calle.carriles; c++) {
            if (Math.random() < calle.probabilidadGeneracion) {
                nuevaCalle[c][0] = 1; // Genera carros en la primera celda de cada carril
            } else {
                nuevaCalle[c][0] = 0;
            }
        }
    }

    for (let c = 0; c < calle.carriles; c++) {
        for (let i = 1; i < calle.tamano; i++) {
            // Vecinos en el mismo carril
            let izquierda = calle.arreglo[c][i - 1];
            let actual = calle.arreglo[c][i];
            let derecha = (i < calle.tamano - 1) ? calle.arreglo[c][i + 1] : 0;

            // --- Aplicar reglas (versión simplificada) ---
            let reglaKey = `${izquierda},${actual},${derecha}`;
            nuevaCalle[c][i] = reglas[reglaKey];
        }
    }

    calle.arreglo = nuevaCalle;
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

            calle.arreglo[c].forEach((celda, i) => {
                if (celda === 1) {
                    // Dibujar el carro en el carril y posición correctos
                    ctx.drawImage(carroImg, i * celda_tamano, c * celda_tamano, celda_tamano, celda_tamano);
                }
            });
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
    const Avenida_Miguel_Othon_de_Mendizabal = crearCalle("Av. Miguel Othon de Mendizabal",277, "generador", "conexion", 108, 192, 39, 0.2,3);
    const Avenida_Miguel_Bernard = crearCalle("Av. Miguel Bernard",148, "conexion", "devorador", 324, 17, -39, 0.2,3);
    const Avenida_Cien_Metros = crearCalle("Av. Cien Metros", 250, "generador", "devorador", 134, 115, -73, 0.2,3);
    const Avenida_Juan_de_Dios_Batiz = crearCalle("Av. Juan de Dios Batiz", 422, "generador", "devorador", 210, 110, 0, 0.2,3);
    const Avenida_IPN = crearCalle("Av. IPN", 305, "generador", "devorador", 489, 50, -90, 0.2,2);
    const Avenida_Guanajuato = crearCalle("Av. Guanajuato", 150, "generador", "devorador", 192, 305, 0, 0.2,1);
    const Avenida_Montevideo = crearCalle("Av. Montevideo", 330, "generador", "devorador", 200, 333, 0, 0.2,3);
    const Avenida_Otavalo = crearCalle("Av. Otavalo", 210, "generador", "devorador", 342, 292, 0, 0.2,1);
    const Avenida_17_de_mayo = crearCalle("Av. 17 de mayo", 92, "generador", "devorador", 313, 353, 90, 0.2,1);
    const Calle_Luis_Enrique_Erro_1 = crearCalle("Calle Luis Enrique Erro 1", 220, "generador", "conexion", 342, 306, 90, 0.2,2);
    const Calle_Luis_Enrique_Erro_2 = crearCalle("Calle Luis Enrique Erro 2", 41, "conexion", "devorador", 342, 86, 55, 0.2,2);
    const Calle_Miguel_Anda_y_Barredo = crearCalle("Calle Miguel Anda y Barredo", 153, "generador", "devorador", 415, 264, 90, 0.2,1);
    const Avenida_Wilfrido_Massieu_1 = crearCalle("Av. Wilfrido Massieu 1", 152, "generador", "conexion", 488, 265, 180, 0.2,2);
    const Avenida_Wilfrido_Massieu_2 = crearCalle("Av. Wilfrido Massieu 2", 164, "conexion", "devorador", 336, 265, 173, 0.2,2);
    const Avenida_Sierravista = crearCalle("Av. Sierravista", 61, "generador", "devorador", 541, 185, 150, 0.2,1);
    const Avenida_Lindavista = crearCalle("Av. Lindavista", 60, "generador", "devorador", 541, 230, 152, 0.2,1);
    const Avenida_Buenavista = crearCalle("Av. Buenavista", 60, "generador", "devorador", 540, 293, 152, 0.2,1);
    
    
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

    // Evento para actualizar la probabilidad al hacer clic en el botón
    btnActualizarCalle.addEventListener("click", () => {
        const calleIndex = selectCalle.value;
        const nuevaProbabilidad = parseFloat(inputProbabilidad.value);

        if (calleIndex !== "" && !isNaN(nuevaProbabilidad)) {
            calles[calleIndex].probabilidadGeneracion = nuevaProbabilidad;
            alert("Probabilidad actualizada");
        }
    });

    function animate(tiempoActual) {
        if (!tiempoAnterior) tiempoAnterior = tiempoActual;
        const tiempoTranscurrido = tiempoActual - tiempoAnterior;

        if (tiempoTranscurrido >= intervaloDeseado) {
            calles.forEach(actualizarCalle);
            conexiones.forEach(({ origen, destino }) => {
                for(let c = 0; c < origen.carriles; c++){ //Iterar sobre los carriles
                    destino.arreglo[c][0] = origen.arreglo[c][origen.tamano - 1];
                }
            });
            renderizarCanvas();
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