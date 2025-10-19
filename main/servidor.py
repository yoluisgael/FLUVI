#!/usr/bin/env python3
"""
Servidor HTTP simple para el simulador FLUVI
Ejecuta este script y abre http://localhost:8000 en tu navegador
"""

import http.server
import socketserver
import os
import sys

# Configuración
PORT = 8000
DIRECTORY = "."

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Agregar headers CORS para evitar problemas
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def main():
    print("=" * 60)
    print("SERVIDOR WEB PARA FLUVI - SIMULADOR DE TRAFICO")
    print("=" * 60)
    print(f"\nSirviendo archivos desde: {os.path.abspath(DIRECTORY)}")
    print(f"Puerto: {PORT}")
    print(f"\nServidor iniciado correctamente!")
    print(f"\nAbre tu navegador y ve a:")
    print(f"   http://localhost:{PORT}")
    print(f"   http://127.0.0.1:{PORT}")
    print(f"\nPara detener el servidor, presiona Ctrl+C")
    print("=" * 60 + "\n")

    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServidor detenido por el usuario")
        sys.exit(0)
    except OSError as e:
        if e.errno == 10048:  # Puerto en uso (Windows)
            print(f"\nERROR: El puerto {PORT} ya esta en uso.")
            print(f"   Intenta cerrar otros servidores o usa otro puerto.")
        else:
            print(f"\nERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
