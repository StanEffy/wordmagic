<div align="center">

# 🖋️ WordMagic

### *The Distraction-Free Prose Editor & Creative Constraint Suite for Serious Writers*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Windows | Linux | Web](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20Web-blue.svg)](#-platforms--quick-start)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20External%20NPM-brightgreen.svg)](#)
[![Offline First](https://img.shields.io/badge/Storage-Offline--First%20IndexedDB-orange.svg)](#)
[![Cloud Sync](https://img.shields.io/badge/Cloud%20Sync-Firebase%20%2B%20Self--Hosted-purple.svg)](#)

[**Русский**](#-обзор-на-русском) | [**English**](#-english-overview) | [**Быстрый старт / Quickstart**](#-quick-start) | [**Лицензия / License**](#-license)

---

</div>

## 📖 English Overview

**WordMagic** is an open-source, offline-first prose editor engineered specifically for authors, novelists, and creative writers. It unites minimalist aesthetics with analytical productivity tracking, constraint-writing mechanics (*Acro-prose*), and seamless multi-device synchronization.

### ✨ Key Features

- 🧘 **Distraction-Free Zen Writing**: True fullscreen mode (`Alt+Z`), Typewriter scrolling (keeps active line vertically centered), and paragraph-focus dimming.
- 📊 **7-Day Analytics & 52-Week Forecasting**: Tracks start-of-day and end-of-day word counts per book and projects your annual output across 52 weeks with an interactive high-DPI canvas chart.
- 🏆 **Canonical Masterpiece Benchmarks**: Live motivational pace comparisons showing your ETA to write *The Lord of the Rings*, *War and Peace*, *Crime and Punishment*, *The Master and Margarita*, and *Harry Potter*.
- 🔤 **Acro-Prose Prompter (Constraint Writing)**: Real-time tape prompter streaming letter constraints from any source poem or text with phonetic sound equivalence matching and cross-chapter offset tracking.
- 📚 **Multi-Book & Chapter Hierarchy**: Manage multiple independent manuscripts, nested folders/parts, chapters, and compile entire books into a single Markdown manuscript in 1 click.
- ☁️ **Dual Cloud & Server Sync**:
  - **Google Firebase**: Built-in Google Auth & Cloud Firestore real-time database with offline persistence.
  - **Self-Hosted Sync Server**: Lightweight, zero-dependency Python + SQLite server (`server/server.py`) or Docker container.
  - **Git & GitHub Integration**: Direct commits and push to GitHub repositories with visual LCS line-by-line diff inspector.

---

## 🇷🇺 Обзор на русском

**WordMagic** — это свободный (Open Source, MIT) текстовый редактор с фокусом на литературную прозу, книги и романы. В нём объединены дзен-окружение для писателя, строгая аналитика прогресса по каждому произведению и уникальный тренажёр словесного мастерства (акро-проза).

### 🌟 Основные возможности

| Раздел | Возможности |
| --- | --- |
| ✍️ **Дзен-писательство** | Полноэкранный режим `Alt+Z`, центрирование строки (Typewriter scrolling), фокус на текущем абзаце, книжная типографика (*Literata*, *PT Serif*, *Merriweather*). |
| 📊 **7-дневная аналитика** | Точный подсчёт слов литературного стандарта (слова через дефис как одно слово, знаки препинания игнорируются). Учет стартового и конечного объема дня **раздельно для каждого произведения**. |
| 📈 **Экстраполяция на 52 недели** | Проекция темпа на год вперёд на интерактивном графике с интерактивным регулятором темпа. |
| 🏛️ **5 литературных эталонов** | Сравнение прогресса с шедеврами классики: *«Властелин колец»*, *«Война и мир»*, *«Преступление и наказание»*, *«Мастер и Маргарита»*, *«Гарри Поттер»*. |
| 🎭 **Режим Акро-прозы** | Лента-подсказчик буквенных ограничений из поэтических текстов, строгий режим (без Ь/Ъ, Й=И, Ё=Е), фонетическое соответствие согласных/гласных и сквозной перенос прогресса между главами. |
| 📚 **Книги и структура глав** | Неограниченное количество произведений, папки/части, главы и экспорт всей книги в единый Markdown-файл. |
| ☁️ **Облако и синхронизация** | Официальный **Google Firebase** (Google Auth + Cloud Firestore), собственный автономный **Python/Docker сервер** и прямое версионирование в **GitHub**. |

---

## 🚀 Quick Start / Быстрый запуск

### 🪟 Windows (Standalone `.exe`)
Дважды кликните по файлу **[`WordMagic.exe`](file:///c:/Users/User/Documents/projects/wordmagic/WordMagic.exe)**:
- Запускается как автономное нативное окно без рамок браузера и адресных строк.
- Вшитая иконка в окне, проводнике и системном трее Windows.

```powershell
# Запуск через готовый exe:
.\WordMagic.exe
```

### 🐧 Ubuntu / Debian / Linux
В репозитории есть готовые лаунчер и системный установщик:

```bash
# 1. Запуск из папки:
chmod +x wordmagic-linux.sh
./wordmagic-linux.sh

# 2. Установка в главное меню Ubuntu (Gnome Dash):
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

### 🌐 Web Browser / Python
```bash
python3 -m http.server 8080
# Open in browser: http://localhost:8080
```

---

## ☁️ Cloud & Sync Options / Варианты синхронизации

```
                  ┌───────────────────────────────┐
                  │      WordMagic Editor         │
                  │   (Windows / Linux / Web)     │
                  └──────────────┬────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
 ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
 │   Firebase    │       │  Sync Server  │       │    GitHub     │
 │ Firestore DB  │       │ Python/Docker │       │  REST Commit  │
 │  Google Auth  │       │  SQLite Sync  │       │   LCS Diffs   │
 └───────────────┘       └───────────────┘       └───────────────┘
```

1. **Google Firebase (Cloud Firestore)**:
   - Нажмите **`🔥 Войти в Облако`** в шапке программы и войдите через Google в 1 клик.
   - Все тексты, книги и 7-дневная статистика синхронизируются в базу данных Cloud Firestore.
2. **Собственный Sync Server (Python / Docker)**:
   ```bash
   cd server
   python3 server.py --port 8080 --key "my_secret_key"
   # Или через Docker:
   docker compose up -d
   ```
3. **GitHub Git Sync**:
   - Укажите Personal Access Token и репозиторий `username/repo` для прямого пуша глав с просмотром визуальных диффов.

---

## ⌨️ Hotkeys / Горячие клавиши

| Keybinding | Action (EN) | Действие (RU) |
| --- | --- | --- |
| `Alt + Z` | Toggle Zen Fullscreen Mode | Полноэкранный Дзен-режим |
| `Ctrl + S` / `Cmd + S` | Save & Snapshot Revision | Сохранить и создать ревизию |
| `Tab` | Smart Literary Indentation | Умный писательский отступ |
| `Esc` | Close active modal | Закрыть модальное окно |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details. Free for personal, commercial, and open-source use.
