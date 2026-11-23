const { getDefaultConfig } = require('expo/metro-config');
const syncLegalDocuments = require('./scripts/sync-legal-documents.cjs');

// Keep the offline legal content current for development, exports, and native builds.
syncLegalDocuments();

module.exports = getDefaultConfig(__dirname);
