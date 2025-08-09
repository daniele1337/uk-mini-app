from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Test server is running'})

@app.route('/api/users/stats', methods=['GET'])
def user_stats():
    return jsonify({
        'metersCount': 5,
        'complaintsCount': 2,
        'activeComplaints': 1,
        'lastReading': {
            'electricity': 1234.5,
            'water': 567.8,
            'gas': 89.1,
            'date': '2024-08-04T21:30:00'
        }
    })

if __name__ == '__main__':
    print("Starting test server on http://localhost:5000")
    app.run(debug=True, host='localhost', port=5000) 