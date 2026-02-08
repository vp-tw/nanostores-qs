import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { packageDirectory } from "pkg-dir";

const filesToCopy = ["README.md", "LICENSE"];

const pkgDir = await packageDirectory();
if (!pkgDir) throw new Error("Could not find package directory");
const rootDir = resolve(pkgDir, "../..");
for (const file of filesToCopy) {
  const src = resolve(rootDir, file);
  const dest = resolve(pkgDir, file);
  copyFileSync(src, dest);
}
