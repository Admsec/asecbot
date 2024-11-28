import {Structs} from "node-napcat-ts";
import {definePlugin} from "../../src/plugin";

export default definePlugin({
    name: "koi_cmd",
    version: "0.1.0",
    description: "基础插件",
    setup: async (ctx) => {
        ctx.handle("message", async (e) => {
            if (!ctx.isMaster(e)) return;
            if (e.raw_message.startsWith(".p")) {
                let msg = "", count = 0;
                const key = e.raw_message.split(" ")
                msg += "〓 插件列表 〓 \n"
                switch (key?.[1]) {
                    case "ls":
                        const pluginMap = ctx.plugin.getPlugins();
                        pluginMap.forEach((value, index) => {
                            if(value.setup.enable){
                                msg += `🟢 ${index}`
                            } else {
                                msg += `🔴 ${index}`
                            }
                            if(++count != pluginMap.size){
                                msg += "\n"
                            }
                        })
                        break;
                    case 'on':
                        const onPluginName = key?.[2];
                        if(!onPluginName) {
                            msg = "[-]请输入要启用的插件名";
                            break;
                        }
                        const onPluginResult = ctx.plugin.onPlugin(onPluginName);
                        msg = onPluginResult;
                        break;
                    case 'off':
                        const offPluginName = key?.[2];
                        if(!offPluginName) {
                            msg = "[-]请输入要启用的插件名";
                            break;
                        }
                        const offPluginResult = ctx.plugin.offPlugin(offPluginName);
                        msg = offPluginResult;
                        break;
                    case 'reload':
                        const reloadPluginName = key?.[2];
                        if(!reloadPluginName) {
                            msg = "[-]请输入要重载的插件名";
                            break;
                        }
                        const reloadPluginResult = ctx.plugin.reloadPlugin(reloadPluginName);
                        msg = await reloadPluginResult;
                        break;
                    default:
                        msg = help();
                }
                await e.quick_action([Structs.text(msg)])
            }
            function help() {
                return `.p 查看帮助\n.p ls 插件列表\n.p on [插件] 启用插件\n.p off [插件] 禁用插件\n.p reload [插件] 重载插件`;
            }
        })
    }
})
