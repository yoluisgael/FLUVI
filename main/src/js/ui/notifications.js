/**
 * notifications.js - Sistema de notificaciones con Bootstrap Toasts
 * Proporciona feedback visual al usuario mediante toasts
 */

/**
 * Muestra una notificación toast
 * @param {string} tipo - Tipo de notificación: 'success', 'error', 'warning', 'info'
 * @param {string} titulo - Título de la notificación
 * @param {string} mensaje - Mensaje descriptivo
 * @param {number} duracion - Duración en milisegundos (por defecto 5000)
 */
function mostrarNotificacion(tipo, titulo, mensaje, duracion = 5000) {
    // Obtener o crear el contenedor de toasts
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '11000';
        document.body.appendChild(toastContainer);
    }

    // Configuración de iconos y colores según el tipo
    const config = {
        success: {
            icon: '✅',
            bgClass: 'bg-success',
            textClass: 'text-white'
        },
        error: {
            icon: '❌',
            bgClass: 'bg-danger',
            textClass: 'text-white'
        },
        warning: {
            icon: '⚠️',
            bgClass: 'bg-warning',
            textClass: 'text-dark'
        },
        info: {
            icon: 'ℹ️',
            bgClass: 'bg-info',
            textClass: 'text-white'
        }
    };

    const cfg = config[tipo] || config.info;

    // Crear ID único para el toast
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Convertir saltos de línea a <br> para el mensaje
    const mensajeHTML = mensaje.replace(/\n/g, '<br>');

    // Crear el HTML del toast
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${duracion}">
            <div class="toast-header ${cfg.bgClass} ${cfg.textClass}">
                <strong class="me-auto">
                    <span class="me-2">${cfg.icon}</span>${titulo}
                </strong>
                <button type="button" class="btn-close ${cfg.textClass === 'text-white' ? 'btn-close-white' : ''}" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${mensajeHTML}
            </div>
        </div>
    `;

    // Insertar el toast en el contenedor
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    // Obtener el elemento del toast
    const toastElement = document.getElementById(toastId);

    // Inicializar y mostrar el toast con Bootstrap
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: duracion
    });

    toast.show();

    // Eliminar el toast del DOM después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });

    // Log en consola (si los logs están habilitados)
    if (window.CONSOLE_LOGS_ENABLED) {
        console.log(`📢 Notificación [${tipo}]: ${titulo} - ${mensaje}`);
    }
}

/**
 * Funciones de ayuda para tipos específicos de notificaciones
 */
function mostrarExito(titulo, mensaje, duracion) {
    mostrarNotificacion('success', titulo, mensaje, duracion);
}

function mostrarError(titulo, mensaje, duracion) {
    mostrarNotificacion('error', titulo, mensaje, duracion);
}

function mostrarAdvertencia(titulo, mensaje, duracion) {
    mostrarNotificacion('warning', titulo, mensaje, duracion);
}

function mostrarInfo(titulo, mensaje, duracion) {
    mostrarNotificacion('info', titulo, mensaje, duracion);
}

// Exponer funciones globalmente
window.mostrarNotificacion = mostrarNotificacion;
window.mostrarExito = mostrarExito;
window.mostrarError = mostrarError;
window.mostrarAdvertencia = mostrarAdvertencia;
window.mostrarInfo = mostrarInfo;

console.log('✅ Sistema de notificaciones cargado');
