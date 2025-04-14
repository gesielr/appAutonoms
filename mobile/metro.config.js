// Configuração personalizada do Metro para o Expo
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Adicionar suporte para arquivos .web.js
defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'web.js',
  'web.ts',
  'web.jsx',
  'web.tsx',
];

module.exports = defaultConfig;
