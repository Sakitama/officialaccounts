const Promise = require("bluebird");
const request = Promise.promisify(require("request"));
const prefix = "https://api.weixin.qq.com/cgi-bin/";
const path = require("path");
const wechatAccessTokenFile = path.join(__dirname, "../wechataccesstoken/wechat.txt");
const wechatJSapiTicketFile = path.join(__dirname, "../wechatjsapiticket/wechat.txt");
const api = {
    getAccessTokenUrl: prefix + "token?grant_type=client_credential&",
    temporary: {
        uploadUrl: prefix + "media/upload?",
        downloadUrl: prefix + "media/get?"
    },
    permanent: {
        uploadUrl: {
            news: prefix + "material/add_news?",
            newsImg: prefix + "media/uploadimg?",
            other: prefix + "material/add_material?"
        },
        downloadUrl: prefix + "material/get_material?",
        deleteUrl: prefix + "material/del_material?",
        updateUrl: prefix + "material/update_news?"
    },
    getMaterialCountUrl: prefix + "material/get_materialcount?",
    getPermanentMaterialListUrl: prefix + "material/batchget_material?",
    userManage: {
        userGroupManageUrl: {
            createGroup: prefix + "groups/create?",
            getGroup: prefix + "groups/get?",
            getUserGroup: prefix + "groups/getid?",
            updateGroupName: prefix + "groups/update?",
            moveUserGroup: prefix + "groups/members/update?",
            batchMoveUserGroup: prefix + "groups/members/batchupdate?",
            deleteGroup: prefix + "groups/delete?"
        },
        setUserRemarkName: prefix + "user/info/updateremark?",
        getUserBasicInformation: prefix + "user/info?",
        batchGetUserBasicInformation: prefix + "user/info/batchget?",
        getUserList: prefix + "user/get?"
    },
    messageMange: {
        massMessage: {
            groupMassMessage: prefix + "message/mass/sendall?",
            openidListMassMessage: prefix + "message/mass/send?",
            deleteMassMessage: prefix + "message/mass/delete?",
            previewMassMessage: prefix + "message/mass/preview?",
            queryMassMessageSendStatus: prefix + "message/mass/get?"
        }
    },
    customMenu: {
        createMenu: prefix + "menu/create?",
        queryMenu: prefix + "menu/get?",
        deleteMenu: prefix + "menu/delete?",
        getCustomMenuConfiguration: prefix + "get_current_selfmenu_info?"
    },
    accountManage: {
        withArgumentQRCode: {
            createQRCodeTicket: prefix + "qrcode/create?",
            longToShort: prefix + "shorturl?"
        }
    },
    wechatIntelligence: {
        semanticUnderstand: "https://api.weixin.qq.com/semantic/semproxy/search?"
    },
    jsapiTicket: prefix + "ticket/getticket?"
};
const util = require("./util");
const fs = require("fs");
const _ = require("lodash");

class Wechat {
    constructor(config) {
        this.appID = config.appID;
        this.appSecret = config.appSecret;
        this.get = config.get;
        this.save = config.save;
    }
    isValidAccessToken(data) {
        if (!data.access_token || !data.expires_in) {
            return false;
        }
        let accessToken = data.access_token;
        let expiresIn = data.expires_in;
        let now = new Date().getTime();

        if (now < expiresIn) {
            return true;
        } else {
            return false;
        }
    }
    updateAccessToken() {
        let appID = this.appID;
        let appSecret = this.appSecret;
        let url = `${api.getAccessTokenUrl}appid=${appID}&secret=${appSecret}`;
        return new Promise((resolve, reject) => {
            request({
                url: url,
                json: true
            }).then((response) => {
                let data = response.body;
                let now = new Date().getTime();
                let expiresIn = now + (data.expires_in - 20) * 1000;
                data.expires_in = expiresIn;
                resolve(data);
            }).catch((err) => {
                reject(err);
            });
        });
    }
    reply() {
        let content = this.body;
        let message = this.weixin;
        let xml = util.tpl(content, message);

        this.status = 200;
        this.type = "application/xml";
        this.body = xml;
    }
    fetchAccessToken() {
        let that = this;
        return new Promise((resolve, reject) => {
            that.get(wechatAccessTokenFile).then((data) => {
                //尝试解析
                try {
                    data = JSON.parse(data);
                }
                catch (err) { //解析失败，指定文件内容为空
                    return that.updateAccessToken(); //重新获取acess_token
                }
                //成功解析acess_token
                if (that.isValidAccessToken(data)) { //有效的acess_token
                    return Promise.resolve(data);
                } else { //过期的acess_token
                    return that.updateAccessToken(); //重新获取acess_token
                }
            }).then((data) => {
                return that.save(wechatAccessTokenFile, data);
            }).then((data) => {
                resolve(JSON.parse(data));
            }).catch((err) => {
                reject(err);
            });
        });
    }
    isValidJSapiTicket(data) {
        if (!data.ticket || !data.expires_in) {
            return false;
        }
        let ticket = data.ticket;
        let expiresIn = data.expires_in;
        let now = new Date().getTime();

        if (ticket && now < expiresIn) {
            return true;
        } else {
            return false;
        }
    }
    updateJSapiTicket(access_token) {
        let url = `${api.jsapiTicket}access_token=${access_token}&type=jsapi`;
        return new Promise((resolve, reject) => {
            request({
                method: "GET",
                url: url,
                json: true
            }).then((response) => {
                let data = response.body;
                let now = new Date().getTime();
                let expiresIn = now + (data.expires_in - 20) * 1000;
                data.expires_in = expiresIn;
                resolve(data);
            }).catch((err) => {
                reject(err);
            });
        });
    }
    fetchJSapiTicket() {
        let that = this;
        return new Promise((resolve, reject) => {
            that.get(wechatJSapiTicketFile).then((data) => {
                //尝试解析
                try {
                    data = JSON.parse(data);
                }
                catch (err) { //解析失败，指定文件内容为空
                    return that.fetchAccessToken().then((_data) => {
                        return that.updateJSapiTicket(_data.access_token);
                    }).catch((err) => {
                        console.error(err);
                    }); //重新获取jsapi_token
                }
                //成功解析jsapi_token
                if (that.isValidJSapiTicket(data)) { //有效的jsapi_token
                    return Promise.resolve(data);
                } else { //过期的jsapi_token
                    return that.fetchAccessToken().then((_data) => {
                        return that.updateJSapiTicket(_data.access_token);
                    }).catch((err) => {
                        console.error(err);
                    }); //重新获取jsapi_token
                }
            }).then((data) => {
                return that.save(wechatJSapiTicketFile, data);
            }).then((data) => {
                resolve(JSON.parse(data));
            }).catch((err) => {
                reject(err);
            });
        });
    }
    getPermanentMaterialList(options) {
        let that = this;
        options.type = options.type || "image";
        options.offset = options.offset || 0;
        options.count = options.count || 1;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.getPermanentMaterialListUrl}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: options,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Get Permanent Material List failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    getMaterialCount() {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.getMaterialCountUrl}access_token=${data.access_token}`;
                request({
                    method: "GET",
                    url: url,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Get Material Count failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    updatePermanentNewsMaterial(mediaID, news) {
        let that = this;
        let form = {
            media_id: mediaID
        };
        _.extend(form, news);
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.permanent.updateUrl}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: form,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Update Permanent News Material failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    deletePermanentMaterial(mediaID) {
        let that = this;
        let form = {
            media_id: mediaID
        };
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.permanent.deleteUrl}access_token=${data.access_token}`;
                form.access_token = data.access_token;
                request({
                    method: "POST",
                    url: url,
                    body: form,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Delete permanent material failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    downloadTemporaryMaterial(mediaID, type) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.temporary.downloadUrl}access_token=${data.access_token}&media_id=${mediaID}`;
                if (type === "video") { //获取视频临时文件，视频文件不支持https下载，调用该接口需http协议。
                    url.replace("https", "http");
                }
                request({
                    method: "GET",
                    url: url,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Download temporary material failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    downloadPermanentMaterial(mediaID) {
        let that = this;
        let form = {
            media_id: mediaID
        };
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.permanent.downloadUrl}access_token=${data.access_token}`;
                form.access_token = data.access_token;
                request({
                    method: "POST",
                    url: url,
                    body: form,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Download temporary material failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    uploadTemporaryMaterial(type, filepath) {
        let that = this;
        let form = {};
        form.media = fs.createReadStream(filepath);
        form.type = type;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.temporary.uploadUrl}access_token=${data.access_token}&type=${type}`;
                form.access_token = data.access_token;
                let options = {
                    method: "POST",
                    url: url,
                    formData: form,
                    json: true
                };
                request(options).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Upload temporary material failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    uploadPermanentMaterial(type, material, permanent) {
        let that = this;
        let form = {};
        let pre = api.permanent.uploadUrl.other; //默认情况，上传永久普通素材
        _.extend(form, permanent);
        if (type === "newsImg") { //上传永久图文素材里的图片
            pre = api.permanent.uploadUrl.newsImg;
        }
        if (type === "news") { //上传永久图文素材
            pre = api.permanent.uploadUrl.news;
            form = material; //material是一个数组
        } else {
            form.media = fs.createReadStream(material); //否则material就是一个文件路径
        }
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let finalUploadUrl = `${pre}access_token=${data.access_token}`;
                if (type !== "news") {
                    form.access_token = data.access_token;
                }
                let options = {
                    method: "POST",
                    url: finalUploadUrl,
                    json: true
                };
                if (type === "news") {
                    options.body = form;
                } else {
                    options.formData = form;
                }
                request(options).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Upload permanent material failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    createGroup(name) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.userGroupManageUrl.createGroup}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {"group":{"name":name}},
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Create group failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    getGroup(name) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.userGroupManageUrl.getGroup}access_token=${data.access_token}`;
                request({
                    method: "GET",
                    url: url,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Get group failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    getUserGroup(openid) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.userGroupManageUrl.getUserGroup}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {"openid":openid},
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Get user group failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    updateGroupName(id, name) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.userGroupManageUrl.updateGroupName}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {"group":{"id":id,"name":name}},
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Update group name failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    moveUserGroup(openid, toGroupid) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.userGroupManageUrl.moveUserGroup}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {"openid":openid,"to_groupid":toGroupid},
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Move user group failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    batchMoveUserGroup(openidList, toGroupid) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.userGroupManageUrl.batchMoveUserGroup}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {"openid_list":openidList,"to_groupid":toGroupid},
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Batch move user group failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    deleteGroup(id) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.userGroupManageUrl.deleteGroup}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {"group":{"id":id}},
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Delete group failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    setUserRemarkName(openid, remark) { //开发者可以通过该接口对指定用户设置备注名，该接口暂时开放给微信认证的服务号。
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.setUserRemarkName}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {"openid":openid,"remark":remark},
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Set user remark name failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    getUserBasicInformation(openid, lang) {
        let that = this;
        lang = lang || "zh_CN";
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.getUserBasicInformation}access_token=${data.access_token}&openid=${openid}&lang=${lang}`;
                request({
                    method: "GET",
                    url: url,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Get user basic information failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    batchGetUserBasicInformation(userlist) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.batchGetUserBasicInformation}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {"user_list":userlist},
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Batch get user basic information failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    getUserList(next_openid) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.userManage.getUserList}access_token=${data.access_token}`;
                if (next_openid) {
                    url += `&next_openid=${next_openid}`;
                }
                request({
                    method: "GET",
                    url: url,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Get user list failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    groupMassMessage(type, data, group_id) { //根据分组进行群发，订阅号与服务号认证后均可用，暂不支持视频类型。
        let that = this;
        let options = {
            msgtype: type,
            filter: {},
        };
        options[type] = data;
        if (!group_id) { //群发
            options.filter.is_to_all = true;
        } else { //发送给指定分组
            options.filter = {
                is_to_all: false,
                group_id: group_id
            }
        }
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.messageMange.massMessage.groupMassMessage}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: options,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Group mass message failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    openidListMassMessage(type, data, openidList) { //根据OpenID列表群发，订阅号不可用，服务号认证后可用，暂不支持视频类型。
        let that = this;
        let options = {
            msgtype: type,
            touser: openidList
        };
        options[type] = data;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.messageMange.massMessage.openidListMassMessage}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: options,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Openid list mass message failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    deleteMassMessage(msgid) { //删除群发，订阅号与服务号认证后均可用。
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.messageMange.massMessage.deleteMassMessage}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {
                        "msg_id": msgid
                    },
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Delete mass message failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    previewMassMessage(type, data, openid) { //预览接口，订阅号与服务号认证后均可用，暂不支持视频类型。
        let that = this;
        let options = {
            msgtype: type,
            touser: openid
        };
        options[type] = data;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.messageMange.massMessage.previewMassMessage}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: options,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Preview mass message failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    queryMassMessageSendStatus(msgid) { //查询群发消息发送状态，订阅号与服务号认证后均可用。
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.messageMange.massMessage.queryMassMessageSendStatus}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {
                        "msg_id": msgid
                    },
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Query mass message send status failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    createMenu(buttons) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.customMenu.createMenu}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: {
                        "button": buttons
                    },
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Create menu failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    queryMenu() {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.customMenu.queryMenu}access_token=${data.access_token}`;
                request({
                    method: "GET",
                    url: url,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Query menu failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    deleteMenu() {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.customMenu.deleteMenu}access_token=${data.access_token}`;
                request({
                    method: "GET",
                    url: url,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Delete menu failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    getCustomMenuConfiguration() {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.customMenu.getCustomMenuConfiguration}access_token=${data.access_token}`;
                request({
                    method: "GET",
                    url: url,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Get custom menu configuration failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    createQRCode(qr) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.accountManage.withArgumentQRCode.createQRCodeTicket}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: qr,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        return _data;
                    } else {
                        reject(new Error("Create QRCode ticket failed"));
                    }
                }).then((data) => {
                    resolve(`https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURI(data.ticket)}`);
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    longToShort(options) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.accountManage.withArgumentQRCode.longToShort}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: options,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Long to short failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
    semanticUnderstand(data) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.fetchAccessToken().then((data) => {
                let url = `${api.wechatIntelligence.semanticUnderstand}access_token=${data.access_token}`;
                request({
                    method: "POST",
                    url: url,
                    body: data,
                    json: true
                }).then((response) => {
                    let _data = response.body;
                    if (_data) {
                        resolve(_data);
                    } else {
                        reject(new Error("Semantic understand failed"));
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
}

module.exports = Wechat;