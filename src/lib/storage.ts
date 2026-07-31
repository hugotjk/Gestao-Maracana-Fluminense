import { Match, Operation, Employee, Assignment, Sale } from '../types';

const STORAGE_KEYS = {
  MATCHES: 'flu_app_matches',
  OPERATIONS: 'flu_app_operations',
  EMPLOYEES: 'flu_app_employees',
  ASSIGNMENTS: 'flu_app_assignments',
  SALES: 'flu_app_sales',
  ACTIVE_MATCH_ID: 'flu_app_active_match_id',
  SHEET_ID: 'flu_app_sheet_id',
};

export const DEFAULT_SHEET_ID = '1LSacDLpH7y4M8s2H8627FnAxS0IvFe54ACK9rE4BErs';

const initialMatches: Match[] = [];

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
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveMatches(matches: Match[]) {
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
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

export function getStoredEmployees(): Employee[] {
  const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveEmployees(employees: Employee[]) {
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
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
