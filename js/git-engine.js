/**
 * WordMagic Git & GitHub Synchronization Engine
 * Handles GitHub REST API commits, pull/push, local snapshots timeline, and line-by-line diffing.
 */

export class GitEngine {
  /**
   * Push prose file to GitHub repository via REST API
   */
  static async pushToGitHub({ token, repo, branch = 'main', path = 'prose.md', content, message }) {
    if (!token || !repo) {
      throw new Error('Укажите GitHub Personal Access Token и репозиторий (username/repo)');
    }

    const cleanRepo = repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
    const cleanPath = path.trim().replace(/^\//, '') || 'prose.md';
    const cleanBranch = branch.trim() || 'main';
    const commitMsg = message && message.trim() ? message.trim() : `Update ${cleanPath} from WordMagic (${new Date().toLocaleString('ru-RU')})`;

    const apiUrl = `https://api.github.com/repos/${cleanRepo}/contents/${cleanPath}?ref=${cleanBranch}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    // 1. Check if file already exists to get its SHA
    let existingSha = null;
    try {
      const getRes = await fetch(apiUrl, { method: 'GET', headers });
      if (getRes.ok) {
        const fileData = await getRes.json();
        existingSha = fileData.sha;
      }
    } catch (e) {
      console.warn('File does not exist yet or branch is fresh', e);
    }

    // 2. Base64 encode Unicode content properly
    const base64Content = this.utf8ToBase64(content);

    const bodyData = {
      message: commitMsg,
      content: base64Content,
      branch: cleanBranch
    };

    if (existingSha) {
      bodyData.sha = existingSha;
    }

    // 3. Put commit
    const putRes = await fetch(`https://api.github.com/repos/${cleanRepo}/contents/${cleanPath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(bodyData)
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      throw new Error(errJson.message || `Ошибка GitHub API: ${putRes.status} ${putRes.statusText}`);
    }

    const resData = await putRes.json();
    return {
      success: true,
      commitSha: resData.commit ? resData.commit.sha : '',
      commitUrl: resData.commit ? resData.commit.html_url : '',
      contentUrl: resData.content ? resData.content.html_url : ''
    };
  }

  /**
   * Fetch recent commit history from GitHub for the file
   */
  static async fetchGitHubCommits({ token, repo, branch = 'main', path = 'prose.md' }) {
    if (!token || !repo) return [];

    const cleanRepo = repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
    const cleanPath = path.trim().replace(/^\//, '');
    const cleanBranch = branch.trim() || 'main';

    const apiUrl = `https://api.github.com/repos/${cleanRepo}/commits?path=${encodeURIComponent(cleanPath)}&sha=${cleanBranch}&per_page=15`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${token.trim()}`,
      'X-GitHub-Api-Version': '2022-11-28'
    };

    try {
      const res = await fetch(apiUrl, { method: 'GET', headers });
      if (!res.ok) return [];
      const commits = await res.json();
      return commits.map(c => ({
        sha: c.sha.substring(0, 7),
        fullSha: c.sha,
        message: c.commit.message,
        author: c.commit.author.name,
        date: new Date(c.commit.author.date).toLocaleString('ru-RU'),
        htmlUrl: c.html_url
      }));
    } catch (e) {
      console.warn('Failed to fetch GitHub commits', e);
      return [];
    }
  }

  /**
   * Helper: encode UTF-8 string to base64
   */
  static utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Helper: decode base64 to UTF-8 string
   */
  static base64ToUtf8(b64) {
    const binary = window.atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  /**
   * Lightweight LCS (Longest Common Subsequence) Line-by-Line Diff Engine
   */
  static computeDiff(oldText, newText) {
    const oldLines = (oldText || '').split('\n');
    const newLines = (newText || '').split('\n');

    const m = oldLines.length;
    const n = newLines.length;

    // Fast path: if equal
    if (oldText === newText) {
      return oldLines.map(line => ({ type: 'same', text: line }));
    }

    // Build DP table (bounded to prevent huge memory)
    if (m * n > 4000000) {
      // Simplified fallback for massive files
      return [
        { type: 'del', text: `--- Старая версия (${m} строк) ---` },
        { type: 'add', text: `+++ Новая версия (${n} строк) +++` }
      ];
    }

    const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find diff
    const diff = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        diff.unshift({ type: 'same', text: oldLines[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'add', text: `+ ${newLines[j - 1]}` });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        diff.unshift({ type: 'del', text: `- ${oldLines[i - 1]}` });
        i--;
      }
    }

    return diff;
  }
}
