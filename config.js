const util = require("./libs/util");
const config = {
    wechat: {
        appID: "wxeabf7da22d88014a",
        appSecret: "0521449d2c3858fbdd8ac46983b4266b",
        token: "myfirstwechat",
        get: (filepath) => {
            return util.readFileAsync(filepath);
        },
        save: (filepath, data) => {
            data = JSON.stringify(data);
            return util.writeFileAsync(filepath, data);
        }
    }
};
module.exports = config;