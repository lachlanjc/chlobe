import { defineConfig } from 'oxlint';
import core from 'ultracite/oxlint/core';
import jsPlugins from 'ultracite/oxlint/js-plugins';
import next from 'ultracite/oxlint/next';
import nextJsPlugins from 'ultracite/oxlint/next/js-plugins';
import react from 'ultracite/oxlint/react';
import vitest from 'ultracite/oxlint/vitest';

const selectedJsPluginNames = new Set(['react-doctor']);
const selectedJsPluginRulePrefixes = new Set(['react-doctor']);

const selectedJsPlugins = {
  ...jsPlugins,
  jsPlugins: jsPlugins.jsPlugins?.filter((plugin) =>
    selectedJsPluginNames.has(typeof plugin === 'string' ? plugin : plugin.name)
  ),
  overrides: jsPlugins.overrides?.map((override) => ({
    ...override,
    rules: Object.fromEntries(
      Object.entries(override.rules ?? {}).filter(([ruleName]) =>
        selectedJsPluginRulePrefixes.has(ruleName.split('/')[0] ?? ruleName)
      )
    ),
  })),
  rules: Object.fromEntries(
    Object.entries(jsPlugins.rules ?? {}).filter(([ruleName]) =>
      selectedJsPluginRulePrefixes.has(ruleName.split('/')[0] ?? ruleName)
    )
  ),
};

export default defineConfig({
  extends: [core, react, vitest, next, nextJsPlugins, selectedJsPlugins],
  ignorePatterns: core.ignorePatterns,
});
