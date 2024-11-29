import {Structs} from "node-napcat-ts";
import {definePlugin, log} from "../../src/"

export default definePlugin({
  // 插件名应和文件名一致, 不然可能会出问题
  name: "示例",
  description: "插件描述",
  setup: (ctx) => {
    ctx.handle("message", async (e) => {
      if(e.raw_message != "12345") return;
      await e.quick_action([Structs.text("上山打老虎")])
    })
  }
})