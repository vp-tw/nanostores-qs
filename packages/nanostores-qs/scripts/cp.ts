import fs from "fs-extra";
import path from "pathe";
import { packageDirectory } from "pkg-dir";

const filesToCopy = ["README.md", "LICENSE"];

(async () => {
  const pkgDir = await packageDirectory();
  if (!pkgDir) throw new Error("Could not find package directory");
  const rootDir = path.resolve(pkgDir, "../..");
  for (const file of filesToCopy) {
    const src = path.join(rootDir, file);
    const dest = path.join(pkgDir, file);
    await fs.copy(src, dest);
  }
})();
