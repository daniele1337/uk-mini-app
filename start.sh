#!/bin/bash

echo "Starting UK Mini App..."

echo "Installing frontend dependencies..."
npm install

echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Starting backend server..."
python app.py &
BACKEND_PID=$!

echo "Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "UK Mini App is starting..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Ожидание сигнала завершения
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Ожидание завершения
wait 