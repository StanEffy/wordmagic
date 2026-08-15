/**
 * WordMagic Cloud & Server Synchronization Engine
 * Handles bi-directional synchronization between local IndexedDB storage and the WordMagic Sync Server.
 */

import { storage } from './storage.js';

export class SyncEngine {
  /**
   * Test connection to server
   */
  static async testConnection(serverUrl, syncKey) {
    if (!serverUrl) throw new Error('Укажите URL сервера синхронизации');
    const cleanUrl = serverUrl.trim().replace(/\/+$/, '');

    try {
      const res = await fetch(`${cleanUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Сервер вернул код ошибки: ${res.status}`);
      }

      const data = await res.json();
      return { success: true, data };
    } catch (e) {
      throw new Error(`Не удалось связаться с сервером: ${e.message}`);
    }
  }

  /**
   * Perform full two-way synchronization
   */
  static async sync({ serverUrl, syncKey, lastSyncTime = 0, onProgress }) {
    if (!serverUrl) {
      return { success: false, error: 'URL сервера не настроен' };
    }

    const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (syncKey) {
      headers['X-WordMagic-Key'] = syncKey.trim();
    }

    if (onProgress) onProgress('Проверка связи с сервером...');

    // 1. Pull changes from server since lastSyncTime
    let remoteProjects = [];
    let remoteDocs = [];
    let remoteLogs = {};
    let serverTime = Date.now();

    try {
      if (onProgress) onProgress('Получение обновлений с сервера...');
      const pullRes = await fetch(`${cleanUrl}/api/sync/pull?since=${lastSyncTime || 0}`, {
        method: 'GET',
        headers
      });

      if (!pullRes.ok) {
        const errJson = await pullRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Ошибка сервера: ${pullRes.status}`);
      }

      const pullData = await pullRes.json();
      remoteProjects = pullData.projects || [];
      remoteDocs = pullData.documents || [];
      remoteLogs = pullData.dailyLogs || {};
      serverTime = pullData.serverTime || Date.now();
    } catch (e) {
      throw new Error(`Ошибка загрузки с сервера: ${e.message}`);
    }

    // 2. Apply remote changes locally (if newer)
    if (onProgress) onProgress('Слияние данных...');
    let downloadedProjects = 0;
    let downloadedDocs = 0;
    
    // Merge projects
    const localProjects = storage.getProjects();
    for (const rProj of remoteProjects) {
      const localIdx = localProjects.findIndex(p => p.id === rProj.id);
      if (localIdx === -1 || (rProj.updatedAt || 0) > (localProjects[localIdx].updatedAt || 0)) {
        storage.saveProject(rProj);
        downloadedProjects++;
      }
    }

    // Merge documents
    for (const rDoc of remoteDocs) {
      const localDoc = await storage.getDocument(rDoc.id);
      if (!localDoc || (rDoc.updatedAt || 0) > (localDoc.updatedAt || 0)) {
        await storage.saveDocument(rDoc);
        downloadedDocs++;
      }
    }

    // Merge daily logs
    if (Object.keys(remoteLogs).length > 0) {
      const localAllLogs = storage.getDailyLogs();
      for (const pId of Object.keys(remoteLogs)) {
        if (!localAllLogs[pId]) localAllLogs[pId] = {};
        for (const dateStr of Object.keys(remoteLogs[pId])) {
          const rEntry = remoteLogs[pId][dateStr];
          const lEntry = localAllLogs[pId][dateStr];
          if (!lEntry || (rEntry.lastUpdated || 0) > (lEntry.lastUpdated || 0)) {
            localAllLogs[pId][dateStr] = rEntry;
          }
        }
      }
      storage.saveDailyLogs(localAllLogs);
    }

    // 3. Push local changes to server (Upload ONLY items modified locally)
    const allLocalProjects = storage.getProjects();
    const allLocalDocs = await storage.getAllDocuments();
    const allLocalLogs = storage.getDailyLogs();

    const projectsToUpload = allLocalProjects.filter(lp => {
      const rp = remoteProjects.find(r => r.id === lp.id);
      return !rp || (lp.updatedAt || 0) > (rp.updatedAt || 0);
    });

    const docsToUpload = allLocalDocs.filter(ld => {
      const rd = remoteDocs.find(r => r.id === ld.id);
      return !rd || (ld.updatedAt || 0) > (rd.updatedAt || 0);
    });

    let uploadedDocs = docsToUpload.length;
    let uploadedProjects = projectsToUpload.length;

    if (projectsToUpload.length > 0 || docsToUpload.length > 0) {
      if (onProgress) onProgress(`Отправка измененных глав на сервер (${docsToUpload.length})...`);
      
      const pushPayload = {
        clientTime: Date.now(),
        projects: projectsToUpload,
        documents: docsToUpload,
        dailyLogs: allLocalLogs
      };

      try {
        const pushRes = await fetch(`${cleanUrl}/api/sync/push`, {
          method: 'POST',
          headers,
          body: JSON.stringify(pushPayload)
        });

        if (!pushRes.ok) {
          const errJson = await pushRes.json().catch(() => ({}));
          throw new Error(errJson.error || `Ошибка отправки: ${pushRes.status}`);
        }

        const pushData = await pushRes.json();
        serverTime = pushData.serverTime || serverTime;
      } catch (e) {
        throw new Error(`Ошибка отправки на сервер: ${e.message}`);
      }
    }

    return {
      success: true,
      serverTime: serverTime,
      downloadedDocs,
      downloadedProjects,
      uploadedDocs,
      uploadedProjects,
      totalDocs: allLocalDocs.length
    };
  }
}
