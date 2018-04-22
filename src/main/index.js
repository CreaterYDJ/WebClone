/* eslint-disable no-undef */

const path = require("path");
const url = require("url");

const electron = require("electron");
const {ipcMain, app, BrowserWindow, session} = electron;

const utils = require("../utils");

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const db = low(new FileSync(utils.DB_FILE));

db.defaults({projects: []}).write();

// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the JavaScript object is garbage collected.
let ctrlWindow;
let webViewWindow;

ipcMain.on("goto-url", (event, arg) => {
    console.log(arg);  // prints "ping"
    webViewWindow.loadURL(arg);
    // event.sender.send('asynchronous-reply', 'pong') //reply
});

function createWindow() {

    // Create the browser window.
    ctrlWindow = new BrowserWindow({
        width: 800,
        height: 300,
        // frame: false,
        alwaysOnTop: true
    });

    webViewWindow = new BrowserWindow({
        width: 1200,
        height: 768,
        webPreferences: {
            nodeIntegration: false
        },
        // closable: false
    });

    const winURL = (process.env.NODE_ENV === "development") ? "http://localhost:9080" : url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true
    });
    ctrlWindow.loadURL(winURL);

    const filter = {urls: ["http://*", "https://*"]};

    // TODO:自定义UA
    // FIXME: 修改UA不生效
    const UserAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36";

    //TODO: session.defaultSession 与 win.webContents.session的区别

    webViewWindow.webContents.session.setUserAgent(UserAgent);
    ctrlWindow.webContents.session.setUserAgent(UserAgent);

    console.log("ses.getUserAgent()", webViewWindow.webContents.session.getUserAgent());
    // ses.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    //     details.requestHeaders['User-Agent'] = UserAgent
    //     callback({cancel: false, requestHeaders: details.requestHeaders})
    // });

    session.defaultSession.webRequest.onBeforeRequest(filter, function (details, callback) {

        let remoteURL = url.parse(details.url);
        // 过滤非http(s)协议 过滤本地开发服务器
        if (remoteURL.host === "localhost:9080"
            || (remoteURL.protocol !== "http:" && remoteURL.protocol !== "https:")) {

            console.warn("Ignored invalid URL : " + details.url);
        } else {
            // FIXED: 主线程无法主动发消息给渲染线程
            ctrlWindow.webContents.send("add-request", details);
        }
        callback({});

    });

    let template = [];

    if (process.platform === "darwin") {
        const appName = electron.app.getName();
        template.push({
            label: appName,
            submenu: [
                {label: `关于 ${appName}`, role: "about"},
                {type: "separator"},
                {label: "服务", role: "services", submenu: []},
                {type: "separator"},
                {label: `隐藏 ${appName}`, accelerator: "Command+H", role: "hide"},
                {label: "隐藏其他", accelerator: "Command+Alt+H", role: "hideothers"},
                {label: "全部显示", role: "unhide"},
                {type: "separator"},
                {
                    label: `退出 ${appName}`, accelerator: "Command+Q", click() {
                        electron.app.quit();
                    }
                }
            ]
        });
        template.push({
            label: "编辑",
            submenu: [
                {label: "撤销", accelerator: "CmdOrCtrl+Z", selector: "undo:"},
                {label: "重做", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:"},
                {type: "separator"},
                {label: "剪切", accelerator: "CmdOrCtrl+X", selector: "cut:"},
                {label: "复制", accelerator: "CmdOrCtrl+C", selector: "copy:"},
                {label: "粘贴", accelerator: "CmdOrCtrl+V", selector: "paste:"},
                {label: "全选", accelerator: "CmdOrCtrl+A", selector: "selectAll:"}
            ]
        });
    }

    template.push({
        label: "显示",
        submenu: [
            {
                label: "切换开发者工具",
                accelerator: (process.platform === "darwin") ? "Option+Command+I" : "Ctrl+Shift+I",
                click: () => {
                    ctrlWindow.webContents.toggleDevTools();
                    webViewWindow.webContents.toggleDevTools();

                }
            },
            {
                label: "刷新", accelerator: "CmdOrCtrl+R", click: function () {
                    ctrlWindow.webContents.reload();
                }
            },
            {
                label: "退出", accelerator: "CmdOrCtrl+Q", click: function () {
                    app.quit();
                }
            },
        ]
    });

    electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(template));

    ctrlWindow.on("closed", function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        app.quit();
        // ctrlWindow = null;
        // webViewWindow = null;
    });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function () {
    // On OS X it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (ctrlWindow === null) {
        createWindow();
    }
});

