import {Structs} from "node-napcat-ts";
import {definePlugin} from "../../src/plugin";

export default definePlugin({
  // 插件名应和文件名一致, 否则可能会出问题
  name: "取图片",
  description: "简单的取图片插件",
  usage: "[引用消息]取图片 | [图片]取图片",
  setup: (ctx: any) => {
    ctx.handle("message", async (e: any) => {
      if(e.raw_message.match("取图片")){
        // 从当前消息取图片
        let imageUrl = e.message.filter((value: any) => value.type === "image")[0]?.data.url
        // 从引用消息取图片
        if(!imageUrl){
          const quoteMessageId = parseInt(e.message.filter((value: any) => value.type === 'reply')[0]?.data.id)
          if(e.message_type === "group"){
            const historyMessage = await ctx.bot.get_group_msg_history({group_id: e.group_id})
            const message = historyMessage.messages.filter((value: any) => value.message_id === quoteMessageId)[0]
            imageUrl = message.message.filter((value: any) => value.type === 'image')[0]?.data.url
          } else {
            const historyMessage = await ctx.bot.get_friend_msg_history({user_id: e.sender.user_id})
            const message = historyMessage.messages.filter((value: any) => value.message_id === quoteMessageId)[0]
            imageUrl = message.message.filter((value: any) => value.type === 'image')[0]?.data.url
          }
        }
        if(imageUrl){
            await e.quick_action([Structs.image(imageUrl), Structs.text(imageUrl)], true)
          }
        
      }
      
    })
  }
})