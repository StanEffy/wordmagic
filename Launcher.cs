using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;
using System.Drawing;
using System.Collections.Generic;

namespace WordMagic
{
    static class Program
    {
        private static HttpListener listener;
        private static string baseDir;
        private static int serverPort;
        private static string serverUrl;
        private static NotifyIcon trayIcon;

        private static readonly Dictionary<string, string> MimeTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { ".html", "text/html; charset=utf-8" },
            { ".htm", "text/html; charset=utf-8" },
            { ".css", "text/css; charset=utf-8" },
            { ".js", "application/javascript; charset=utf-8" },
            { ".json", "application/json; charset=utf-8" },
            { ".png", "image/png" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".svg", "image/svg+xml" },
            { ".ico", "image/x-icon" },
            { ".txt", "text/plain; charset=utf-8" },
            { ".md", "text/markdown; charset=utf-8" }
        };

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            baseDir = AppDomain.CurrentDomain.BaseDirectory;

            // 1. Find a reliable free port
            serverPort = GetFreePort();
            serverUrl = "http://127.0.0.1:" + serverPort + "/";

            // 2. Start HTTP Server
            try
            {
                listener = new HttpListener();
                listener.Prefixes.Add(serverUrl);
                listener.Start();

                Thread serverThread = new Thread(ListenLoop);
                serverThread.IsBackground = true;
                serverThread.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Не удалось запустить сервер WordMagic: " + ex.Message, "WordMagic", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // 3. Create System Tray Icon for reliable background lifecycle
            ContextMenu menu = new ContextMenu();
            menu.MenuItems.Add("🖋️ Открыть WordMagic", (s, e) => LaunchAppWindow());
            menu.MenuItems.Add("🌐 Открыть в обычном браузере", (s, e) => Process.Start(serverUrl));
            menu.MenuItems.Add("-");
            menu.MenuItems.Add("❌ Выход", (s, e) => ExitApp());

            Icon customIcon = SystemIcons.Application;
            string icoPath = Path.Combine(baseDir, "icon.ico");
            if (File.Exists(icoPath))
            {
                try { customIcon = new Icon(icoPath); } catch { }
            }

            trayIcon = new NotifyIcon
            {
                Icon = customIcon,
                ContextMenu = menu,
                Text = "WordMagic — Редактор прозы",
                Visible = true
            };
            trayIcon.DoubleClick += (s, e) => LaunchAppWindow();

            // 4. Open Application Window immediately
            LaunchAppWindow();

            // 5. Run message loop
            Application.Run();
        }

        private static int GetFreePort()
        {
            try
            {
                TcpListener l = new TcpListener(IPAddress.Loopback, 0);
                l.Start();
                int port = ((IPEndPoint)l.LocalEndpoint).Port;
                l.Stop();
                return port;
            }
            catch
            {
                return 32456;
            }
        }

        private static void LaunchAppWindow()
        {
            // Search for Microsoft Edge or Google Chrome to launch in standalone App window mode
            string[] possibleBrowsers = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft\\Edge\\Application\\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft\\Edge\\Application\\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Microsoft\\Edge\\Application\\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google\\Chrome\\Application\\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google\\Chrome\\Application\\chrome.exe")
            };

            bool launched = false;
            foreach (string exePath in possibleBrowsers)
            {
                if (File.Exists(exePath))
                {
                    try
                    {
                        ProcessStartInfo psi = new ProcessStartInfo
                        {
                            FileName = exePath,
                            Arguments = "--app=\"" + serverUrl + "\" --window-size=1280,820",
                            UseShellExecute = true
                        };
                        Process.Start(psi);
                        launched = true;
                        break;
                    }
                    catch { }
                }
            }

            if (!launched)
            {
                // Fallback: Default Browser
                try
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = serverUrl,
                        UseShellExecute = true
                    });
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Не удалось открыть браузер: " + ex.Message, "WordMagic", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }
        }

        private static void ListenLoop()
        {
            while (listener != null && listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem(ProcessRequest, context);
                }
                catch
                {
                    break;
                }
            }
        }

        private static void ProcessRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            try
            {
                string rawUrl = context.Request.RawUrl;
                if (rawUrl.Contains("?")) rawUrl = rawUrl.Substring(0, rawUrl.IndexOf('?'));

                if (rawUrl == "/api/heartbeat")
                {
                    context.Response.ContentType = "application/json";
                    byte[] okBytes = System.Text.Encoding.UTF8.GetBytes("{\"status\":\"ok\"}");
                    context.Response.ContentLength64 = okBytes.Length;
                    context.Response.OutputStream.Write(okBytes, 0, okBytes.Length);
                    return;
                }

                if (rawUrl == "/" || string.IsNullOrEmpty(rawUrl)) rawUrl = "/index.html";

                string relPath = rawUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                string filePath = Path.Combine(baseDir, relPath);

                if (File.Exists(filePath))
                {
                    byte[] bytes = File.ReadAllBytes(filePath);
                    string ext = Path.GetExtension(filePath);
                    string mime = MimeTypes.ContainsKey(ext) ? MimeTypes[ext] : "application/octet-stream";

                    context.Response.ContentType = mime;
                    context.Response.ContentLength64 = bytes.Length;
                    context.Response.AddHeader("Cache-Control", "no-cache");
                    context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    context.Response.StatusCode = 404;
                    byte[] notFound = System.Text.Encoding.UTF8.GetBytes("Файл не найден");
                    context.Response.OutputStream.Write(notFound, 0, notFound.Length);
                }
            }
            catch { }
            finally
            {
                try { context.Response.OutputStream.Close(); } catch { }
            }
        }

        private static void ExitApp()
        {
            try
            {
                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
                if (listener != null)
                {
                    listener.Stop();
                }
            }
            catch { }

            Application.Exit();
        }
    }
}
