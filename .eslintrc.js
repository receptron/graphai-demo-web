module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ["plugin:vue/vue3-strongly-recommended", "eslint:recommended", "prettier", "@vue/typescript/recommended"],
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: ["no-type-assertion", "sonarjs"],
  rules: {
    "vue/no-unused-vars": "error",
    "vue/no-reserved-component-names": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-unreachable": "error",
    "vue/multi-word-component-names": "off",
    "vue/no-textarea-mustache": "off",
    "sonarjs/cognitive-complexity": "error",
    "sonarjs/no-duplicate-string": "error",
    "sonarjs/elseif-without-else": "error",
    "sonarjs/max-switch-cases": "error",
    "sonarjs/no-all-duplicated-branches": "error",
    "sonarjs/no-collapsible-if": "error",
    "sonarjs/no-collection-size-mischeck": "error",
    "sonarjs/no-duplicate-string": "error",
    "sonarjs/no-duplicated-branches": "error",
    "sonarjs/no-element-overwrite": "error",
    "sonarjs/no-empty-collection": "error",
    "sonarjs/no-extra-arguments": "error",
    "sonarjs/no-gratuitous-expressions": "error",
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
    "sonarjs/prefer-immediate-return": "error",
    "sonarjs/prefer-object-literal": "error",
    "sonarjs/prefer-single-boolean-return": "error",
    "sonarjs/prefer-while": "error",
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
  },
};
