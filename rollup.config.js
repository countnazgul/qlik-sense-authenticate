import commonjs from "@rollup/plugin-commonjs";
import del from "rollup-plugin-delete";
import resolve from "@rollup/plugin-node-resolve"
import json from "@rollup/plugin-json"
import terser from '@rollup/plugin-terser';

export default {
  input: "src/index.js",
  output: {
    format: "es",
    dir: "dist",
    sourcemap: true,
  },
  external: [
    "fs",
    "url",
    "https"
  ],
  plugins: [
    del({
      targets: "dist/*",
    }),
    json(),
    resolve(),
    commonjs(),
    terser()
  ],
};
