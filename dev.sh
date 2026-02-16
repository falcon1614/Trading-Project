#!/bin/bash

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------
PROJECT_ROOT="/run/media/falcon/Local/Trading-Project"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
CLOUDFLARED_DIR="$HOME/.cloudflared"
TUNNEL_NAME="stock"

LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting development environment...${NC}"

cleanup() {
    echo -e "\n${YELLOW}⏹️  Stopping all services...${NC}"
    pkill -P $$ 2>/dev/null
    echo -e "${GREEN}✅ All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# -------------------------------------------------------------------
# 1. Start FastAPI Backend (with Venv)
# -------------------------------------------------------------------
if [ -d "$BACKEND_DIR" ]; then
    echo -e "${GREEN}📡 Starting FastAPI backend...${NC}"
    cd "$BACKEND_DIR" || exit

    # Check if venv exists and activate it
    if [ -d "venv" ]; then
        source venv/bin/activate
        echo -e "   ✅ Virtual environment activated."
    else
        echo -e "${YELLOW}   ⚠️  Warning: venv directory not found in $BACKEND_DIR${NC}"
    fi

    # Explicitly bind to 127.0.0.1:8000 to fix CONNECTION_REFUSED
    uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload > "$LOG_DIR/uvicorn.log" 2>&1 &

    # Wait a moment to see if it crashes
    sleep 2
    if ! ps -p $! > /dev/null; then
        echo -e "${RED}   ❌ Backend failed to start. Last 5 lines of log:${NC}"
        tail -n 5 "$LOG_DIR/uvicorn.log"
    else
        echo -e "   Backend PID: $! (logs: $LOG_DIR/uvicorn.log)"
    fi
else
    echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"
fi

# -------------------------------------------------------------------
# 2. Start React Frontend
# -------------------------------------------------------------------
if [ -d "$FRONTEND_DIR" ]; then
    echo -e "${GREEN}🎨 Starting React frontend...${NC}"
    cd "$FRONTEND_DIR" || exit
    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    echo -e "   Frontend PID: $! (logs: $LOG_DIR/frontend.log)"
else
    echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"
fi

# -------------------------------------------------------------------
# 3. Start Cloudflared Tunnel
# -------------------------------------------------------------------
if command -v cloudflared &> /dev/null; then
    echo -e "${GREEN}🌐 Starting Cloudflared tunnel '$TUNNEL_NAME'...${NC}"
    cd "$CLOUDFLARED_DIR" || exit
    cloudflared tunnel run "$TUNNEL_NAME" > "$LOG_DIR/cloudflared.log" 2>&1 &
    echo -e "   Cloudflared PID: $! (logs: $LOG_DIR/cloudflared.log)"
else
    echo -e "${RED}❌ cloudflared command not found.${NC}"
fi

echo -e "\n${GREEN}✅ Services are live! Press Ctrl+C to shut down.${NC}"

# Keep script running
wait
