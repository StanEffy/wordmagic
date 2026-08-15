#!/usr/bin/env bash
# ==============================================================================
# WordMagic One-Click Installer for Ubuntu / Debian
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DESKTOP_DIR="$HOME/.local/share/applications"

echo "=================================================="
echo "  Установка WordMagic в систему Ubuntu / Linux   "
echo "=================================================="

chmod +x "$DIR/wordmagic-linux.sh"
chmod +x "$DIR/server/server.py"

mkdir -p "$DESKTOP_DIR"
mkdir -p "$HOME/.local/share/icons/hicolor/256x256/apps"
mkdir -p "$HOME/.local/share/pixmaps"

cp "$DIR/icon.png" "$HOME/.local/share/icons/hicolor/256x256/apps/wordmagic.png"
cp "$DIR/icon.png" "$HOME/.local/share/pixmaps/wordmagic.png"

# Generate desktop file with absolute path
cat <<EOF > "$DESKTOP_DIR/wordmagic.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=WordMagic
GenericName=Prose Text Editor
Comment=Специализированный редактор для прозы с акро-прозой и аналитикой
Exec=$DIR/wordmagic-linux.sh
Icon=$DIR/icon.png
Terminal=false
Categories=Office;WordProcessor;TextEditor;
StartupNotify=true
EOF

chmod +x "$DESKTOP_DIR/wordmagic.desktop"

echo "✅ Установка завершена!"
echo "Теперь вы можете:"
echo "1. Запустить WordMagic из меню приложений Ubuntu (нажмите Super и введите WordMagic)"
echo "2. Или запустить скрипт в терминале: ./wordmagic-linux.sh"
