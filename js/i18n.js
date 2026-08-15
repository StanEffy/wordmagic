/**
 * WordMagic Internationalization (i18n) Engine
 * Full bilingual support: Russian (RU) & English (EN).
 */

export const TRANSLATIONS = {
  ru: {
    // Header
    brand: "WordMagic",
    theme_paper: "Папирус",
    theme_dark: "Обсидиан Dark",
    theme_sepia: "Сепия",
    font_literata: "Literata (Serif)",
    font_ptserif: "PT Serif",
    font_merriweather: "Merriweather",
    font_inter: "Inter (Sans)",
    font_mono: "JetBrains Mono",
    btn_zen: "Дзен",
    btn_zen_title: "Полноэкранный Дзен-режим (Alt+Z)",
    btn_login_cloud: "Войти в Облако",
    btn_user_cloud: "В сети",

    // Sidebar
    manage_projects_title: "Управление произведениями и книгами",
    btn_new_chapter: "+ Новая глава",
    btn_new_folder: "+ Папка",
    btn_compile: "📦 Собрать всю книгу (.md)",
    btn_stats: "📊 Аналитика (7 дней)",
    btn_acro: "🎭 Акро-проза",
    btn_git: "☁️ Облако & Git",
    btn_export: "💾 Экспорт",
    default_chapter_title: "Без названия",
    default_folder_title: "Новая часть",
    confirm_delete_doc: "Удалить этот документ/главу?",
    confirm_delete_folder: "Удалить эту папку и всё её содержимое?",

    // Status Bar
    status_saved: "Сохранено",
    status_saving: "Сохранение...",
    status_offline: "Офлайн",
    status_words: "сл.",
    status_chars: "симв.",
    status_reading_time: "мин. чтения",
    status_avg_sentence: "сл/предл.",

    // Stats Modal
    stats_modal_title: "📊 Аналитика и Прогноз на 52 недели",
    stats_scope_label: "Область расчета:",
    stats_scope_current: "📖 Текущее произведение",
    stats_scope_all: "🌐 Все произведения суммарно",
    stats_pace_label: "Желаемый темп:",
    stats_seven_days_title: "Динамика за последние 7 дней",
    stats_extrapolation_title: "Проекция на 52 недели (Годовой темп)",
    stats_benchmarks_title: "Сравнение с 5 шедеврами мировой литературы",
    day_mon: "Пн",
    day_tue: "Вт",
    day_wed: "Ср",
    day_thu: "Чт",
    day_fri: "Пт",
    day_sat: "Сб",
    day_sun: "Вс",
    day_today: "Сегодня",
    day_start: "Старт:",
    day_end: "Конец:",
    pace_words_per_day: "сл/день",
    chart_week_prefix: "нед.",
    chart_words_label: "Слов",

    // Acro-Prose Prompter
    acro_modal_title: "🎭 Настройки режима Акро-прозы",
    acro_status_active: "Режим Акро-прозы активен",
    acro_status_inactive: "Режим Акро-прозы выключен",
    acro_enable_toggle: "Включить подсказчик акро-прозы",
    acro_preset_label: "Готовые поэтические источники:",
    acro_source_label: "Текст-источник (поэма, стихотворение, цитата):",
    acro_source_placeholder: "Вставьте сюда текст, начальные буквы которого будут направлять вашу прозу...",
    acro_mode_label: "Правило строгости букв:",
    acro_mode_strict: "Строгий (по умолч.: без Ь/Ъ, Й=И, Ё=Е)",
    acro_mode_phonetic: "Фонетический (парные звонкие/глухие, безударные гласные)",
    acro_mode_free: "Свободный (все гласные между собой, все согласные между собой)",
    acro_trigger_label: "Переключение буквы по:",
    acro_trigger_words: "Каждому слову (слово на букву)",
    acro_trigger_sentences: "Каждому предложению (предложение на букву)",
    acro_trigger_paragraphs: "Каждому абзацу (абзац на букву)",
    acro_stats_label: "Прогресс и статистика потока:",
    acro_stat_current_chapter: "Слов в текущей главе:",
    acro_stat_offset: "Пройдено в предыдущих главах книги:",
    acro_stat_accuracy: "Точность следования:",
    acro_stat_streak: "Текущая серия совпадений:",
    acro_stat_remaining: "Осталось букв в источнике:",

    // Cloud & Git Modal
    cloud_modal_title: "☁️ Облачная синхронизация (Firebase, Сервер, Git)",
    firebase_card_title: "Google Firebase Cloud",
    firebase_unauth: "Вы не авторизованы (данные сохраняются только на этом компьютере)",
    firebase_auth_prefix: "В сети:",
    firebase_btn_google: "Войти через Google",
    firebase_btn_guest: "Гостевой вход",
    firebase_btn_logout: "Выйти",
    firebase_btn_sync: "Синхронизировать с Firebase",
    server_card_title: "Свой сервер синхронизации (Ubuntu / VPS / Docker)",
    server_url_label: "URL сервера (например, http://localhost:8080):",
    server_key_label: "Ключ доступа (Sync Secret Key):",
    server_autosync_label: "Автоматическая фоновая синхронизация (каждые 60 сек)",
    server_btn_test: "🔌 Проверить связь",
    server_btn_sync: "🔄 Синхронизировать сейчас",
    git_card_title: "Синхронизация с GitHub (Резервная копия репозитория)",
    git_token_label: "GitHub Personal Access Token:",
    git_repo_label: "Репозиторий (username/repo):",
    git_branch_label: "Ветка (Branch):",
    git_path_label: "Путь к файлу в репозитории:",
    git_btn_save: "Сохранить параметры GitHub",
    git_btn_push: "🚀 Закоммитить и отправить в GitHub",
    git_commit_msg_label: "Сообщение коммита:",
    git_timeline_title: "История ревизий и локальных снапшотов",

    // Projects Modal
    projects_modal_title: "📚 Управление произведениями и книгами",
    projects_btn_create: "+ Новая книга / роман",
    project_create_prompt: "Введите название новой книги:",
    project_delete_confirm: "Вы уверены, что хотите удалить книгу со всеми главами?",
    project_active_badge: "Активная книга",
    project_words_badge: "слов",

    // Export Modal
    export_modal_title: "💾 Экспорт главы и рукописи",
    export_btn_md: "Скачать Markdown (.md)",
    export_btn_txt: "Скачать Текст (.txt)",
    export_btn_html: "Скачать HTML (.html)",
    export_btn_copy: "Скопировать в буфер обмена",
    export_copied_alert: "Текст успешно скопирован в буфер обмена!"
  },

  en: {
    // Header
    brand: "WordMagic",
    theme_paper: "Papyrus",
    theme_dark: "Obsidian Dark",
    theme_sepia: "Sepia",
    font_literata: "Literata (Serif)",
    font_ptserif: "PT Serif",
    font_merriweather: "Merriweather",
    font_inter: "Inter (Sans)",
    font_mono: "JetBrains Mono",
    btn_zen: "Zen",
    btn_zen_title: "Fullscreen Zen Focus Mode (Alt+Z)",
    btn_login_cloud: "Sign In (Cloud)",
    btn_user_cloud: "Online",

    // Sidebar
    manage_projects_title: "Manage Manuscripts & Books",
    btn_new_chapter: "+ New Chapter",
    btn_new_folder: "+ Folder",
    btn_compile: "📦 Compile Full Book (.md)",
    btn_stats: "📊 Analytics (7 Days)",
    btn_acro: "🎭 Acro-Prose",
    btn_git: "☁️ Cloud & Git",
    btn_export: "💾 Export",
    default_chapter_title: "Untitled",
    default_folder_title: "New Part",
    confirm_delete_doc: "Delete this document/chapter?",
    confirm_delete_folder: "Delete this folder and all its contents?",

    // Status Bar
    status_saved: "Saved",
    status_saving: "Saving...",
    status_offline: "Offline",
    status_words: "words",
    status_chars: "chars",
    status_reading_time: "min read",
    status_avg_sentence: "w/sent.",

    // Stats Modal
    stats_modal_title: "📊 Analytics & 52-Week Projection",
    stats_scope_label: "Calculation Scope:",
    stats_scope_current: "📖 Current Manuscript",
    stats_scope_all: "🌐 All Manuscripts Combined",
    stats_pace_label: "Target Pace:",
    stats_seven_days_title: "7-Day Writing Dynamics",
    stats_extrapolation_title: "52-Week Annual Extrapolation",
    stats_benchmarks_title: "Comparison Against 5 Literary Masterpieces",
    day_mon: "Mon",
    day_tue: "Tue",
    day_wed: "Wed",
    day_thu: "Thu",
    day_fri: "Fri",
    day_sat: "Sat",
    day_sun: "Sun",
    day_today: "Today",
    day_start: "Start:",
    day_end: "End:",
    pace_words_per_day: "words/day",
    chart_week_prefix: "wk.",
    chart_words_label: "Words",

    // Acro-Prose Prompter
    acro_modal_title: "🎭 Acro-Prose Constraint Prompter",
    acro_status_active: "Acro-Prose Mode Active",
    acro_status_inactive: "Acro-Prose Mode Inactive",
    acro_enable_toggle: "Enable Acro-Prose letter prompter",
    acro_preset_label: "Poetic Source Presets:",
    acro_source_label: "Source Text (poem, quote, sonnet):",
    acro_source_placeholder: "Paste source text here whose initial letters will guide your prose...",
    acro_mode_label: "Letter Matching Rule:",
    acro_mode_strict: "Strict (Default: omit Ь/Ъ, treat Й=И, Ё=Е)",
    acro_mode_phonetic: "Phonetic (voiced/unvoiced pairs, vowel harmony)",
    acro_mode_free: "Free (any vowel with vowel, any consonant with consonant)",
    acro_trigger_label: "Advance Prompt On:",
    acro_trigger_words: "Every Word (one letter per word)",
    acro_trigger_sentences: "Every Sentence (one letter per sentence)",
    acro_trigger_paragraphs: "Every Paragraph (one letter per paragraph)",
    acro_stats_label: "Stream Progress & Accuracy:",
    acro_stat_current_chapter: "Words in current chapter:",
    acro_stat_offset: "Processed in preceding chapters:",
    acro_stat_accuracy: "Constraint Accuracy:",
    acro_stat_streak: "Current Streak:",
    acro_stat_remaining: "Letters remaining:",

    // Cloud & Git Modal
    cloud_modal_title: "☁️ Cloud Synchronization (Firebase, Server, Git)",
    firebase_card_title: "Google Firebase Cloud",
    firebase_unauth: "Not signed in (data stored locally on this machine only)",
    firebase_auth_prefix: "Online:",
    firebase_btn_google: "Sign in with Google",
    firebase_btn_guest: "Guest Sign-in",
    firebase_btn_logout: "Sign Out",
    firebase_btn_sync: "Sync with Firebase",
    server_card_title: "Self-Hosted Sync Server (Ubuntu / VPS / Docker)",
    server_url_label: "Server URL (e.g., http://localhost:8080):",
    server_key_label: "Sync Secret Key:",
    server_autosync_label: "Automatic background sync (every 60 seconds)",
    server_btn_test: "🔌 Test Connection",
    server_btn_sync: "🔄 Sync Now",
    git_card_title: "GitHub Repository Synchronization",
    git_token_label: "GitHub Personal Access Token:",
    git_repo_label: "Repository (username/repo):",
    git_branch_label: "Branch:",
    git_path_label: "File path in repository:",
    git_btn_save: "Save GitHub Settings",
    git_btn_push: "🚀 Commit & Push to GitHub",
    git_commit_msg_label: "Commit message:",
    git_timeline_title: "Revision History & Local Snapshots",

    // Projects Modal
    projects_modal_title: "📚 Manage Manuscripts & Books",
    projects_btn_create: "+ New Book / Novel",
    project_create_prompt: "Enter title for the new manuscript:",
    project_delete_confirm: "Are you sure you want to delete this book and all its chapters?",
    project_active_badge: "Active Manuscript",
    project_words_badge: "words",

    // Export Modal
    export_modal_title: "💾 Export Chapter & Manuscript",
    export_btn_md: "Download Markdown (.md)",
    export_btn_txt: "Download Plain Text (.txt)",
    export_btn_html: "Download HTML (.html)",
    export_btn_copy: "Copy to Clipboard",
    export_copied_alert: "Manuscript copied to clipboard!"
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('wordmagic_lang') || 'ru';
    this.listeners = [];
  }

  get lang() {
    return this.currentLang;
  }

  setLanguage(lang) {
    if (lang !== 'ru' && lang !== 'en') lang = 'ru';
    this.currentLang = lang;
    localStorage.setItem('wordmagic_lang', lang);
    this.applyToDOM();
    this.listeners.forEach(cb => {
      try { cb(lang); } catch (e) { console.error(e); }
    });
  }

  t(key, params = {}) {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.ru;
    let text = dict[key] || TRANSLATIONS.ru[key] || key;

    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp(`{${p}}`, 'g'), params[p]);
    });

    return text;
  }

  onChange(cb) {
    this.listeners.push(cb);
  }

  applyToDOM() {
    document.documentElement.lang = this.currentLang;
    
    // Elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // Elements with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.title = this.t(key);
      }
    });

    // Elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = this.t(key);
      }
    });
  }
}

export const i18n = new I18nManager();
