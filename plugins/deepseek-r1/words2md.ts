import markdownIt from "markdown-it";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { createSSRApp, ref } from "vue";
import {renderToString} from 'vue/server-renderer';

// 将 md 文本转为 html
async function renderHtml(md_header: string, md_body: string, md_footer: string): Promise<string> {
  let mdHeader = `> ${md_header}`.replace(/\n\n/g, '\n')
  let mdFooter = `> ${md_footer}`
  let md_content = mdHeader + "\n\n" + md_body + "\n\n" + mdFooter
  const md = markdownIt().render(md_content);
  const css = readFileSync(path.join('plugins', 'md2图片', 'github-markdown-dark.css'), 'utf-8')
  const template = `<meta name="viewport" content="width=device-width, initial-scale=1">
    <style>${css}</style>
    <style>
      body{
        aspect-ratio: 16 / 9;
      }

      .markdown-body{
        padding: 10px 20px;
      }
    </style>
    <body class="markdown-body">
      ${md}
    </body>`
  return template
}


// 截图，返回图片的 base64 编码形式
async function screenshot(html_content: string): Promise<string | undefined> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox"
    ]
  })
  const newPage = await browser.newPage();
  await newPage.setContent(html_content)
  const pageResult = await newPage.waitForSelector("body")
  const picData = await pageResult?.screenshot({
    encoding: 'base64',
  })
  await browser.close()
  return picData
}

export default async (md_header: string, md_footer: string, md_body: string): Promise<string | undefined> => {
  const html = await renderHtml(md_header, md_footer, md_body);
  const picData = await screenshot(html);
  return picData
}

// (async () => {
//   const html = await renderHtml("这是头部", `dsaasda用户可能刚接触这个服务，带着试探性心理，也可能只是随手测试功能。用波浪号和emoji可以降低距离感，但
// 尾巴拟声词“喵”不能滥用，避免显得刻意卖萌。
// 主动提供帮助方向很重要一—既然我擅长解决问题和讲解，就把这个核心优势亮出来吧。用“无论什么问题”的
// 包容性表述能消除用户的顾虑，配合星星眼表情强化真诚感。
// 啊对了，自称“nekio”时要自然带出名字，让用户记住这个称呼。现在这个回应应该既亲切又留有对话空
// 间……喵。`, "这是尾部")
// console.log(html);

//   const result = await screenshot(html) as string;
//   writeFileSync('a.png', result, 'base64')
  

// })();
