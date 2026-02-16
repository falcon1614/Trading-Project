---

# 🚀 Project Setup Guide

## 🖥️ Backend Setup (FastAPI)

The backend uses **Uvicorn** as the ASGI server. Ensure you have Python installed before proceeding.

1. **Create and activate a virtual environment:**
```bash
# Create the environment
python -m venv venv

# Activate it (Windows)
.\venv\Scripts\activate

# Activate it (macOS/Linux)
source venv/bin/activate

```


2. **Install dependencies:**
```bash
pip install -r requirements.txt

```


3. **Run the development server:**
```bash
uvicorn app.main:app --reload

```


> 💡 **API Documentation:** Once running, you can access the interactive docs at [http://127.0.0.1:8000/docs](https://www.google.com/search?q=http://127.0.0.1:8000/docs)



---

## 🌐 Frontend Setup (React)

The frontend manages UI components and state. Ensure you have **Node.js** installed.

1. **Install packages:**
```bash
npm install

```


2. **Launch the development server:**
```bash
npm run dev

```


> 💡 **Default URL:** Usually available at [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173) or [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)



---

### 🛠️ Architecture Overview

| Component | Technology | Default Port |
| --- | --- | --- |
| **Backend** | FastAPI / Python | `8000` |
| **Frontend** | React / Node.js | `5173` or `3000` |

---

Would you like me to add a section for **Environment Variables (.env)** setup so you can track your API keys and database strings?
