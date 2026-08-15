/**
 * WordMagic Storage Manager
 * Handles IndexedDB document persistence, LocalStorage settings, daily logs, and revision snapshots.
 */

const STORAGE_KEYS = {
  SETTINGS: 'wordmagic_settings',
  DAILY_LOGS: 'wordmagic_daily_logs',
  SNAPSHOTS: 'wordmagic_snapshots',
  GITHUB_CONFIG: 'wordmagic_github_config',
  SERVER_CONFIG: 'wordmagic_server_config',
  ACRO_CONFIG: 'wordmagic_acro_config',
  DOCUMENTS: 'wordmagic_documents_meta',
  PROJECTS: 'wordmagic_projects_list',
  ACTIVE_DOC_ID: 'wordmagic_active_doc_id',
  ACTIVE_PROJECT_ID: 'wordmagic_active_project_id'
};

const DEFAULT_PROJECT = {
  id: 'proj_default',
  title: 'Роман I (Основная рукопись)',
  description: 'Главное литературное произведение',
  createdAt: Date.now() - 86400000 * 5,
  updatedAt: Date.now()
};

const DEFAULT_SETTINGS = {
  theme: 'paper',          // 'paper' | 'dark' | 'sepia'
  font: 'literata',        // 'literata' | 'ptserif' | 'merriweather' | 'inter' | 'mono'
  fontSize: 'md',          // 'sm' | 'md' | 'lg'
  columnWidth: 'standard', // 'narrow' | 'standard' | 'wide'
  typewriter: false,
  paragraphFocus: false,
  autoSaveInterval: 2000
};

const DEFAULT_ACRO_CONFIG = {
  enabled: true,
  mode: 'strict',          // 'strict' (default: no Ь/Ъ, Й=И, Ё=Е) | 'phonetic'
  trigger: 'words',        // 'words' | 'sentences' | 'paragraphs'
  scope: 'project',        // 'project' (сквозной перенос между главами) | 'chapter' (с нуля в каждой главе)
  sourceTitle: 'А.С. Пушкин — «Я помню чудное мгновенье»',
  ignoreSoftHardSigns: true,
  mapIota: true,           // Й -> И, Ё -> Е
  sourceText: 'Я помню чудное мгновенье:\nПередо мной явилась ты,\nКак мимолетное виденье,\nКак гений чистой красоты.\n\nВ томленьях грусти безнадежной,\nВ тревогах шумной суеты,\nЗвучал мне долго голос нежный\nИ снились милые черты.'
};

class StorageManager {
  constructor() {
    this.dbName = 'WordMagicProseDB';
    this.dbVersion = 1;
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('revisions')) {
          const revStore = db.createObjectStore('revisions', { keyPath: 'id' });
          revStore.createIndex('docId', 'docId', { unique: false });
          revStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB init error:', event.target.error);
        resolve(null); // Fallback to localStorage gracefully
      };
    });
  }

  // --- Document Operations ---

  async saveDocument(doc) {
    await this.initPromise;
    doc.updatedAt = Date.now();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');
        const req = store.put(doc);
        req.onsuccess = () => resolve(doc);
        req.onerror = () => reject(req.error);
      });
    } else {
      // Fallback
      localStorage.setItem(`doc_${doc.id}`, JSON.stringify(doc));
      return doc;
    }
  }

  async getDocument(id) {
    await this.initPromise;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('documents', 'readonly');
        const store = tx.objectStore('documents');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } else {
      const item = localStorage.getItem(`doc_${id}`);
      return item ? JSON.parse(item) : null;
    }
  }

  async getAllDocuments() {
    await this.initPromise;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('documents', 'readonly');
        const store = tx.objectStore('documents');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } else {
      const list = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('doc_')) {
          try {
            list.push(JSON.parse(localStorage.getItem(key)));
          } catch (e) {}
        }
      }
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      return list;
    }
  }

  async deleteDocument(id) {
    await this.initPromise;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction(['documents', 'revisions'], 'readwrite');
        tx.objectStore('documents').delete(id);
        resolve(true);
      });
    } else {
      localStorage.removeItem(`doc_${id}`);
      return true;
    }
  }

  // --- Revision / Snapshot Operations ---

  async saveRevision(docId, message, content, wordCount) {
    await this.initPromise;
    const revision = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      docId,
      message: message || `Снапшот (${wordCount} слов)`,
      content,
      wordCount,
      timestamp: Date.now()
    };

    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('revisions', 'readwrite');
        tx.objectStore('revisions').put(revision);
        resolve(revision);
      });
    } else {
      const snapshots = this.getLocalStorageSnapshots(docId);
      snapshots.unshift(revision);
      localStorage.setItem(`${STORAGE_KEYS.SNAPSHOTS}_${docId}`, JSON.stringify(snapshots.slice(0, 50)));
      return revision;
    }
  }

  async getRevisions(docId) {
    await this.initPromise;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('revisions', 'readonly');
        const store = tx.objectStore('revisions');
        const index = store.index('docId');
        const req = index.getAll(docId);
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => b.timestamp - a.timestamp);
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } else {
      return this.getLocalStorageSnapshots(docId);
    }
  }

  getLocalStorageSnapshots(docId) {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.SNAPSHOTS}_${docId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // --- Daily Log Operations (Per Project & Global) ---

  getDailyLogs(projectId = null) {
    try {
      const logs = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
      const allLogs = logs ? JSON.parse(logs) : {};
      if (!projectId) return allLogs;
      return allLogs[projectId] || {};
    } catch (e) {
      return {};
    }
  }

  saveDailyLogs(allLogs) {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(allLogs));
    } catch (e) {
      console.error('Failed to save daily logs', e);
    }
  }

  updateDailyWordCount(projectId, wordsInProject) {
    if (!projectId) return null;
    const today = new Date().toISOString().split('T')[0];
    const allLogs = this.getDailyLogs();

    if (!allLogs[projectId]) {
      allLogs[projectId] = {};
    }

    const projLogs = allLogs[projectId];

    if (!projLogs[today]) {
      // First time writing in this project today
      projLogs[today] = {
        date: today,
        startWords: wordsInProject,
        endWords: wordsInProject,
        netWords: 0,
        sessions: 1,
        lastUpdated: Date.now()
      };
    } else {
      // Update endWords and calculate net words written today in this project
      projLogs[today].endWords = wordsInProject;
      projLogs[today].netWords = Math.max(0, projLogs[today].endWords - projLogs[today].startWords);
      projLogs[today].lastUpdated = Date.now();
    }

    this.saveDailyLogs(allLogs);
    return projLogs[today];
  }

  // --- Settings & Configuration ---

  getSettings() {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  getAcroConfig() {
    try {
      const c = localStorage.getItem(STORAGE_KEYS.ACRO_CONFIG);
      return c ? { ...DEFAULT_ACRO_CONFIG, ...JSON.parse(c) } : { ...DEFAULT_ACRO_CONFIG };
    } catch (e) {
      return { ...DEFAULT_ACRO_CONFIG };
    }
  }

  saveAcroConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACRO_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save acro config', e);
    }
  }

  getServerConfig() {
    try {
      const c = localStorage.getItem(STORAGE_KEYS.SERVER_CONFIG);
      return c ? JSON.parse(c) : { serverUrl: '', syncKey: '', autoSync: false, lastSyncTime: 0 };
    } catch (e) {
      return { serverUrl: '', syncKey: '', autoSync: false, lastSyncTime: 0 };
    }
  }

  saveServerConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVER_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save Server config', e);
    }
  }

  getGitHubConfig() {
    try {
      const g = localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG);
      return g ? JSON.parse(g) : { token: '', repo: '', branch: 'main', path: 'prose.md' };
    } catch (e) {
      return { token: '', repo: '', branch: 'main', path: 'prose.md' };
    }
  }

  saveGitHubConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.GITHUB_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save GitHub config', e);
    }
  }

  // --- Projects / Books Operations ---

  getProjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const list = data ? JSON.parse(data) : [DEFAULT_PROJECT];
      if (list.length === 0) list.push(DEFAULT_PROJECT);
      return list;
    } catch (e) {
      return [DEFAULT_PROJECT];
    }
  }

  saveProject(project) {
    const list = this.getProjects();
    const idx = list.findIndex(p => p.id === project.id);
    project.updatedAt = Date.now();
    if (idx >= 0) {
      list[idx] = project;
    } else {
      list.push(project);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    return project;
  }

  deleteProject(projectId) {
    let list = this.getProjects();
    list = list.filter(p => p.id !== projectId);
    if (list.length === 0) list.push(DEFAULT_PROJECT);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    return list;
  }

  getActiveProjectId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID) || DEFAULT_PROJECT.id;
  }

  setActiveProjectId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  }

  getActiveDocId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_DOC_ID) || null;
  }

  setActiveDocId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DOC_ID, id);
  }
}

export const storage = new StorageManager();
