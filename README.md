📈 AlgoMente – Stock Prediction Dashboard

FastAPI Backend + React Frontend + Machine Learning Model

A full-stack stock prediction system that fetches real-time market data using Yahoo Finance (with an Alpha Vantage fallback), processes it with a trained Keras model, and displays the results in an interactive React dashboard.

🚀 Features
🔧 Backend (FastAPI)

Real-time stock data fetch

Yahoo Finance as primary API

Alpha Vantage as fallback

Moving averages (100 / 200 / 250 days)

ML model prediction

REST API endpoints

CORS enabled

🌐 Frontend (React + Vite)

Modern dashboard UI

Stock symbol search

Charts with Recharts

Lucide icons

Moving averages graph

Actual vs predicted prices

📦 Project Structure
project-root/
│
├── backend/
│   ├── test.py
│   ├── model/
│   ├── utils/
│   ├── requirements.txt
│   └── ...other backend files
│
└── frontend/
    ├── src/
    ├── public/
    ├── package.json
    └── ...other frontend files

⚙️ Backend Setup
cd backend
pip install -r requirements.txt
python -m uvicorn test:app --reload --port 8000


Backend runs at:

http://localhost:8000

💻 Frontend Setup
cd frontend
npm install
npm run dev


Frontend runs at:

http://localhost:3000

🔌 API Endpoints
Method	Endpoint	Description
GET	/	Health check
GET	/stock/{symbol}	Fetch stock data
GET	/predict/{symbol}	Predict next price
GET	/moving-averages/{symbol}	Return MA100, MA200, MA250
🤖 Machine Learning Model

Built using Keras

Trained on historical stock data

Uses normalized sequences

Predicts next-step price movement

🛠️ Technologies
Backend

FastAPI

Uvicorn

yfinance

Alpha Vantage

TensorFlow / Keras

Pandas

NumPy

Frontend

React

Vite

Recharts

Lucide Icons

Axios

🧪 Run Both Together

Start backend:

python -m uvicorn test:app --reload --port 8000


Start frontend:

npm run dev
