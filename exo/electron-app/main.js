const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const http = require('http')
const { execFile } = require('child_process')
let trayIcon = nativeImage.createFromPath(path.join(__dirname, 'images/exo-rounded-small.png'))
let appIcon = nativeImage.createFromPath(path.join(__dirname, 'images/exo-rounded.png'))

app.setName('exo');

app.setAboutPanelOptions({
  applicationName: 'exo',
  applicationVersion: '0.1.0',
  applicationIcon: appIcon,
  copyright: 'Copyright © 2024 exo Labs, Inc.'
})

let tray = null
let mainWindow = null

const launchBackend = () => {
  const backendPath = path.join(__dirname, 'backend/exo')
  execFile(`${backendPath}`)
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false
  })
  mainWindow.loadFile('index.html')
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.webContents.openDevTools()
}

const sendQuitSignal = () => {
  const chatUrl = process.env.CHAT_URL || 'http://127.0.0.1:8000'
  const req = http.request(`${chatUrl}/quit`, {
    method: 'POST',
    timeout: 5000
  }, (res) => {
    app.quit()
  })
  req.on('error', (error) => {
    console.error('Error sending quit signal:', error)
    app.quit()
  })
  req.end()
}

const createTray = () => {
  tray = new Tray(trayIcon)
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', 
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show()
        } else {
          createWindow()
        }
      }
    },
    { label: 'Quit', click: () => sendQuitSignal() }
  ])
  
  tray.setToolTip('exo')
  tray.setContextMenu(contextMenu)
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(appIcon)
  }
  launchBackend()
  if (!mainWindow) {
    createWindow()
  }
  else{
    mainWindow.show()
  }
  createTray()
})

app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})