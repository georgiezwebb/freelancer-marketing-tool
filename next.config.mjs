import path from "path";
import { fileURLToPath } from "url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    /* App package root (this folder) — not the parent capstone directory */
    root: appDir,
  },
};

export default nextConfig;
