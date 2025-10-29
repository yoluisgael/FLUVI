// ========== FIX PARA WARNING DE ARIA-HIDDEN EN MODALES ==========
document.addEventListener('DOMContentLoaded', function() {
  // Obtener todos los modales
  const modals = document.querySelectorAll('.modal');

  modals.forEach(modal => {
    // Antes de que el modal se oculte, remover el foco de cualquier elemento dentro del modal
    modal.addEventListener('hide.bs.modal', function(event) {
      // Buscar el elemento que tiene el foco dentro del modal
      const focusedElement = modal.querySelector(':focus');

      if (focusedElement) {
        // Remover el foco del elemento
        focusedElement.blur();
      }
    });

    // Opcional: Cuando el modal se muestre, enfocar el botón de cerrar o el primer input
    modal.addEventListener('shown.bs.modal', function(event) {
      // Buscar el primer input o textarea que no esté deshabilitado
      const firstInput = modal.querySelector('input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])');

      if (firstInput) {
        // Pequeño delay para asegurar que el modal esté completamente renderizado
        setTimeout(() => firstInput.focus(), 100);
      }
    });
  });

  console.log(`✓ ${modals.length} modales configurados para evitar warning de aria-hidden`);
});
