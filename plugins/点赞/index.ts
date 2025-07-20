import {GroupMessage, PrivateFriendMessage, PrivateGroupMessage, Structs} from "node-napcat-ts";
import {log, definePlugin, AsecPluginContext} from "../../src";


const key = ["赞我", "草我", "点赞"];
export default definePlugin({
  name: "点赞",
  description: `点赞插件`,
  usage: `${key.join("|")}`,
  setup: (ctx) => {
    ctx.handle("message", async (e) => {
      if (key.includes(e.raw_message)) {
        if(e.message_type === "group"){
          await sendLike(ctx, e.sender.user_id, e.message_type, e.group_id)
        } else {
          await sendLike(ctx, e.sender.user_id, e.message_type)
        }
      }
    }
  );
  // 每天自动给主人点赞
    ctx.cron(`${Math.floor(Math.random() * 60)} 6 * * *`, async () => {

    })

  },
});

async function sendLike(ctx: AsecPluginContext, uid: number, msgType: "group" | "private", group_id?: number) {
          try {
          await ctx.bot.send_like({
            user_id: uid,
            times: 20,
          });
          await replyMessage(ctx, uid, msgType, group_id)
        } catch (err: any) {
          if (err) {
            // log.error(`[-]插件执行出错: ${err.message}`);
            await replyMessage(ctx, uid, msgType, group_id, err.message)
          }
        }
}

async function replyMessage(ctx: AsecPluginContext, uid: number, msgType: "group" | "private", group_id?: number, err?: string) {
  if(err){
    const limit = err.match("上限") ? true : false
    if(msgType === "group" && !limit){
      await ctx.bot.send_group_msg({group_id: group_id as number, message: [Structs.text(err)]})
    } else if(msgType === "private" && !limit){
      await ctx.bot.send_private_msg({user_id: uid, message: [Structs.text(err)]})
    } else if(msgType === "private" && limit){
      const msg = "已经赞过了喵, 明天再来吧~"
      await ctx.bot.send_private_msg({user_id: uid, message: [Structs.text(msg)]})
    }
  } else {
    if(msgType == "group"){
      await ctx.bot.send_poke({group_id: group_id, user_id: uid})
    } else {
      await ctx.bot.send_poke({user_id: uid})
    }
  }
}