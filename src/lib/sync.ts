import { useSyncExternalStore } from 'react';
import {
  getStoredSales,
  getStoredEmployees,
  getStoredOperations,
  getStoredMatches,
  getStoredAssignments,
  getStoredPendingTasks,
  getSpreadsheetId,
  setUnsyncedChanges,
  hasUnsyncedChanges,
  setLastSync,
  getLastSync,
} from './storage';
import { pushAllToGoogleSheets } from './googleSheets';

/**
 * Fila de envio para a planilha.
 *
 * - Toda alteração é gravada primeiro no aparelho (localStorage) e marcada como "não enviada".
 * - Depois de ~1,5 s sem novas alterações, envia UMA vez o estado mais recente.
 * - Nunca há dois envios ao mesmo tempo (evita um envio antigo chegar por último e desfazer o novo).
 * - Só marca como "salvo" quando a planilha confirma a gravação.
 */

export type SyncState = 'saved' | 'pending' | 'saving' | 'error' | 'outdated';

export interface SyncStatus {
  state: SyncState;
  message: string;
  lastSync: string | null;
}

let status: SyncStatus = {
  state: hasUnsyncedChanges() ? 'pending' : 'saved',
  message: hasUnsyncedChanges() ? 'Há alterações aguardando envio.' : 'Tudo salvo na planilha.',
  lastSync: getLastSync(),
};
const listeners = new Set<() => void>();

function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  listeners.forEach((l) => l());
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => status
  );
}

const DEBOUNCE_MS = 1500;
const RETRY_MS = 20000;

let changeCounter = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
let runAgain = false;

/** Chame depois de gravar qualquer alteração no aparelho. */
export function markChanged() {
  changeCounter++;
  setUnsyncedChanges(true);
  setStatus({ state: 'pending', message: 'Alterações aguardando envio…' });
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void flush();
  }, DEBOUNCE_MS);
}

/** Envia agora o que estiver guardado no aparelho. */
export async function flush(): Promise<boolean> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (inFlight) {
    runAgain = true;
    return false;
  }

  inFlight = true;
  const counterAtStart = changeCounter;
  setStatus({ state: 'saving', message: 'Salvando na planilha…' });

  const result = await pushAllToGoogleSheets(getSpreadsheetId(), {
    sales: getStoredSales(),
    employees: getStoredEmployees(),
    operations: getStoredOperations(),
    matches: getStoredMatches(),
    assignments: getStoredAssignments(),
    pendingTasks: getStoredPendingTasks(),
  });

  inFlight = false;

  if (result.success) {
    const now = new Date().toISOString();
    setLastSync(now);
    // Se nada mudou enquanto enviava, está tudo salvo.
    if (changeCounter === counterAtStart && !runAgain) {
      setUnsyncedChanges(false);
      setStatus({ state: 'saved', message: result.message, lastSync: now });
    } else {
      setStatus({ lastSync: now });
    }
  } else {
    setStatus({ state: result.outdated ? 'outdated' : 'error', message: result.message });
    // Tenta de novo sozinho mais tarde (exceto quando o script está desatualizado).
    if (!result.outdated) {
      retryTimer = setTimeout(() => void flush(), RETRY_MS);
    }
  }

  if (runAgain || changeCounter !== counterAtStart) {
    runAgain = false;
    return flush();
  }
  return result.success;
}

// Avisa antes de fechar a página se ainda houver algo não enviado.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (e) => {
    if (status.state === 'pending' || status.state === 'saving') {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}
