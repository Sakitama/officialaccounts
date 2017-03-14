const sha1 = require("sha1");
const Wechat = require("./Wechat");
const rawBody = require("raw-body");
const util = require("./util");

module.exports = (config, handler) => {
    let wechat = new Wechat(config);

    return function* (next) {
        /*
         * 获取来自微信服务器的请求，this.query是一个对象，具有signature、nonce、timestamp和echostr4个属性
         * 把自定义的Token、timestamp和nonce进行字典排序和sha1加密，和signature进行比对
         * */
        let token = config.token;
        let signature = this.query.signature;
        let nonce = this.query.nonce;
        let timestamp = this.query.timestamp;
        let echostr = this.query.echostr;
        let str = [token, timestamp, nonce].sort().join("");
        let sha = sha1(str);
        let method = this.method;

        if (method === "GET") { //微信服务器通过GET请求验证开发者身份
            if (sha === signature) {
                this.body = echostr + "";
            } else {
                this.body = "wrong";
            }
        } else if (method === "POST") { //来自用户的请求
            if (sha !== signature) { //签名不合法
                this.body = "wrong";
                return false;
            }
            let data = yield rawBody(this.req, { //把this上的request对象，其实也就是http模块中的request对象，去拼装它的数据，最终可以拿到一个buffer的xml数据
                length: this.length,
                limit: "1mb",
                encoding: this.charset
            });
            /*console.log(data.toString()); 当我首次关注我的接口测试号的时候
             <xml><ToUserName><![CDATA[gh_0d9fc913b0bf]]></ToUserName>
             <FromUserName><![CDATA[ojSeOxMPAxz4yq5xC1VkBBGpNLzU]]></FromUserName>
             <CreateTime>1488552826</CreateTime>
             <MsgType><![CDATA[event]]></MsgType>
             <Event><![CDATA[subscribe]]></Event>
             <EventKey><![CDATA[]]></EventKey>
             </xml>*/
            let content = yield util.parseXMLAsync(data);
            /*console.log(content);
            { xml:
            { ToUserName: [ 'gh_0d9fc913b0bf' ],
                FromUserName: [ 'ojSeOxMPAxz4yq5xC1VkBBGpNLzU' ],
                CreateTime: [ '1488555613' ],
                MsgType: [ 'event' ],
                Event: [ 'subscribe' ],
                EventKey: [ '' ] } }*/
            let message = util.formatMessage(content.xml);
            /*console.log(message);
             { ToUserName: 'gh_0d9fc913b0bf',
             FromUserName: 'ojSeOxMPAxz4yq5xC1VkBBGpNLzU',
             CreateTime: '1488694978',
             MsgType: 'event',
             Event: 'subscribe',
             EventKey: '' }
             */
            this.weixin = message;
            yield handler.call(this, next);
            wechat.reply.call(this);
        }
    }
};

