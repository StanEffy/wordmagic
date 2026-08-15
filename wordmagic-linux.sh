#!/usr/bin/env bash
# ==============================================================================
# WordMagic Desktop Launcher for Ubuntu / Debian / Fedora / Arch Linux
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Find a free TCP port
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()')
URL="http://127.0.0.1:$PORT/index.html"

echo "=========================================="
echo "  🖋️ Запуск WordMagic (Ubuntu / Linux)    "
echo "  Локальный адрес: $URL"
echo "=========================================="

# Start local server in background
python3 -m http.server "$PORT" > /dev/null 2>&1 &
SERVER_PID=$!

# Trap signals to ensure server cleanup on exit
cleanup() {
    echo "Завершение работы WordMagic..."
    kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Find available browser supporting standalone app mode
BROWSER=""
for b in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge-stable microsoft-edge brave-browser; do
    if command -v "$b" >/dev/null 2>&1; then
        BROWSER="$b"
        break
    fi
done

if [ -n "$BROWSER" ]; then
    echo "Запуск в отдельном окне приложения через $BROWSER..."
    "$BROWSER" --app="$URL" --window-size=1280,840 --user-data-dir="/tmp/wordmagic-profile-$USER" > /dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then
    echo "Открытие в браузере по умолчанию..."
    xdg-open "$URL" > /dev/null 2>&1 || true
    # Keep server alive
    wait "$SERVER_PID"
else
    echo "Откройте вручную в браузере: $URL"
    wait "$SERVER_PID"
fi
