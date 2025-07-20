import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { createSSRApp, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";

interface plugin {
  name: string;
  desc: string;
  admin: boolean,
  usage: string
}

export async function render(plugins: plugin[]) {
  const app = createSSRApp(
    defineComponent({
      async setup() {
        const versionFile = JSON.parse(readFileSync('package.json', 'utf-8'))
        const version = versionFile.version;
        return {
          version,
          plugins
        };
      },
      template: readFileSync(path.join('plugins', '帮助', "index.html"), "utf-8"),
    })
  );
  return renderToString(app);
}

// (async () => {
//   const result = await renderToString(app);
//   writeFileSync("output.html", result);
// })();
