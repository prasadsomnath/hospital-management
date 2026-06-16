const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Disable package exports support to force Metro to fall back to the CJS main entry points,
// preventing incompatible ESM bundles (which use import.meta) from being loaded on web.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
