import { Match, Operation, Employee, Assignment, Sale } from '../types';

const STORAGE_KEYS = {
  MATCHES: 'flu_app_matches',
  OPERATIONS: 'flu_app_operations',
  EMPLOYEES: 'flu_app_employees',
  ASSIGNMENTS: 'flu_app_assignments',
  SALES: 'flu_app_sales',
  ACTIVE_MATCH_ID: 'flu_app_active_match_id',
  SHEET_ID: 'flu_app_sheet_id',
  SCRIPT_URL: 'flu_app_script_url',
};

export const DEFAULT_SHEET_ID = '1LSacDLpH7y4M8s2H8627FnAxS0IvFe54ACK9rE4BErs';
export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxn95noFHcFSvIB9XANE9_jetXyCmo0OhUWj80vB-BHPI59w9hR9TkN9BY476hy7Ew/exec';

// Helper to sort matches by date (oldest at the bottom -> ascending order from top to bottom means top is newest, bottom is oldest? Wait: "mais antigo fica em baixo" means top is newest, bottom is oldest, OR ascending order where oldest is at bottom. Ascending order means newest on top or oldest on top? Let's check: Top: Newest, Bottom: Oldest -> date descending OR Top: Newer, Bottom: Older -> date descending. Or if date ascending: Top is older, Bottom is newer. "o mais antigo fica em baixo" -> oldest at bottom means descending date sort (newest date first at the top, oldest date at the bottom)).
export function sortMatchesByDate(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    // b.data vs a.data: descending means newest at top, oldest at bottom
    if (!a.data) return 1;
    if (!b.data) return -1;
    return b.data.localeCompare(a.data);
  });
}

const initialOperations: Operation[] = [];

const initialEmployees: Employee[] = [];

const initialSales: Sale[] = [];

const initialAssignments: Assignment[] = [];

export function getStoredMatches(): Match[] {
  const data = localStorage.getItem(STORAGE_KEYS.MATCHES);
  if (!data) {
    return [];
  }
  try {
    return sortMatchesByDate(JSON.parse(data));
  } catch {
    return [];
  }
}

export function saveMatches(matches: Match[]) {
  const sorted = sortMatchesByDate(matches);
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(sorted));
}

export function getStoredOperations(): Operation[] {
  const data = localStorage.getItem(STORAGE_KEYS.OPERATIONS);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveOperations(operations: Operation[]) {
  localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(operations));
}

export function sortEmployees(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => {
    // Favorites first
    if (a.favorito && !b.favorito) return -1;
    if (!a.favorito && b.favorito) return 1;
    // Alphabetical by name
    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  });
}

export function getStoredEmployees(): Employee[] {
  const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
  if (!data) {
    return [];
  }
  try {
    return sortEmployees(JSON.parse(data));
  } catch {
    return [];
  }
}

export function saveEmployees(employees: Employee[]) {
  const sorted = sortEmployees(employees);
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(sorted));
}

export function getStoredAssignments(): Assignment[] {
  const data = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveAssignments(assignments: Assignment[]) {
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
}

export function getStoredSales(): Sale[] {
  const data = localStorage.getItem(STORAGE_KEYS.SALES);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveSales(sales: Sale[]) {
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
}

export function getActiveMatchId(): string {
  const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_MATCH_ID);
  if (!id) {
    const matches = getStoredMatches();
    const defaultId = matches[0]?.id || '';
    if (defaultId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, defaultId);
    }
    return defaultId;
  }
  return id;
}

export function setActiveMatchId(id: string) {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, id);
}

export function getSpreadsheetId(): string {
  return localStorage.getItem(STORAGE_KEYS.SHEET_ID) || DEFAULT_SHEET_ID;
}

export function setSpreadsheetId(id: string) {
  localStorage.setItem(STORAGE_KEYS.SHEET_ID, id.trim());
}

export function getScriptUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || DEFAULT_SCRIPT_URL;
}

export function setScriptUrl(url: string) {
  localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, url.trim());
}

export function generateNextSaleCode(existingSales: Sale[]): string {
  let maxNum = 0;
  existingSales.forEach((s) => {
    if (s.codigo && s.codigo.startsWith('V')) {
      const num = parseInt(s.codigo.replace('V', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `V${String(nextNum).padStart(9, '0')}`;
}

export function generateNextOperationCode(existingOps: Operation[]): string {
  let maxNum = 0;
  existingOps.forEach((o) => {
    if (o.codigo && o.codigo.startsWith('O')) {
      const num = parseInt(o.codigo.replace('O', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `O${String(nextNum).padStart(9, '0')}`;
}

export function clearAllLocalData() {
  localStorage.removeItem(STORAGE_KEYS.MATCHES);
  localStorage.removeItem(STORAGE_KEYS.OPERATIONS);
  localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
  localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
  localStorage.removeItem(STORAGE_KEYS.SALES);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_MATCH_ID);
}
