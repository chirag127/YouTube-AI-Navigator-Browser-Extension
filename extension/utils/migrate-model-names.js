import { sg, ss } from './shortcuts/storage.js';
import { e } from './shortcuts/log.js';
export async function migrateModelNames() {
  try {
    const d = await sg(['model']);
    if (d.model && typeof d.model === 'string' && d.model.startsWith('models/')) {
      const c = d.model.replace('models/', '');
      await ss('model', c);

      return true;
    }
    return false;
  } catch (x) {
    e('[Migration] Failed to migrate model names:', x);
    return false;
  }
}
