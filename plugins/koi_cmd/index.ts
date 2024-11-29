import {Structs} from "node-napcat-ts";
import {join} from "path";
import {existsSync} from "fs";
import {definePlugin} from "../../src";

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
                        const plugins = ctx.plugin.getPlugins();
                        if(!onPluginName) {
                            msg = "[-]请输入要启用的插件名";
                            break;
                        }

                        // 如果缓存里有
                        if(plugins.has(onPluginName)) {
                            if(plugins.get(onPluginName).setup.enable){
                                msg = `[-]插件${onPluginName}已经在运行中`;
                                break;
                            }
                            msg = ctx.plugin.onPlugin(onPluginName);
                        } else {
                        // 从插件目录搜寻插件
                            const onPluginPath = join(process.cwd(), "plugins", onPluginName, "index.ts");
                            if(!existsSync(onPluginPath)){
                                msg = `[-]未找到该插件, 请确认插件存在: ${onPluginName}`
                                break;
                            }
                                const onPluginResult = await ctx.plugin.loadPlugin(onPluginPath)
                                if(!onPluginResult){
                                    msg = `[-]插件启用失败: ${onPluginName}, 具体原因请看日志`
                                    break;
                                }
                                msg = `[+]插件${onPluginName}已启用`
                        }

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
                        const reloadPluginResult = await ctx.plugin.reloadPlugin(reloadPluginName);
                        if(!reloadPluginResult){
                            msg = `[-]插件${reloadPluginName}重载失败`;
                            break;
                        }
                        msg = `[+]插件${reloadPluginName}已重载`;

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
