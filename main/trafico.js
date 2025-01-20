const reglas = {
    "0,0,0": 0,
    "0,0,1": 0,
    "0,1,0": 0,
    "0,1,1": 1, // mismo
    "1,0,0": 1, // anterior
    "1,0,1": 1, // anterior
    "1,1,0": 0,
    "1,1,1": 1  // mismo
};

let calles = [];       // Almacenará las calles
let conexiones = [];   // Almacenará las conexiones entre calles
const celda_tamano = 5;

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
            calle.arreglo[i] = Math.random() < 0.1 ? 1 : 0; // Carros iniciales al azar
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
    if (calle.tipoInicio === "generador" && (Math.random() < calle.probabilidadGeneracion))
        nuevaCalle[0] = 1; // Genera carros en la primera celda
    else 
        nuevaCalle[0] = 0;

    for (let i = 1; i < calle.tamano; i++) {
        let izquierda = i > 0 ? calle.arreglo[i - 1] : 0;
        let actual = calle.arreglo[i];
        let derecha = i < calle.tamano - 1 ? calle.arreglo[i + 1] : 0;
        let reglaKey = `${izquierda},${actual},${derecha}`;
        nuevaCalle[i] = reglas[reglaKey];
    }

    calle.arreglo = nuevaCalle;
}

// Renderiza las calles en coordenadas específicas y ángulo
function renderizarCalles() {
    const contenedor = document.getElementById("contenido-simulador"); // <-- Cambiado a "contenido-simulador"
    contenedor.innerHTML = ""; // Limpia el contenedor

    calles.forEach((calle) => {
        const calleContainer = document.createElement("div");
        calleContainer.style.position = "absolute";
        calleContainer.style.left = `${calle.x}px`;
        calleContainer.style.top = `${calle.y}px`;

        // Traslación al inicio de la calle
        calleContainer.style.transform = `translate(${-calle.tamano * celda_tamano / 2}px, ${celda_tamano/2}px)`;

        // Rotación sobre el inicio de la calle
        calleContainer.style.transform += `rotate(${-calle.angulo}deg)`;

        calleContainer.style.transform += `translate(${calle.tamano * celda_tamano / 2}px, ${celda_tamano/2}px)`;

        calleContainer.style.display = "flex";

        // Renderiza cada celda de la calle
        calle.arreglo.forEach(celda => {
            const div = document.createElement("div");
            div.className = "cuadro";
            div.style.width = `${celda_tamano}px`;
            div.style.height = `${celda_tamano}px`;
            div.style.border = "0px solid gray";
            if (celda === 1) div.classList.add("carro");
            calleContainer.appendChild(div);
        });
        
        contenedor.appendChild(calleContainer);
    });
}

// Inicia la simulación con calles en coordenadas y ángulos personalizados
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

    setInterval(() => {
        // Actualiza calles
        calles.forEach(calle => actualizarCalle(calle));

        // Transfiere datos entre calles conectadas
        conexiones.forEach(({ origen, destino }) => {
            destino.arreglo[0] = origen.arreglo[origen.tamano - 1];
        });

        // Renderizar
        renderizarCalles();
    }, 100);
}

// --- Zoom con la rueda del ratón ---
const contenedorSimulador = document.getElementById('contenido-simulador');
const simuladorDiv = document.getElementById('simulador');
let escalaActual = 0.5;

simuladorDiv.addEventListener('wheel', (event) => {
    event.preventDefault();
    escalaActual += event.deltaY < 0 ? 0.1 : -0.1;
    contenedorSimulador.style.transform = `scale(${escalaActual})`;
});

// --- Desplazamiento del mapa arrastrando ---
let isDragging = false;
let startX, startY;
let offsetX = 0, offsetY = 0;

simuladorDiv.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        isDragging = true;
        startX = event.clientX - offsetX;
        startY = event.clientY - offsetY;
        simuladorDiv.style.cursor = 'grabbing';
    }
});

simuladorDiv.addEventListener('mousemove', (event) => {
    if (isDragging) {
        offsetX = event.clientX - startX;
        offsetY = event.clientY - startY;
        contenedorSimulador.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${escalaActual})`;
    }
});

simuladorDiv.addEventListener('mouseup', () => {
    isDragging = false;
    simuladorDiv.style.cursor = 'default';
});

simuladorDiv.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        simuladorDiv.style.cursor = 'default';
    }
});

// --- Zoom con botones --- // <-- Esta sección se ha movido aquí
const zoomInButton = document.getElementById('zoomIn');
const zoomOutButton = document.getElementById('zoomOut');

zoomInButton.addEventListener('click', () => {
  escalaActual += 0.1;
  contenedorSimulador.style.transform = `scale(${escalaActual})`;
});

zoomOutButton.addEventListener('click', () => {
  escalaActual -= 0.1;
  contenedorSimulador.style.transform = `scale(${escalaActual})`;
});

iniciarSimulacion();
