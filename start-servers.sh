#!/bin/bash

# Tashawer Server Startup Script
# ==============================
# Fixed Ports Configuration:
#   - Backend (Django):  http://localhost:8001
#   - Frontend (Next.js): http://localhost:3001
#
# Usage:
#   ./start-servers.sh          # Start both servers
#   ./start-servers.sh backend  # Start backend only
#   ./start-servers.sh frontend # Start frontend only
#   ./start-servers.sh stop     # Stop all servers

BACKEND_PORT=8001
FRONTEND_PORT=3001
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

start_backend() {
    echo -e "${YELLOW}Starting Backend Server on port $BACKEND_PORT...${NC}"
    cd "$PROJECT_ROOT/tashawer_backend"

    # Activate virtual environment
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    fi

    # Check if port is already in use
    if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
        echo -e "${RED}Port $BACKEND_PORT is already in use!${NC}"
        echo "Run './start-servers.sh stop' first or check what's using the port."
        return 1
    fi

    python manage.py runserver 0.0.0.0:$BACKEND_PORT &
    echo -e "${GREEN}Backend started: http://localhost:$BACKEND_PORT${NC}"
}

start_frontend() {
    echo -e "${YELLOW}Starting Frontend Server on port $FRONTEND_PORT...${NC}"
    cd "$PROJECT_ROOT/tashawer_frontend"

    # Check if port is already in use
    if lsof -i :$FRONTEND_PORT > /dev/null 2>&1; then
        echo -e "${RED}Port $FRONTEND_PORT is already in use!${NC}"
        echo "Run './start-servers.sh stop' first or check what's using the port."
        return 1
    fi

    npm run dev &
    echo -e "${GREEN}Frontend started: http://localhost:$FRONTEND_PORT${NC}"
}

stop_servers() {
    echo -e "${YELLOW}Stopping Tashawer servers...${NC}"

    # Kill Django server on backend port
    if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
        kill $(lsof -t -i :$BACKEND_PORT) 2>/dev/null
        echo -e "${GREEN}Backend server stopped${NC}"
    fi

    # Kill Next.js server on frontend port
    if lsof -i :$FRONTEND_PORT > /dev/null 2>&1; then
        kill $(lsof -t -i :$FRONTEND_PORT) 2>/dev/null
        echo -e "${GREEN}Frontend server stopped${NC}"
    fi

    # Also kill any other next dev processes for this project
    pkill -f "next dev" 2>/dev/null

    echo -e "${GREEN}All servers stopped${NC}"
}

show_status() {
    echo -e "${YELLOW}Tashawer Server Status:${NC}"
    echo "========================"

    if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
        echo -e "Backend (port $BACKEND_PORT):  ${GREEN}RUNNING${NC}"
    else
        echo -e "Backend (port $BACKEND_PORT):  ${RED}STOPPED${NC}"
    fi

    if lsof -i :$FRONTEND_PORT > /dev/null 2>&1; then
        echo -e "Frontend (port $FRONTEND_PORT): ${GREEN}RUNNING${NC}"
    else
        echo -e "Frontend (port $FRONTEND_PORT): ${RED}STOPPED${NC}"
    fi
}

case "$1" in
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    stop)
        stop_servers
        ;;
    status)
        show_status
        ;;
    *)
        echo -e "${GREEN}==============================${NC}"
        echo -e "${GREEN}  Tashawer Development Servers${NC}"
        echo -e "${GREEN}==============================${NC}"
        echo ""
        start_backend
        sleep 2
        start_frontend
        echo ""
        echo -e "${GREEN}Both servers started!${NC}"
        echo "  Backend:  http://localhost:$BACKEND_PORT"
        echo "  Frontend: http://localhost:$FRONTEND_PORT"
        echo ""
        echo "To stop servers: ./start-servers.sh stop"
        ;;
esac
