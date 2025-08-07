import {Structs} from "node-napcat-ts";
import {definePlugin} from "../../src/plugin";
import ai_api from "./ai_api";
import words2md from "./words2md";

export default definePlugin({
  // 插件名应和文件名一致, 否则可能会出问题
  name: "deepseek-r1",
  description: "Ai问答",
  usage: "%[想问的问题] | [引用消息]%",
  setup: (ctx: any) => {
    ctx.handle("message", async (e: any) => {
      if(e.raw_message.startsWith("%")) {
        const question = e.raw_message.slice(1)
        if(!question) return
        await ctx.bot.send_poke({user_id: e.sender.user_id})
        const picData = await ask_question(question, e.sender.nickname)
        await e.quick_action([Structs.image("base64://" + picData as string)])
      }
      if(e.raw_message.endsWith("%")){
        const historyMessageId = parseInt(e.message.filter((value: any) => value.type === "reply")[0]?.data?.id)
        if(e.message_type === "group"){
          const groupHistory = await ctx.bot.get_group_msg_history({group_id: e.group_id})
          const quoteMessages = groupHistory.messages.filter((value: any) => value.message_id === historyMessageId)
          if(quoteMessages){
            const quoteMessage = quoteMessages[0].raw_message
            await ctx.bot.send_poke({user_id: e.sender.user_id})
            const picData = await ask_question(quoteMessage, e.sender.nickname)
            await e.quick_action([Structs.image("base64://" + picData as string)])
          }
        } else {
          const privHistory = await ctx.bot.get_friend_msg_history({user_id: e.sender.user_id})
          const quoteMessages = privHistory.messages.filter((value: any) => value.message_id === historyMessageId)
          if(quoteMessages){
            const quoteMessage = quoteMessages[0].raw_message
            await ctx.bot.send_poke({user_id: e.sender.user_id})
            const picData = await ask_question(quoteMessage, e.sender.nickname)
            await e.quick_action([Structs.image("base64://" + picData as string)])
          }
        }
        
      }
    })
  }
})

async function ask_question(question: string, nickname: string) {
          const now = new Date();
        const formattedDate = now.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).replace(/\//g, '/');
        const start = Date.now()
        const aiReply = await ai_api(question)
        const md_header = `思考内容: ${aiReply.reasoning_content}`
        const md_body = aiReply.reply
        const md_footer = `用户 ${nickname} 提问于 ${formattedDate}, 思考时间: ${Math.floor((Date.now() - start) / 1000)}秒`
        const picData = await words2md(md_header, md_body, md_footer)
        return picData
}