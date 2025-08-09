import http.server
import socketserver
import json
from urllib.parse import urlparse, parse_qs

class SimpleAPIHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {'status': 'ok', 'message': 'Simple server is running'}
            self.wfile.write(json.dumps(response).encode())
            return
            
        elif parsed_path.path == '/api/users/stats':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'metersCount': 5,
                'complaintsCount': 2,
                'activeComplaints': 1,
                'lastReading': {
                    'electricity': 1234.5,
                    'water': 567.8,
                    'gas': 89.1,
                    'date': '2024-08-04T21:30:00'
                }
            }
            self.wfile.write(json.dumps(response).encode())
            return
            
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not found')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    PORT = 5000
    with socketserver.TCPServer(("", PORT), SimpleAPIHandler) as httpd:
        print(f"Server running on http://localhost:{PORT}")
        httpd.serve_forever() 