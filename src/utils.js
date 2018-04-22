const fs = require("fs");
const path = require("path");
const os = require("os");
const url = require("url");
const request = require("request");

const DATA_DIR = path.join(os.homedir(), "WebClone");
const DB_FILE = path.join(DATA_DIR, "db.json");

mkdirsSync(DATA_DIR);

// 递归创建文件夹
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) return true;
    else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
    return false;
}

function downloadFile(uri, filename) {
    mkdirsSync(path.dirname(filename));
    return new Promise((resolve, reject) => {
        let stream = fs.createWriteStream(filename);
        request(uri).pipe(stream).on("close", () => {
            resolve();
        }).on("error", (err) => {
            reject(err);
        });

    });
}

function to_local_path(remoteUrl) {
    const remoteURL = url.parse(remoteUrl);

    let host = remoteURL.host.replace(":", "-"); //文件名不允许包含引号`:`
    let pathname = remoteURL.pathname;
    if (pathname.endsWith('/')) pathname = pathname + "index.html";
    let protocol = remoteURL.protocol;

    let localPath = DATA_DIR;

    switch (protocol) {
        case 'http:':
            localPath = path.join(localPath, "http");
            break;
        case 'https:':
            localPath = path.join(localPath, "https");
            break;
        default:
            console.warn("Invalid url:" + remoteUrl);
            throw new Error("Invalid url:" + remoteUrl)
    }

    localPath = path.join(
        localPath,
        host,
        pathname
    );

    return localPath
}

module.exports = {
    DB_FILE: DB_FILE,
    to_local_path: to_local_path,
    downloadFile: downloadFile
};
