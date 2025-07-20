import {Structs} from "node-napcat-ts";
import {definePlugin, log} from "../../src"
import ai_api from "./ai_api";
import words2md from "./words2md";


export default definePlugin({
  // 插件名应和文件名一致, 不然可能会出问题
  name: "md2图片",
  description: "实现 md 和图片互转",
  setup: (ctx) => {
    ctx.handle("message", async (e) => {
      if(e.raw_message.startsWith("%")) {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).replace(/\//g, '/');
        const question = e.raw_message.slice(1)
        await ctx.bot.send_poke({user_id: e.sender.user_id})
        const start = Date.now()
        const aiReply = await ai_api(question)
        const md_header = `思考内容: ${aiReply.reasoning_content}`
        const md_body = aiReply.reply
        const md_footer = `用户 ${e.sender.nickname} 提问于 ${formattedDate}, 思考时间: ${Math.floor((Date.now() - start) / 1000)}秒`
        const picData = await words2md(md_header, md_body, md_footer)
        await e.quick_action([Structs.image("base64://" + picData as string)])
      }
    })
  }
})