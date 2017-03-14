let xml2js = require("xml2js"); //把xml转换为js对象
let Promise = require("bluebird");
let tpl = require("./tpl");

exports.parseXMLAsync = (xml) => new Promise((resolve, reject) => {
   xml2js.parseString(xml, {
       trim: true
   }, (err, content) => {
       if (err) reject(err);
       else resolve(content);
   });
});

function formatMessage(result) { //xml转换成的js对象可能存在嵌套结构，实现一个遍历过程，获得一个只有一层键值对的对象
    let message = {};
    if (typeof result === "object") {
        let keys = Object.keys(result); //获取该对象所有可枚举属性
        keys.forEach((item) => {
            let value = result[item];
            if (!Array.isArray(value) || value.length === 0) {
                return;
            }
            if (value.length === 1) {
                let val = value[0];
                if (typeof val === "object") {
                    message[item] = formatMessage(val);
                } else {
                    message[item] = (val || "").trim();
                }
            } else {
                message[item] = [];
                value.forEach((newItem) => {
                    message[item].push(formatMessage(newItem));
                });
            }
        });
    }
    return message;
}

exports.formatMessage = formatMessage;
exports.tpl = (content, message) => {
    let info = {};
    let type = "text";
    let fromUser = message.FromUserName;
    let toUser = message.ToUserName;
    if (Array.isArray(content)) { //图文消息
        type = "news";
    }
    type = content.type || type;
    info.content = content;
    info.createTime = new Date().getTime();
    info.msgType = type;
    info.toUser = fromUser;
    info.fromUser = toUser;
    return tpl.compiled(info);
};