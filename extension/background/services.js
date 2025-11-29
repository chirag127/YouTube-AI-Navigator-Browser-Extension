import { ChunkingService } from '../services/chunking/index.js';
import { GeminiService } from '../api/gemini.js';
import { SegmentClassificationService } from '../services/segments/index.js';
import { StorageService } from '../services/storage/index.js';
import { l, e, w } from '../utils/shortcuts/logging.js';
let services = {
  gemini: null,
  chunking: null,
  segmentClassification: null,
  storage: null,
  initialized: false,
};
export async function initializeServices(apiKey) {
  l('InitServices');
  try {
    if (services.initialized && services.gemini) return services;
    if (!apiKey) throw new Error('API Key required');
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
    l('InitServices:Done');
    return services;
  } catch (err) {
    e('Err:InitServices', err);
    throw err;
  }
}
export function getServices() {
  l('GetServices');
  if (!services.initialized) throw new Error('Services not initialized');
  l('GetServices:Done');
  return services;
}
