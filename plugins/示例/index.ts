import {Structs} from "node-napcat-ts";
import {definePlugin} from "../../src/plugin";

export default definePlugin({
  // 插件名应和文件名一致, 否则可能会出问题
  name: "示例",
  description: "插件描述",
  setup: (ctx: any) => {
    ctx.handle("message", async (e: any) => {
      if(e.raw_message != "12345") return;
      await e.quick_action([Structs.text("上山打老虎111222")])
    })

    // 可设置多个 cron
    // ctx.cron("*/3 * * * * *", () => {
    //   log.info(2131231)
    // })
  }
})