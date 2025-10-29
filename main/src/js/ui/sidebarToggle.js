// ========== SISTEMA DE TOGGLE PARA SIDEBAR RESPONSIVE ==========
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  const toggleBtnInner = document.getElementById('sidebarToggle');
  const toggleBtnFloat = document.getElementById('sidebarToggleFloat');

  // Estado del sidebar (inicialmente visible)
  let sidebarVisible = true;

  // Cargar estado del sidebar desde localStorage
  const savedState = localStorage.getItem('sidebarVisible');
  if (savedState !== null) {
    sidebarVisible = savedState === 'true';
    applySidebarState(false); // Aplicar sin animación inicial
  }

  // Función para aplicar el estado del sidebar
  function applySidebarState(animate = true) {
    if (sidebarVisible) {
      // Mostrar sidebar
      sidebar.classList.remove('hidden');
      mainContent.classList.remove('expanded');
      document.body.classList.remove('sidebar-collapsed');

      // Mostrar botón flotante = oculto
      toggleBtnFloat.style.display = 'none';
    } else {
      // Ocultar sidebar
      sidebar.classList.add('hidden');
      mainContent.classList.add('expanded');
      document.body.classList.add('sidebar-collapsed');

      // Mostrar botón flotante después de la animación
      setTimeout(() => {
        toggleBtnFloat.style.display = 'flex';
      }, animate ? 400 : 0);
    }

    // Guardar estado en localStorage
    localStorage.setItem('sidebarVisible', sidebarVisible);

    // Redimensionar canvas después de la transición
    if (animate) {
      setTimeout(() => {
        resizeCanvasToFit();
      }, 400);
    } else {
      // Aplicar inmediatamente si no hay animación
      resizeCanvasToFit();
    }
  }

  // Función para redimensionar el canvas al tamaño correcto
  function resizeCanvasToFit() {
    const header = document.querySelector('header');
    const sidebarWidth = sidebarVisible ? (window.innerWidth > 768 ? 380 : 0) : 0;
    const headerHeight = header ? header.offsetHeight : 0;

    const newWidth = window.innerWidth - sidebarWidth;
    const newHeight = window.innerHeight - headerHeight;

    // Si usamos PixiJS, redimensionar su renderer
    if (window.USE_PIXI && window.pixiApp && window.pixiApp.app) {
      window.pixiApp.app.renderer.resize(newWidth, newHeight);
      console.log(`🖼️ Canvas PixiJS redimensionado: ${newWidth}x${newHeight}`);
    } else {
      // Canvas 2D tradicional
      const canvas = document.getElementById('simuladorCanvas');
      if (canvas) {
        canvas.width = newWidth;
        canvas.height = newHeight;
      }
    }

    // Renderizar después del redimensionamiento
    if (window.renderizarCanvas) {
      window.renderizarCanvas();
    }
  }

  // Función para toggle del sidebar
  function toggleSidebar() {
    sidebarVisible = !sidebarVisible;
    applySidebarState(true);
    console.log(`📊 Panel de control ${sidebarVisible ? 'mostrado' : 'ocultado'}`);
  }

  // Event listeners para ambos botones
  toggleBtnInner.addEventListener('click', toggleSidebar);
  toggleBtnFloat.addEventListener('click', toggleSidebar);

  // Atajo de teclado: Ctrl + B para toggle
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
  });

  console.log('✓ Sistema de toggle del sidebar inicializado (Ctrl+B para toggle)');
});
