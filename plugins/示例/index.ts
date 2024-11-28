import { Structs } from "node-napcat-ts";
import { definePlugin } from "../../src/plugin";

export default definePlugin({
  name: "示例",
  description: "插件描述",
  setup: (ctx) => {
    ctx.handle("message", async (e) => {
      if(e.raw_message != "12345") return;

      await e.quick_action([Structs.text("上山打老虎")])
    })
  }
})