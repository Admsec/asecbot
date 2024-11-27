import { logger, Structs } from "node-napcat-ts";
import { definePlugin } from "../../plugin";

export default definePlugin({
  name: "点赞",
  description: "点赞插件",
  setup: (ctx) => {
    ctx.handle("message", async (e) => {
      const key = ["赞我", "草我", "点赞"];
      if (key.includes(e.raw_message)) {
        try {
          await ctx.bot.send_like({
            user_id: e.sender.user_id,
            times: 20,
          });
          await e.quick_action([Structs.text("已赞（￣︶￣）↗　")])
        } catch (err) {
          if (err.message.match("上限")) {
            await e["quick_action"]([
              Structs.text("今天赞过了哦, 明天再来吧!(●'◡'●)"),
            ], true);
          } else {
            logger.warn(`[-]插件执行出错: ${err.message}`);
            await e["quick_action"]([
              Structs.text(`点赞失败, 原因: ${err.message}`)
            ], true);
          }
        }
      }
    });
  },
});
