const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');

// Steam integration placeholder — wire up greenworks/steamworks.js here if distributing on Steam
// const steamworks = require('steamworks.js');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    title: 'PixelRift',
    icon: path.join(__dirname, '../public/icons/icon-192.png'),
    fullscreen: false,
    fullscreenable: true,
    resizable: true,
    backgroundColor: '#0d0d1a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Load the built game
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // On first launch, offer fullscreen
    const prefsPath = path.join(app.getPath('userData'), 'prefs.json');
    let prefs = {};
    try { prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8')); } catch {}
    if (prefs.fullscreen) mainWindow.setFullScreen(true);
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // Track fullscreen preference
  mainWindow.on('enter-full-screen', () => _saveFullscreenPref(true));
  mainWindow.on('leave-full-screen', () => _saveFullscreenPref(false));
}

function _saveFullscreenPref(value) {
  try {
    const prefsPath = path.join(app.getPath('userData'), 'prefs.json');
    let prefs = {};
    try { prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8')); } catch {}
    prefs.fullscreen = value;
    fs.writeFileSync(prefsPath, JSON.stringify(prefs));
  } catch {}
}

function buildMenu() {
  const template = [
    {
      label: 'Game',
      submenu: [
        {
          label: 'Toggle Fullscreen',
          accelerator: process.platform === 'darwin' ? 'Cmd+Ctrl+F' : 'F11',
          click() {
            if (!mainWindow) return;
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        { type: 'separator' },
        {
          label: 'Open Save Folder',
          click() {
            shell.openPath(app.getPath('userData'));
          },
        },
        { type: 'separator' },
        {
          label: 'Quit PixelRift',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click() { app.quit(); },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click() { mainWindow?.setFullScreen(!mainWindow.isFullScreen()); },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Controls',
          click() {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'PixelRift Controls',
              message: 'Controls',
              detail: [
                '⌨️  Keyboard:',
                '  Move:  ← → Arrow keys  |  A / D',
                '  Jump:  ↑  |  W  |  Space  |  Enter',
                '  Run:   Z  |  Shift',
                '  Fire:  X  |  Ctrl',
                '  Pause: Escape',
                '',
                '🎮 Controller (Xbox / PlayStation):',
                '  Move:  Left Stick  |  D-Pad',
                '  Jump:  A / Cross',
                '  Run:   B / Circle',
                '  Fire:  X / Square',
                '  Pause: Start / Options',
                '',
                '📱 Touch:',
                '  Left / Right buttons bottom-left',
                '  Jump / Run / Fire buttons bottom-right',
              ].join('\n'),
              buttons: ['OK'],
            });
          },
        },
        { type: 'separator' },
        {
          label: 'About PixelRift',
          click() {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About PixelRift',
              message: 'PixelRift v1.0',
              detail: 'Leap. Explore. Conquer.\n\nA pixel-art 2D platformer.\n3 Worlds · 15 Levels · 12 Quests',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// IPC: renderer can request userData path for save files
ipcMain.handle('get-user-data-path', () => app.getPath('userData'));
ipcMain.handle('toggle-fullscreen',  () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()));

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Prevent navigation away from the game
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) e.preventDefault();
  });
});
