const canvas = document.getElementById("simuladorCanvas");
const ctx = canvas.getContext("2d");

// Constantes de intersecciones
let intersecciones = []; 
const celdasIntersectadas = new Set();
let mapaIntersecciones = new Map(); 

let mostrarConexiones = false; // NUEVO: Variable para controlar visualización de conexiones
let mostrarEtiquetas = true; // Variable para controlar visualización de etiquetas de nombres
let colorFondoCanvas = "#c6cbcd"; // Color de fondo del canvas (almacenado para detección automática)
let prioridadPar = true;

// Ajustar tamaño inicial del canvas
function resizeCanvas() {
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.header');
    const sidebarWidth = window.innerWidth > 768 ? 380 : 0;
    const headerHeight = header ? header.offsetHeight : 0;

    canvas.width = window.innerWidth - sidebarWidth;
    canvas.height = window.innerHeight - headerHeight;
}

resizeCanvas();

// Reglas de tráfico
const reglas = {
    // Reglas para vehículo tipo 1
    "0,0,0": 0, "0,0,1": 0, "0,1,0": 0, "0,1,1": 1, "0,1,2": 1, "0,1,3": 1, "0,1,4": 1, "0,1,5": 1, "0,1,6": 1,
    "1,0,0": 1, "1,0,1": 1, "1,0,2": 1, "1,0,3": 1, "1,0,4": 1, "1,0,5": 1, "1,0,6": 1,
    "1,1,0": 0, "1,1,1": 1, "1,1,2": 1, "1,1,3": 1, "1,1,4": 1, "1,1,5": 1, "1,1,6": 1,
    "2,1,0": 0, "2,1,1": 1, "2,1,2": 1, "2,1,3": 1, "2,1,4": 1, "2,1,5": 1, "2,1,6": 1,
    "3,1,0": 0, "3,1,1": 1, "3,1,2": 1, "3,1,3": 1, "3,1,4": 1, "3,1,5": 1, "3,1,6": 1,
    "4,1,0": 0, "4,1,1": 1, "4,1,2": 1, "4,1,3": 1, "4,1,4": 1, "4,1,5": 1, "4,1,6": 1,
    "5,1,0": 0, "5,1,1": 1, "5,1,2": 1, "5,1,3": 1, "5,1,4": 1, "5,1,5": 1, "5,1,6": 1,
    "6,1,0": 0, "6,1,1": 1, "6,1,2": 1, "6,1,3": 1, "6,1,4": 1, "6,1,5": 1, "6,1,6": 1,

    // Reglas para vehículo tipo 2
    "0,0,2": 0, "0,2,0": 0, "0,2,1": 2, "0,2,2": 2, "0,2,3": 2, "0,2,4": 2, "0,2,5": 2, "0,2,6": 2,
    "1,2,0": 0, "1,2,1": 2, "1,2,2": 2, "1,2,3": 2, "1,2,4": 2, "1,2,5": 2, "1,2,6": 2,
    "2,0,0": 2, "2,0,1": 2, "2,0,2": 2, "2,0,3": 2, "2,0,4": 2, "2,0,5": 2, "2,0,6": 2,
    "2,2,0": 0, "2,2,1": 2, "2,2,2": 2, "2,2,3": 2, "2,2,4": 2, "2,2,5": 2, "2,2,6": 2,
    "0,1,2": 1, "2,1,0": 0, "2,1,1": 1, "2,1,2": 1, "2,1,3": 1, "2,1,4": 1, "2,1,5": 1, "2,1,6": 1,
    "3,2,0": 0, "3,2,1": 2, "3,2,2": 2, "3,2,3": 2, "3,2,4": 2, "3,2,5": 2, "3,2,6": 2,
    "4,2,0": 0, "4,2,1": 2, "4,2,2": 2, "4,2,3": 2, "4,2,4": 2, "4,2,5": 2, "4,2,6": 2,
    "5,2,0": 0, "5,2,1": 2, "5,2,2": 2, "5,2,3": 2, "5,2,4": 2, "5,2,5": 2, "5,2,6": 2,
    "6,2,0": 0, "6,2,1": 2, "6,2,2": 2, "6,2,3": 2, "6,2,4": 2, "6,2,5": 2, "6,2,6": 2,

    // Reglas para vehículo tipo 3
    "0,0,3": 0, "0,3,0": 0, "0,3,1": 3, "0,3,2": 3, "0,3,3": 3, "0,3,4": 3, "0,3,5": 3, "0,3,6": 3,
    "1,3,0": 0, "1,3,1": 3, "1,3,2": 3, "1,3,3": 3, "1,3,4": 3, "1,3,5": 3, "1,3,6": 3,
    "2,3,0": 0, "2,3,1": 3, "2,3,2": 3, "2,3,3": 3, "2,3,4": 3, "2,3,5": 3, "2,3,6": 3,
    "3,0,0": 3, "3,0,1": 3, "3,0,2": 3, "3,0,3": 3, "3,0,4": 3, "3,0,5": 3, "3,0,6": 3,
    "3,3,0": 0, "3,3,1": 3, "3,3,2": 3, "3,3,3": 3, "3,3,4": 3, "3,3,5": 3, "3,3,6": 3,
    "0,1,3": 1, "3,1,0": 0, "3,1,1": 1, "3,1,2": 1, "3,1,3": 1, "3,1,4": 1, "3,1,5": 1, "3,1,6": 1,
    "0,2,3": 2, "3,2,0": 0, "3,2,1": 2, "3,2,2": 2, "3,2,3": 2, "3,2,4": 2, "3,2,5": 2, "3,2,6": 2,
    "4,3,0": 0, "4,3,1": 3, "4,3,2": 3, "4,3,3": 3, "4,3,4": 3, "4,3,5": 3, "4,3,6": 3,
    "5,3,0": 0, "5,3,1": 3, "5,3,2": 3, "5,3,3": 3, "5,3,4": 3, "5,3,5": 3, "5,3,6": 3,
    "6,3,0": 0, "6,3,1": 3, "6,3,2": 3, "6,3,3": 3, "6,3,4": 3, "6,3,5": 3, "6,3,6": 3,

    // Reglas para vehículo tipo 4
    "0,0,4": 0, "0,4,0": 0, "0,4,1": 4, "0,4,2": 4, "0,4,3": 4, "0,4,4": 4, "0,4,5": 4, "0,4,6": 4,
    "1,4,0": 0, "1,4,1": 4, "1,4,2": 4, "1,4,3": 4, "1,4,4": 4, "1,4,5": 4, "1,4,6": 4,
    "2,4,0": 0, "2,4,1": 4, "2,4,2": 4, "2,4,3": 4, "2,4,4": 4, "2,4,5": 4, "2,4,6": 4,
    "3,4,0": 0, "3,4,1": 4, "3,4,2": 4, "3,4,3": 4, "3,4,4": 4, "3,4,5": 4, "3,4,6": 4,
    "4,0,0": 4, "4,0,1": 4, "4,0,2": 4, "4,0,3": 4, "4,0,4": 4, "4,0,5": 4, "4,0,6": 4,
    "4,4,0": 0, "4,4,1": 4, "4,4,2": 4, "4,4,3": 4, "4,4,4": 4, "4,4,5": 4, "4,4,6": 4,
    "0,1,4": 1, "4,1,0": 0, "4,1,1": 1, "4,1,2": 1, "4,1,3": 1, "4,1,4": 1, "4,1,5": 1, "4,1,6": 1,
    "0,2,4": 2, "4,2,0": 0, "4,2,1": 2, "4,2,2": 2, "4,2,3": 2, "4,2,4": 2, "4,2,5": 2, "4,2,6": 2,
    "0,3,4": 3, "4,3,0": 0, "4,3,1": 3, "4,3,2": 3, "4,3,3": 3, "4,3,4": 3, "4,3,5": 3, "4,3,6": 3,
    "5,4,0": 0, "5,4,1": 4, "5,4,2": 4, "5,4,3": 4, "5,4,4": 4, "5,4,5": 4, "5,4,6": 4,
    "6,4,0": 0, "6,4,1": 4, "6,4,2": 4, "6,4,3": 4, "6,4,4": 4, "6,4,5": 4, "6,4,6": 4,

    // Reglas para vehículo tipo 5
    "0,0,5": 0, "0,5,0": 0, "0,5,1": 5, "0,5,2": 5, "0,5,3": 5, "0,5,4": 5, "0,5,5": 5, "0,5,6": 5,
    "1,5,0": 0, "1,5,1": 5, "1,5,2": 5, "1,5,3": 5, "1,5,4": 5, "1,5,5": 5, "1,5,6": 5,
    "2,5,0": 0, "2,5,1": 5, "2,5,2": 5, "2,5,3": 5, "2,5,4": 5, "2,5,5": 5, "2,5,6": 5,
    "3,5,0": 0, "3,5,1": 5, "3,5,2": 5, "3,5,3": 5, "3,5,4": 5, "3,5,5": 5, "3,5,6": 5,
    "4,5,0": 0, "4,5,1": 5, "4,5,2": 5, "4,5,3": 5, "4,5,4": 5, "4,5,5": 5, "4,5,6": 5,
    "5,0,0": 5, "5,0,1": 5, "5,0,2": 5, "5,0,3": 5, "5,0,4": 5, "5,0,5": 5, "5,0,6": 5,
    "5,5,0": 0, "5,5,1": 5, "5,5,2": 5, "5,5,3": 5, "5,5,4": 5, "5,5,5": 5, "5,5,6": 5,
    "0,1,5": 1, "5,1,0": 0, "5,1,1": 1, "5,1,2": 1, "5,1,3": 1, "5,1,4": 1, "5,1,5": 1, "5,1,6": 1,
    "0,2,5": 2, "5,2,0": 0, "5,2,1": 2, "5,2,2": 2, "5,2,3": 2, "5,2,4": 2, "5,2,5": 2, "5,2,6": 2,
    "0,3,5": 3, "5,3,0": 0, "5,3,1": 3, "5,3,2": 3, "5,3,3": 3, "5,3,4": 3, "5,3,5": 3, "5,3,6": 3,
    "0,4,5": 4, "5,4,0": 0, "5,4,1": 4, "5,4,2": 4, "5,4,3": 4, "5,4,4": 4, "5,4,5": 4, "5,4,6": 4,
    "6,5,0": 0, "6,5,1": 5, "6,5,2": 5, "6,5,3": 5, "6,5,4": 5, "6,5,5": 5, "6,5,6": 5,

    // Reglas para vehículo tipo 6
    "0,0,6": 0, "0,6,0": 0, "0,6,1": 6, "0,6,2": 6, "0,6,3": 6, "0,6,4": 6, "0,6,5": 6, "0,6,6": 6,
    "1,6,0": 0, "1,6,1": 6, "1,6,2": 6, "1,6,3": 6, "1,6,4": 6, "1,6,5": 6, "1,6,6": 6,
    "2,6,0": 0, "2,6,1": 6, "2,6,2": 6, "2,6,3": 6, "2,6,4": 6, "2,6,5": 6, "2,6,6": 6,
    "3,6,0": 0, "3,6,1": 6, "3,6,2": 6, "3,6,3": 6, "3,6,4": 6, "3,6,5": 6, "3,6,6": 6,
    "4,6,0": 0, "4,6,1": 6, "4,6,2": 6, "4,6,3": 6, "4,6,4": 6, "4,6,5": 6, "4,6,6": 6,
    "5,6,0": 0, "5,6,1": 6, "5,6,2": 6, "5,6,3": 6, "5,6,4": 6, "5,6,5": 6, "5,6,6": 6,
    "6,0,0": 6, "6,0,1": 6, "6,0,2": 6, "6,0,3": 6, "6,0,4": 6, "6,0,5": 6, "6,0,6": 6,
    "6,6,0": 0, "6,6,1": 6, "6,6,2": 6, "6,6,3": 6, "6,6,4": 6, "6,6,5": 6, "6,6,6": 6,
    "0,1,6": 1, "6,1,0": 0, "6,1,1": 1, "6,1,2": 1, "6,1,3": 1, "6,1,4": 1, "6,1,5": 1, "6,1,6": 1,
    "0,2,6": 2, "6,2,0": 0, "6,2,1": 2, "6,2,2": 2, "6,2,3": 2, "6,2,4": 2, "6,2,5": 2, "6,2,6": 2,
    "0,3,6": 3, "6,3,0": 0, "6,3,1": 3, "6,3,2": 3, "6,3,3": 3, "6,3,4": 3, "6,3,5": 3, "6,3,6": 3,
    "0,4,6": 4, "6,4,0": 0, "6,4,1": 4, "6,4,2": 4, "6,4,3": 4, "6,4,4": 4, "6,4,5": 4, "6,4,6": 4,
    "0,5,6": 5, "6,5,0": 0, "6,5,1": 5, "6,5,2": 5, "6,5,3": 5, "6,5,4": 5, "6,5,5": 5, "6,5,6": 5
};

// Tipos de conexión
const TIPOS_CONEXION = {
    LINEAL: "lineal",
    INCORPORACION: "incorporacion",
    PROBABILISTICA: "probabilistica"
};

// AGREGAR: Tipos de arreglos
const TIPOS = {
    GENERADOR: "generador",
    CONEXION: "conexion",
    DEVORADOR: "devorador"
};

// Variables para el modificador de calles
const selectCalle = document.getElementById("selectCalle");
const inputProbabilidadGeneracion = document.getElementById("inputProbabilidadGeneracion");
const inputProbabilidadSalto = document.getElementById("inputProbabilidadSalto");
const btnActualizarCalle = document.getElementById("btnActualizarCalle");

let animationId; // Variable para guardar el ID de la animación
let tiempoAnterior = 0;
let intervaloDeseado = 500; // Intervalo en milisegundos (100ms = 10 actualizaciones por segundo)

let isPaused = false;
let mostrarIntersecciones = false;
const minVelocidadSlider = 1;  
const maxVelocidadSlider = 100; 
const maxIntervalo = 1000;  
const minIntervalo = 10;

// Configuración
let calles = [];
let conexiones = [];
const celda_tamano = 5;
let escala = 1;
let offsetX = 0, offsetY = 0;
let isDragging = false, startX, startY;
let hasDragged = false;
let lastTouchX, lastTouchY;
let calleSeleccionada = null; // Variable para almacenar la calle seleccionada
let probabilidadGeneracionGeneral = 0.5;

// Variables globales expuestas para el editor
window.calles = calles;
window.conexiones = conexiones; // IMPORTANTE: Exponer para que constructor.js pueda acceder
window.calleSeleccionada = null;
window.isPaused = false;
window.escala = escala;
window.offsetX = offsetX;
window.offsetY = offsetY;
window.celda_tamano = celda_tamano;
window.renderizarCanvas = renderizarCanvas;
window.inicializarIntersecciones = inicializarIntersecciones;
window.construirMapaIntersecciones = construirMapaIntersecciones;
window.modoSeleccion = "configuracion"; // Para diferenciar entre "configuracion" y "constructor"

// Cargar las imágenes de los 6 tipos de carros
const carroImgs = [];
for (let i = 1; i <= 6; i++) {
    const img = new Image();
    img.src = i === 1 ? "carro.png" : `carro${i}.png`;
    carroImgs.push(img);
}

// Función para obtener la imagen según el tipo de vehículo
function obtenerImagenVehiculo(tipo) {
    const indice = tipo - 1; // tipo 1 = índice 0, tipo 6 = índice 5
    if (indice >= 0 && indice < carroImgs.length) {
        return carroImgs[indice];
    }
    return carroImgs[0]; // Fallback a carro.png
}

// Mantener compatibilidad con código antiguo
const carroImg = carroImgs[0];

// Cargar la imagen del carretera
const carreteraImg = new Image();
carreteraImg.src = "carretera.png";

// Cargar la imagen del cono
const conoImg = new Image();
conoImg.src = "cono.png";

// ========== LISTA DE EDIFICIOS COMPLETA (DESDE TRAFICO.TXT) ==========
const edificios = [
    // ========== ZONA SUPERIOR IZQUIERDA (cerca de Av. Miguel Othon de Mendizabal) ==========
        
    // CONO
    { x: 1937, y: 910, width: 45, height: 45, color: "#0d0e10ff", angle: 12, label: "CONO" },

    // ESCOM
    { x: 1083, y: 854, width: 100, height: 60, color: "#0047a3ff", angle: 12, label: "ESCOM" },
    
    // ESTACIONAMIENTO ESCOM
    { x: 1199, y: 916, width: 200, height: 90, color: "#29293aff", angle: 282, label: "ESTACIONAMIENTO ESCOM" },
    
    // CIC
    { x: 1050, y: 1008, width: 100, height: 60, color: "#0047a3ff", angle: 12, label: "CIC" },

    // ESTACIONAMIENTO CIC
    { x: 916, y: 997, width: 200, height: 90, color: "#29293aff", angle: 282, label: "ESTACIONAMIENTO CIC" },
    
    // CFIE
    { x: 1643, y: 1592, width: 140, height: 100, color: "#0047a3ff", angle: 12, label: "C.F.I.E" },
    // Edificios pequeños E
    { x: 2029, y: 1774, width: 35, height: 30, color: "#29293aff", angle: 17, label: "E" },
    { x: 1688, y: 463, width: 35, height: 30, color: "#29293aff", angle: 157, label: "E" },
    { x: 1591, y: 517, width: 35, height: 30, color: "#29293aff", angle: 149, label: "E" },
    
    // ========== ZONA CENTRAL IZQUIERDA (entre Av. Cien Metros y Av. Juan de Dios Batiz) ==========
    // Campo de entrenamiento "Pieles Rojas"
    { x: 1739, y: 1116, width: 300, height: 140, color: "#164916ff", angle: 279, label: "CAMPO ENTRENAMIENTO" },
    
    // Campo de Beisbol
    { x: 1963, y: 1413, width: 100, height: 200, color: "#164916ff", angle: 10, label: "BEISBOL" },

    // ========== ZONA CENTRAL (entre Luis Enrique Erro y Miguel Anda y Barredo) ==========
    // Estadio Americano
    { x: 2018, y: 1107, width: 250, height: 80, color: "#164916ff", angle: 280, label: "ESTADIO AMERICANO" },
    
    // Alberca
    { x: 2133, y: 1474, width: 100, height: 200, color: "#4169E1", angle: 10, label: "ALBERCA" },
    
    // Gimnasio
    { x: 1891, y: 1617, width: 70, height: 50, color: "#8b4513", angle: 282, label: "Gimnasio" },
    
    // PLANETARIO
    { x: 1876, y: 1740, width: 80, height: 80, color: "#4b0000ff", angle: 13, label: "PLANETARIO" },
    
    // CENLEX
    { x: 2050, y: 1689, width: 70, height: 45, color: "#8b4513", angle: 12, label: "CENLEX" },
    
    // Estacionamiento zona planetario
    { x: 2584, y: 1370, width: 70, height: 90, color: "#fff9d0ff", angle: 11, label: "EST" },

    // ========== ZONA SUPERIOR CENTRAL (cerca de Av. Miguel Bernard) ==========
    // Edificios E (fila horizontal)
    { x: 1940, y: 624, width: 40, height: 35, color: "#8b7355", angle: 25, label: "E" },
    { x: 1873, y: 690, width: 40, height: 35, color: "#8b7355", angle: 43, label: "E" },
    { x: 1411, y: 590, width: 40, height: 35, color: "#8b7355", angle: 127, label: "E" },
    { x: 1370, y: 663, width: 40, height: 35, color: "#8b7355", angle: 45, label: "E" },
    { x: 1303, y: 720, width: 40, height: 35, color: "#8b7355", angle: 9, label: "E" },
    { x: 1636, y: 779, width: 40, height: 35, color: "#8b7355", angle: 14, label: "E" },
    


    // ========== ZONA DERECHA (entre Av. IPN y edificios numerados) ==========
    // Edificios numerados 1-9
    { x: 2429, y: 1134, width: 90, height: 32, color: "#4b0000ff", angle: 15, label: "Edificio 1" },
    { x: 2410, y: 1206, width: 90, height: 32, color: "#4b0000ff", angle: 15, label: "Edificio 2" },
    { x: 2397, y: 1280, width: 90, height: 32, color: "#4b0000ff", angle: 15, label: "Edificio 3" },
    { x: 2384, y: 1341, width: 90, height: 32, color: "#4b0000ff", angle: 15, label: "Edificio 4" },
    { x: 2369, y: 1411, width: 90, height: 32, color: "#4b0000ff", angle: 15, label: "Edificio 5" },
    { x: 2350, y: 1476, width: 90, height: 32, color: "#4b0000ff", angle: 15, label: "Edificio 6" },
    { x: 2339, y: 1531, width: 90, height: 32, color: "#4b0000ff", angle: 15, label: "Edificio 7" },
    { x: 2326, y: 1594, width: 90, height: 32, color: "#4b0000ff", angle: 15, label: "Edificio 8" },
    { x: 2317, y: 1664, width: 90, height: 32, color: "#4b0000ff", angle: 15, label: "Edificio 9" },
    
    // Edificio Z (vertical largo)
    { x: 2216, y: 897, width: 35, height: 300, color: "#4b0000ff", angle: 99, label: "Z" },
    
    // Centro Cultural JTB
    { x: 2306, y: 1754, width: 90, height: 60, color: "#8b4513", angle: 17, label: "CC JTB" },
    
    // ========== ESTACIONAMIENTOS ZONA DERECHA ==========
    { x: 1974, y: 1273, width: 160, height: 50, color: "#29293aff", angle: 10, label: "ESTACIONAMIENTO" },
    { x: 1923, y: 1548, width: 160, height: 50, color: "#29293aff", angle: 10, label: "ESTACIONAMIENTO" },
    { x: 2551, y: 1537, width: 45, height: 140, color: "#29293aff", angle: 12, label: "ESTACIONAMIENTO" }, 
    
    // Estacionamiento grande abajo
    { x: 2399, y: 1904, width: 200, height: 50, color: "#29293aff", angle: 15, label: "ESTACIONAMIENTO" },
    
    
    // ========== EDIFICIOS ADICIONALES (zona Montevideo/Guanajuato) ==========
    { x: 2637, y: 974, width: 60, height: 50, color: "#8b7355", angle: 13, label: "Edificio A" },
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

// Evento para guardar la calle seleccionada y mostrar valores en los inputs
selectCalle.addEventListener("change", () => {
    const calleIndex = selectCalle.value;
    if (calleIndex !== "") {
        calleSeleccionada = calles[calleIndex];
        window.calleSeleccionada = calleSeleccionada; // Exponer globalmente
        // Mostrar valores actuales en los inputs
        inputProbabilidadGeneracion.value = calleSeleccionada.probabilidadGeneracion * 100; // Conversión a porcentaje
        inputProbabilidadSalto.value = calleSeleccionada.probabilidadSaltoDeCarril * 100; // Conversión a porcentaje
    } else {
        calleSeleccionada = null;
        window.calleSeleccionada = null;
    }
    renderizarCanvas();
});

// Función para crear una calle con posición, ángulo y tamaño
function crearCalle(nombre, tamano, tipo, x, y, angulo, probabilidadGeneracion, carriles = 1, probabilidadSaltoDeCarril = 0.05) {
    let calle = {
        nombre: nombre,
        tamano: tamano,
        tipo: tipo,
        probabilidadGeneracion: probabilidadGeneracion,
        arreglo: [],
        celulasEsperando: [],
        conexionesSalida: [],
        x: x,
        y: y,
        angulo: angulo,
        carriles: carriles,
        probabilidadSaltoDeCarril: probabilidadSaltoDeCarril,
        // NUEVAS PROPIEDADES PARA CURVAS
        vertices: [],  // Array de vértices para crear curvas
        esCurva: false // Indica si la calle tiene curva activa
    };

    // Creamos la matriz (arreglo 2D) y estructuras de control
    for (let i = 0; i < carriles; i++) {
        calle.arreglo.push(new Array(tamano).fill(0));
        calle.celulasEsperando.push(new Array(tamano).fill(false));
        calle.conexionesSalida.push([]);
    }

    // Inicialización SOLO si es GENERADOR
    if (tipo === TIPOS.GENERADOR) {
        for (let i = 0; i < carriles; i++) {
            for (let j = 0; j < tamano; j++) {
                calle.arreglo[i][j] = Math.random() < 0.1 ? 1 : 0;
            }
        }
    }

    // NUEVO: Inicializar vértices automáticamente para calles tipo CONEXION
    if (tipo === TIPOS.CONEXION) {
        inicializarVertices(calle);
    }

    calles.push(calle);
    return calle;
}


// Clase para conexiones multi-carril
class ConexionCA {
    constructor(origen, destino, carrilOrigen, carrilDestino, posOrigen = -1, posDestino = 0, probabilidadTransferencia = 1.0, tipo = TIPOS_CONEXION.LINEAL) {
        this.origen = origen;
        this.destino = destino;
        this.carrilOrigen = carrilOrigen;
        this.carrilDestino = carrilDestino;
        this.posOrigen = posOrigen;
        this.posDestino = posDestino;
        this.probabilidadTransferencia = probabilidadTransferencia;
        this.tipo = tipo;
        this.bloqueada = false;
        this.esConexionIntermedia = posOrigen !== -1 && posOrigen !== origen.tamano - 1;
    }

    transferir() {
        const posOrig = this.posOrigen === -1 ? this.origen.tamano - 1 : this.posOrigen;

        this.bloqueada = false;

        const vehiculoOrigen = this.origen.arreglo[this.carrilOrigen][posOrig];

        if (vehiculoOrigen > 0) {

            // Para conexiones probabilísticas, aplicar probabilidad
            if (this.tipo === TIPOS_CONEXION.PROBABILISTICA) {
                const seTransfiere = Math.random() < this.probabilidadTransferencia;

                if (!seTransfiere) {
                    return false;
                }
            }

            // Verificar si destino está ocupado
            if (this.destino.arreglo[this.carrilDestino][this.posDestino] > 0) {
                this.bloqueada = true;
                this.origen.celulasEsperando[this.carrilOrigen][posOrig] = true;
                return false;
            } else {
                if (!this.origen.celulasEsperando[this.carrilOrigen][posOrig]) {
                    // Transferir el tipo de vehículo
                    this.destino.arreglo[this.carrilDestino][this.posDestino] = vehiculoOrigen;
                    this.origen.arreglo[this.carrilOrigen][posOrig] = 0;
                    return true;
                } else {
                    return false;
                }
            }
        }
        return false;
    }

    dibujar() {
        const posOrig = this.posOrigen === -1 ? this.origen.tamano - 1 : this.posOrigen;
        
        // Calcular coordenadas del origen
        const coordOrigen = obtenerCoordenadasGlobalesCelda(this.origen, this.carrilOrigen, posOrig);
        
        // Calcular coordenadas del destino
        const coordDestino = obtenerCoordenadasGlobalesCelda(this.destino, this.carrilDestino, this.posDestino);
        
        const x1 = coordOrigen.x;
        const y1 = coordOrigen.y;
        const x2 = coordDestino.x;
        const y2 = coordDestino.y;

        // Color según tipo
        let colorLinea = "#6bff8bff"; // Verde para conexiones lineales
        if (this.bloqueada) {
            colorLinea = "#FF3333"; // Rojo para bloqueadas
        } else if (this.tipo === TIPOS_CONEXION.PROBABILISTICA) {
            colorLinea = "#9966FF"; // Morado para probabilísticas
        } else if (this.tipo === TIPOS_CONEXION.INCORPORACION) {
            colorLinea = "#FF8C00"; // Naranja para incorporación
        }
        
        ctx.strokeStyle = colorLinea;
        ctx.lineWidth = this.bloqueada ? 1.5 : 1;
        
        // Patrón de línea
        if (this.tipo === TIPOS_CONEXION.PROBABILISTICA) {
            ctx.setLineDash([3, 3]);
        } else if (this.tipo === TIPOS_CONEXION.INCORPORACION) {
            ctx.setLineDash([5, 3]);
        } else {
            ctx.setLineDash(this.bloqueada ? [2, 2] : []);
        }
        
        // Dibujar línea
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Dibujar flecha en el destino
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 6;
        
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI/6), 
                   y2 - arrowLength * Math.sin(angle - Math.PI/6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI/6), 
                   y2 - arrowLength * Math.sin(angle + Math.PI/6));
        ctx.stroke();
        
        // Indicadores visuales en el punto medio
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        if (this.bloqueada) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(midX, midY, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = "#FF0000";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(midX - 4, midY - 4);
            ctx.lineTo(midX + 4, midY + 4);
            ctx.moveTo(midX + 4, midY - 4);
            ctx.lineTo(midX - 4, midY + 4);
            ctx.stroke();
        } else if (this.tipo === TIPOS_CONEXION.PROBABILISTICA) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(midX, midY, 1, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = "#9966FF";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(midX, midY, 1, 0, 2 * Math.PI);
            ctx.stroke();
            
            ctx.fillStyle = "#9966FF";
            ctx.font = "bold 1px Arial";
            ctx.textAlign = "center";
            ctx.fillText("%", midX, midY + 3);
            
            ctx.font = "7px Arial";
            ctx.fillText(`${Math.round(this.probabilidadTransferencia * 100)}%`, midX, midY + 18);
            ctx.textAlign = "left";
        } else if (this.tipo === TIPOS_CONEXION.INCORPORACION) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(midX, midY, 1, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = "#FF8C00";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(midX, midY, 1, 0, 2 * Math.PI);
            ctx.stroke();
            
            ctx.fillStyle = "#FF8C00";
            ctx.font = "bold 8px Arial";
            ctx.textAlign = "center";
            ctx.fillText("I", midX, midY + 3);
            ctx.textAlign = "left";
        }
        
        // Restaurar configuración del contexto
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
    }
}

// Calcula las coordenadas globales del CENTRO de una celda específica.
function obtenerCoordenadasGlobalesCelda(calle, carril, indice) {
    const localX = (indice + 0.5) * celda_tamano;
    const localY = (carril + 0.5) * celda_tamano;

    const anguloRad = -calle.angulo * Math.PI / 180;
    const cos = Math.cos(anguloRad);
    const sin = Math.sin(anguloRad);
    const rotadoX = localX * cos - localY * sin;
    const rotadoY = localX * sin + localY * cos;

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
    intersecciones = [];
    celdasIntersectadas.clear();

    const umbralDistancia = celda_tamano;

    for (let j = 0; j < calles.length; j++) {
        const calle1 = calles[j];
        for (let k = j + 1; k < calles.length; k++) {
            const calle2 = calles[k];

            for (let c1 = 0; c1 < calle1.carriles; c1++) {
                for (let i1 = 0; i1 < calle1.tamano; i1++) {
                    const idCelda1 = `${j}-${c1}-${i1}`;

                    if (celdasIntersectadas.has(idCelda1)) {
                        continue;
                    }

                    const centro1 = obtenerCoordenadasGlobalesCelda(calle1, c1, i1);

                    for (let c2 = 0; c2 < calle2.carriles; c2++) {
                        for (let i2 = 0; i2 < calle2.tamano; i2++) {
                            const idCelda2 = `${k}-${c2}-${i2}`;

                            if (celdasIntersectadas.has(idCelda2)) {
                                continue;
                            }

                            const centro2 = obtenerCoordenadasGlobalesCelda(calle2, c2, i2);

                            if (distancia(centro1, centro2) < umbralDistancia) {
                                const nuevaInterseccion = {
                                    calle1: calle1,
                                    calle1Index: j,
                                    carril1: c1,
                                    indice1: i1,
                                    calle2: calle2,
                                    calle2Index: k,
                                    carril2: c2,
                                    indice2: i2,
                                    coords: { x: (centro1.x + centro2.x) / 2, y: (centro1.y + centro2.y) / 2 }
                                };
                                intersecciones.push(nuevaInterseccion);

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

// Construye un mapa de búsqueda rápida para intersecciones
function construirMapaIntersecciones() {
    mapaIntersecciones.clear();
    intersecciones.forEach(inter => {
        const id1 = `${inter.calle1Index}-${inter.carril1}-${inter.indice1}`;
        const id2 = `${inter.calle2Index}-${inter.carril2}-${inter.indice2}`;

        mapaIntersecciones.set(id1, {
            calle: inter.calle2,
            carril: inter.carril2,
            indice: inter.indice2
        });
        mapaIntersecciones.set(id2, {
            calle: inter.calle1,
            carril: inter.carril1,
            indice: inter.indice1
        });
    });
    console.log(`Mapa de lookup de intersecciones construido con ${mapaIntersecciones.size} entradas.`);
}

// Regresa un carro en caso de haber dos en la misma intersección
function checarIntersecciones() {
    intersecciones.forEach(inter => {
        const { calle1Index, carril1, indice1, calle2Index, carril2, indice2 } = inter;

        const calle1 = calles[calle1Index];
        const calle2 = calles[calle2Index];

        if (!calle1?.arreglo?.[carril1]?.[indice1] === undefined ||
            !calle2?.arreglo?.[carril2]?.[indice2] === undefined) {
             return;
        }

        const estadoActualI1 = calle1.arreglo[carril1][indice1];
        const estadoActualI2 = calle2.arreglo[carril2][indice2];

        if (estadoActualI1 > 0 && estadoActualI2 > 0) {
            let vehiculoPerdedor;
            if (prioridadPar) {
                callePerdedora = calle2; carrilPerdedor = carril2; indicePerdedor = indice2;
                vehiculoPerdedor = estadoActualI2;
            } else {
                callePerdedora = calle1; carrilPerdedor = carril1; indicePerdedor = indice1;
                vehiculoPerdedor = estadoActualI1;
            }

            callePerdedora.arreglo[carrilPerdedor][indicePerdedor] = 0;

            let indiceAnteriorPerdedor = indicePerdedor - 1;
            if (indiceAnteriorPerdedor >= 0) {
                 if (callePerdedora.arreglo[carrilPerdedor]?.[indiceAnteriorPerdedor] !== undefined) {
                     // Preservar el tipo de vehículo al retroceder
                     callePerdedora.arreglo[carrilPerdedor][indiceAnteriorPerdedor] = vehiculoPerdedor;
                 }
            }
        }
    });
}

// Elimina un carro en las intersecciones sin regresos
function suavizarIntersecciones() {
    intersecciones.forEach(inter => {
        const { calle1Index, carril1, indice1, calle2Index, carril2, indice2 } = inter;

        const calle1 = calles[calle1Index];
        const calle2 = calles[calle2Index];

        if (!calle1?.arreglo?.[carril1]?.[indice1] === undefined ||
            !calle2?.arreglo?.[carril2]?.[indice2] === undefined) {
             return;
        }

        const estadoActualI1 = calle1.arreglo[carril1][indice1];
        const estadoActualI2 = calle2.arreglo[carril2][indice2];

        if (estadoActualI1 > 0 && estadoActualI2 > 0) {
            if (prioridadPar) {
                callePerdedora = calle2; carrilPerdedor = carril2; indicePerdedor = indice2;
            } else {
                callePerdedora = calle1; carrilPerdedor = carril1; indicePerdedor = indice1;
            }

            callePerdedora.arreglo[carrilPerdedor][indicePerdedor] = 0;
        }
    });
}

function marcarCelulaEsperando(calle, carril, posicion) {
    calle.celulasEsperando[carril][posicion] = true;
}

function tieneConexionSalida(calle, carril, posicion) {
    return calle.conexionesSalida[carril].some(conexion => {
        const posOrig = conexion.posOrigen === -1 ? calle.tamano - 1 : conexion.posOrigen;
        if (posOrig === posicion) {
            if (conexion.tipo === TIPOS_CONEXION.PROBABILISTICA) {
                return calle.celulasEsperando[carril][posicion];
            }
            return true;
        }
        return false;
    });
}

// Función para generar células en arreglos GENERADOR
function generarCelulas(calle) {
    if (calle.tipo === TIPOS.GENERADOR) {
        for (let carril = 0; carril < calle.carriles; carril++) {
            if (calle.arreglo[carril][0] === 0 && Math.random() < calle.probabilidadGeneracion) {
                // Generar tipo aleatorio de vehículo (1-6)
                const tipoVehiculo = Math.floor(Math.random() * 6) + 1;
                calle.arreglo[carril][0] = tipoVehiculo;
                console.log(`🏭 Generador "${calle.nombre}": Vehículo tipo ${tipoVehiculo} en carril ${carril + 1}, posición 0`);
            }
        }
    }
}

function actualizarCalle(calle, calleIndex) {
    let nuevaCalle = [];
    for (let c = 0; c < calle.carriles; c++) {
        nuevaCalle.push([...calle.arreglo[c]]);
    }

    // Aplicar reglas CA
    for (let c = 0; c < calle.carriles; c++) {
        if (!calle.arreglo?.[c] || !nuevaCalle?.[c] || calle.arreglo[c].length !== calle.tamano) continue;
        if (calle.tamano <= 1) continue;

        for (let i = 0; i < calle.tamano; i++) {
            // ✅ CRÍTICO: Si la celda está esperando, NO procesarla
            if (calle.celulasEsperando[c][i]) {
                nuevaCalle[c][i] = calle.arreglo[c][i];
                continue;
            }
            
            // Si tiene conexión de salida, no mover
            if (tieneConexionSalida(calle, c, i) && calle.arreglo[c][i] > 0) {
                nuevaCalle[c][i] = calle.arreglo[c][i];
                continue;
            }

            const izq = i > 0 ? calle.arreglo[c][i - 1] : 0;
            const centro = calle.arreglo[c][i];
            const der = i < calle.tamano - 1 ? calle.arreglo[c][i + 1] : 0;

            const idCeldaActual = `${calleIndex}-${c}-${i}`;
            const infoIntersec = mapaIntersecciones.get(idCeldaActual);
            let derechaReal = der;
            if (infoIntersec && i === calle.tamano - 1) {
                derechaReal = infoIntersec.calle.arreglo[infoIntersec.carril][infoIntersec.indice];
            }

            const patron = `${izq},${centro},${derechaReal}`;
            const resultadoRegla = reglas[patron];

            if (resultadoRegla !== undefined) {
                nuevaCalle[c][i] = resultadoRegla;
            } else {
                nuevaCalle[c][i] = centro;
            }
        }
    }

    calle.arreglo = nuevaCalle;
    
    // ✅ CRÍTICO: Limpiar flags de espera DESPUÉS de actualizar
    for (let c = 0; c < calle.carriles; c++) {
        calle.celulasEsperando[c].fill(false);
    }

    if (calle.tipo === TIPOS.DEVORADOR) {
        for (let c = 0; c < calle.carriles; c++) {
            calle.arreglo[c][calle.tamano - 1] = 0;
        }
    }
}

function cambioCarril(calle) {
    if (calle.carriles <= 1 || calle.probabilidadSaltoDeCarril <= 0) {
        return;
    }
    
    const cambios = [];
    const espaciosReservados = new Set();
    
    for (let c = 0; c < calle.carriles; c++) {
        for (let i = 1; i < calle.tamano - 1; i++) {
            const vehiculo = calle.arreglo[c][i];

            // Solo procesar si hay vehículo Y no está esperando
            if (vehiculo > 0 && !calle.celulasEsperando[c][i]) {
                if (Math.random() < calle.probabilidadSaltoDeCarril) {
                    const carrilesDisponibles = [];

                    // Verificar carril superior (cambio vertical)
                    if (c > 0) {
                        const destinoSuperior = `${c - 1},${i}`;
                        // Verificar que destino esté libre
                        if (calle.arreglo[c - 1][i] === 0 &&
                            !espaciosReservados.has(destinoSuperior) &&
                            !calle.celulasEsperando[c - 1][i]) {
                            carrilesDisponibles.push({carril: c - 1, key: destinoSuperior});
                        }
                    }

                    // Verificar carril inferior (cambio vertical)
                    if (c < calle.carriles - 1) {
                        const destinoInferior = `${c + 1},${i}`;
                        // Verificar que destino esté libre
                        if (calle.arreglo[c + 1][i] === 0 &&
                            !espaciosReservados.has(destinoInferior) &&
                            !calle.celulasEsperando[c + 1][i]) {
                            carrilesDisponibles.push({carril: c + 1, key: destinoInferior});
                        }
                    }

                    if (carrilesDisponibles.length > 0) {
                        const seleccion = carrilesDisponibles[Math.floor(Math.random() * carrilesDisponibles.length)];

                        // Reservar el espacio
                        espaciosReservados.add(seleccion.key);

                        cambios.push({
                            desde: {carril: c, posicion: i},
                            hacia: {carril: seleccion.carril, posicion: i},
                            tipoVehiculo: vehiculo
                        });
                    }
                }
            }
        }
    }

    // CORRECCIÓN 5: Aplicar cambios en DOS FASES
    // FASE 1: Primero limpiar todas las celdas de origen
    cambios.forEach(cambio => {
        calle.arreglo[cambio.desde.carril][cambio.desde.posicion] = 0;
    });

    // FASE 2: Luego colocar vehículos en destino Y marcar celdas como esperando
    cambios.forEach(cambio => {
        // Colocar vehículo con su tipo original
        calle.arreglo[cambio.hacia.carril][cambio.hacia.posicion] = cambio.tipoVehiculo;

        // CRÍTICO: Marcar el destino como esperando
        calle.celulasEsperando[cambio.hacia.carril][cambio.hacia.posicion] = true;

        // CRÍTICO: Marcar el origen como esperando para evitar que CA copie vehículos ahí
        calle.celulasEsperando[cambio.desde.carril][cambio.desde.posicion] = true;

        // CRÍTICO: Marcar las celdas adyacentes en AMBAS direcciones para evitar que CA las procese
        // Celda anterior (izquierda) en el carril de destino
        if (cambio.hacia.posicion > 0) {
            calle.celulasEsperando[cambio.hacia.carril][cambio.hacia.posicion - 1] = true;
        }
        // Celda siguiente (derecha) en el carril de destino
        if (cambio.hacia.posicion < calle.tamano - 1) {
            calle.celulasEsperando[cambio.hacia.carril][cambio.hacia.posicion + 1] = true;
        }
        // Celda anterior (izquierda) en el carril de origen
        if (cambio.desde.posicion > 0) {
            calle.celulasEsperando[cambio.desde.carril][cambio.desde.posicion - 1] = true;
        }
        // Celda siguiente (derecha) en el carril de origen
        if (cambio.desde.posicion < calle.tamano - 1) {
            calle.celulasEsperando[cambio.desde.carril][cambio.desde.posicion + 1] = true;
        }
    });
}

// ========== EXPONER EDIFICIOS PARA EL EDITOR ==========
window.edificios = edificios;
window.edificioSeleccionado = null;

// Función mejorada para dibujar edificios con selección visual
function dibujarEdificios() {
    // Usar window.edificios si existe, sino usar la constante local edificios como fallback
    const edificiosADibujar = window.edificios || edificios;
    edificiosADibujar.forEach((edificio, index) => {
        ctx.save();
        ctx.translate(edificio.x, edificio.y);
        ctx.rotate((edificio.angle || 0) * Math.PI / 180);

        // Si es un CONO y la imagen está cargada, dibujar la imagen
        if (edificio.label === "CONO" && conoImg.complete && conoImg.naturalHeight !== 0) {
            ctx.drawImage(conoImg, -edificio.width / 2, -edificio.height / 2, edificio.width, edificio.height);
        } else {
            // Dibujar rectángulo de color para otros edificios
            ctx.fillStyle = edificio.color;
            ctx.fillRect(-edificio.width / 2, -edificio.height / 2, edificio.width, edificio.height);
        }

        // Resaltar edificio seleccionado
        if (window.edificioSeleccionado && window.edificioSeleccionado.index === index) {
            // Naranja para Constructor, dorado para Configuración
            ctx.strokeStyle = window.modoSeleccion === "constructor" ? "#FFA500" : "#FFD700";
            ctx.lineWidth = 4 / escala;
            ctx.setLineDash([10 / escala, 5 / escala]);
            ctx.strokeRect(-edificio.width / 2, -edificio.height / 2, edificio.width, edificio.height);
            ctx.setLineDash([]);
        }

        // Etiqueta del edificio (opcional, puedes comentar esta sección si no quieres el texto)
        if (edificio.label && edificio.label !== "CONO") {
            ctx.fillStyle = "white";
            ctx.font = `${12 / escala}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(edificio.label, 0, 0);
        }

        ctx.restore();
    });
}

function dibujarCalles() {
    calles.forEach(calle => {
        ctx.save();
        
        // Si la calle tiene curva activa, dibujar con curvas
        if (calle.esCurva && calle.vertices.length >= 2) {
            dibujarCalleConCurva(calle);
        } else {
            // Dibujo tradicional (rectilíneo)
            ctx.translate(calle.x, calle.y);
            ctx.rotate(-calle.angulo * Math.PI / 180);

            for (let c = 0; c < calle.carriles; c++) {
                for (let i = 0; i < calle.tamano; i++) {
                    ctx.drawImage(carreteraImg, i * celda_tamano, c * celda_tamano, celda_tamano, celda_tamano);
                }
            }
            
            // Dibujar borde si la calle está seleccionada
            if (window.calleSeleccionada && calle.nombre === window.calleSeleccionada.nombre) {
                // Naranja para Constructor, amarillo para Configuración
                ctx.strokeStyle = window.modoSeleccion === "constructor" ? "#FFA500" : "yellow";
                ctx.lineWidth = 1;
                ctx.strokeRect(0, 0, calle.tamano * celda_tamano, calle.carriles * celda_tamano);
            }
        }
        
        ctx.restore();
    });
}

// Función para dibujar calle con curvas
function dibujarCalleConCurva(calle) {
    // Dibujar cada celda en su posición curvada
    for (let c = 0; c < calle.carriles; c++) {
        for (let i = 0; i < calle.tamano; i++) {
            const coords = obtenerCoordenadasGlobalesCeldaConCurva(calle, c, i);
            
            ctx.save();
            ctx.translate(coords.x, coords.y);
            ctx.rotate(-coords.angulo * Math.PI / 180);
            ctx.drawImage(carreteraImg, -celda_tamano / 2, -celda_tamano / 2, celda_tamano, celda_tamano);
            ctx.restore();
        }
    }
    
    // Dibujar contorno completo si está seleccionada
    if (window.calleSeleccionada && calle.nombre === window.calleSeleccionada.nombre) {
        dibujarContornoCalleCurva(calle);
    }
}

// Función para dibujar el contorno completo de una calle con curvas
function dibujarContornoCalleCurva(calle) {
    // Naranja para Constructor, amarillo para Configuración
    ctx.strokeStyle = window.modoSeleccion === "constructor" ? "#FFA500" : "yellow";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]); // Línea punteada para mejor visibilidad

    // Dibujar contorno superior (carril 0)
    ctx.beginPath();
    for (let i = 0; i < calle.tamano; i++) {
        const coords = obtenerCoordenadasGlobalesCeldaConCurva(calle, 0, i);
        const anguloRad = -coords.angulo * Math.PI / 180;

        // Offset perpendicular hacia arriba (lado superior de la calle)
        const offsetX = -Math.sin(anguloRad) * (celda_tamano / 2);
        const offsetY = Math.cos(anguloRad) * (celda_tamano / 2);

        const puntoX = coords.x + offsetX;
        const puntoY = coords.y + offsetY;

        if (i === 0) {
            ctx.moveTo(puntoX, puntoY);
        } else {
            ctx.lineTo(puntoX, puntoY);
        }
    }
    ctx.stroke();

    // Dibujar contorno inferior (último carril)
    ctx.beginPath();
    const ultimoCarril = calle.carriles - 1;
    for (let i = 0; i < calle.tamano; i++) {
        const coords = obtenerCoordenadasGlobalesCeldaConCurva(calle, ultimoCarril, i);
        const anguloRad = -coords.angulo * Math.PI / 180;

        // Offset perpendicular hacia abajo (lado inferior de la calle)
        const offsetX = Math.sin(anguloRad) * (celda_tamano / 2);
        const offsetY = -Math.cos(anguloRad) * (celda_tamano / 2);

        const puntoX = coords.x + offsetX;
        const puntoY = coords.y + offsetY;

        if (i === 0) {
            ctx.moveTo(puntoX, puntoY);
        } else {
            ctx.lineTo(puntoX, puntoY);
        }
    }
    ctx.stroke();

    // Dibujar líneas laterales (inicio y final)
    // Lado izquierdo (inicio de la calle)
    ctx.beginPath();
    const coordsInicio0 = obtenerCoordenadasGlobalesCeldaConCurva(calle, 0, 0);
    const coordsInicioN = obtenerCoordenadasGlobalesCeldaConCurva(calle, ultimoCarril, 0);
    const anguloInicioRad = -coordsInicio0.angulo * Math.PI / 180;

    const offsetInicioSupX = -Math.sin(anguloInicioRad) * (celda_tamano / 2);
    const offsetInicioSupY = Math.cos(anguloInicioRad) * (celda_tamano / 2);
    const offsetInicioInfX = Math.sin(anguloInicioRad) * (celda_tamano / 2);
    const offsetInicioInfY = -Math.cos(anguloInicioRad) * (celda_tamano / 2);

    ctx.moveTo(coordsInicio0.x + offsetInicioSupX, coordsInicio0.y + offsetInicioSupY);
    ctx.lineTo(coordsInicioN.x + offsetInicioInfX, coordsInicioN.y + offsetInicioInfY);
    ctx.stroke();

    // Lado derecho (final de la calle)
    ctx.beginPath();
    const ultimoIndice = calle.tamano - 1;
    const coordsFinal0 = obtenerCoordenadasGlobalesCeldaConCurva(calle, 0, ultimoIndice);
    const coordsFinalN = obtenerCoordenadasGlobalesCeldaConCurva(calle, ultimoCarril, ultimoIndice);
    const anguloFinalRad = -coordsFinal0.angulo * Math.PI / 180;

    const offsetFinalSupX = -Math.sin(anguloFinalRad) * (celda_tamano / 2);
    const offsetFinalSupY = Math.cos(anguloFinalRad) * (celda_tamano / 2);
    const offsetFinalInfX = Math.sin(anguloFinalRad) * (celda_tamano / 2);
    const offsetFinalInfY = -Math.cos(anguloFinalRad) * (celda_tamano / 2);

    ctx.moveTo(coordsFinal0.x + offsetFinalSupX, coordsFinal0.y + offsetFinalSupY);
    ctx.lineTo(coordsFinalN.x + offsetFinalInfX, coordsFinalN.y + offsetFinalInfY);
    ctx.stroke();

    ctx.setLineDash([]); // Restaurar línea sólida
}


// Función para dibujar vértices editables
function dibujarVertices() {
    if (!mostrarConexiones) return;

    ctx.save();

    calles.forEach(calle => {
        if (calle.tipo !== TIPOS.CONEXION || !calle.vertices || calle.vertices.length === 0) return;

        calle.vertices.forEach((vertice, index) => {
            const pos = calcularPosicionVertice(calle, vertice);

            // Dibujar línea guía entre vértices
            if (index > 0) {
                const verticeAnterior = calle.vertices[index - 1];
                const posAnterior = calcularPosicionVertice(calle, verticeAnterior);

                ctx.strokeStyle = "rgba(255, 165, 0, 0.4)";
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(posAnterior.x, posAnterior.y);

                // Si la calle tiene curvas activas, dibujar siguiendo la curva real
                if (calle.esCurva && calle.vertices.length >= 2) {
                    const carrilCentral = Math.floor(calle.carriles / 2);
                    const pasos = Math.max(5, Math.floor((vertice.indiceCelda - verticeAnterior.indiceCelda) / 5));

                    for (let i = 1; i <= pasos; i++) {
                        const t = i / pasos;
                        const indiceCeldaIntermedia = Math.floor(verticeAnterior.indiceCelda + t * (vertice.indiceCelda - verticeAnterior.indiceCelda));
                        const coordIntermedia = obtenerCoordenadasGlobalesCeldaConCurva(calle, carrilCentral, indiceCeldaIntermedia);
                        ctx.lineTo(coordIntermedia.x, coordIntermedia.y);
                    }
                } else {
                    // Para calles rectas, línea directa
                    ctx.lineTo(pos.x, pos.y);
                }

                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Determinar si es el vértice seleccionado
            const esSeleccionado = calleSeleccionada && calle.nombre === calleSeleccionada.nombre;
            const esVerticeActivo = verticeSeleccionado && verticeSeleccionado.indice === index &&
                                     verticeSeleccionado.calle === calle;

            // Si es el vértice activo, dibujar control visual mejorado
            if (esVerticeActivo) {
                // Línea perpendicular para mostrar dirección de arrastre
                // Usar el ángulo real en este punto de la curva
                const anguloEnPuntoActual = calle.esCurva && calle.vertices.length >= 2
                    ? obtenerAnguloEnPunto(calle, vertice.indiceCelda)
                    : calle.angulo;
                const anguloBaseRad = -anguloEnPuntoActual * Math.PI / 180;
                const perpX = -Math.sin(anguloBaseRad);
                const perpY = Math.cos(anguloBaseRad);

                const radioGuia = 50; // Longitud de la guía visual
                ctx.strokeStyle = "rgba(100, 200, 255, 0.6)";
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(pos.x - perpX * radioGuia, pos.y - perpY * radioGuia);
                ctx.lineTo(pos.x + perpX * radioGuia, pos.y + perpY * radioGuia);
                ctx.stroke();
                ctx.setLineDash([]);

                // Círculo de control exterior (área de arrastre)
                ctx.strokeStyle = "rgba(100, 200, 255, 0.5)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 50, 0, 2 * Math.PI);
                ctx.stroke();

                // Indicador de posición actual del ángulo
                const anguloOffsetRad = (-vertice.anguloOffset * Math.PI) / 180;
                const indicadorX = pos.x + perpX * (vertice.anguloOffset / 30) * 50;
                const indicadorY = pos.y + perpY * (vertice.anguloOffset / 30) * 50;

                ctx.fillStyle = "rgba(255, 100, 100, 0.8)";
                ctx.beginPath();
                ctx.arc(indicadorX, indicadorY, 6, 0, 2 * Math.PI);
                ctx.fill();

                // Línea conectando centro con indicador
                ctx.strokeStyle = "rgba(255, 100, 100, 0.6)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(indicadorX, indicadorY);
                ctx.stroke();
            }

            // Radio del vértice
            const radio = esVerticeActivo ? 10 : (esSeleccionado ? 8 : 6);

            // Color según ángulo offset
            let colorVertice = "rgba(100, 149, 237, 0.9)"; // Azul por defecto
            if (Math.abs(vertice.anguloOffset) > 0) {
                const intensidad = Math.abs(vertice.anguloOffset) / 30;
                colorVertice = `rgba(255, ${165 * (1 - intensidad)}, 0, 0.9)`;
            }

            // Círculo del vértice
            ctx.fillStyle = esVerticeActivo ? "rgba(100, 200, 255, 0.9)" :
                           (esSeleccionado ? "rgba(255, 215, 0, 0.9)" : colorVertice);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radio, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Número del vértice
            ctx.fillStyle = "white";
            ctx.font = "bold 9px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(index.toString(), pos.x, pos.y);

            // Mostrar ángulo offset si no es cero
            if ((esSeleccionado || esVerticeActivo) && Math.abs(vertice.anguloOffset) > 0.1) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fillRect(pos.x - 25, pos.y - 30, 50, 18);
                ctx.fillStyle = "white";
                ctx.font = "bold 11px Arial";
                ctx.fillText(`${vertice.anguloOffset.toFixed(1)}°`, pos.x, pos.y - 22);
            }
        });
    });

    ctx.restore();
}

// Función para obtener el color según el tipo de vehículo
function obtenerColorVehiculo(tipo) {
    const colores = {
        1: '#FF5733', // Rojo-naranja
        2: '#3498DB', // Azul
        3: '#2ECC71', // Verde
        4: '#F39C12', // Amarillo-naranja
        5: '#9B59B6', // Púrpura
        6: '#E74C3C'  // Rojo
    };
    return colores[tipo] || '#FF5733';
}

function dibujarCarros() {
    calles.forEach(calle => {
        ctx.save();

        if (calle.esCurva && calle.vertices.length >= 2) {
            // Dibujar carros en calle curva
            for (let c = 0; c < calle.carriles; c++) {
                calle.arreglo[c].forEach((celda, i) => {
                    if (celda > 0) {
                        const coords = obtenerCoordenadasGlobalesCeldaConCurva(calle, c, i);
                        
                        ctx.save();
                        ctx.translate(coords.x, coords.y);
                        
                        // Calcular rotación
                        let angulo = calle.angulo;
                        if (i < calle.tamano - 1) {
                            const coordsSiguiente = obtenerCoordenadasGlobalesCeldaConCurva(calle, c, i + 1);
                            const dx = coordsSiguiente.x - coords.x;
                            const dy = coordsSiguiente.y - coords.y;
                            angulo = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                        }
                        
                        ctx.rotate(-angulo * Math.PI / 180);
                        // Obtener la imagen según el tipo de vehículo
                        const imgVehiculo = obtenerImagenVehiculo(celda);
                        // Dibujar imagen o rectángulo de color como fallback
                        if (imgVehiculo && imgVehiculo.complete && imgVehiculo.naturalHeight !== 0) {
                            ctx.drawImage(imgVehiculo, -celda_tamano / 2, -celda_tamano / 2, celda_tamano, celda_tamano);
                        } else {
                            ctx.fillStyle = obtenerColorVehiculo(celda);
                            ctx.fillRect(-celda_tamano / 2, -celda_tamano / 2, celda_tamano, celda_tamano);
                        }
                        ctx.restore();
                    }
                });
            }
        } else {
            // Dibujo tradicional
            ctx.translate(calle.x, calle.y);
            ctx.rotate(-calle.angulo * Math.PI / 180);

            for (let c = 0; c < calle.carriles; c++) {
                calle.arreglo[c].forEach((celda, i) => {
                    if (celda > 0) {
                        // Obtener la imagen según el tipo de vehículo
                        const imgVehiculo = obtenerImagenVehiculo(celda);
                        // Dibujar imagen o rectángulo de color como fallback
                        if (imgVehiculo && imgVehiculo.complete && imgVehiculo.naturalHeight !== 0) {
                            ctx.drawImage(imgVehiculo, i * celda_tamano, c * celda_tamano, celda_tamano, celda_tamano);
                        } else {
                            ctx.fillStyle = obtenerColorVehiculo(celda);
                            ctx.fillRect(i * celda_tamano, c * celda_tamano, celda_tamano, celda_tamano);
                        }
                    }
                });
            }
        }
        
        ctx.restore();
    });
}

function dibujarInterseccionesDetectadas() {
    if(!mostrarIntersecciones)
        return;

    ctx.save();
    ctx.fillStyle = "rgba(255, 0, 255, 0.5)";
    const radio = celda_tamano / 2;
  
    intersecciones.forEach(inter => {
        ctx.beginPath();
        ctx.arc(inter.coords.x, inter.coords.y, radio, 0, 2 * Math.PI);
        ctx.fill();
    });
    ctx.restore();
}

// Función para dibujar todas las conexiones
function dibujarConexionesDetectadas() {
    if (!mostrarConexiones) return;

    ctx.save();
    
    conexiones.forEach(conexion => {
        if (conexion instanceof ConexionCA) {
            conexion.dibujar();
        }
    });
    
    ctx.restore();
}

// Renderizar canvas
function renderizarCanvas() {
    ctx.fillStyle = "#c6cbcd";

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(escala, 0, 0, escala, offsetX, offsetY);
    
    dibujarEdificios();
    dibujarCalles();
    dibujarCarros();
    dibujarInterseccionesDetectadas();
    dibujarConexionesDetectadas();
    dibujarVertices();
    dibujarEtiquetasCalles();
    dibujarMinimapa();
}


// Función para calcular los límites del mapa
function calcularLimitesMapa() {
    if (calles.length === 0) {
        return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    calles.forEach(calle => {
        const angle = -calle.angulo * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const corners = [
            { x: 0, y: 0 },
            { x: calle.tamano * celda_tamano, y: 0 },
            { x: 0, y: calle.carriles * celda_tamano },
            { x: calle.tamano * celda_tamano, y: calle.carriles * celda_tamano }
        ];

        corners.forEach(corner => {
            const globalX = calle.x + (corner.x * cos - corner.y * sin);
            const globalY = calle.y + (corner.x * sin + corner.y * cos);

            minX = Math.min(minX, globalX);
            minY = Math.min(minY, globalY);
            maxX = Math.max(maxX, globalX);
            maxY = Math.max(maxY, globalY);
        });
    });

    const margen = 200;
    return {
        minX: minX - margen,
        minY: minY - margen,
        maxX: maxX + margen,
        maxY: maxY + margen
    };
}

// Función para aplicar límites al offset
function aplicarLimitesOffset() {
    const limites = calcularLimitesMapa();
    const viewportWidth = canvas.width / escala;
    const viewportHeight = canvas.height / escala;

    const minOffsetX = -(limites.maxX * escala - canvas.width);
    const maxOffsetX = -limites.minX * escala;
    const minOffsetY = -(limites.maxY * escala - canvas.height);
    const maxOffsetY = -limites.minY * escala;

    offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, offsetX));
    offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, offsetY));
}

function calcularViewportVisible() {
    const vistaX = -offsetX / escala;
    const vistaY = -offsetY / escala;
    const vistaAncho = canvas.width / escala;
    const vistaAlto = canvas.height / escala;
    return { x: vistaX, y: vistaY, ancho: vistaAncho, alto: vistaAlto };
}

function encontrarCeldaMasCercana(worldX, worldY) {
    let celdaMasCercana = null;
    let distanciaMinima = Infinity;
    const umbralDistancia = celda_tamano;

    calles.forEach((calle, calleIndex) => {
        for (let carril = 0; carril < calle.carriles; carril++) {
            for (let indice = 0; indice < calle.tamano; indice++) {
                const centroCelda = obtenerCoordenadasGlobalesCelda(calle, carril, indice);
                const dx = worldX - centroCelda.x;
                const dy = worldY - centroCelda.y;
                const distancia = Math.sqrt(dx * dx + dy * dy);

                if (distancia < distanciaMinima) {
                    distanciaMinima = distancia;
                    celdaMasCercana = { calle, carril, indice, calleIndex };
                }
            }
        }
    });

    if (celdaMasCercana && distanciaMinima < umbralDistancia) {
        return celdaMasCercana;
    } else {
        return null;
    }
}

// Función para detectar si un punto está sobre una calle (para selección por clic)
function encontrarCalleEnPunto(worldX, worldY) {
    // Iterar sobre todas las calles en orden inverso (las de arriba primero)
    for (let i = calles.length - 1; i >= 0; i--) {
        const calle = calles[i];

        // Si la calle tiene curvas, usar método de detección por celdas
        if (calle.esCurva && calle.vertices && calle.vertices.length > 0) {
            for (let carril = 0; carril < calle.carriles; carril++) {
                for (let indice = 0; indice < calle.tamano; indice++) {
                    const coords = obtenerCoordenadasGlobalesCeldaConCurva(calle, carril, indice);
                    const dx = worldX - coords.x;
                    const dy = worldY - coords.y;
                    const distancia = Math.sqrt(dx * dx + dy * dy);

                    if (distancia < celda_tamano) {
                        return { calle, calleIndex: i };
                    }
                }
            }
        } else {
            // Para calles rectas, usar transformación geométrica
            const angle = -calle.angulo * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Transformar el punto al sistema de coordenadas local de la calle
            const dx = worldX - calle.x;
            const dy = worldY - calle.y;
            const localX = dx * cos + dy * sin;
            const localY = -dx * sin + dy * cos;

            // Verificar si el punto está dentro del rectángulo de la calle
            const width = calle.tamano * celda_tamano;
            const height = calle.carriles * celda_tamano;

            if (localX >= 0 && localX <= width && localY >= 0 && localY <= height) {
                return { calle, calleIndex: i };
            }
        }
    }

    return null;
}

// Función para detectar si un punto está sobre un edificio (para selección por clic)
function encontrarEdificioEnPunto(worldX, worldY) {
    // Usar window.edificios si existe, sino usar la constante local edificios como fallback
    const edificiosABuscar = window.edificios || edificios;
    // Iterar sobre todos los edificios en orden inverso (los de arriba primero)
    for (let i = edificiosABuscar.length - 1; i >= 0; i--) {
        const edificio = edificiosABuscar[i];

        // Transformar el punto al sistema de coordenadas local del edificio
        const angle = -(edificio.angle || 0) * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const dx = worldX - edificio.x;
        const dy = worldY - edificio.y;
        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;

        // Verificar si el punto está dentro del rectángulo del edificio
        const halfWidth = edificio.width / 2;
        const halfHeight = edificio.height / 2;

        if (localX >= -halfWidth && localX <= halfWidth &&
            localY >= -halfHeight && localY <= halfHeight) {
            return { edificio, edificioIndex: i };
        }
    }

    return null;
}

function limpiarCeldas(){
    calles.forEach(calle => {
        for (let c = 0; c < calle.carriles; c++) {
            const carrilActual = calle.arreglo[c];
            if (carrilActual) { 
                for (let i = 0; i < calle.tamano; i++) { 
                    carrilActual[i] = 0; 
                }
            }
        }
        renderizarCanvas();
    });
}

function crearConexionLineal(origen, destino, numCarriles = null, probabilidad = 1.0) {
    const carriles = numCarriles || Math.min(origen.carriles, destino.carriles);
    const conexionesCreadas = [];
    
    console.log(`🔗 Conexión LINEAL: ${origen.nombre} → ${destino.nombre} (${carriles} carriles)`);
    
    for (let carril = 0; carril < carriles; carril++) {
        conexionesCreadas.push(new ConexionCA(
            origen,
            destino,
            carril,
            carril,
            -1,
            0,
            probabilidad,
            TIPOS_CONEXION.LINEAL
        ));
    }
    
    return conexionesCreadas;
}

function crearConexionIncorporacion(origen, destino, carrilDestino = 0, posicionInicial = 0, configuracion = null) {
    const conexionesCreadas = [];
    
    console.log(`🔀 Conexión INCORPORACIÓN: ${origen.nombre} (${origen.carriles} carriles) → ${destino.nombre}[C${carrilDestino + 1}]`);
    
    if (configuracion === null) {
        for (let carril = 0; carril < origen.carriles; carril++) {
            conexionesCreadas.push(new ConexionCA(
                origen,
                destino,
                carril,
                carrilDestino,
                -1,
                posicionInicial + carril,
                1.0,
                TIPOS_CONEXION.INCORPORACION
            ));
        }
    } else {
        configuracion.forEach(config => {
            conexionesCreadas.push(new ConexionCA(
                origen,
                destino,
                config.carrilOrigen,
                carrilDestino,
                -1,
                config.posDestino,
                config.probabilidad || 1.0,
                TIPOS_CONEXION.INCORPORACION
            ));
        });
    }
    
    return conexionesCreadas;
}

function crearConexionProbabilistica(origen, carrilOrigen, destino, distribucion) {
    const conexionesCreadas = [];
    
    console.log(`🎲 Conexión PROBABILÍSTICA: ${origen.nombre}[C${carrilOrigen + 1}] → ${destino.nombre} (${distribucion.length} salidas)`);
    
    distribucion.forEach(dist => {
        conexionesCreadas.push(new ConexionCA(
            origen,
            destino,
            carrilOrigen,
            dist.carrilDestino,
            dist.posOrigen || -1,
            dist.posDestino || 0,
            dist.probabilidad,
            TIPOS_CONEXION.PROBABILISTICA
        ));
        console.log(`   → Carril ${dist.carrilDestino + 1}: ${(dist.probabilidad * 100).toFixed(0)}% prob.`);
    });
    
    return conexionesCreadas;
}

function registrarConexiones(conexionesArray) {
    calles.forEach(calle => {
        if (!calle.conexionesSalida) {
            calle.conexionesSalida = [];
            for (let carril = 0; carril < calle.carriles; carril++) {
                calle.conexionesSalida[carril] = [];
            }
        }
    });

    conexionesArray.forEach(conexion => {
        if (!conexion.origen.conexionesSalida[conexion.carrilOrigen]) {
            conexion.origen.conexionesSalida[conexion.carrilOrigen] = [];
        }
        conexion.origen.conexionesSalida[conexion.carrilOrigen].push(conexion);
    });
    
    console.log(`✅ ${conexionesArray.length} conexiones registradas`);
}

function iniciarSimulacion() {
    // Sistema 1: Avenida Wilfrido Massieu
    const Avenida_Miguel_Othon_de_Mendizabal_1 = crearCalle("Av. Miguel Othon de Mendizabal →", 247, TIPOS.CONEXION, 734, 803, 22, 0.0, 3, 0.02);
    
    //const Avenida_Miguel_Othon_de_Mendizabal_2 = crearCalle("Av. Miguel Othon de Mendizabal 2", 10, TIPOS.CONEXION, 1780, 368, 37, 0.0, 3, 0.02);
    //const Avenida_Miguel_Othon_de_Mendizabal_3 = crearCalle("Av. Miguel Othon de Mendizabal 3", 10, TIPOS.CONEXION, 1816, 341, 42, 0.0, 3, 0.02);
    //const Avenida_Miguel_Othon_de_Mendizabal_4 = crearCalle("Av. Miguel Othon de Mendizabal 4", 9, TIPOS.CONEXION, 1745, 386, 28, 0.0, 3, 0.02);
    
    const Avenida_Miguel_Othon_de_Mendizabal_5 = crearCalle("Av. Miguel Othon de Mendizabal ←", 258, TIPOS.CONEXION, 1907, 256, 202, 0.0, 3, 0.02);
    //const Avenida_Miguel_Othon_de_Mendizabal_6 = crearCalle("Av. Miguel Othon de Mendizabal 6", 10, TIPOS.CONEXION, 1780, 345, 208, 0.0, 3, 0.02);
    //const Avenida_Miguel_Othon_de_Mendizabal_7 = crearCalle("Av. Miguel Othon de Mendizabal 7", 14, TIPOS.CONEXION, 1836, 309, 212, 0.0, 3, 0.02);
    //const Avenida_Miguel_Othon_de_Mendizabal_8 = crearCalle("Av. Miguel Othon de Mendizabal 8", 13, TIPOS.CONEXION, 1884, 268, 221, 0.0, 3, 0.02);

    const Avenida_Miguel_Bernard = crearCalle("Av. Miguel Bernard →", 180, TIPOS.CONEXION, 1862, 329, -46, 0.0, 3, 0.01);
    const Avenida_Miguel_Bernard2 = crearCalle("Av. Miguel Bernard ←", 195, TIPOS.CONEXION, 2550, 979, 134, 0.0, 3, 0.01);
    const Avenida_Cien_Metros = crearCalle("Av. Cien Metros →", 382, TIPOS.CONEXION, 570, 595, -70, 0.0, 3, 0.01);
    const Avenida_Cien_Metros2 = crearCalle("Av. Cien Metros ←", 382, TIPOS.CONEXION, 1290, 2375, 110, 0.9, 3, 0.01);
    const Avenida_Juan_de_Dios_Batiz = crearCalle("Av. Juan de Dios Batiz", 380, TIPOS.CONEXION, 1020, 760, -10, 0.0, 3, 0.01);
    const Avenida_Juan_de_Dios_Batiz2 = crearCalle("Av. Juan de Dios Batiz 2", 380, TIPOS.CONEXION, 2920, 1075, 170, 0.0, 2, 0.01);
    const Avenida_IPN = crearCalle("Av. IPN", 320, TIPOS.CONEXION, 2805, 950, -100, 0.0, 2, 0.01);
    const Avenida_IPN2 = crearCalle("Av. IPN 2", 320, TIPOS.CONEXION, 2545, 2525, 80, 0.0, 2, 0.01);
    const Avenida_Guanajuato = crearCalle("Av. Guanajuato", 100, TIPOS.CONEXION, 1180, 2035, -14, 0.0, 1, 0.01);
    const Avenida_Montevideo = crearCalle("Av. Montevideo", 308, TIPOS.CONEXION, 1230, 2160, -12, 0.0, 3, 0.01);
    const Avenida_Montevideo2 = crearCalle("Av. Montevideo 2", 308, TIPOS.CONEXION, 2720, 2460, 168, 0.0, 3, 0.01);
    const Avenida_Otavalo = crearCalle("Av. Otavalo", 150, TIPOS.CONEXION, 1765, 2050, -11, 0.0, 1, 0.01);
    const Avenida_17_de_mayo = crearCalle("Av. 17 de mayo", 122, TIPOS.CONEXION, 1520, 2395, 72, 0.0, 1, 0.01);
    const Calle_Luis_Enrique_Erro_1 = crearCalle("Calle Luis Enrique Erro 1", 202, TIPOS.CONEXION, 1790, 1800, 80, 0.0, 2, 0.01);
    const Calle_Luis_Enrique_Erro_2 = crearCalle("Calle Luis Enrique Erro 2", 10, TIPOS.CONEXION, 1965, 805, 65, 0.0, 2, 0.01);
    const Calle_Luis_Enrique_Erro_3 = crearCalle("Calle Luis Enrique Erro 3", 43, TIPOS.CONEXION, 1985, 760, 46, 0.0, 2, 0.01);
    const Calle_Luis_Enrique_Erro_6 = crearCalle("Calle Luis Enrique Erro 6", 174, TIPOS.CONEXION, 1945, 800, -100, 0.0, 2, 0.01);
    const Calle_Luis_Enrique_Erro_4 = crearCalle("Calle Luis Enrique Erro 4", 46, TIPOS.CONEXION, 2125, 595, -134, 0.0, 2, 0.01);
    const Calle_Luis_Enrique_Erro_5 = crearCalle("Calle Luis Enrique Erro 5", 10, TIPOS.CONEXION, 1965, 760, -115, 0.0, 2, 0.01);
    const Calle_Miguel_Anda_y_Barredo = crearCalle("Calle Miguel Anda y Barredo", 185, TIPOS.CONEXION, 2180, 1915, 80, 0.0, 1, 0.01);
    const Calle_Miguel_Anda_y_Barredo2 = crearCalle("Calle Miguel Anda y Barredo 2", 183, TIPOS.CONEXION, 2320, 1000, -100, 0.0, 1, 0.01);
    const Avenida_Wilfrido_Massieu_1 = crearCalle("Av. Wilfrido Massieu ←", 346, TIPOS.CONEXION, 2605, 2027, 166, 0.0, 2, 0.01);
    //const Avenida_Wilfrido_Massieu_2 = crearCalle("Av. Wilfrido Massieu 2", 190, TIPOS.CONEXION, 1820, 1825, 155, 0.0, 2, 0.01);
    const Avenida_Wilfrido_Massieu_2 = crearCalle("Av. Wilfrido Massieu →", 185, TIPOS.CONEXION, 985, 1485, -24, 0.0, 2, 0.01);
    //const Avenida_Wilfrido_Massieu_4 = crearCalle("Av. Wilfrido Massieu 4", 160, TIPOS.CONEXION, 1825, 1860, -14, 0.0, 2, 0.01);
    const Avenida_Sierravista = crearCalle("Av. Sierravista", 50, TIPOS.CONEXION, 2940, 1445, 132, 0.0, 1, 0.01);
    const Avenida_Lindavista = crearCalle("Av. Lindavista", 36, TIPOS.CONEXION, 2845, 1710, 134, 0.0, 1, 0.01);
    const Avenida_Buenavista = crearCalle("Av. Buenavista", 40, TIPOS.CONEXION, 2825, 2095, 171, 0.0, 1, 0.01);
    
    const Devorador = crearCalle("Salida Cien Metros ←", 4, TIPOS.DEVORADOR, 638, 584, 110, 0.5, 3, 0.01);
    const Generador_1 = crearCalle("Entrada a Cien Metros →", 4, TIPOS.GENERADOR, 565, 580, -70, 0.3, 3, 0.01);
    // Vértices para Av. Miguel Othon de Mendizabal →
    Avenida_Miguel_Othon_de_Mendizabal_1.vertices = [
        { indiceCelda: 0, anguloOffset: 0 },
        { indiceCelda: 10, anguloOffset: 0 },
        { indiceCelda: 20, anguloOffset: 0 },
        { indiceCelda: 30, anguloOffset: 0 },
        { indiceCelda: 40, anguloOffset: 0 },
        { indiceCelda: 50, anguloOffset: 0 },
        { indiceCelda: 60, anguloOffset: 0 },
        { indiceCelda: 70, anguloOffset: 0 },
        { indiceCelda: 80, anguloOffset: 0 },
        { indiceCelda: 90, anguloOffset: 0 },
        { indiceCelda: 100, anguloOffset: 0 },
        { indiceCelda: 110, anguloOffset: 0 },
        { indiceCelda: 120, anguloOffset: 0 },
        { indiceCelda: 130, anguloOffset: 0 },
        { indiceCelda: 140, anguloOffset: 0 },
        { indiceCelda: 150, anguloOffset: 0 },
        { indiceCelda: 160, anguloOffset: 0 },
        { indiceCelda: 170, anguloOffset: 0 },
        { indiceCelda: 180, anguloOffset: 0 },
        { indiceCelda: 190, anguloOffset: 0 },
        { indiceCelda: 200, anguloOffset: 15.782577335816946 },
        { indiceCelda: 210, anguloOffset: 5.405854354182056 },
        { indiceCelda: 220, anguloOffset: 16.08041053597891 },
        { indiceCelda: 230, anguloOffset: 5.828495352842338 },
        { indiceCelda: 240, anguloOffset: -15.330152643963826 },
        { indiceCelda: 246, anguloOffset: -31.67142247899585 }
    ];
    Avenida_Miguel_Othon_de_Mendizabal_1.esCurva = true;

    

    // Vértices para Av. Miguel Bernard ←
    Avenida_Miguel_Bernard2.vertices = [
        { indiceCelda: 0, anguloOffset: 0 },
        { indiceCelda: 10, anguloOffset: 0 },
        { indiceCelda: 20, anguloOffset: 0 },
        { indiceCelda: 30, anguloOffset: 0 },
        { indiceCelda: 40, anguloOffset: 0 },
        { indiceCelda: 50, anguloOffset: 0 },
        { indiceCelda: 60, anguloOffset: 0 },
        { indiceCelda: 70, anguloOffset: 0 },
        { indiceCelda: 80, anguloOffset: 0 },
        { indiceCelda: 90, anguloOffset: 0 },
        { indiceCelda: 100, anguloOffset: 0 },
        { indiceCelda: 110, anguloOffset: 0 },
        { indiceCelda: 120, anguloOffset: 0 },
        { indiceCelda: 130, anguloOffset: 0 },
        { indiceCelda: 140, anguloOffset: 0 },
        { indiceCelda: 150, anguloOffset: 0 },
        { indiceCelda: 160, anguloOffset: 0 },
        { indiceCelda: 170, anguloOffset: 0 },
        { indiceCelda: 180, anguloOffset: -14.205962673951502 },
        { indiceCelda: 190, anguloOffset: -23.537916581209004 },
        { indiceCelda: 194, anguloOffset: -21.51222188728547 }
    ];
    Avenida_Miguel_Bernard2.esCurva = true;

    Avenida_Miguel_Bernard.vertices = [
        { indiceCelda: 0, anguloOffset: 29.183651591046115 },
        { indiceCelda: 10, anguloOffset: -1.0407776280136602 },
        { indiceCelda: 20, anguloOffset: 0 },
        { indiceCelda: 30, anguloOffset: 0 },
        { indiceCelda: 40, anguloOffset: 0 },
        { indiceCelda: 50, anguloOffset: 0 },
        { indiceCelda: 60, anguloOffset: 0 },
        { indiceCelda: 70, anguloOffset: 0 },
        { indiceCelda: 80, anguloOffset: 0 },
        { indiceCelda: 90, anguloOffset: 0 },
        { indiceCelda: 100, anguloOffset: 0 },
        { indiceCelda: 110, anguloOffset: 0 },
        { indiceCelda: 120, anguloOffset: 0 },
        { indiceCelda: 130, anguloOffset: 0 },
        { indiceCelda: 140, anguloOffset: 0 },
        { indiceCelda: 150, anguloOffset: 0 },
        { indiceCelda: 160, anguloOffset: 0 },
        { indiceCelda: 170, anguloOffset: 0 },
        { indiceCelda: 179, anguloOffset: 0 }
    ];
    Avenida_Miguel_Bernard.esCurva = true;
    
    // Vértices para Av. Wilfrido Massieu ←
Avenida_Wilfrido_Massieu_1.vertices = [
    { indiceCelda: 0, anguloOffset: 0 },
    { indiceCelda: 10, anguloOffset: 0 },
    { indiceCelda: 20, anguloOffset: 0 },
    { indiceCelda: 30, anguloOffset: 0 },
    { indiceCelda: 40, anguloOffset: 0 },
    { indiceCelda: 50, anguloOffset: 0 },
    { indiceCelda: 60, anguloOffset: 0 },
    { indiceCelda: 70, anguloOffset: 0 },
    { indiceCelda: 80, anguloOffset: 0 },
    { indiceCelda: 90, anguloOffset: 0 },
    { indiceCelda: 100, anguloOffset: 0 },
    { indiceCelda: 110, anguloOffset: 0 },
    { indiceCelda: 120, anguloOffset: 0 },
    { indiceCelda: 130, anguloOffset: 0 },
    { indiceCelda: 140, anguloOffset: 0 },
    { indiceCelda: 150, anguloOffset: 0 },
    { indiceCelda: 160, anguloOffset: 0 },
    { indiceCelda: 170, anguloOffset: -11.009098478730472 },
    { indiceCelda: 180, anguloOffset: -11.407038740359418 },
    { indiceCelda: 190, anguloOffset: -11.663564370295632 },
    { indiceCelda: 200, anguloOffset: -6.575739493312889 },
    { indiceCelda: 210, anguloOffset: -11.606703150263227 },
    { indiceCelda: 220, anguloOffset: -14.044688014277959 },
    { indiceCelda: 230, anguloOffset: -11.926764002101764 },
    { indiceCelda: 240, anguloOffset: -9.308916375838844 },
    { indiceCelda: 250, anguloOffset: -8.62069360411787 },
    { indiceCelda: 260, anguloOffset: -11.797253613314432 },
    { indiceCelda: 270, anguloOffset: -8.451094990844364 },
    { indiceCelda: 280, anguloOffset: -10.873446369255475 },
    { indiceCelda: 290, anguloOffset: -10.148863339446716 },
    { indiceCelda: 300, anguloOffset: -12.044049971264982 },
    { indiceCelda: 310, anguloOffset: -9.734523874663381 },
    { indiceCelda: 320, anguloOffset: -11.155215416939388 },
    { indiceCelda: 330, anguloOffset: -8.107048185852282 },
    { indiceCelda: 340, anguloOffset: 0.07275865577794495 },
    { indiceCelda: 345, anguloOffset: 32.42406150399883 }
];
Avenida_Wilfrido_Massieu_1.esCurva = true;

    const conexionesCA = [];

    conexionesCA.push(...crearConexionLineal(
        Avenida_Miguel_Othon_de_Mendizabal_1, 
        Avenida_Miguel_Bernard
    ));
    
    /*
    conexionesCA.push(...crearConexionLineal(
        Avenida_Miguel_Othon_de_Mendizabal_1, 
        Avenida_Miguel_Othon_de_Mendizabal_4
    ));
    conexionesCA.push(...crearConexionLineal(
        Avenida_Miguel_Othon_de_Mendizabal_4, 
        Avenida_Miguel_Othon_de_Mendizabal_2
    ));
    conexionesCA.push(...crearConexionLineal(
        Avenida_Miguel_Othon_de_Mendizabal_2, 
        Avenida_Miguel_Othon_de_Mendizabal_3
    ));
    
    conexionesCA.push(...crearConexionIncorporacion(
        Avenida_Miguel_Othon_de_Mendizabal_3,
        Avenida_Miguel_Bernard,
        2,
        0
    ));
    
    conexionesCA.push(...crearConexionIncorporacion(
        Avenida_Miguel_Bernard2,
        Avenida_Miguel_Othon_de_Mendizabal_8,
        0,
        0
    ));

    conexionesCA.push(...crearConexionLineal(
        Avenida_Miguel_Othon_de_Mendizabal_8, 
        Avenida_Miguel_Othon_de_Mendizabal_7
    ));
    conexionesCA.push(...crearConexionLineal(
        Avenida_Miguel_Othon_de_Mendizabal_7, 
        Avenida_Miguel_Othon_de_Mendizabal_6
    ));
    conexionesCA.push(...crearConexionLineal(
        Avenida_Miguel_Othon_de_Mendizabal_6, 
        Avenida_Miguel_Othon_de_Mendizabal_5
    ));
    */
    conexionesCA.push(...crearConexionProbabilistica(
        Avenida_Cien_Metros2,
        2,
        Avenida_Miguel_Othon_de_Mendizabal_1,
        [
            { carrilDestino: 0, posOrigen: 334, posDestino: 0, probabilidad: 0.2 },
            { carrilDestino: 1, posOrigen: 333, posDestino: 0, probabilidad: 0.2 },
            { carrilDestino: 2, posOrigen: 332, posDestino: 0, probabilidad: 0.5 }
        ]
    ));

    conexionesCA.push(...crearConexionIncorporacion(
        Avenida_Montevideo2,
        Avenida_Cien_Metros2,
        2,
        49
    ));
    conexionesCA.push(...crearConexionIncorporacion(
        Avenida_Miguel_Othon_de_Mendizabal_5,
        Avenida_Cien_Metros2,
        2,
        339
    ));

    conexionesCA.push(...crearConexionLineal(
        Generador_1, 
        Avenida_Cien_Metros
    ));
    

    conexionesCA.push(...crearConexionLineal(
        Calle_Luis_Enrique_Erro_1,
        Calle_Luis_Enrique_Erro_2
    ));
    
    conexionesCA.push(...crearConexionProbabilistica(
        Calle_Luis_Enrique_Erro_1,
        0,
        Calle_Luis_Enrique_Erro_3,
        [
            { carrilDestino: 0, posOrigen: 4, posDestino: 0, probabilidad: 0.2 },
            { carrilDestino: 1, posOrigen: 5, posDestino: 0, probabilidad: 0.9 },
            { carrilDestino: 2, posOrigen: 6, posDestino: 0, probabilidad: 0.3 }
        ]
    ));
    
    conexionesCA.push(...crearConexionLineal(
        Calle_Luis_Enrique_Erro_3,
        Calle_Luis_Enrique_Erro_4
    ));

    registrarConexiones(conexionesCA);
    conexiones = conexionesCA;

    calles.forEach(calle => {
        let option = document.createElement("option");
        option.value = calles.indexOf(calle);
        option.textContent = calle.nombre;
        selectCalle.appendChild(option);
    });

    const btnPauseResume = document.getElementById('btnPauseResume');
    const btnIntersecciones = document.getElementById('btnIntersecciones');
    const btnConexiones = document.getElementById('btnConexiones');

    const btnPaso = document.getElementById('btnPaso');
    const velocidadSlider = document.getElementById('velocidadSlider');
    const velocidadValorSpan = document.getElementById('velocidadValor');
    const btnBorrar = document.getElementById('btnBorrar');
    const btnRandom = document.getElementById('btnRandom');
    const probabilidadSlider = document.getElementById('probabilidadSlider');
    const probabilidadValor = document.getElementById('probabilidadValor');

    function calcularIntervaloDesdeSlider(valorSlider) {
        const rangoSlider = maxVelocidadSlider - minVelocidadSlider;
        const rangoIntervalo = maxIntervalo - minIntervalo;
        if (rangoSlider === 0) return intervaloDeseado;
        const normalizado = (valorSlider - minVelocidadSlider) / rangoSlider;
        return Math.round(maxIntervalo - (normalizado * rangoIntervalo));
    }

    function calcularSliderDesdeIntervalo(intervalo) {
        const rangoSlider = maxVelocidadSlider - minVelocidadSlider;
        const rangoIntervalo = maxIntervalo - minIntervalo;
        if (rangoIntervalo === 0) return minVelocidadSlider;
        const normalizado = (maxIntervalo - Math.max(minIntervalo, Math.min(maxIntervalo, intervalo))) / rangoIntervalo;
        return Math.round(minVelocidadSlider + (normalizado * rangoSlider));
    }

    inicializarIntersecciones();
    construirMapaIntersecciones();
    intervaloDeseado = calcularIntervaloDesdeSlider(50);

    btnActualizarCalle.addEventListener("click", () => {
        const calleIndex = selectCalle.value;
        const nuevaProbabilidad = parseFloat(inputProbabilidadGeneracion.value / 100);
        const nuevaProbabilidadSalto = parseFloat(inputProbabilidadSalto.value / 100);
        if (calleIndex !== "" && (!isNaN(nuevaProbabilidad) || !isNaN(nuevaProbabilidadSalto))) {
            calles[calleIndex].probabilidadGeneracion = nuevaProbabilidad;
            calles[calleIndex].probabilidadSaltoDeCarril = nuevaProbabilidadSalto;
            console.log(`✏️ Actualizada ${calles[calleIndex].nombre}: Gen=${nuevaProbabilidad}, Salto=${nuevaProbabilidadSalto}`);
        }
    });

    function paso() {
        // 1. Generar nuevos vehículos
        calles.forEach(calle => {
            if (calle.tipo === TIPOS.GENERADOR) {
                generarCelulas(calle);
            }
        });
        
        // 2. Transferir vehículos por conexiones
        let transferenciasExitosas = 0;
        let transferenciasBloqueadas = 0;
        
        conexiones.forEach((conexion) => {
            if (conexion instanceof ConexionCA) {
                const resultado = conexion.transferir();
                if (resultado === true) {
                    transferenciasExitosas++;
                } else if (conexion.bloqueada) {
                    transferenciasBloqueadas++;
                }
            }
        });

        // ✅ CRÍTICO: PRIMERO cambiar carriles
        calles.forEach(cambioCarril);

        // ✅ CRÍTICO: LUEGO actualizar estado de cada calle
        calles.forEach((calle, index) => {
            actualizarCalle(calle, index);
        });

        updateMetrics();
        renderizarCanvas();

        prioridadPar = !prioridadPar;
    }

    function animate(tiempoActual) {
        if (!tiempoAnterior) tiempoAnterior = tiempoActual;
        const tiempoTranscurrido = tiempoActual - tiempoAnterior;
        if (tiempoTranscurrido >= intervaloDeseado) {
            paso();
            tiempoAnterior = tiempoActual;
        }
        animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    if (btnPauseResume) {
        btnPauseResume.addEventListener('click', () => {
            isPaused = !isPaused;
            if (isPaused) {
                cancelAnimationFrame(animationId);
                btnPauseResume.textContent = '▶️';
                btnPaso.disabled = false;
            } else {
                tiempoAnterior = performance.now();
                animationId = requestAnimationFrame(animate);
                btnPauseResume.textContent = '⏸';
                btnPaso.disabled = true;
            }
        });
    }

    if (btnIntersecciones) {
        btnIntersecciones.addEventListener('click', () => {
            mostrarIntersecciones = !mostrarIntersecciones;
            btnIntersecciones.textContent = mostrarIntersecciones ? 'Ocultar Intersecciones' : 'Mostrar Intersecciones';
            renderizarCanvas();
        });
    }
    if (btnConexiones) {
        btnConexiones.addEventListener('click', () => {
            mostrarConexiones = !mostrarConexiones;
            window.mostrarConexiones = mostrarConexiones;
            btnConexiones.textContent = mostrarConexiones ? 'Ocultar Conexiones' : 'Mostrar Conexiones';
            renderizarCanvas();
        });
    }

    const btnEtiquetas = document.getElementById('btnEtiquetas');
    if (btnEtiquetas) {
        btnEtiquetas.addEventListener('click', () => {
            mostrarEtiquetas = !mostrarEtiquetas;
            btnEtiquetas.textContent = mostrarEtiquetas ? '🏷️ Ocultar Etiquetas' : '🏷️ Mostrar Etiquetas';
            renderizarCanvas();
        });
    }

    if (btnPaso) {
        btnPaso.addEventListener('click', () => {
            paso();
        });
    }

    if (btnBorrar) {
        btnBorrar.addEventListener('click', () => {
            limpiarCeldas();
        });
    }

    if (btnRandom) {
        btnRandom.addEventListener('click', () => {
            calles.forEach(calle => {
                for (let c = 0; c < calle.carriles; c++) {
                    const carrilActual = calle.arreglo[c];
                    if (carrilActual) {
                        for (let i = 0; i < calle.tamano; i++) {
                            carrilActual[i] = Math.random() < probabilidadGeneracionGeneral ? 1 : 0;
                        }
                    }
                }
            });
            suavizarIntersecciones();
            renderizarCanvas();
        });
    }

    if (velocidadSlider && velocidadValorSpan) {
        const valorInicialSlider = calcularSliderDesdeIntervalo(intervaloDeseado);
        velocidadSlider.value = valorInicialSlider;
        velocidadValorSpan.textContent = valorInicialSlider;
        velocidadSlider.addEventListener('input', () => {
            const valorActualSlider = parseFloat(velocidadSlider.value);
            intervaloDeseado = calcularIntervaloDesdeSlider(valorActualSlider);
            velocidadValorSpan.textContent = valorActualSlider;
        });
    }

    if (probabilidadSlider && probabilidadValor) {
        const valorInicialPorcentaje = probabilidadGeneracionGeneral * 100;
        probabilidadSlider.value = valorInicialPorcentaje;
        probabilidadValor.textContent = valorInicialPorcentaje + '%';
        probabilidadSlider.addEventListener('input', () => {
            const valorSlider = probabilidadSlider.value;
            const nuevaProbabilidad = parseFloat(valorSlider) / 100.0;
            probabilidadGeneracionGeneral = nuevaProbabilidad;
            probabilidadValor.textContent = valorSlider + '%';
        });
    }
}

// Zoom y Desplazamiento
canvas.addEventListener("wheel", event => {
    event.preventDefault();

    const zoomIntensity = 1.1;
    const direction = event.deltaY < 0 ? 1 : -1;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const worldX_before = (mouseX - offsetX) / escala;
    const worldY_before = (mouseY - offsetY) / escala;

    const escala_anterior = escala;
    escala = escala_anterior * Math.pow(zoomIntensity, direction);

    const minEscala = 0.7;
    const maxEscala = 20.0;
    escala = Math.max(minEscala, Math.min(maxEscala, escala));
    if (escala === escala_anterior) {
        return;
    }

    offsetX = mouseX - worldX_before * escala;
    offsetY = mouseY - worldY_before * escala;

    aplicarLimitesOffset();

    // Actualizar handles del editor si está disponible y en modo edición
    if (window.editorCalles && window.editorCalles.modoEdicion) {
        window.editorCalles.actualizarPosicionHandles();
    }

    renderizarCanvas();
});

canvas.addEventListener("mousedown", event => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledMouseX = mouseX * scaleX;
    const scaledMouseY = mouseY * scaleY;

    const worldX = (scaledMouseX - offsetX) / escala;
    const worldY = (scaledMouseY - offsetY) / escala;

    // Intentar detectar vértice primero
    const verticeDetectado = detectarVerticeEnPosicion(worldX, worldY);

    if (verticeDetectado && calleSeleccionada && calleSeleccionada.esCurva) {
        // Iniciar control de vértice
        controlandoVertice = true;
        verticeSeleccionado = {
            calle: calleSeleccionada,
            indice: verticeDetectado.indice,
            vertice: verticeDetectado.vertice
        };
        renderizarCanvas();
        return;
    }

    // Si no hay vértice, iniciar arrastre normal del canvas
    isDragging = true;
    hasDragged = false;
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;
});

canvas.addEventListener('click', (event) => {
    // Evitar comportamiento si se está arrastrando o controlando vértice
    if (hasDragged || controlandoVertice) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledMouseX = mouseX * scaleX;
    const scaledMouseY = mouseY * scaleY;

    const worldX = (scaledMouseX - offsetX) / escala;
    const worldY = (scaledMouseY - offsetY) / escala;

    // Si se presiona Ctrl (Windows/Linux) o Cmd (Mac), seleccionar calle o edificio
    if (event.ctrlKey || event.metaKey) {
        // Intentar detectar edificio primero (están arriba de las calles visualmente)
        const resultadoEdificio = encontrarEdificioEnPunto(worldX, worldY);
        const resultadoCalle = encontrarCalleEnPunto(worldX, worldY);

        if (resultadoEdificio) {
            const { edificio, edificioIndex } = resultadoEdificio;

            // Limpiar selección de calle
            window.calleSeleccionada = null;
            calleSeleccionada = null;

            // Actualizar selección de edificio
            window.edificioSeleccionado = edificio;
            window.edificioSeleccionado.index = edificioIndex;

            // Actualizar selector de Configuración de Calles (volver a default)
            selectCalle.value = '';

            // Actualizar selectores del Constructor
            const selectTipoObjeto = document.getElementById('selectTipoObjeto');
            const selectEdificio = document.getElementById('selectEdificio');

            if (selectTipoObjeto && selectEdificio) {
                window.modoSeleccion = "constructor";
                selectTipoObjeto.value = 'edificio';

                // Disparar evento change para mostrar el selector correcto
                selectTipoObjeto.dispatchEvent(new Event('change'));

                // Seleccionar el edificio
                selectEdificio.value = edificioIndex;
                selectEdificio.dispatchEvent(new Event('change'));
            }

            renderizarCanvas();
            console.log(`🖱️ Edificio seleccionado por clic: ${edificio.label || 'Edificio ' + (edificioIndex + 1)}`);

        } else if (resultadoCalle) {
            const { calle, calleIndex } = resultadoCalle;

            // Limpiar selección de edificio
            window.edificioSeleccionado = null;

            // Actualizar la selección de calle
            calleSeleccionada = calle;
            window.calleSeleccionada = calle;

            // SIEMPRE actualizar AMBOS selectores de calle

            // 1. Actualizar selector de Configuración de Calles
            selectCalle.value = calleIndex;
            // Actualizar los campos de probabilidad
            inputProbabilidadGeneracion.value = calle.probabilidadGeneracion * 100;
            inputProbabilidadSalto.value = calle.probabilidadSaltoDeCarril * 100;

            // 2. Actualizar selectores del Constructor de Mapas
            const selectTipoObjeto = document.getElementById('selectTipoObjeto');
            const selectCalleEditor = document.getElementById('selectCalleEditor');

            if (selectTipoObjeto && selectCalleEditor) {
                selectTipoObjeto.value = 'calle';

                // Disparar evento change para mostrar el selector correcto
                selectTipoObjeto.dispatchEvent(new Event('change'));

                // Seleccionar la calle en el selector del constructor
                selectCalleEditor.value = calleIndex;
                selectCalleEditor.dispatchEvent(new Event('change'));
            }

            // Establecer modo basado en el acordeón abierto, pero la calle está seleccionada en ambos
            window.modoSeleccion = "configuracion";

            renderizarCanvas();
            console.log(`🖱️ Calle seleccionada por clic: ${calle.nombre} (actualizado en ambos selectores)`);
        }
        return;
    }

    // Comportamiento normal: agregar/quitar vehículos
    const celdaObjetivo = encontrarCeldaMasCercana(worldX, worldY);

    if (celdaObjetivo) {
        const { calle, carril, indice } = celdaObjetivo;
        if (calle.arreglo[carril] !== undefined && calle.arreglo[carril][indice] === 0) {
            calle.arreglo[carril][indice] = 1;
            renderizarCanvas();
        } else if (calle.arreglo[carril] !== undefined && calle.arreglo[carril][indice] !== 0) {
            calle.arreglo[carril][indice] = 0;
            renderizarCanvas();
        }
    }
});

canvas.addEventListener("mousemove", event => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledMouseX = mouseX * scaleX;
    const scaledMouseY = mouseY * scaleY;

    const worldX = (scaledMouseX - offsetX) / escala;
    const worldY = (scaledMouseY - offsetY) / escala;

    // Cambiar cursor si se presiona Ctrl/Cmd
    if (event.ctrlKey || event.metaKey) {
        const resultadoEdificio = encontrarEdificioEnPunto(worldX, worldY);
        const resultadoCalle = encontrarCalleEnPunto(worldX, worldY);
        canvas.style.cursor = (resultadoEdificio || resultadoCalle) ? 'pointer' : 'default';
    } else {
        canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
    }

    // Si estamos controlando un vértice
    if (controlandoVertice && verticeSeleccionado) {
        actualizarVerticePorArrastre(
            verticeSeleccionado.calle,
            verticeSeleccionado.indice,
            worldX,
            worldY
        );
        renderizarCanvas();
        return;
    }

    // Si estamos arrastrando el canvas
    if (isDragging) {
        hasDragged = true;
        offsetX = (event.clientX - startX);
        offsetY = (event.clientY - startY);
        aplicarLimitesOffset();

        // Actualizar handles del editor si está disponible y en modo edición
        if (window.editorCalles && window.editorCalles.modoEdicion) {
            window.editorCalles.actualizarPosicionHandles();
        }

        renderizarCanvas();
    }
});

canvas.addEventListener("mouseup", () => {
    isDragging = false;
    controlandoVertice = false;
    verticeSeleccionado = null;
    renderizarCanvas();
});

canvas.addEventListener("mouseleave", () => {
    isDragging = false;
    controlandoVertice = false;
    verticeSeleccionado = null;
    renderizarCanvas();
});

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

    aplicarLimitesOffset();

    renderizarCanvas();
});

// Event listeners para cambiar el cursor cuando se presiona/suelta Ctrl/Cmd
document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey) {
        canvas.style.cursor = 'pointer';
    }
});

document.addEventListener("keyup", (event) => {
    if (!event.ctrlKey && !event.metaKey) {
        canvas.style.cursor = 'grab';
    }
});

minimapaCanvas.addEventListener("click", (event) => {
    const rect = minimapaCanvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const viewport = calcularViewportVisible();
    const centroX = (viewport.x + viewport.ancho / 2);
    const centroY = (viewport.y + viewport.alto / 2);
    const minimapaEscala = 0.1;
    const minimapaAncho = canvas.width * minimapaEscala;
    const minimapaAlto = canvas.height * minimapaEscala;
    const minimapaOffsetX = minimapaAncho / 2 - centroX * minimapaEscala;
    const minimapaOffsetY = minimapaAlto / 2 - centroY * minimapaEscala;

    const mapaX = (clickX - minimapaOffsetX) / minimapaEscala;
    const mapaY = (clickY-10 - minimapaOffsetY) / minimapaEscala;

    offsetX = -(mapaX * escala - canvas.width / 2);
    offsetY = -(mapaY * escala - canvas.height / 2);

    aplicarLimitesOffset();

    renderizarCanvas();
});

// Ajustar tamaño del canvas si cambia la ventana
window.addEventListener("resize", () => {
    resizeCanvas();
    renderizarCanvas();
});

// ==================== SISTEMA DE MÉTRICAS Y GRÁFICAS ====================

const metricsHistory = {
    timestamps: [],
    density: [],
    flow: [],
    speed: [],
    maxDataPoints: 50
};

let previousCarCount = 0;
let flowMeasureInterval = 1000;
let lastFlowMeasure = Date.now();

function calculateMetrics() {
    let totalCars = 0;
    let totalCells = 0;
    let carsInMotion = 0;

    calles.forEach(calle => {
        for (let c = 0; c < calle.carriles; c++) {
            totalCells += calle.tamano;
            for (let i = 0; i < calle.tamano; i++) {
                if (calle.arreglo[c][i] === 1) {
                    totalCars++;
                    const nextIndex = (i + 1) % calle.tamano;
                    if (calle.arreglo[c][nextIndex] === 0) {
                        carsInMotion++;
                    }
                }
            }
        }
    });

    const density = totalCells > 0 ? (totalCars / totalCells) * 100 : 0;

    const now = Date.now();
    const timeDiff = (now - lastFlowMeasure) / 1000;
    let flow = 0;

    if (timeDiff >= 1) {
        flow = Math.abs(totalCars - previousCarCount) / timeDiff;
        previousCarCount = totalCars;
        lastFlowMeasure = now;
    }

    const avgSpeed = totalCars > 0 ? (carsInMotion / totalCars) * 100 : 0;

    return {
        density: density.toFixed(2),
        flow: flow.toFixed(2),
        speed: avgSpeed.toFixed(2),
        totalCars: totalCars
    };
}

function updateMetricsHistory(metrics) {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' +
                    now.getMinutes().toString().padStart(2, '0') + ':' +
                    now.getSeconds().toString().padStart(2, '0');

    metricsHistory.timestamps.push(timeStr);
    metricsHistory.density.push(parseFloat(metrics.density));
    metricsHistory.flow.push(parseFloat(metrics.flow));
    metricsHistory.speed.push(parseFloat(metrics.speed));

    if (metricsHistory.timestamps.length > metricsHistory.maxDataPoints) {
        metricsHistory.timestamps.shift();
        metricsHistory.density.shift();
        metricsHistory.flow.shift();
        metricsHistory.speed.shift();
    }
}

// Variables globales para las instancias de Chart.js
let densityChartInstance = null;
let flowChartInstance = null;
let speedChartInstance = null;

function initializeCharts() {
    if (!window.Chart) {
        console.error('Chart.js no está cargado');
        return;
    }

    // Configuración común para todas las gráficas
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Desactivar animaciones para mejor rendimiento en tiempo real
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 8,
                displayColors: false
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    maxTicksLimit: 6,
                    font: {
                        size: 10
                    }
                }
            },
            y: {
                display: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    // Gráfica de Densidad
    const densityCtx = document.getElementById('densityChart');
    if (densityCtx) {
        densityChartInstance = new Chart(densityCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '% Ocupación',
                    data: [],
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0,
                        max: 100,
                        ticks: {
                            ...commonOptions.scales.y.ticks,
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfica de Flujo
    const flowCtx = document.getElementById('flowChart');
    if (flowCtx) {
        flowChartInstance = new Chart(flowCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Carros/seg',
                    data: [],
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0,
                        suggestedMax: 20
                    }
                }
            }
        });
    }

    // Gráfica de Velocidad
    const speedCtx = document.getElementById('speedChart');
    if (speedCtx) {
        speedChartInstance = new Chart(speedCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '% Movimiento',
                    data: [],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0,
                        max: 100,
                        ticks: {
                            ...commonOptions.scales.y.ticks,
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    console.log('✅ Gráficas de Chart.js inicializadas correctamente');
}

function updateCharts() {
    if (!window.Chart) return;

    // Actualizar gráfica de densidad
    if (densityChartInstance) {
        densityChartInstance.data.labels = metricsHistory.timestamps;
        densityChartInstance.data.datasets[0].data = metricsHistory.density;
        densityChartInstance.update('none'); // 'none' evita animaciones
    }

    // Actualizar gráfica de flujo
    if (flowChartInstance) {
        flowChartInstance.data.labels = metricsHistory.timestamps;
        flowChartInstance.data.datasets[0].data = metricsHistory.flow;
        flowChartInstance.update('none');
    }

    // Actualizar gráfica de velocidad
    if (speedChartInstance) {
        speedChartInstance.data.labels = metricsHistory.timestamps;
        speedChartInstance.data.datasets[0].data = metricsHistory.speed;
        speedChartInstance.update('none');
    }
}

// Función para descargar métricas en formato CSV
function descargarMetricasCSV() {
    if (metricsHistory.timestamps.length === 0) {
        alert('No hay métricas para exportar. Ejecuta la simulación primero.');
        return;
    }

    // Función auxiliar para calcular estadísticas
    const calcularEstadisticas = (arr) => {
        if (arr.length === 0) return { avg: 0, min: 0, max: 0 };
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        return { avg: avg.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) };
    };

    // Calcular estadísticas
    const densityStats = calcularEstadisticas(metricsHistory.density);
    const flowStats = calcularEstadisticas(metricsHistory.flow);
    const speedStats = calcularEstadisticas(metricsHistory.speed);

    // Encabezado de datos
    let csvContent = 'Timestamp,Density (%),Flow (cars/sec),Speed (% movement)\n';

    // Datos de series temporales
    for (let i = 0; i < metricsHistory.timestamps.length; i++) {
        csvContent += `${metricsHistory.timestamps[i]},${metricsHistory.density[i]},${metricsHistory.flow[i]},${metricsHistory.speed[i]}\n`;
    }

    // Agregar línea en blanco y sección de estadísticas
    csvContent += '\n';
    csvContent += 'STATISTICS\n';
    csvContent += 'Metric,Average,Minimum,Maximum\n';
    csvContent += `Density (%),${densityStats.avg},${densityStats.min},${densityStats.max}\n`;
    csvContent += `Flow (cars/sec),${flowStats.avg},${flowStats.min},${flowStats.max}\n`;
    csvContent += `Speed (% movement),${speedStats.avg},${speedStats.min},${speedStats.max}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const fileName = `metricas_trafico_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Métricas exportadas a CSV: ${fileName}`);
}

// Función para descargar métricas en formato JSON
function descargarMetricasJSON() {
    if (metricsHistory.timestamps.length === 0) {
        alert('No hay métricas para exportar. Ejecuta la simulación primero.');
        return;
    }

    const calcularEstadisticas = (arr) => {
        if (arr.length === 0) return { avg: 0, min: 0, max: 0 };
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        return { avg: avg.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) };
    };

    const exportData = {
        metadata: {
            version: '1.0',
            exportDate: new Date().toISOString(),
            simulationName: 'FLUVI Traffic Simulation',
            totalDataPoints: metricsHistory.timestamps.length
        },
        metrics: {
            timestamps: metricsHistory.timestamps,
            density: metricsHistory.density,
            flow: metricsHistory.flow,
            speed: metricsHistory.speed
        },
        statistics: {
            density: calcularEstadisticas(metricsHistory.density),
            flow: calcularEstadisticas(metricsHistory.flow),
            speed: calcularEstadisticas(metricsHistory.speed)
        }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const fileName = `metricas_trafico_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.json`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Métricas exportadas a JSON: ${fileName}`);
}

// Función para limpiar el historial de métricas
function limpiarMetricas() {
    if (metricsHistory.timestamps.length === 0) {
        alert('No hay métricas para limpiar.');
        return;
    }

    if (confirm('¿Estás seguro de que deseas limpiar todas las métricas? Esta acción no se puede deshacer.')) {
        metricsHistory.timestamps = [];
        metricsHistory.density = [];
        metricsHistory.flow = [];
        metricsHistory.speed = [];

        updateCharts();

        console.log('Métricas limpiadas exitosamente');
        alert('Métricas limpiadas exitosamente');
    }
}

let metricsUpdateCounter = 0;
function updateMetrics() {
    metricsUpdateCounter++;

    if (metricsUpdateCounter % 5 === 0) {
        const metrics = calculateMetrics();
        updateMetricsHistory(metrics);
        updateCharts();
    }
}

const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const toggleIcon = document.getElementById('toggleIcon');

        sidebar.classList.toggle('open');

        if (sidebar.classList.contains('open')) {
            toggleIcon.textContent = '✕';
        } else {
            toggleIcon.textContent = '📊';
        }
    });
}

window.addEventListener('load', () => {
    if (window.Chart) {
        initializeCharts();
    } else {
        console.error('Chart.js no se cargó correctamente');
    }
});

iniciarSimulacion();

// ========== EXPONER VARIABLES PARA EL EDITOR ==========
// IMPORTANTE: Actualizar referencia a conexiones después de inicializar la simulación
window.conexiones = conexiones;
window.calleSeleccionada = calleSeleccionada;
window.escala = escala;
window.offsetX = offsetX;
window.offsetY = offsetY;
window.celda_tamano = celda_tamano;
window.isPaused = isPaused;
window.calleSeleccionada = calleSeleccionada;

// NUEVAS EXPOSICIONES PARA VÉRTICES
window.inicializarVertices = inicializarVertices;
window.calcularPosicionVertice = calcularPosicionVertice;
window.obtenerAnguloEnPunto = obtenerAnguloEnPunto;
window.actualizarAnguloVertice = actualizarAnguloVertice;
window.actualizarVerticePorArrastre = actualizarVerticePorArrastre;
window.obtenerCoordenadasGlobalesCeldaConCurva = obtenerCoordenadasGlobalesCeldaConCurva;
window.calcularCentroCalleCurva = calcularCentroCalleCurva;
window.calcularPuntoFinalCalleCurva = calcularPuntoFinalCalleCurva;

// EXPOSICIONES PARA EL CONSTRUCTOR
window.crearCalle = crearCalle;
window.crearConexionLineal = crearConexionLineal;
window.crearConexionIncorporacion = crearConexionIncorporacion;
window.crearConexionProbabilistica = crearConexionProbabilistica;
window.registrarConexiones = registrarConexiones;
window.TIPOS = TIPOS;
window.TIPOS_CONEXION = TIPOS_CONEXION;
window.ConexionCA = ConexionCA; // Exponer clase ConexionCA para el constructor

selectCalle.addEventListener("change", () => {
    window.calleSeleccionada = calleSeleccionada;
});

window.renderizarCanvas = renderizarCanvas;
window.inicializarIntersecciones = inicializarIntersecciones;
window.construirMapaIntersecciones = construirMapaIntersecciones;

canvas.addEventListener("wheel", () => {
    window.escala = escala;
    window.offsetX = offsetX;
    window.offsetY = offsetY;
});

canvas.addEventListener("mousemove", () => {
    if (isDragging) {
        window.offsetX = offsetX;
        window.offsetY = offsetY;
    }
});

// ========== BOTONES DE CONTROL DE CURVAS ==========
const btnToggleCurva = document.getElementById('btnToggleCurva');
const btnResetVertices = document.getElementById('btnResetVertices');

if (btnToggleCurva) {
    btnToggleCurva.addEventListener('click', () => {
        if (!calleSeleccionada) return;
        
        calleSeleccionada.esCurva = !calleSeleccionada.esCurva;
        
        if (calleSeleccionada.esCurva) {
            btnToggleCurva.textContent = '🚫 Desactivar Curvas';
            btnToggleCurva.classList.remove('btn-outline-info');
            btnToggleCurva.classList.add('btn-info');
            console.log(`🌊 Curvas activadas para ${calleSeleccionada.nombre}`);
        } else {
            btnToggleCurva.textContent = '🌊 Activar Curvas';
            btnToggleCurva.classList.remove('btn-info');
            btnToggleCurva.classList.add('btn-outline-info');
            console.log(`📏 Curvas desactivadas para ${calleSeleccionada.nombre}`);
        }
        
        renderizarCanvas();
    });
}

if (btnResetVertices) {
    btnResetVertices.addEventListener('click', () => {
        if (!calleSeleccionada) return;
        
        if (confirm(`¿Resetear vértices de "${calleSeleccionada.nombre}"?`)) {
            inicializarVertices(calleSeleccionada);
            calleSeleccionada.esCurva = false;
            
            if (btnToggleCurva) {
                btnToggleCurva.textContent = '🌊 Activar Curvas';
                btnToggleCurva.classList.remove('btn-info');
                btnToggleCurva.classList.add('btn-outline-info');
            }
            
            renderizarCanvas();
            console.log(`🔄 Vértices reseteados para ${calleSeleccionada.nombre}`);
        }
    });
}

// Actualizar estado de botones cuando cambia la selección
selectCalle.addEventListener('change', () => {
    const hayCalleSeleccionada = calleSeleccionada !== null;
    
    if (btnToggleCurva) {
        btnToggleCurva.disabled = !hayCalleSeleccionada || calleSeleccionada.tipo !== TIPOS.CONEXION;
        
        if (hayCalleSeleccionada && calleSeleccionada.esCurva) {
            btnToggleCurva.textContent = '🚫 Desactivar Curvas';
            btnToggleCurva.classList.remove('btn-outline-info');
            btnToggleCurva.classList.add('btn-info');
        } else {
            btnToggleCurva.textContent = '🌊 Activar Curvas';
            btnToggleCurva.classList.remove('btn-info');
            btnToggleCurva.classList.add('btn-outline-info');
        }
    }
    
    if (btnResetVertices) {
        btnResetVertices.disabled = !hayCalleSeleccionada || calleSeleccionada.tipo !== TIPOS.CONEXION;
    }
});