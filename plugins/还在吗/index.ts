import { Structs } from "node-napcat-ts";
import {definePlugin} from "../../src/plugin";


export default definePlugin({
    name: "还在吗",
    description: "显示当前 Bot 的运行时间和内存占用",
    usage: "还在吗",
    admin: true,
    setup: (ctx) => {
        ctx.handle("message", async (e) => {
            if(!ctx.isMaster(e.sender.user_id)) return;
            if(e.raw_message == "还在吗"){
                const memoryUsage = process.memoryUsage().rss;
                const msg =  `在的喵~！已经运行了${formatTime(process.uptime())}啦~\n当前内存使用: ${(memoryUsage / 1024 ** 2).toFixed(2)}MB`
                await e.quick_action([Structs.text(msg)])
            }
        })

    }
})



function formatTime(time: number){
    let result = ``
    let minute = 0
    let hour = 0
    let day = 0
    // 如果分钟够60分钟
    if(time / 3600 > 0){
        minute =  Math.floor((time % 3600) / 60)
        hour = Math.floor((time / 3600))
    }
    // 如果小时够24小时
    if(hour > 24){
        day = Math.floor(hour / 24)
        hour = Math.floor((time / 3600) % 24)
    }
    if(day) result += day + "天";
    if(hour) result += hour + "小时";
    if(minute) result += minute + "分钟";
    if(!result.length){ result += Math.floor(time % 60) + "秒"}
    return result
}