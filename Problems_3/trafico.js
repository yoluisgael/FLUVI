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

// Configuración
let calles = [];
let conexiones = [];
const celda_tamano = 5;
let escala = 1;
let offsetX = 0, offsetY = 0;
let isDragging = false, startX, startY;
let lastTouchX, lastTouchY;

// Cargar la imagen del carro
const carroImg = new Image();
carroImg.src = "carro.png";

// Cargar la imagen del carretera
const carreteraImg = new Image();
carreteraImg.src = "carretera.png";

// Lista de edificios estáticos
const edificios = [
    { x: 100, y: 100, width: 30, height: 41, color: "green", angle: 10 },
    { x: 200, y: 150, width: 50, height: 60, color: "green", angle: -15 },
    { x: 300, y: 180, width: 40, height: 55, color: "green", angle: 5 }
];

// Función para crear una calle con posición, ángulo y tamaño
function crearCalle(tamano, tipoInicio, tipoFinal, x, y, angulo, probabilidadGeneracion) {
    let calle = {
        tamano: tamano,
        tipoInicio: tipoInicio,
        tipoFinal: tipoFinal,
        probabilidadGeneracion: probabilidadGeneracion,
        arreglo: new Array(tamano).fill(0),
        x: x * celda_tamano,             // Coordenada x de inicio
        y: y * celda_tamano,             // Coordenada y de inicio
        angulo: angulo    // Ángulo de rotación
    };
    // Si es generador, inicializa las primeras celdas
    if (tipoInicio === "generador") {
        for (let i = 0; i < tamano; i++) {
            calle.arreglo[i] = Math.random() < 0.1 ? 1 : 0;// Carros iniciales al azar
        }
    }

    calles.push(calle);
    return calle;
}

// Función para conectar dos calles
function conexion_calle_de_2(calle1, calle2) {
    if (calle1.tipoFinal === "conexion" && calle2.tipoInicio === "conexion") {
        conexiones.push({ origen: calle1, destino: calle2 });
    } else {
        console.error("Las calles no son compatibles para conexión.");
    }
}

// Actualiza el estado de una calle
function actualizarCalle(calle) {
    let nuevaCalle = [...calle.arreglo];
    if (calle.tipoInicio === "generador" && Math.random() < calle.probabilidadGeneracion) {
        nuevaCalle[0] = 1;
    } else {
        nuevaCalle[0] = 0;
    }
    for (let i = 1; i < calle.tamano; i++) {
        let izquierda = i > 0 ? calle.arreglo[i - 1] : 0;
        let actual = calle.arreglo[i];
        let derecha = i < calle.tamano - 1 ? calle.arreglo[i + 1] : 0;
        let reglaKey = `${izquierda},${actual},${derecha}`;
        nuevaCalle[i] = reglas[reglaKey];
    }
    //for (let i = 1; i < calle.tamano; i++) {
        //let reglaKey = `${calle.arreglo[i - 1]},${calle.arreglo[i]},${calle.arreglo[i + 1] || 0}`;
        //nuevaCalle[i] = reglas[reglaKey];
        
    //}

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

// Dibujar calles
function dibujarCalles() {
    calles.forEach(calle => {
        ctx.save(); // Guarda el estado del contexto antes de aplicar transformaciones
        ctx.translate(calle.x, calle.y); // Traslada el contexto al inicio de la calle
        ctx.rotate(-calle.angulo * Math.PI / 180); // Rota el contexto según el ángulo de la calle

        // Dibujar imagen de la carretera
        for (let i = 0; i < calle.tamano; i++) {
            ctx.drawImage(carreteraImg, i * celda_tamano, 0, celda_tamano, celda_tamano);
        }
        // Dibujar imagen de la carretera con color
        //ctx.fillStyle = "gray";
        //ctx.fillRect(0, 0, calle.tamano * celda_tamano, celda_tamano); // Dibuja la calle horizontalmente

        calle.arreglo.forEach((celda, i) => {
            //Asi se hace con colores
            /*if (celda === 1) {
                ctx.fillStyle = "blue";
                ctx.fillRect(i * celda_tamano, 0, celda_tamano, celda_tamano); // Dibuja los carros horizontalmente
            }*/
           //Asi se hace con imagenes
            if (celda === 1) {
                ctx.drawImage(carroImg, i * celda_tamano, 0, celda_tamano, celda_tamano);
            }
        });

        ctx.restore(); // Restaura el estado original del contexto
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
    //dibujarFondo();    // Dibuja el fondo personalizado
    dibujarEdificios();
    dibujarCalles();
}

let animationId; // Variable para guardar el ID de la animación
let tiempoAnterior = 0;
const intervaloDeseado = 60; // Intervalo en milisegundos (100ms = 10 actualizaciones por segundo)

// Iniciar la simulación
function iniciarSimulacion() {
    // Calles con posiciones ajustadas
    const Avenida_Miguel_Othon_de_Mendizabal = crearCalle(277, "generador", "conexion", 108, 192, 39, 0.2);
    const Avenida_Miguel_Bernard = crearCalle(148, "conexion", "devorador", 324, 17, -39, 0.2);
    const Avenida_Cien_Metros = crearCalle(250, "generador", "devorador", 134, 115, -73, 0.2);
    const Avenida_Juan_de_Dios_Batiz = crearCalle(422, "generador", "devorador", 210, 110, 0, 0.2);
    const Avenida_IPN = crearCalle(305, "generador", "devorador", 489, 50, -90, 0.2);
    const Avenida_Guanajuato = crearCalle(150, "generador", "devorador", 192, 305, 0, 0.2);
    const Avenida_Montevideo = crearCalle(330, "generador", "devorador", 200, 333, 0, 0.2);
    const Avenida_Otavalo = crearCalle(210, "generador", "devorador", 342, 292, 0, 0.2);
    const Avenida_17_de_mayo = crearCalle(92, "generador", "devorador", 313, 353, 90, 0.2);
    const Calle_Luis_Enrique_Erro_1 = crearCalle(220, "generador", "conexion", 342, 306, 90, 0.2);
    const Calle_Luis_Enrique_Erro_2 = crearCalle(41, "conexion", "devorador", 342, 86, 55, 0.2);
    const Calle_Miguel_Anda_y_Barredo = crearCalle(153, "generador", "devorador", 415, 264, 90, 0.2);
    const Avenida_Wilfrido_Massieu_1 = crearCalle(152, "generador", "conexion", 488, 265, 180, 0.2);
    const Avenida_Wilfrido_Massieu_2 = crearCalle(164, "conexion", "devorador", 336, 265, 173, 0.2);
    const Avenida_Sierravista = crearCalle(61, "generador", "devorador", 541, 185, 150, 0.2);
    const Avenida_Lindavista = crearCalle(60, "generador", "devorador", 541, 230, 152, 0.2);
    const Avenida_Buenavista = crearCalle(60, "generador", "devorador", 540, 293, 152, 0.2);
    
    // Conectar calles
    conexion_calle_de_2(Avenida_Wilfrido_Massieu_1, Avenida_Wilfrido_Massieu_2);
    conexion_calle_de_2(Avenida_Miguel_Othon_de_Mendizabal, Avenida_Miguel_Bernard);
    conexion_calle_de_2(Calle_Luis_Enrique_Erro_1, Calle_Luis_Enrique_Erro_2);

    //setInterval(() => {
        //calles.forEach(actualizarCalle);
        // Actualiza calles
        //calles.forEach(calle => actualizarCalle(calle));
        // Transfiere datos entre calles conectadas
        //conexiones.forEach(({ origen, destino }) => {
            //destino.arreglo[0] = origen.arreglo[origen.tamano - 1];
        //});
        //renderizarCanvas();
    //}, 100);
    /*function animate() {
        calles.forEach(actualizarCalle);
        conexiones.forEach(({ origen, destino }) => {
            destino.arreglo[0] = origen.arreglo[origen.tamano - 1];
        });
        renderizarCanvas();
        animationId = requestAnimationFrame(animate);
    }*/
    function animate(tiempoActual) {
        if (!tiempoAnterior) tiempoAnterior = tiempoActual;
        const tiempoTranscurrido = tiempoActual - tiempoAnterior;
    
        if (tiempoTranscurrido >= intervaloDeseado) {
            calles.forEach(actualizarCalle);
            conexiones.forEach(({ origen, destino }) => {
                destino.arreglo[0] = origen.arreglo[origen.tamano - 1];
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
    escala *= event.deltaY < 0 ? 1.1 : 0.9;
    renderizarCanvas();
});

canvas.addEventListener("mousedown", event => {
    isDragging = true;
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;
});

canvas.addEventListener("mousemove", event => {
    if (isDragging) {
        offsetX = event.clientX - startX;
        offsetY = event.clientY - startY;
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
    offsetX += event.touches[0].clientX - lastTouchX;
    offsetY += event.touches[0].clientY - lastTouchY;
    lastTouchX = event.touches[0].clientX;
    lastTouchY = event.touches[0].clientY;
    renderizarCanvas();
});

// Ajustar tamaño del canvas si cambia la ventana
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderizarCanvas();
});

iniciarSimulacion();
