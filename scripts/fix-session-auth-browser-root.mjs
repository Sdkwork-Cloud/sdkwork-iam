import fs from "node:fs";

const paths = [
  "E:/sdkwork-space/sdkwork-commerce/apps/sdkwork-commerce-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-games/apps/sdkwork-games-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-skills/apps/sdkwork-skills-pc/src/main.tsx",
  "E:/sdkwork-space/sdkwork-notary/apps/sdkwork-notary-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-documents/apps/sdkwork-documents-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-dezhou/apps/sdkwork-dezhou-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-gameengine/apps/sdkwork-gameengine-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-knowledgebase/apps/sdkwork-knowledgebase-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-mall/apps/sdkwork-mall-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-im/apps/sdkwork-im-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-rtc/apps/sdkwork-rtc-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-mail/apps/sdkwork-mail-pc/src/App.tsx",
  "E:/sdkwork-space/sdkwork-drive/apps/sdkwork-drive-pc/src/main.tsx",
];

for (const file of paths) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/`n/g, "\n");
  content = content.replace(
    /(import \{ SdkworkSessionAuthBrowserRoot \} from '@sdkwork\/auth-pc-react';\n)+/g,
    "import { SdkworkSessionAuthBrowserRoot } from '@sdkwork/auth-pc-react';\n",
  );
  fs.writeFileSync(file, content);
  console.log("fixed", file);
}
