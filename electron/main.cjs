const { app, BrowserWindow, Menu, net, protocol, screen, session, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const DIST_DIR = path.resolve(__dirname, '..', 'dist');

function registerAppProtocol() {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let relPath = decodeURIComponent(url.pathname);
    if (!relPath || relPath === '/') {
      relPath = '/index.html';
    }

    const cleanRel = relPath.replace(/^\/+/, '');
    let filePath = path.resolve(DIST_DIR, cleanRel);

    if (!filePath.startsWith(DIST_DIR)) {
      return new Response('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function createMainWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay();
  const maxHeight = Math.max(640, workAreaSize.height - 60);
  const height = Math.min(960, maxHeight);
  const width = Math.round((height * 9) / 16);

  const iconPath = path.resolve(__dirname, '..', 'public', 'icon-256.png');

  const win = new BrowserWindow({
    width,
    height,
    minWidth: 360,
    minHeight: 600,
    title: 'Zorbit',
    backgroundColor: '#070913',
    autoHideMenuBar: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void win.loadURL(devUrl);
  } else {
    void win.loadURL('app://zorbit/');
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://zorbit.truncgil.com/api/*'] },
    (details, callback) => {
      details.requestHeaders.Origin = 'https://zorbit.truncgil.com';
      callback({ requestHeaders: details.requestHeaders });
    }
  );
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://zorbit.truncgil.com/api/*'] },
    (details, callback) => {
      const headers = { ...(details.responseHeaders ?? {}) };
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === 'access-control-allow-origin') {
          delete headers[key];
        }
      }
      headers['access-control-allow-origin'] = ['*'];
      callback({ responseHeaders: headers });
    }
  );
  registerAppProtocol();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

