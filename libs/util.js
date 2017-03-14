const fs = require("fs");
const Promise = require("bluebird");
const sha1 = require("sha1");

exports.readFileAsync = (filePath, encoding) => {
    return new Promise((resolve, reject) => {
       fs.readFile(filePath, encoding, (err, content) => {
           if (err) {
               reject(err);
           } else {
               resolve(content);
           }
       });
    });
};

exports.writeFileAsync = (filePath, content) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(content);
            }
        });
    });
};

function createNonce() {
    return Math.random().toString(36).substr(2, 15);
}
function createTimestamp() {
    return parseInt(new Date().getTime() / 1000, 10) + "";
}

exports.sign = (ticket, url) => {
    let noncestr = createNonce();
    let timestamp = createTimestamp();
    let signatrue = sha1(["noncestr=" + noncestr, "jsapi_ticket=" + ticket, "timestamp=" + timestamp, "url=" + url].sort().join("&"));
    return {
        noncestr: noncestr,
        timestamp: timestamp,
        signature: signatrue
    };
}