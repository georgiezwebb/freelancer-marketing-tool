import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    /* Use this app as Turbopack root when a parent dir (e.g. ~/Projects) has another lockfile */
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
