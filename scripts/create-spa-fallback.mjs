import { copyFile } from "node:fs/promises";
import path from "node:path";

const dist = path.resolve("dist");

await copyFile(path.join(dist, "index.html"), path.join(dist, "404.html"));
console.log("Created dist/404.html SPA fallback");
