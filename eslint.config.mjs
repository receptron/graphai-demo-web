import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import pluginVue from 'eslint-plugin-vue';
import vueParser from "vue-eslint-parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    files: ["src/**/*.{vue,ts}"],
  },
  {
    ignores: ["**/*js", "functions"]
  },
  eslint.configs.all,
  ...tseslint.configs.strict,
  ...pluginVue.configs['flat/strongly-recommended'],
  sonarjs.configs.recommended,
  {
    plugins: {
      'typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
        project: './tsconfig.json',
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
  },
  {
    rules: {
      indent: ["error", 2],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^__",
          varsIgnorePattern: "^__",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "max-statements": "off",
      "camelcase": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "no-ternary": "off",
      "no-unreachable": "error",
      "one-var": "off",
      "operator-assignment": "off",
      "no-undefined": "off",
      "sort-keys": "off",
      "sort-vars": "off",
      "sort-imports": "off",
      "no-magic-numbers": "off",
      "no-template-curly-in-string": "off",
      "vue/no-unused-vars": "error",
      "vue/no-reserved-component-names": "error",
      "vue/multi-word-component-names": "off",
      "sonarjs/cognitive-complexity": "error",
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/elseif-without-else": "error",
      "sonarjs/max-switch-cases": "error",
      "sonarjs/no-all-duplicated-branches": "error",
      "sonarjs/no-collapsible-if": "warn",
      "sonarjs/no-collection-size-mischeck": "error",
      "sonarjs/no-duplicated-branches": "error",
      "sonarjs/no-element-overwrite": "error",
      "sonarjs/no-empty-collection": "error",
      "sonarjs/no-extra-arguments": "error",
      "sonarjs/no-gratuitous-expressions": "error",
      "sonarjs/pseudo-random": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/no-identical-conditions": "error",
      "sonarjs/no-identical-expressions": "error",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-ignored-return": "error",
      "sonarjs/no-inverted-boolean-check": "error",
      "sonarjs/no-nested-switch": "error",
      "sonarjs/no-nested-template-literals": "error",
      "sonarjs/no-one-iteration-loop": "error",
      "sonarjs/no-redundant-boolean": "error",
      "sonarjs/no-redundant-jump": "error",
      "sonarjs/no-same-line-conditional": "error",
      "sonarjs/no-small-switch": "error",
      "sonarjs/no-unused-collection": "error",
      "sonarjs/no-use-of-empty-return-value": "error",
      "sonarjs/no-useless-catch": "error",
      "sonarjs/non-existent-operator": "error",
      "sonarjs/prefer-immediate-return": "warn",
      "sonarjs/prefer-object-literal": "error",
      "sonarjs/prefer-single-boolean-return": "error",
      "sonarjs/prefer-while": "error",
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",


      "vue/no-textarea-mustache": "off",
      "no-promise-executor-return": "off",
      "capitalized-comments": "off",
      "arrow-body-style": "off",
      "prefer-template": "off",
      "no-inline-comments": "off",
      "no-use-before-define": "off",

      "class-methods-use-this": "off",
      "no-await-in-loop": "off",
    },
  },
  eslintConfigPrettier,
];
