/*
exports.getTemplateXML = (type, toUser, fromUser, content) => {
    let now = new Date().getTime();
    let pre = `<xml><ToUserName><![CDATA[${toUser}]]></ToUserName><FromUserName><![CDATA[${fromUser}]]></FromUserName><CreateTime>${now}</CreateTime>`;
    switch (type) {
        case "text":
            return pre + `<MsgType><![CDATA[text]]></MsgType>
                          <Content><![CDATA[${content.text}]]></Content>
                          </xml>`;
        case "image":
            return pre + `<MsgType><![CDATA[image]]></MsgType>
                          <Image>
                          <MediaId><![CDATA[${content.media_id}]]></MediaId>
                          </Image>
                          </xml>`;
        case "voice":
            return pre + `<MsgType><![CDATA[voice]]></MsgType>
                          <Voice>
                          <MediaId><![CDATA[${content.media_id}]]></MediaId>
                          </Voice>
                          </xml>`;
        case "vedio":
            return pre + `<MsgType><![CDATA[video]]></MsgType>
                          <Video>
                          <MediaId><![CDATA[${content.media_id}]]></MediaId>
                          <Title><![CDATA[${content.title}]]></Title>
                          <Description><![CDATA[${content.description}]]></Description>
                          </Video>
                          </xml>`;
        case "music":
            return pre + `<MsgType><![CDATA[music]]></MsgType>
                          <Music>
                          <Title><![CDATA[${content.TITLE}]]></Title>
                          <Description><![CDATA[${content.DESCRIPTION}]]></Description>
                          <MusicUrl><![CDATA[${content.MUSIC_Url}]]></MusicUrl>
                          <HQMusicUrl><![CDATA[${content.HQ_MUSIC_Url}]]></HQMusicUrl>
                          <ThumbMediaId><![CDATA[${content.media_id}]]></ThumbMediaId>
                          </Music>
                          </xml>`;
        case "news": {
            let temp = pre + `<MsgType><![CDATA[news]]></MsgType>
                              <ArticleCount>${content.length}</ArticleCount>
                              <Articles>`;
            content.forEach((item) => {
                temp + `<item>
                        <Title><![CDATA[${item.title1}]]></Title> 
                        <Description><![CDATA[${item.description}]]></Description>
                        <PicUrl><![CDATA[${item.picurl}]]></PicUrl>
                        <Url><![CDATA[${item.url}]]></Url>
                        </item>`;
            });
            return temp + `</Articles></xml>`;
        }
        default:
            break;
    }

}
*/

let ejs = require("ejs");
let heredoc = require("heredoc");
let tpl = heredoc(() => {
    /*
    <xml>
    <ToUserName><![CDATA[<%= toUser %>]]></ToUserName>
    <FromUserName><![CDATA[<%= fromUser %>]]></FromUserName>
    <CreateTime><%= createTime %></CreateTime>
    <MsgType><![CDATA[<%= msgType %>]]></MsgType>
    <% if (msgType === "text") { %>
        <Content><![CDATA[<%- content %>]]></Content>
    <% } else if (msgType === "image") { %>
        <Image>
            <MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
        </Image>
    <% } else if (msgType === "voice") { %>
        <Voice>
            <MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
        </Voice>
    <% } else if (msgType === "video") { %>
        <Video>
            <MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
            <Title><![CDATA[<%= content.title %>]]></Title>
            <Description><![CDATA[<%= content.description %>]]></Description>
        </Video>
    <% } else if (msgType === "music") { %>
        <Music>
            <Title><![CDATA[<%= content.TITLE %>]]></Title>
            <Description><![CDATA[<%= content.DESCRIPTION %>]]></Description>
            <MusicUrl><![CDATA[<%= content.MUSIC_Url %>]]></MusicUrl>
            <HQMusicUrl><![CDATA[<%= content.HQ_MUSIC_Url %>]]></HQMusicUrl>
            <ThumbMediaId><![CDATA[<%= content.media_id %>]]></ThumbMediaId>
        </Music>
    <% } else if (msgType === "news") { %>
        <ArticleCount><%= content.length %></ArticleCount>
        <Articles>
        <% content.forEach((item) => { %>
            <item>
                <Title><![CDATA[<%= item.title %>]]></Title>
                <Description><![CDATA[<%= item.description %>]]></Description>
                <PicUrl><![CDATA[<%= item.picurl %>]]></PicUrl>
                <Url><![CDATA[<%= item.url %>]]></Url>
            </item>
        <% }) %>
        </Articles>
    <% } %>
    </xml>
    */
});
let compiled = ejs.compile(tpl);
exports = module.exports = {
    compiled: compiled
};
