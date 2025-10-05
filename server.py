#!/usr/bin/env python3
"""
Simple HTTP server for Plant Identifier App
Serves the app locally with proper CORS headers for camera access
"""

import http.server
import socketserver
import os
import webbrowser
from urllib.parse import urlparse

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for camera access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def start_server(port=8000):
    """Start the HTTP server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
        print(f"🌱 Plant Identifier App Server")
        print(f"📱 Server running at: http://localhost:{port}")
        print(f"📱 Mobile access: http://{get_local_ip()}:{port}")
        print(f"🔗 Open in browser: http://localhost:{port}")
        print(f"⏹️  Press Ctrl+C to stop the server")
        print("-" * 50)
        
        try:
            # Try to open browser automatically
            webbrowser.open(f'http://localhost:{port}')
        except:
            pass
            
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            httpd.shutdown()

def get_local_ip():
    """Get the local IP address for mobile access"""
    import socket
    try:
        # Connect to a remote server to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

if __name__ == "__main__":
    import sys
    
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Invalid port number. Using default port 8000.")
    
    start_server(port)