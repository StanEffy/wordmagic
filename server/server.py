#!/usr/bin/env python3
"""
WordMagic Sync Server
A lightweight, zero-dependency cloud synchronization server for WordMagic Prose Editor.
Stores documents, projects, revisions, and daily writing logs in a local SQLite database.
"""

import http.server
import socketserver
import sqlite3
import json
import os
import sys
import time
import argparse
from urllib.parse import urlparse, parse_qs

def load_env_file():
    for candidate in ['.env', 'server/.env', '../.env']:
        if os.path.isfile(candidate):
            try:
                with open(candidate, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            k, v = line.split('=', 1)
                            os.environ.setdefault(k.strip(), v.strip().strip('"\''))
                break
            except Exception:
                pass

load_env_file()

DB_FILE = os.environ.get('WORDMAGIC_DB', 'wordmagic_server.db')
AUTH_KEY = os.environ.get('WORDMAGIC_KEY', '')

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            data JSON,
            updated_at INTEGER
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            title TEXT,
            content TEXT,
            is_folder INTEGER,
            parent_id TEXT,
            data JSON,
            updated_at INTEGER
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS daily_logs (
            project_id TEXT,
            date_str TEXT,
            data JSON,
            updated_at INTEGER,
            PRIMARY KEY (project_id, date_str)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS server_meta (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    conn.commit()
    conn.close()

class SyncHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-WordMagic-Key')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def check_auth(self):
        if not AUTH_KEY:
            return True  # No key configured -> open server
        auth_header = self.headers.get('Authorization', '')
        key_header = self.headers.get('X-WordMagic-Key', '')
        
        token = ''
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
        elif key_header:
            token = key_header.strip()
            
        return token == AUTH_KEY

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/health':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            res = json.dumps({'status': 'ok', 'server': 'WordMagic Sync Server', 'time': int(time.time() * 1000)})
            self.wfile.write(res.encode('utf-8'))
            return

        if not self.check_auth():
            self.send_response(401)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Unauthorized: invalid or missing sync key'}).encode('utf-8'))
            return

        if path == '/api/sync/pull':
            qs = parse_qs(parsed.query)
            since = int(qs.get('since', [0])[0])

            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()

            # Pull projects
            c.execute('SELECT id, title, data, updated_at FROM projects WHERE updated_at > ?', (since,))
            projects = []
            for row in c.fetchall():
                pdata = json.loads(row[2]) if row[2] else {}
                pdata['id'] = row[0]
                pdata['title'] = row[1]
                pdata['updatedAt'] = row[3]
                projects.append(pdata)

            # Pull documents
            c.execute('SELECT id, project_id, title, content, is_folder, parent_id, data, updated_at FROM documents WHERE updated_at > ?', (since,))
            documents = []
            for row in c.fetchall():
                ddata = json.loads(row[6]) if row[6] else {}
                ddata['id'] = row[0]
                ddata['projectId'] = row[1]
                ddata['title'] = row[2]
                ddata['content'] = row[3]
                ddata['isFolder'] = bool(row[4])
                ddata['parentId'] = row[5]
                ddata['updatedAt'] = row[7]
                documents.append(ddata)

            # Pull daily logs
            c.execute('SELECT project_id, date_str, data, updated_at FROM daily_logs WHERE updated_at > ?', (since,))
            logs = {}
            for row in c.fetchall():
                p_id = row[0]
                d_str = row[1]
                ldata = json.loads(row[2]) if row[2] else {}
                if p_id not in logs:
                    logs[p_id] = {}
                logs[p_id][d_str] = ldata

            conn.close()

            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            resp = {
                'success': True,
                'serverTime': int(time.time() * 1000),
                'projects': projects,
                'documents': documents,
                'dailyLogs': logs
            }
            self.wfile.write(json.dumps(resp).encode('utf-8'))
            return

        # Fallback static or 404
        self.send_response(404)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if not self.check_auth():
            self.send_response(401)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Unauthorized: invalid or missing sync key'}).encode('utf-8'))
            return

        if path == '/api/sync/push':
            content_len = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_len)
            try:
                payload = json.loads(body.decode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Invalid JSON: {str(e)}'}).encode('utf-8'))
                return

            projects = payload.get('projects', [])
            documents = payload.get('documents', [])
            daily_logs = payload.get('dailyLogs', {})
            client_time = int(payload.get('clientTime', time.time() * 1000))
            now = int(time.time() * 1000)

            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()

            # Save projects
            for p in projects:
                p_id = p.get('id')
                p_title = p.get('title', 'Без названия')
                p_updated = p.get('updatedAt', now)
                
                c.execute('SELECT updated_at FROM projects WHERE id = ?', (p_id,))
                existing = c.fetchone()
                if not existing or p_updated >= existing[0]:
                    c.execute('''
                        INSERT INTO projects (id, title, data, updated_at)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            title = excluded.title,
                            data = excluded.data,
                            updated_at = excluded.updated_at
                    ''', (p_id, p_title, json.dumps(p), p_updated))

            # Save documents
            for d in documents:
                d_id = d.get('id')
                d_proj = d.get('projectId', 'proj_default')
                d_title = d.get('title', 'Без названия')
                d_content = d.get('content', '')
                d_folder = 1 if d.get('isFolder') else 0
                d_parent = d.get('parentId')
                d_updated = d.get('updatedAt', now)

                c.execute('SELECT updated_at FROM documents WHERE id = ?', (d_id,))
                existing = c.fetchone()
                if not existing or d_updated >= existing[0]:
                    c.execute('''
                        INSERT INTO documents (id, project_id, title, content, is_folder, parent_id, data, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            project_id = excluded.project_id,
                            title = excluded.title,
                            content = excluded.content,
                            is_folder = excluded.is_folder,
                            parent_id = excluded.parent_id,
                            data = excluded.data,
                            updated_at = excluded.updated_at
                    ''', (d_id, d_proj, d_title, d_content, d_folder, d_parent, json.dumps(d), d_updated))

            # Save daily logs
            for proj_id, days in daily_logs.items():
                for date_str, log_entry in days.items():
                    log_updated = log_entry.get('lastUpdated', now)
                    c.execute('''
                        INSERT INTO daily_logs (project_id, date_str, data, updated_at)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(project_id, date_str) DO UPDATE SET
                            data = excluded.data,
                            updated_at = excluded.updated_at
                    ''', (proj_id, date_str, json.dumps(log_entry), log_updated))

            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            resp = {
                'success': True,
                'serverTime': now,
                'syncedProjects': len(projects),
                'syncedDocuments': len(documents)
            }
            self.wfile.write(json.dumps(resp).encode('utf-8'))
            return

        self.send_response(404)
        self.send_cors_headers()
        self.end_headers()

def run_server(port=8080, key=''):
    global AUTH_KEY
    if key:
        AUTH_KEY = key
    init_db()

    server_address = ('', port)
    httpd = socketserver.TCPServer(server_address, SyncHandler)
    print(f"==================================================")
    print(f"  WordMagic Cloud Sync Server running on port {port}")
    if AUTH_KEY:
        print(f"  Security Key: [CONFIGURED]")
    else:
        print(f"  Security Key: [NONE - Open Access]")
    print(f"  Database file: {DB_FILE}")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='WordMagic Sync Server')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind (default: 8080)')
    parser.add_argument('--key', type=str, default='', help='Secret sync authorization key')
    args = parser.parse_args()

    run_server(port=args.port, key=args.key)
