import {Structs} from "node-napcat-ts";
import {definePlugin, log} from "../../src/"
import { render } from "./render";
import puppeteer from "puppeteer";

export default definePlugin({
  // 插件名应和文件名一致, 不然可能会出问题
  name: "帮助面板",
  description: "帮助面板",
  usage: "帮助 | help",
  setup: (ctx) => {
        ctx.handle("message", async (e) => {
          if(e.raw_message == "help" || e.raw_message == "帮助"){
            const pluginsMap = await ctx.plugin.getPlugins()
            pluginsMap.delete("示例");
            const pluginArray = Array.from(pluginsMap, ([name, pluginData]) => ({
              name: name,
              desc: pluginData.description,
              admin: pluginData.admin,
              usage: pluginData.usage
            }));
            const renderer = await render(pluginArray)
            const b64Data = await html2img(renderer)
            e.quick_action([Structs.image("base64://" + b64Data)])
          }
        })
  }
})

async function html2img(html: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox"
    ]
  })
  const newPage = await browser.newPage();
  await newPage.setContent(html)
  const pageResult = await newPage.waitForSelector("#app")
  const b64Data = await pageResult?.screenshot({encoding: 'base64'})
  await newPage
  await browser.close()
  return b64Data
}