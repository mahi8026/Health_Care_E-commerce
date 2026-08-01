import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import tailwindcss from "eslint-plugin-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Backend has its own ESLint setup
    "backend/**",
    // Third-party scripts
    "scripts/**",
    "public/**",
  ]),
  // Relax Next.js-specific image rule in test files —
  // Jest mocks for next/image intentionally use <img> tags.
  {
    files: ["**/__tests__/**/*.{js,jsx}", "**/*.test.{js,jsx}"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  // Design-system guardrail: flag raw arbitrary hex/px/z literals so drift
  // gets caught at lint time. var() tokens are sanctioned — only raw hex,
  // raw px font sizes, and raw numeric z-index arbitrary values warn.
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      tailwindcss,
      designguard: {
        rules: {
          "no-raw-arbitrary": {
            meta: { type: "suggestion" },
            create(context) {
              return {
                JSXAttribute(node) {
                  if (node.name.name !== "className") return;
                  const value = node.value;
                  if (!value || value.type !== "Literal") return;
                  const s = String(value.value);
                  const re = /(?:^|\s)(?:(?:bg|text|border|from|to|via|ring|accent)-\[#[0-9a-fA-F]{3,8}\]|text-\[[0-9.]+px\]|z-\[\d+\])(?=\s|$)/g;
                  const m = s.match(re);
                  if (m) {
                    context.report({
                      node,
                      message: `Raw arbitrary value(s) detected: ${m.join(", ")} — use a design token instead`,
                    });
                  }
                },
              };
            },
          },
        },
      },
    },
    rules: {
      "designguard/no-raw-arbitrary": "warn",
    },
  },
]);

export default eslintConfig;
