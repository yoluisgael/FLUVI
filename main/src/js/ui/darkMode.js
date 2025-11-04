// ========== SISTEMA DE MODO OSCURO ==========
// Aplicar modo oscuro inmediatamente al cargar la página (antes de renderizar)

(function() {
  // Ejecutar inmediatamente para aplicar clase al body antes de renderizar
  const modoOscuroGuardado = localStorage.getItem('modoOscuro');
  if (modoOscuroGuardado === 'true' && document.body) {
    document.body.classList.add('dark-mode');
  }
})();

// También escuchar el evento DOMContentLoaded como fallback
document.addEventListener('DOMContentLoaded', function() {
  const modoOscuroGuardado = localStorage.getItem('modoOscuro');
  if (modoOscuroGuardado === 'true') {
    document.body.classList.add('dark-mode');
  }
}, false);
