import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appNodeModules = path.join(appRoot, "node_modules");
const capstoneDir = path.resolve(appRoot, "..");
const capstoneNodeModules = path.join(capstoneDir, "node_modules");

function main() {
  if (!fs.existsSync(appNodeModules)) {
    console.error(
      "ensure-capstone-node-modules: node_modules missing in app; run npm install"
    );
    process.exit(1);
  }

  try {
    const st = fs.lstatSync(capstoneNodeModules);
    if (st.isSymbolicLink()) {
      const target = fs.realpathSync(capstoneNodeModules);
      const expected = fs.realpathSync(appNodeModules);
      if (target === expected) return;
      fs.unlinkSync(capstoneNodeModules);
    } else if (st.isDirectory()) {
      console.warn(
        "ensure-capstone-node-modules:",
        capstoneNodeModules,
        "already exists as a directory; not modifying"
      );
      return;
    } else {
      fs.unlinkSync(capstoneNodeModules);
    }
  } catch {
    /* does not exist — create link */
  }

  const type = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(path.resolve(appNodeModules), capstoneNodeModules, type);
}

main();
