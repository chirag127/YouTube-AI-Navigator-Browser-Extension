import { ChunkingService } from '../services/chunking/index.js';
import { GeminiService } from '../api/gemini.js';
import { SegmentClassificationService } from '../services/segments/index.js';
import { StorageService } from '../services/storage/index.js';
import { E } from '../utils/shortcuts/core.js';
import { w } from '../utils/shortcuts/log.js';

let services = {
  gemini: null,
  chunking: null,
  segmentClassification: null,
  storage: null,
  initialized: false,
};

export async function initializeServices(apiKey) {
  if (services.initialized && services.gemini) return services;

  if (!apiKey) throw new E('API Key required');

  services.gemini = new GeminiService(apiKey);
  services.chunking = new ChunkingService();
  services.segmentClassification = new SegmentClassificationService(
    services.gemini,
    services.chunking
  );
  services.storage = new StorageService();

  try {
    await services.gemini.fetchAvailableModels();
  } catch (err) {
    w('[Services] Failed to fetch models:', err.message);
  }

  services.initialized = true;
  return services;
}

export function getServices() {
  if (!services.initialized) throw new E('Services not initialized');
  return services;
}
