import commonjs from "@rollup/plugin-commonjs";
import del from "rollup-plugin-delete";
import pkg from "./package.json";

export default {
  input: "src/index.js",
  output: {
    format: "es",
    dir: "dist",
    sourcemap: true,
  },
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    "fs",
    "url",
  ],
  plugins: [
    del({
      targets: "dist/*",
    }),
    commonjs(),
  ],
};
