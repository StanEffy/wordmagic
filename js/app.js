/**
 * WordMagic - Main Application Orchestrator
 */

import { storage } from './storage.js';
import { ProseEditor } from './editor.js';
import { StatsEngine } from './stats-engine.js';
import { BenchmarkCalculator } from './benchmarks.js';
import { AcroEngine } from './acro-engine.js';
import { GitEngine } from './git-engine.js';
import { SyncEngine } from './sync-engine.js';
import { firebaseService } from './firebase-service.js';
import { i18n } from './i18n.js';
import { ACRO_PRESETS, STARTER_PROSE } from './presets.js';

class WordMagicApp {
  constructor() {
    this.currentProject = null;
    this.currentDoc = null;
    this.projects = [];
    this.documents = [];
    this.saveTimeout = null;
    this.settings = storage.getSettings();
    this.acroConfig = storage.getAcroConfig();
    this.githubConfig = storage.getGitHubConfig();
    this.serverConfig = storage.getServerConfig();
    this.acroTargetStream = [];
    this.lastAcroIndex = -1;

    this.init();
  }

  async init() {
    this.cacheDom();
    this.applySettings();
    this.initEditor();
    this.initAcroStream();
    this.initLanguage();
    this.bindEvents();
    this.bindModals();
    this.startHeartbeat();
    this.startAutoSyncWatcher();
    this.initFirebaseListeners();
    await this.loadProjectsAndDocuments();
    this.updateStatsUI();

    // Auto-sync on launch if configured
    if (this.serverConfig && this.serverConfig.serverUrl && this.serverConfig.autoSync) {
      setTimeout(() => this.handleSyncNow(true), 1500);
    }
  }

  initLanguage() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.value = i18n.lang;
      langSelect.addEventListener('change', (e) => {
        i18n.setLanguage(e.target.value);
        this.renderDocList();
        this.updateStatsUI();
        this.populateAcroModal();
        if (this.currentDoc) {
          this.updateMetricsHUD(this.currentDoc.content);
        }
      });
    }
    i18n.applyToDOM();
  }

  startHeartbeat() {
    // Keep local launcher alive while editor tab/window is open
    setInterval(() => {
      fetch('/api/heartbeat').catch(() => {});
    }, 2500);
  }

  cacheDom() {
    // Stage elements
    this.appEl = document.getElementById('app');
    this.sidebarEl = document.getElementById('sidebar');
    this.toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    this.docListEl = document.getElementById('docList');
    this.newDocBtn = document.getElementById('newDocBtn');
    this.newFolderBtn = document.getElementById('newFolderBtn');
    this.projectSwitcherBtn = document.getElementById('projectSwitcherBtn');
    this.projectCurrentTitle = document.getElementById('projectCurrentTitle');
    this.openProjectsModalBtn = document.getElementById('openProjectsModalBtn');
    this.projectsModal = document.getElementById('projectsModal');
    this.projectsList = document.getElementById('projectsList');
    this.newProjectTitleInput = document.getElementById('newProjectTitleInput');
    this.createNewProjectBtn = document.getElementById('createNewProjectBtn');
    this.exportFullBookBtn = document.getElementById('exportFullBookBtn');

    this.docTitleInput = document.getElementById('docTitleInput');
    this.syncStatusDot = document.getElementById('syncStatusDot');
    this.syncStatusText = document.getElementById('syncStatusText');

    // Editor elements
    this.editorViewport = document.getElementById('editorViewport');
    this.editorTextarea = document.getElementById('proseEditor');
    this.zenToggleBtn = document.getElementById('zenToggleBtn');
    this.zenExitBtn = document.getElementById('zenExitBtn');

    // HUD metrics
    this.hudWords = document.getElementById('hudWords');
    this.hudChars = document.getElementById('hudChars');
    this.hudReadingTime = document.getElementById('hudReadingTime');
    this.hudSentences = document.getElementById('hudSentences');

    // Acro Ribbon
    this.acroRibbon = document.getElementById('acroRibbon');
    this.acroLetterTrack = document.getElementById('acroLetterTrack');
    this.acroModePill = document.getElementById('acroModePill');
    this.acroStreakVal = document.getElementById('acroStreakVal');
    this.toggleAcroRibbonBtn = document.getElementById('toggleAcroRibbonBtn');
    this.openAcroModalBtn = document.getElementById('openAcroModalBtn');

    // Floating Tools
    this.toolTypewriter = document.getElementById('toolTypewriter');
    this.toolFocus = document.getElementById('toolFocus');
    this.themeSelect = document.getElementById('themeSelect');
    this.fontSelect = document.getElementById('fontSelect');

    // Modals
    this.statsModal = document.getElementById('statsModal');
    this.acroModal = document.getElementById('acroModal');
    this.gitModal = document.getElementById('gitModal');
    this.exportModal = document.getElementById('exportModal');

    // Modal Triggers
    this.openStatsBtn = document.getElementById('openStatsBtn');
    this.openGitBtn = document.getElementById('openGitBtn');
    this.openExportBtn = document.getElementById('openExportBtn');

    // 52-Week Chart Canvas
    this.extrapolationCanvas = document.getElementById('extrapolationCanvas');
    this.sevenDayGrid = document.getElementById('sevenDayGrid');
    this.benchmarksList = document.getElementById('benchmarksList');
    this.paceMultiplierSlider = document.getElementById('paceMultiplierSlider');
    this.paceMultiplierVal = document.getElementById('paceMultiplierVal');

    // Git / GitHub Modal Elements
    this.ghTokenInput = document.getElementById('ghTokenInput');
    this.ghRepoInput = document.getElementById('ghRepoInput');
    this.ghBranchInput = document.getElementById('ghBranchInput');
    this.ghPathInput = document.getElementById('ghPathInput');
    this.saveGhConfigBtn = document.getElementById('saveGhConfigBtn');
    this.commitMessageInput = document.getElementById('commitMessageInput');
    this.pushGitHubBtn = document.getElementById('pushGitHubBtn');
    this.createLocalSnapshotBtn = document.getElementById('createLocalSnapshotBtn');
    this.gitTimelineList = document.getElementById('gitTimelineList');
    this.diffContainer = document.getElementById('diffContainer');
  }

  applySettings() {
    document.documentElement.setAttribute('data-theme', this.settings.theme || 'paper');
    if (this.themeSelect) this.themeSelect.value = this.settings.theme || 'paper';
    if (this.fontSelect) this.fontSelect.value = this.settings.font || 'literata';

    document.body.classList.remove('font-literata', 'font-ptserif', 'font-merriweather', 'font-inter', 'font-mono');
    document.body.classList.add(`font-${this.settings.font || 'literata'}`);

    document.body.classList.remove('size-sm', 'size-md', 'size-lg');
    document.body.classList.add(`size-${this.settings.fontSize || 'md'}`);

    document.body.classList.remove('width-narrow', 'width-standard', 'width-wide');
    document.body.classList.add(`width-${this.settings.columnWidth || 'standard'}`);

    if (this.settings.typewriter) {
      document.body.classList.add('typewriter-mode');
      if (this.toolTypewriter) this.toolTypewriter.classList.add('active');
    }
    if (this.settings.paragraphFocus) {
      document.body.classList.add('focus-mode-paragraph');
      if (this.toolFocus) this.toolFocus.classList.add('active');
    }

    if (!this.acroConfig.enabled && this.acroRibbon) {
      this.acroRibbon.classList.add('hidden');
    }
  }

  initEditor() {
    this.editor = new ProseEditor({
      textareaEl: this.editorTextarea,
      viewportEl: this.editorViewport,
      changeCallback: (content, isInitial) => {
        this.handleContentChange(content, isInitial);
      }
    });

    this.editor.setTypewriterMode(this.settings.typewriter);
    this.editor.setParagraphFocusMode(this.settings.paragraphFocus);
  }

  initAcroStream() {
    this.acroTargetStream = AcroEngine.buildTargetStream(this.acroConfig.sourceText, this.acroConfig);
    this.updateAcroModeBadge();
  }

  updateAcroModeBadge() {
    if (!this.acroModePill) return;
    const isStrict = (this.acroConfig.mode || 'strict') === 'strict';
    this.acroModePill.className = `acro-mode-pill ${isStrict ? 'strict' : 'phonetic'}`;
    this.acroModePill.innerHTML = isStrict
      ? `<span class="icon">🔒</span> Строгий (без Ь/Ъ, Й=И, Ё=Е)`
      : `<span class="icon">✨</span> Фонетический (звуки)`;
  }

  async loadProjectsAndDocuments() {
    this.projects = storage.getProjects();
    const activeProjId = storage.getActiveProjectId();
    this.currentProject = this.projects.find(p => p.id === activeProjId) || this.projects[0];
    storage.setActiveProjectId(this.currentProject.id);

    if (this.projectCurrentTitle) {
      this.projectCurrentTitle.textContent = this.currentProject.title;
    }

    let docs = await storage.getAllDocuments();
    if (docs.length === 0) {
      // Seed starter document
      const starter = { ...STARTER_PROSE, projectId: this.currentProject.id };
      await storage.saveDocument(starter);
      docs = [starter];
    } else {
      // Auto-migrate any unassigned documents
      for (const d of docs) {
        if (!d.projectId) {
          d.projectId = this.currentProject.id;
          await storage.saveDocument(d);
        }
      }
    }

    this.documents = docs;
    this.renderDocList();

    const activeId = storage.getActiveDocId();
    const projectDocs = this.documents.filter(d => d.projectId === this.currentProject.id && !d.isFolder);
    const docToOpen = projectDocs.find(d => d.id === activeId) || projectDocs[0] || this.documents[0];
    
    if (docToOpen) {
      this.openDocument(docToOpen);
    }
  }

  renderDocList() {
    if (!this.docListEl || !this.currentProject) return;
    this.docListEl.innerHTML = '';

    const projectDocs = this.documents.filter(d => d.projectId === this.currentProject.id);

    if (projectDocs.length === 0) {
      this.docListEl.innerHTML = '<li style="font-size:0.78rem; color:var(--text-muted); padding:10px; font-style:italic;">В этой книге пока нет глав. Нажмите «+ Глава»!</li>';
      return;
    }

    // Folders first, then chapters
    const folders = projectDocs.filter(d => d.isFolder);
    const rootChapters = projectDocs.filter(d => !d.isFolder && !d.parentId);

    folders.forEach(folder => {
      const folderLi = document.createElement('li');
      folderLi.className = 'doc-item folder';
      folderLi.innerHTML = `
        <span class="doc-item-title">📁 ${this.escapeHtml(folder.title)}</span>
        <button class="btn btn-ghost btn-sm add-child-btn" style="padding:1px 6px; font-size:0.7rem;" title="Добавить главу в папку">+</button>
      `;
      folderLi.querySelector('.add-child-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.createNewDocument(folder.id);
      });
      this.docListEl.appendChild(folderLi);

      // Nested chapters inside this folder
      const childDocs = projectDocs.filter(d => d.parentId === folder.id);
      childDocs.forEach(child => {
        const childLi = document.createElement('li');
        childLi.className = `doc-item nested ${this.currentDoc && this.currentDoc.id === child.id ? 'active' : ''}`;
        childLi.innerHTML = `
          <span class="doc-item-title">📄 ${this.escapeHtml(child.title || 'Без названия')}</span>
          <span class="doc-item-meta">${StatsEngine.countWords(child.content)} сл.</span>
        `;
        childLi.addEventListener('click', () => this.openDocument(child));
        this.docListEl.appendChild(childLi);
      });
    });

    // Root chapters
    rootChapters.forEach(doc => {
      const li = document.createElement('li');
      li.className = `doc-item ${this.currentDoc && this.currentDoc.id === doc.id ? 'active' : ''}`;
      li.innerHTML = `
        <span class="doc-item-title">📄 ${this.escapeHtml(doc.title || 'Без названия')}</span>
        <span class="doc-item-meta">${StatsEngine.countWords(doc.content)} сл.</span>
      `;
      li.addEventListener('click', () => this.openDocument(doc));
      this.docListEl.appendChild(li);
    });
  }

  openDocument(doc) {
    if (doc.isFolder) return;
    this.currentDoc = doc;
    storage.setActiveDocId(doc.id);
    this.docTitleInput.value = doc.title || 'Без названия';
    this.editor.loadDocument(doc);
    this.renderDocList();
    this.updateSyncStatus('synced', 'Сохранено');
  }

  async createNewDocument(parentId = null) {
    const projectDocs = this.documents.filter(d => d.projectId === this.currentProject.id && !d.isFolder);
    const newDoc = {
      id: `doc_${Date.now()}`,
      projectId: this.currentProject.id,
      parentId: parentId,
      isFolder: false,
      title: `Глава ${projectDocs.length + 1}`,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.saveDocument(newDoc);
    this.documents.push(newDoc);
    this.openDocument(newDoc);
  }

  async createNewFolder() {
    const title = prompt('Название новой папки / части (например: «Часть II. Зима»):');
    if (!title || !title.trim()) return;

    const newFolder = {
      id: `folder_${Date.now()}`,
      projectId: this.currentProject.id,
      parentId: null,
      isFolder: true,
      title: title.trim(),
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.saveDocument(newFolder);
    this.documents.push(newFolder);
    this.renderDocList();
  }

  // --- Projects Switcher & Manager ---

  renderProjectsList() {
    if (!this.projectsList) return;
    this.projectsList.innerHTML = '';

    this.projects.forEach(proj => {
      const projDocs = this.documents.filter(d => d.projectId === proj.id && !d.isFolder);
      const totalWords = projDocs.reduce((sum, d) => sum + StatsEngine.countWords(d.content), 0);
      const isActive = this.currentProject && this.currentProject.id === proj.id;

      const li = document.createElement('li');
      li.className = `doc-item ${isActive ? 'active' : ''}`;
      li.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px; flex:1;">
          <strong style="font-size:0.92rem; color:var(--text-primary);">${this.escapeHtml(proj.title)}</strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">${projDocs.length} глав • ${totalWords.toLocaleString()} слов</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-ghost btn-sm select-proj-btn" style="font-size:0.76rem;">${isActive ? '✓ Активно' : 'Перейти'}</button>
          ${this.projects.length > 1 ? '<button class="btn btn-ghost btn-sm del-proj-btn" style="color:var(--accent-primary); font-size:0.76rem;">✕</button>' : ''}
        </div>
      `;

      li.querySelector('.select-proj-btn').addEventListener('click', () => {
        this.switchProject(proj.id);
        this.closeAllModals();
      });

      const delBtn = li.querySelector('.del-proj-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Удалить произведение «${proj.title}» и все его главы?`)) {
            this.deleteProject(proj.id);
          }
        });
      }

      this.projectsList.appendChild(li);
    });
  }

  async switchProject(projId) {
    const target = this.projects.find(p => p.id === projId);
    if (!target) return;

    this.currentProject = target;
    storage.setActiveProjectId(target.id);
    if (this.projectCurrentTitle) {
      this.projectCurrentTitle.textContent = target.title;
    }

    this.renderDocList();
    const projectDocs = this.documents.filter(d => d.projectId === target.id && !d.isFolder);
    if (projectDocs.length > 0) {
      this.openDocument(projectDocs[0]);
    } else {
      await this.createNewDocument();
    }
    this.updateStatsUI();
  }

  async createNewProject(title) {
    if (!title || !title.trim()) return;
    const newProj = {
      id: `proj_${Date.now()}`,
      title: title.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.saveProject(newProj);
    this.projects.push(newProj);
    await this.switchProject(newProj.id);
    this.renderProjectsList();
  }

  deleteProject(projId) {
    this.projects = storage.deleteProject(projId);
    this.documents = this.documents.filter(d => d.projectId !== projId);
    this.switchProject(this.projects[0].id);
    this.renderProjectsList();
  }

  // --- Full Manuscript Compiler / Exporter ---

  exportFullBook() {
    if (!this.currentProject) return;

    const projectDocs = this.documents.filter(d => d.projectId === this.currentProject.id && !d.isFolder);
    
    let compiled = `# ${this.currentProject.title}\n\n`;
    compiled += `*Скомпилировано из редактора WordMagic: ${new Date().toLocaleDateString('ru-RU')}*\n\n`;
    compiled += `---\n\n`;

    projectDocs.forEach((doc, idx) => {
      compiled += `## ${doc.title || `Глава ${idx + 1}`}\n\n`;
      compiled += `${doc.content || ''}\n\n`;
      compiled += `---\n\n`;
    });

    const filename = `${this.currentProject.title.replace(/[\\/*?:"<>|]/g, '_')}_Рукопись.md`;
    this.downloadFile(filename, compiled, 'text/markdown');
  }

  handleContentChange(content, isInitial = false) {
    if (!this.currentDoc) return;
    this.currentDoc.content = content;

    // Update Status HUD
    const metrics = StatsEngine.getDetailedMetrics(content);
    const minSuffix = i18n.lang === 'en' ? 'min' : 'мин';
    const sentSuffix = i18n.lang === 'en' ? 'w/s' : 'сл/пр';
    this.hudWords.textContent = metrics.words.toLocaleString();
    this.hudChars.textContent = metrics.characters.toLocaleString();
    this.hudReadingTime.textContent = `${metrics.readingTimeMinutes} ${minSuffix}`;
    this.hudSentences.textContent = `${metrics.sentences} (${metrics.avgSentenceWords} ${sentSuffix})`;

    // Update Acro-Prose Stream
    if (this.acroConfig.enabled) {
      this.updateAcroPrompt(content);
    }

    if (isInitial) return;

    this.updateSyncStatus('unsaved', i18n.t('status_saving'));

    // Debounced Auto-Save
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      await storage.saveDocument(this.currentDoc);
      
      // Update Daily Log for Current Project
      if (this.currentProject) {
        const projectWords = this.getTotalProjectWords(this.currentProject.id);
        storage.updateDailyWordCount(this.currentProject.id, projectWords);
      }

      this.updateSyncStatus('synced', i18n.t('status_saved'));
      this.renderDocList();

      // Cloud Firestore Auto-Sync (if logged in)
      if (firebaseService.currentUser) {
        firebaseService.syncWithFirestore().catch(e => console.warn('[Firebase AutoSync]', e));
      }
    }, 1200);
  }

  getTotalProjectWords(projectId = null) {
    const targetProjId = projectId || (this.currentProject ? this.currentProject.id : null);
    if (!targetProjId) return 0;

    return this.documents
      .filter(d => d.projectId === targetProjId && !d.isFolder)
      .reduce((sum, d) => {
        if (this.currentDoc && d.id === this.currentDoc.id) {
          return sum + StatsEngine.countWords(this.currentDoc.content);
        }
        return sum + StatsEngine.countWords(d.content);
      }, 0);
  }

  getTotalAllProjectsWords() {
    return this.documents
      .filter(d => !d.isFolder)
      .reduce((sum, d) => {
        if (this.currentDoc && d.id === this.currentDoc.id) {
          return sum + StatsEngine.countWords(this.currentDoc.content);
        }
        return sum + StatsEngine.countWords(d.content);
      }, 0);
  }

  updateSyncStatus(state, text) {
    if (!this.syncStatusDot || !this.syncStatusText) return;
    this.syncStatusDot.className = `status-dot ${state}`;
    this.syncStatusText.textContent = text;
  }

  // --- Acro-Prose Ribbon & Stream Management ---

  getPrecedingAcroOffset() {
    if (!this.currentProject || !this.currentDoc || this.acroConfig.scope !== 'project') {
      return 0;
    }

    const projectDocs = this.documents.filter(d => d.projectId === this.currentProject.id && !d.isFolder);
    const currentDocIdx = projectDocs.findIndex(d => d.id === this.currentDoc.id);
    if (currentDocIdx <= 0) return 0;

    let offset = 0;
    for (let i = 0; i < currentDocIdx; i++) {
      const prevDoc = projectDocs[i];
      const tokens = AcroEngine.extractAuthorTokens(prevDoc.content, this.acroConfig.trigger || 'words');
      offset += tokens.length;
    }

    return Math.min(offset, this.acroTargetStream.length);
  }

  updateAcroPrompt(authorText) {
    if (!this.acroRibbon || this.acroTargetStream.length === 0) return;

    const startOffset = this.getPrecedingAcroOffset();
    const evaluation = AcroEngine.evaluateState(authorText, this.acroTargetStream, this.acroConfig, startOffset);

    // Update Ribbon Source Title & Progress Pill
    const srcTitleEl = document.getElementById('acroSourceBadgeTitle');
    if (srcTitleEl) {
      srcTitleEl.textContent = `Источник: «${this.acroConfig.sourceTitle || 'Текст'}»`;
    }

    const progressPill = document.getElementById('acroProgressPill');
    if (progressPill) {
      progressPill.textContent = `📍 ${evaluation.currentIndex} / ${this.acroTargetStream.length} (${evaluation.progressPct}%)`;
    }

    // Update Streak & Accuracy
    if (this.acroStreakVal) {
      this.acroStreakVal.textContent = `🔥 ${evaluation.currentStreak} подряд (${evaluation.accuracy}%)`;
    }

    // Play subtle visual match trigger if advanced
    if (evaluation.currentIndex > this.lastAcroIndex && this.lastAcroIndex !== -1) {
      const lastToken = evaluation.evaluatedTokens[evaluation.evaluatedTokens.length - 1];
      if (lastToken) {
        if (lastToken.matchType === 'exact') {
          this.editorTextarea.classList.add('flash-success');
          setTimeout(() => this.editorTextarea.classList.remove('flash-success'), 600);
        } else if (lastToken.matchType === 'phonetic') {
          this.editorTextarea.classList.add('flash-phonetic');
          setTimeout(() => this.editorTextarea.classList.remove('flash-phonetic'), 600);
        }
      }
    }
    this.lastAcroIndex = evaluation.currentIndex;

    // Render Tape
    this.renderAcroTape(evaluation.tape);
  }

  renderAcroTape(tape) {
    if (!this.acroLetterTrack) return;
    this.acroLetterTrack.innerHTML = '';

    if (!tape || tape.length === 0) {
      this.acroLetterTrack.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Текст источника завершён!</span>';
      return;
    }

    tape.forEach(item => {
      const pill = document.createElement('div');
      pill.className = `acro-char-pill ${item.role}`;
      pill.textContent = item.char;
      if (item.role === 'current') {
        pill.title = `Следующее слово должно начинаться на букву: ${item.char}`;
      }
      this.acroLetterTrack.appendChild(pill);
    });
  }

  populateAcroModal() {
    const srcInput = document.getElementById('acroSourceInput');
    const modeSel = document.getElementById('acroModeSelect');
    const scopeSel = document.getElementById('acroScopeSelect');
    if (srcInput) srcInput.value = this.acroConfig.sourceText || '';
    if (modeSel) modeSel.value = this.acroConfig.mode || 'strict';
    if (scopeSel) scopeSel.value = this.acroConfig.scope || 'project';

    // Update Live Progress Stats in Modal
    const totalChars = this.acroTargetStream.length;
    const startOffset = this.getPrecedingAcroOffset();
    const currentTokens = this.currentDoc ? AcroEngine.extractAuthorTokens(this.currentDoc.content, this.acroConfig.trigger || 'words').length : 0;
    const totalDone = Math.min(totalChars, startOffset + currentTokens);
    const remaining = Math.max(0, totalChars - totalDone);
    const pct = totalChars > 0 ? Math.min(100, Math.round((totalDone / totalChars) * 100)) : 0;

    const titleDisp = document.getElementById('acroModalTitleDisplay');
    if (titleDisp) titleDisp.textContent = `«${this.acroConfig.sourceTitle || 'Текст-источник'}»`;

    const pctDisp = document.getElementById('acroModalPercentDisplay');
    if (pctDisp) pctDisp.textContent = `${pct}%`;

    const progFill = document.getElementById('acroModalProgressFill');
    if (progFill) progFill.style.width = `${pct}%`;

    const statTot = document.getElementById('acroStatTotal');
    if (statTot) statTot.textContent = totalChars.toLocaleString();

    const statProj = document.getElementById('acroStatProjectDone');
    if (statProj) statProj.textContent = totalDone.toLocaleString();

    const statChap = document.getElementById('acroStatChapterDone');
    if (statChap) statChap.textContent = currentTokens.toLocaleString();

    const statRem = document.getElementById('acroStatRemaining');
    if (statRem) statRem.textContent = remaining.toLocaleString();
  }

  // --- 7-Day Stats & 52-Week Extrapolation Dashboard ---

  updateStatsUI() {
    const lang = i18n.lang;
    const scopeSelect = document.getElementById('statsProjectScopeSelect');
    const isGlobal = scopeSelect && scopeSelect.value === 'all';
    
    const scopeBadge = document.getElementById('statsScopeBadge');
    const sevenDayTitle = document.getElementById('sevenDayTitle');

    let totalWords = 0;
    let dailyLogs = {};

    if (!isGlobal && this.currentProject) {
      totalWords = this.getTotalProjectWords(this.currentProject.id);
      dailyLogs = storage.getDailyLogs(this.currentProject.id);
      const scopeText = lang === 'en' ? `Book: "${this.currentProject.title}"` : `Книга: «${this.currentProject.title}»`;
      if (scopeBadge) scopeBadge.textContent = `${scopeText} (${totalWords.toLocaleString()} ${i18n.t('status_words')})`;
      if (sevenDayTitle) sevenDayTitle.textContent = lang === 'en' 
        ? `7-Day Dynamics for "${this.currentProject.title}"` 
        : `Динамика книги «${this.currentProject.title}» за 7 дней`;
    } else {
      totalWords = this.getTotalAllProjectsWords();
      // Aggregate across all projects
      const allProjLogs = storage.getDailyLogs();
      Object.keys(allProjLogs).forEach(pId => {
        const pLogs = allProjLogs[pId];
        Object.keys(pLogs).forEach(dateStr => {
          if (!dailyLogs[dateStr]) {
            dailyLogs[dateStr] = {
              date: dateStr,
              startWords: 0,
              endWords: 0,
              netWords: 0
            };
          }
          dailyLogs[dateStr].startWords += (pLogs[dateStr].startWords || 0);
          dailyLogs[dateStr].endWords += (pLogs[dateStr].endWords || 0);
          dailyLogs[dateStr].netWords += (pLogs[dateStr].netWords || 0);
        });
      });
      const allText = lang === 'en' ? 'All Author Manuscripts' : 'Все произведения автора';
      if (scopeBadge) scopeBadge.textContent = `${allText} (${totalWords.toLocaleString()} ${i18n.t('status_words')})`;
      if (sevenDayTitle) sevenDayTitle.textContent = lang === 'en' 
        ? 'All Manuscripts 7-Day Dynamics' 
        : 'Общая авторская динамика за 7 дней (все книги)';
    }

    const sevenDays = StatsEngine.getSevenDaySummary(dailyLogs, totalWords, lang);

    // 1. Render 7-Day Grid
    if (this.sevenDayGrid) {
      this.sevenDayGrid.innerHTML = '';
      sevenDays.forEach(day => {
        const card = document.createElement('div');
        card.className = `day-stat-card ${day.isToday ? 'today' : ''}`;
        card.innerHTML = `
          <div class="day-card-name">${day.dayName}</div>
          <div class="day-card-date">${day.formattedDate}</div>
          <div class="day-card-delta ${day.netWords > 0 ? 'positive' : ''}">+${day.netWords.toLocaleString()}</div>
          <div class="day-card-meta">
            <span>${i18n.t('day_start')} ${day.startWords.toLocaleString()}</span>
            <span>${i18n.t('day_end')} ${day.endWords.toLocaleString()}</span>
          </div>
        `;
        this.sevenDayGrid.appendChild(card);
      });
    }

    // 2. Pace & 52-Week Extrapolation
    const multiplier = parseFloat(this.paceMultiplierSlider ? this.paceMultiplierSlider.value : '1.0');
    let dailyPace = StatsEngine.calculateDailyPace(sevenDays, 500);
    dailyPace = Math.round(dailyPace * multiplier);

    if (this.paceMultiplierVal) {
      this.paceMultiplierVal.textContent = `${dailyPace.toLocaleString()} ${i18n.t('pace_words_per_day')}`;
    }

    const projection = StatsEngine.get52WeekProjection(totalWords, dailyPace);

    // 3. Render 5 Motivational Masterpiece Benchmarks
    const bookEstimates = BenchmarkCalculator.calculateEstimates(totalWords, dailyPace, lang);
    if (this.benchmarksList) {
      this.benchmarksList.innerHTML = '';
      bookEstimates.slice(0, 5).forEach(book => {
        const card = document.createElement('div');
        card.className = 'benchmark-card';
        const wordsUnit = i18n.t('status_words');
        const remSuffix = lang === 'en' ? 'remaining' : 'осталось';
        card.innerHTML = `
          <div class="benchmark-info">
            <div class="benchmark-title">${book.displayTitle || book.title}</div>
            <div class="benchmark-author">${book.displayAuthor || book.author} • <span class="benchmark-words">${book.words.toLocaleString()} ${wordsUnit}</span></div>
          </div>
          <div class="benchmark-progress-wrap">
            <div class="benchmark-progress-track">
              <div class="benchmark-progress-fill" style="width: ${book.percentage}%;"></div>
            </div>
          </div>
          <div class="benchmark-estimate">
            <div class="estimate-time">${book.formattedTime}</div>
            <div class="estimate-sub">${book.percentage}% (${(book.remainingWords).toLocaleString()} ${wordsUnit} ${remSuffix})</div>
          </div>
        `;
        this.benchmarksList.appendChild(card);
      });
    }

    // 4. Render 52-Week Projection Canvas Chart
    if (this.extrapolationCanvas) {
      StatsEngine.renderProjectionChart(this.extrapolationCanvas, projection, bookEstimates.slice(0, 5), lang);
    }
  }

  // --- Firebase Cloud Authentication & Firestore Sync ---

  initFirebaseListeners() {
    firebaseService.onAuthChange((user) => {
      this.updateFirebaseAuthUI(user);
    });
  }

  updateFirebaseAuthUI(user) {
    const headerBtn = document.getElementById('firebaseAuthHeaderBtn');
    const headerLabel = document.getElementById('firebaseHeaderLabel');
    const authDot = document.getElementById('firebaseAuthDot');
    const statusText = document.getElementById('firebaseUserStatusText');
    const authControls = document.getElementById('firebaseAuthControls');
    const logoutBtn = document.getElementById('firebaseLogoutBtn');

    if (user) {
      const name = user.displayName || (user.isAnonymous ? 'Гостевой автор' : user.email) || 'Автор';
      if (headerLabel) headerLabel.textContent = `👤 ${name.split(' ')[0]}`;
      if (headerBtn) headerBtn.title = `Аккаунт: ${name} (Синхронизировано с Firebase)`;
      if (authDot) authDot.className = 'status-dot synced';
      if (statusText) statusText.innerHTML = `В сети: <strong>${this.escapeHtml(name)}</strong> (${this.escapeHtml(user.email || 'Cloud Firestore')})`;
      if (authControls) authControls.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    } else {
      if (headerLabel) headerLabel.textContent = 'Войти в Облако';
      if (headerBtn) headerBtn.title = 'Синхронизация с аккаунтом Firebase';
      if (authDot) authDot.className = 'status-dot';
      if (statusText) statusText.textContent = 'Вы не авторизованы (данные сохраняются локально на этом устройстве)';
      if (authControls) authControls.style.display = 'flex';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }

  async handleFirebaseManualSync() {
    if (!firebaseService.currentUser) {
      alert('Сначала войдите в аккаунт через Google или Гостевой вход!');
      return;
    }

    const syncBtn = document.getElementById('firebaseManualSyncBtn');
    const statusText = document.getElementById('firebaseUserStatusText');

    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.textContent = 'Синхронизация...';
    }

    try {
      const result = await firebaseService.syncWithFirestore((msg) => {
        if (statusText) statusText.textContent = msg;
      });

      if (result.success) {
        await this.loadProjectsAndDocuments();
        this.updateStatsUI();
        this.updateFirebaseAuthUI(firebaseService.currentUser);
        alert('Успешно! Все книги, главы и статистика синхронизированы с Google Cloud Firestore.');
      }
    } catch (err) {
      alert(`Ошибка синхронизации с Firebase: ${err.message}`);
    } finally {
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.textContent = '🔄 Синхронизировать с Firebase';
      }
    }
  }

  // --- Server Synchronization Operations ---

  async handleTestServerConnection() {
    const url = document.getElementById('serverUrlInput').value.trim();
    const key = document.getElementById('serverKeyInput').value.trim();
    const statusText = document.getElementById('serverSyncStatusText');

    if (!url) {
      alert('Пожалуйста, укажите URL сервера (например: http://localhost:8080)');
      return;
    }

    if (statusText) statusText.textContent = 'Проверка связи...';

    try {
      const res = await SyncEngine.testConnection(url, key);
      alert('Успешно! Связь с сервером WordMagic установлена.');
      if (statusText) statusText.textContent = 'Связь с сервером активна (OK)';
    } catch (e) {
      alert(`Ошибка связи: ${e.message}`);
      if (statusText) statusText.textContent = `Ошибка: ${e.message}`;
    }
  }

  async handleSyncNow(silent = false) {
    const urlInput = document.getElementById('serverUrlInput');
    const keyInput = document.getElementById('serverKeyInput');
    const autoSyncCheck = document.getElementById('serverAutoSyncCheckbox');
    const statusText = document.getElementById('serverSyncStatusText');
    const syncBtn = document.getElementById('syncNowBtn');

    const url = urlInput ? urlInput.value.trim() : (this.serverConfig.serverUrl || '');
    const key = keyInput ? keyInput.value.trim() : (this.serverConfig.syncKey || '');
    const autoSync = autoSyncCheck ? autoSyncCheck.checked : this.serverConfig.autoSync;

    if (!url) {
      if (!silent) alert('Пожалуйста, укажите URL сервера в настройках синхронизации.');
      return;
    }

    // Save config
    this.serverConfig = {
      serverUrl: url,
      syncKey: key,
      autoSync: autoSync,
      lastSyncTime: this.serverConfig.lastSyncTime || 0
    };
    storage.saveServerConfig(this.serverConfig);

    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.textContent = 'Синхронизация...';
    }

    try {
      const result = await SyncEngine.sync({
        serverUrl: url,
        syncKey: key,
        lastSyncTime: this.serverConfig.lastSyncTime,
        onProgress: (msg) => {
          if (statusText) statusText.textContent = msg;
        }
      });

      if (result.success) {
        this.serverConfig.lastSyncTime = result.serverTime;
        storage.saveServerConfig(this.serverConfig);

        const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        if (statusText) statusText.textContent = `Синхронизировано в ${timeStr} (Получено глав: ${result.pulledDocs})`;

        // Reload data into UI
        await this.loadProjectsAndDocuments();
        this.updateStatsUI();

        if (!silent) {
          alert(`Синхронизация с сервером успешно завершена!\nОбновлено на сервере и локально.`);
        }
      }
    } catch (e) {
      if (statusText) statusText.textContent = `Ошибка синхронизации: ${e.message}`;
      if (!silent) alert(`Ошибка синхронизации: ${e.message}`);
    } finally {
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.textContent = '🔄 Синхронизировать сейчас';
      }
    }
  }

  startAutoSyncWatcher() {
    // Check auto sync every 60 seconds
    setInterval(() => {
      if (this.serverConfig && this.serverConfig.serverUrl && this.serverConfig.autoSync) {
        this.handleSyncNow(true);
      }
    }, 60000);
  }

  // --- Git & GitHub Sync Operations ---

  async refreshGitTimeline() {
    if (!this.gitTimelineList || !this.currentDoc) return;
    this.gitTimelineList.innerHTML = '<li class="timeline-entry"><span style="color:var(--text-muted);">Загрузка истории...</span></li>';

    // 1. Fetch Local Revisions
    const localRevisions = await storage.getRevisions(this.currentDoc.id);

    // 2. Fetch Remote GitHub Commits if configured
    let remoteCommits = [];
    if (this.githubConfig.token && this.githubConfig.repo) {
      remoteCommits = await GitEngine.fetchGitHubCommits(this.githubConfig);
    }

    this.gitTimelineList.innerHTML = '';

    if (localRevisions.length === 0 && remoteCommits.length === 0) {
      this.gitTimelineList.innerHTML = '<li class="diff-empty-state">Нет сохраненных ревизий. Создайте первый снапшот или коммит!</li>';
      return;
    }

    // Render Local Snapshots
    localRevisions.forEach(rev => {
      const li = document.createElement('li');
      li.className = 'timeline-entry';
      li.innerHTML = `
        <div class="timeline-entry-header">
          <span class="timeline-commit-msg">${this.escapeHtml(rev.message)}</span>
          <span class="timeline-badge">Local Git Snapshot</span>
        </div>
        <div class="timeline-entry-footer">
          <span class="timeline-words-count">${rev.wordCount} слов</span>
          <span>${new Date(rev.timestamp).toLocaleString('ru-RU')}</span>
          <div class="timeline-actions">
            <button class="btn btn-ghost btn-sm diff-btn" style="font-size:0.75rem; padding:2px 8px;">Сравнить Diff</button>
            <button class="btn btn-ghost btn-sm rollback-btn" style="font-size:0.75rem; padding:2px 8px; color:var(--accent-primary);">Откатить</button>
          </div>
        </div>
      `;

      li.querySelector('.diff-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.showDiff(rev.content, this.currentDoc.content, rev.message);
      });

      li.querySelector('.rollback-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Восстановить версию от ${new Date(rev.timestamp).toLocaleString('ru-RU')}?`)) {
          this.editor.setContent(rev.content);
          this.closeAllModals();
        }
      });

      this.gitTimelineList.appendChild(li);
    });
  }

  showDiff(oldText, newText, title) {
    if (!this.diffContainer) return;
    const diffLines = GitEngine.computeDiff(oldText, newText);

    this.diffContainer.innerHTML = '';
    const header = document.createElement('div');
    header.style.marginBottom = '8px';
    header.style.fontWeight = '700';
    header.style.color = 'var(--text-primary)';
    header.textContent = `Различия: [${title}] ➔ [Текущий черновик]`;
    this.diffContainer.appendChild(header);

    diffLines.forEach(line => {
      const span = document.createElement('span');
      if (line.type === 'add') span.className = 'diff-line-add';
      else if (line.type === 'del') span.className = 'diff-line-del';
      else span.className = 'diff-line-same';
      span.textContent = line.text;
      this.diffContainer.appendChild(span);
    });
  }

  async handleGitHubPush() {
    if (!this.currentDoc) return;
    const msg = this.commitMessageInput ? this.commitMessageInput.value : '';

    this.pushGitHubBtn.disabled = true;
    this.pushGitHubBtn.textContent = 'Отправка в GitHub...';

    try {
      const result = await GitEngine.pushToGitHub({
        token: this.githubConfig.token,
        repo: this.githubConfig.repo,
        branch: this.githubConfig.branch || 'main',
        path: this.githubConfig.path || `${this.currentDoc.title || 'prose'}.md`,
        content: this.currentDoc.content,
        message: msg
      });

      alert(`Успешно запушено в GitHub!\nCommit SHA: ${result.commitSha}`);
      await storage.saveRevision(this.currentDoc.id, `GitHub: ${msg || 'Коммит'}`, this.currentDoc.content, StatsEngine.countWords(this.currentDoc.content));
      if (this.commitMessageInput) this.commitMessageInput.value = '';
      this.refreshGitTimeline();
    } catch (err) {
      alert(`Ошибка при отправке в GitHub: ${err.message}`);
    } finally {
      this.pushGitHubBtn.disabled = false;
      this.pushGitHubBtn.textContent = 'Коммит и Пуш в GitHub';
    }
  }

  async handleCreateLocalSnapshot() {
    if (!this.currentDoc) return;
    const msg = this.commitMessageInput ? this.commitMessageInput.value.trim() : '';
    const wordCount = StatsEngine.countWords(this.currentDoc.content);
    await storage.saveRevision(this.currentDoc.id, msg || `Ручной снапшот (${wordCount} сл.)`, this.currentDoc.content, wordCount);
    if (this.commitMessageInput) this.commitMessageInput.value = '';
    this.refreshGitTimeline();
  }

  // --- Events & UI Binding ---

  bindEvents() {
    // Document Title Input
    this.docTitleInput.addEventListener('input', () => {
      if (this.currentDoc) {
        this.currentDoc.title = this.docTitleInput.value;
        this.renderDocList();
        storage.saveDocument(this.currentDoc);
      }
    });

    // New Document & Folder
    this.newDocBtn.addEventListener('click', () => this.createNewDocument());
    if (this.newFolderBtn) {
      this.newFolderBtn.addEventListener('click', () => this.createNewFolder());
    }

    // Projects Modal triggers
    if (this.projectSwitcherBtn) {
      this.projectSwitcherBtn.addEventListener('click', () => {
        this.renderProjectsList();
        this.openModal(this.projectsModal);
      });
    }
    if (this.openProjectsModalBtn) {
      this.openProjectsModalBtn.addEventListener('click', () => {
        this.renderProjectsList();
        this.openModal(this.projectsModal);
      });
    }
    if (this.createNewProjectBtn) {
      this.createNewProjectBtn.addEventListener('click', () => {
        const title = this.newProjectTitleInput.value.trim();
        if (title) {
          this.createNewProject(title);
          this.newProjectTitleInput.value = '';
          this.closeAllModals();
        }
      });
    }
    if (this.exportFullBookBtn) {
      this.exportFullBookBtn.addEventListener('click', () => {
        this.exportFullBook();
      });
    }

    // Sidebar Toggle
    this.toggleSidebarBtn.addEventListener('click', () => {
      this.sidebarEl.classList.toggle('collapsed');
    });

    // Zen Mode
    this.zenToggleBtn.addEventListener('click', () => this.toggleZenMode());
    this.zenExitBtn.addEventListener('click', () => this.toggleZenMode(false));

    // Floating Tools
    this.toolTypewriter.addEventListener('click', () => {
      this.settings.typewriter = !this.settings.typewriter;
      this.toolTypewriter.classList.toggle('active', this.settings.typewriter);
      this.editor.setTypewriterMode(this.settings.typewriter);
      storage.saveSettings(this.settings);
    });

    this.toolFocus.addEventListener('click', () => {
      this.settings.paragraphFocus = !this.settings.paragraphFocus;
      this.toolFocus.classList.toggle('active', this.settings.paragraphFocus);
      this.editor.setParagraphFocusMode(this.settings.paragraphFocus);
      storage.saveSettings(this.settings);
    });

    // Theme & Font Pickers
    this.themeSelect.addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
      storage.saveSettings(this.settings);
      this.applySettings();
      if (this.statsModal.classList.contains('open')) {
        this.updateStatsUI();
      }
    });

    this.fontSelect.addEventListener('change', (e) => {
      this.settings.font = e.target.value;
      storage.saveSettings(this.settings);
      this.applySettings();
    });

    // Acro Mode Toggle from Ribbon
    this.acroModePill.addEventListener('click', () => {
      this.acroConfig.mode = this.acroConfig.mode === 'strict' ? 'phonetic' : 'strict';
      storage.saveAcroConfig(this.acroConfig);
      this.updateAcroModeBadge();
      this.updateAcroPrompt(this.editor.getContent());
    });

    this.toggleAcroRibbonBtn.addEventListener('click', () => {
      this.acroConfig.enabled = !this.acroConfig.enabled;
      this.acroRibbon.classList.toggle('hidden', !this.acroConfig.enabled);
      storage.saveAcroConfig(this.acroConfig);
      if (this.acroConfig.enabled) {
        this.updateAcroPrompt(this.editor.getContent());
      }
    });

    // Pace Slider in Stats
    if (this.paceMultiplierSlider) {
      this.paceMultiplierSlider.addEventListener('input', () => {
        this.updateStatsUI();
      });
    }

    // Stats Project Scope Selector (Current Book vs All Books)
    const statsScopeSelect = document.getElementById('statsProjectScopeSelect');
    if (statsScopeSelect) {
      statsScopeSelect.addEventListener('change', () => {
        this.updateStatsUI();
      });
    }

    // Firebase UI Actions
    const fbHeaderBtn = document.getElementById('firebaseAuthHeaderBtn');
    if (fbHeaderBtn) {
      fbHeaderBtn.addEventListener('click', () => {
        this.populateGitModal();
        this.openModal(this.gitModal);
      });
    }

    const fbGoogleBtn = document.getElementById('firebaseGoogleLoginBtn');
    if (fbGoogleBtn) {
      fbGoogleBtn.addEventListener('click', async () => {
        try {
          await firebaseService.signInWithGoogle();
        } catch (err) {
          alert(`Не удалось войти через Google: ${err.message}`);
        }
      });
    }

    const fbGuestBtn = document.getElementById('firebaseGuestLoginBtn');
    if (fbGuestBtn) {
      fbGuestBtn.addEventListener('click', async () => {
        try {
          await firebaseService.signInAsGuest();
        } catch (err) {
          alert(`Не удалось выполнить гостевой вход: ${err.message}`);
        }
      });
    }

    const fbLogoutBtn = document.getElementById('firebaseLogoutBtn');
    if (fbLogoutBtn) {
      fbLogoutBtn.addEventListener('click', async () => {
        if (confirm('Выйти из аккаунта Firebase?')) {
          await firebaseService.logOut();
        }
      });
    }

    const fbSyncBtn = document.getElementById('firebaseManualSyncBtn');
    if (fbSyncBtn) {
      fbSyncBtn.addEventListener('click', () => this.handleFirebaseManualSync());
    }

    // Server Sync Actions
    const syncBtn = document.getElementById('syncNowBtn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.handleSyncNow(false));
    }
    const testConnBtn = document.getElementById('testServerConnBtn');
    if (testConnBtn) {
      testConnBtn.addEventListener('click', () => this.handleTestServerConnection());
    }

    // Git Actions
    if (this.pushGitHubBtn) {
      this.pushGitHubBtn.addEventListener('click', () => this.handleGitHubPush());
    }
    if (this.createLocalSnapshotBtn) {
      this.createLocalSnapshotBtn.addEventListener('click', () => this.handleCreateLocalSnapshot());
    }
    if (this.saveGhConfigBtn) {
      this.saveGhConfigBtn.addEventListener('click', () => {
        this.githubConfig = {
          token: this.ghTokenInput.value.trim(),
          repo: this.ghRepoInput.value.trim(),
          branch: this.ghBranchInput.value.trim() || 'main',
          path: this.ghPathInput.value.trim() || 'prose.md'
        };
        storage.saveGitHubConfig(this.githubConfig);
        alert('Настройки GitHub успешно сохранены!');
        this.refreshGitTimeline();
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.handleManualSave();
      }
      if (e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.toggleZenMode();
      }
    });
  }

  handleManualSave() {
    if (!this.currentDoc) return;
    storage.saveDocument(this.currentDoc);
    const wordCount = StatsEngine.countWords(this.currentDoc.content);
    storage.saveRevision(this.currentDoc.id, `Авто-сохранение (${wordCount} сл.)`, this.currentDoc.content, wordCount);
    this.updateSyncStatus('synced', 'Сохранено вручную');
  }

  toggleZenMode(forceState) {
    const isZen = forceState !== undefined ? forceState : !document.body.classList.contains('zen-mode');
    document.body.classList.toggle('zen-mode', isZen);
  }

  bindModals() {
    // Stats Modal
    this.openStatsBtn.addEventListener('click', () => {
      this.openModal(this.statsModal);
      this.updateStatsUI();
    });

    // Acro Modal Triggers
    const openAcro = () => {
      this.populateAcroModal();
      this.openModal(this.acroModal);
    };

    if (this.openAcroModalBtn) this.openAcroModalBtn.addEventListener('click', openAcro);
    const quickBtn = document.getElementById('acroSourceQuickBtn');
    if (quickBtn) quickBtn.addEventListener('click', openAcro);
    const progPill = document.getElementById('acroProgressPill');
    if (progPill) progPill.addEventListener('click', openAcro);

    // Acro File Upload
    const uploadBtn = document.getElementById('acroUploadFileBtn');
    const fileInput = document.getElementById('acroFileInput');
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            document.getElementById('acroSourceInput').value = evt.target.result;
            this.acroConfig.sourceTitle = file.name;
          };
          reader.readAsText(file);
        }
      });
    }

    // Git Modal
    this.openGitBtn.addEventListener('click', () => {
      this.populateGitModal();
      this.openModal(this.gitModal);
      this.refreshGitTimeline();
    });

    // Export Modal
    this.openExportBtn.addEventListener('click', () => {
      this.openModal(this.exportModal);
    });

    // Close buttons & Backdrop clicks
    document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          this.closeAllModals();
        }
      });
    });

    // Acro Preset Buttons inside Modal
    const presetsContainer = document.getElementById('acroPresetsList');
    if (presetsContainer) {
      presetsContainer.innerHTML = '';
      ACRO_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost btn-sm';
        btn.style.textAlign = 'left';
        btn.style.fontSize = '0.8rem';
        btn.textContent = preset.title;
        btn.addEventListener('click', () => {
          document.getElementById('acroSourceInput').value = preset.text;
          this.acroConfig.sourceTitle = preset.title;
        });
        presetsContainer.appendChild(btn);
      });
    }

    // Save Acro Config inside Modal
    const saveAcroBtn = document.getElementById('saveAcroSettingsBtn');
    if (saveAcroBtn) {
      saveAcroBtn.addEventListener('click', () => {
        const sourceText = document.getElementById('acroSourceInput').value;
        const mode = document.getElementById('acroModeSelect').value;
        const scope = document.getElementById('acroScopeSelect').value;

        this.acroConfig.sourceText = sourceText;
        this.acroConfig.mode = mode;
        this.acroConfig.scope = scope;
        this.acroConfig.enabled = true;

        if (!this.acroConfig.sourceTitle || this.acroConfig.sourceTitle === 'Текст') {
          this.acroConfig.sourceTitle = sourceText.slice(0, 24).replace(/\n/g, ' ') + '...';
        }

        storage.saveAcroConfig(this.acroConfig);
        this.initAcroStream();
        this.acroRibbon.classList.remove('hidden');
        this.updateAcroPrompt(this.editor.getContent());
        this.closeAllModals();
      });
    }

    // Export format buttons
    this.bindExportActions();
  }

  populateAcroModal() {
    const srcInput = document.getElementById('acroSourceInput');
    const modeSel = document.getElementById('acroModeSelect');
    const trigSel = document.getElementById('acroTriggerSelect');
    if (srcInput) srcInput.value = this.acroConfig.sourceText || '';
    if (modeSel) modeSel.value = this.acroConfig.mode || 'strict';
    if (trigSel) trigSel.value = this.acroConfig.trigger || 'words';
  }

  populateGitModal() {
    if (this.ghTokenInput) this.ghTokenInput.value = this.githubConfig.token || '';
    if (this.ghRepoInput) this.ghRepoInput.value = this.githubConfig.repo || '';
    if (this.ghBranchInput) this.ghBranchInput.value = this.githubConfig.branch || 'main';
    if (this.ghPathInput) this.ghPathInput.value = this.githubConfig.path || `${this.currentDoc ? this.currentDoc.title : 'prose'}.md`;

    // Server Config inputs
    const srvUrlInput = document.getElementById('serverUrlInput');
    const srvKeyInput = document.getElementById('serverKeyInput');
    const srvAutoCheck = document.getElementById('serverAutoSyncCheckbox');
    const srvStatus = document.getElementById('serverSyncStatusText');

    if (srvUrlInput) srvUrlInput.value = this.serverConfig.serverUrl || '';
    if (srvKeyInput) srvKeyInput.value = this.serverConfig.syncKey || '';
    if (srvAutoCheck) srvAutoCheck.checked = !!this.serverConfig.autoSync;
    if (srvStatus && this.serverConfig.lastSyncTime) {
      srvStatus.textContent = `Посл. синхронизация: ${new Date(this.serverConfig.lastSyncTime).toLocaleString('ru-RU')}`;
    }
  }

  bindExportActions() {
    // Download as Markdown
    const btnMd = document.getElementById('exportMdBtn');
    if (btnMd) {
      btnMd.addEventListener('click', () => {
        if (!this.currentDoc) return;
        this.downloadFile(`${this.currentDoc.title || 'prose'}.md`, this.currentDoc.content, 'text/markdown');
      });
    }

    // Download as Plain Text
    const btnTxt = document.getElementById('exportTxtBtn');
    if (btnTxt) {
      btnTxt.addEventListener('click', () => {
        if (!this.currentDoc) return;
        this.downloadFile(`${this.currentDoc.title || 'prose'}.txt`, this.currentDoc.content, 'text/plain');
      });
    }

    // Native File System API Save
    const btnFs = document.getElementById('exportFsBtn');
    if (btnFs) {
      btnFs.addEventListener('click', async () => {
        if (!this.currentDoc) return;
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: `${this.currentDoc.title || 'prose'}.md`,
              types: [{
                description: 'Markdown Document',
                accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] }
              }]
            });
            const writable = await handle.createWritable();
            await writable.write(this.currentDoc.content);
            await writable.close();
            alert('Файл успешно сохранен на ваш диск!');
          } catch (e) {
            console.warn('File save cancelled or failed', e);
          }
        } else {
          this.downloadFile(`${this.currentDoc.title || 'prose'}.md`, this.currentDoc.content, 'text/markdown');
        }
      });
    }

    // Copy to Clipboard
    const btnCopy = document.getElementById('exportCopyBtn');
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        if (!this.currentDoc) return;
        await navigator.clipboard.writeText(this.currentDoc.content);
        alert('Текст скопирован в буфер обмена!');
      });
    }
  }

  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  openModal(modalEl) {
    if (!modalEl) return;
    this.closeAllModals();
    modalEl.classList.add('open');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.wordMagic = new WordMagicApp();
});
