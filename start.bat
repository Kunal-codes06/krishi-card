@echo off
echo Starting Krishi-Cart Servers...
start cmd /k "cd frontend && npm run dev"
start cmd /k "cd backend && node server.js"
start cmd /k "cd ml_backend && python app.py"
echo All servers started!
