import { Sale, Employee, Operation, Match, Assignment } from '../types';
import { getScriptUrl } from './storage';

export interface SyncStatus {
  lastSynced?: string;
  isSyncing: boolean;
  error?: string;
  connected: boolean;
}

/**
 * Utility to parse CSV string into 2D array of rows
 */
function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentVal.trim());
      if (row.some((c) => c.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((c) => c.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

export function extractSpreadsheetId(input: string): string {
  let clean = input.trim();
  if (clean.includes('docs.google.com/spreadsheets/d/')) {
    const match = clean.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return clean;
}

/**
 * Pushes local data to Google Sheets via Apps Script Web App (0 login required)
 * OR via official Google Sheets REST API (if OAuth token is available).
 */
export async function pushAllToGoogleSheets(
  spreadsheetId: string,
  accessToken: string,
  data: {
    sales: Sale[];
    employees: Employee[];
    operations: Operation[];
    matches: Match[];
    assignments?: Assignment[];
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanSheetId = extractSpreadsheetId(spreadsheetId);
    if (!cleanSheetId) {
      throw new Error('ID da Planilha não foi informado.');
    }

    const scriptUrl = getScriptUrl();
    const payload = {
      sheetId: cleanSheetId,
      salesHeader: ['codigo', 'data', 'mandante', 'visitante', 'operacao', 'venda'],
      sales: data.sales.map((s) => [s.codigo, s.data, s.mandante, s.visitante, s.operacao, s.venda]),
      employeesHeader: ['cpf', 'nome', 'email', 'celular', 'setor', 'empresa', 'funcao'],
      employees: data.employees.map((e) => [e.cpf, e.nome, e.email, e.celular, e.setor, e.empresa, e.funcaoDefault || 'Atendente']),
      operationsHeader: ['codigo', 'operacao', 'meta'],
      operations: data.operations.map((o) => [o.codigo, o.operacao, o.meta]),
      matchesHeader: ['codigo', 'data', 'horario', 'mandante', 'visitante'],
      matches: data.matches.map((m) => [m.id, m.data, m.horario, m.mandante, m.visitante]),
      assignmentsHeader: ['id', 'jogoId', 'cpf', 'operacaoCodigo', 'funcao'],
      assignments: (data.assignments || []).map((a) => [a.id, a.matchId, a.cpf, a.operacaoCodigo, a.funcao || '']),
    };

    let scriptSuccess = false;

    // 1. Try Apps Script Web App if URL configured (ZERO login required!)
    if (scriptUrl && scriptUrl.startsWith('http')) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        scriptSuccess = true;
      } catch (err) {
        console.warn('Erro enviando via Apps Script:', err);
      }
    }

    // 2. If OAuth token available, use Google Sheets API v4
    if (accessToken) {
      const updateTab = async (range: string, values: any[][]) => {
        const clearRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}/values/${encodeURIComponent(range)}:clear`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!clearRes.ok) {
          const errData = await clearRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Não foi possível acessar a aba ${range}.`);
        }

        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range,
              majorDimension: 'ROWS',
              values,
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Erro ao atualizar a aba ${range}`);
        }
      };

      // Aba Venda
      await updateTab('Venda!A1:F', [
        ['codigo', 'data', 'mandante', 'visitante', 'operacao', 'venda'],
        ...data.sales.map((s) => [s.codigo, s.data, s.mandante, s.visitante, s.operacao, s.venda]),
      ]);

      // Aba Funcionarios
      await updateTab('Funcionarios!A1:G', [
        ['cpf', 'nome', 'email', 'celular', 'setor', 'empresa', 'funcao'],
        ...data.employees.map((e) => [e.cpf, e.nome, e.email, e.celular, e.setor, e.empresa, e.funcaoDefault || 'Atendente']),
      ]);

      // Aba Operacoes
      await updateTab('Operacoes!A1:C', [
        ['codigo', 'operacao', 'meta'],
        ...data.operations.map((o) => [o.codigo, o.operacao, o.meta]),
      ]);

      // Aba Jogos
      await updateTab('Jogos!A1:E', [
        ['codigo', 'data', 'horario', 'mandante', 'visitante'],
        ...data.matches.map((m) => [m.id, m.data, m.horario, m.mandante, m.visitante]),
      ]);

      // Aba Escala (if assignments exist)
      if (data.assignments && data.assignments.length > 0) {
        await updateTab('Escala!A1:E', [
          ['id', 'jogoId', 'cpf', 'operacaoCodigo', 'funcao'],
          ...data.assignments.map((a) => [a.id, a.matchId, a.cpf, a.operacaoCodigo, a.funcao || '']),
        ]);
      }

      return {
        success: true,
        message: 'Planilha alimentada com sucesso via Google API!',
      };
    }

    if (scriptSuccess) {
      return {
        success: true,
        message: 'Dados enviados para a Planilha via Web App!',
      };
    }

    // 3. Neither Apps Script URL nor OAuth token is configured
    return {
      success: false,
      message: 'Para enviar dados para a planilha sem login, cole o Link do Web App da sua planilha.',
    };
  } catch (error: any) {
    console.error('Erro na sincronização com Google Sheets:', error);
    return {
      success: false,
      message: error?.message || 'Falha ao sincronizar com o Google Sheets.',
    };
  }
}

/**
 * Pulls data directly from any public Google Sheet (using GViz CSV API - 100% login-free!)
 * or falls back to Google REST API if token exists.
 */
export async function pullFromGoogleSheets(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<{
  success: boolean;
  message: string;
  data?: {
    sales: Sale[];
    employees: Employee[];
    operations: Operation[];
    matches: Match[];
    assignments?: Assignment[];
  };
}> {
  try {
    const cleanSheetId = spreadsheetId.trim();
    if (!cleanSheetId) {
      throw new Error('ID da Planilha não informado.');
    }

    const fetchSheetRows = async (tabName: string): Promise<string[][]> => {
      // 1. Try public GViz CSV URL (Works on ANY public sheet with ZERO login/API key!)
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanSheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
        const res = await fetch(gvizUrl);
        if (res.ok) {
          const text = await res.text();
          const rows = parseCSV(text);
          if (rows && rows.length > 0) {
            return rows;
          }
        }
      } catch (err) {
        console.warn(`Tentativa de leitura pública via CSV falhou para ${tabName}, tentando REST API...`, err);
      }

      // 2. Fallback to REST API if OAuth token exists
      const restUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}/values/${encodeURIComponent(tabName)}`;
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(restUrl, { headers });
      if (!res.ok) {
        throw new Error(`Não foi possível acessar a aba "${tabName}". Certifique-se de que a planilha está pública ("Qualquer pessoa com o link pode ver").`);
      }
      const json = await res.json();
      return json.values || [];
    };

    const vendaRows = await fetchSheetRows('Venda');
    const funcRows = await fetchSheetRows('Funcionarios');
    const opsRows = await fetchSheetRows('Operacoes');
    const jogosRows = await fetchSheetRows('Jogos');
    const escalaRows = await fetchSheetRows('Escala');

    // Parse Vendas
    const sales: Sale[] = [];
    if (vendaRows.length > 1) {
      for (let i = 1; i < vendaRows.length; i++) {
        const row = vendaRows[i];
        if (row && row[0]) {
          sales.push({
            codigo: row[0] || `V${String(i).padStart(9, '0')}`,
            data: row[1] || '',
            mandante: row[2] || '',
            visitante: row[3] || '',
            operacao: row[4] || '',
            venda: parseFloat((row[5] || '0').replace('R$', '').replace('.', '').replace(',', '.')) || 0,
          });
        }
      }
    }

    // Parse Funcionarios
    const employees: Employee[] = [];
    if (funcRows.length > 1) {
      for (let i = 1; i < funcRows.length; i++) {
        const row = funcRows[i];
        if (row && (row[0] || row[1])) {
          employees.push({
            cpf: row[0] || `0000000000${i}`,
            nome: row[1] || `Funcionário ${i}`,
            email: row[2] || '',
            celular: row[3] || '',
            setor: row[4] || '1,2,3,4,5,6',
            empresa: row[5] || 'FMS',
            funcaoDefault: row[6] || 'Atendente',
          });
        }
      }
    }

    // Parse Operacoes
    const operations: Operation[] = [];
    if (opsRows.length > 1) {
      for (let i = 1; i < opsRows.length; i++) {
        const row = opsRows[i];
        if (row && (row[0] || row[1])) {
          operations.push({
            codigo: row[0] || `O${String(i).padStart(9, '0')}`,
            operacao: row[1] || `Operação ${i}`,
            meta: parseFloat((row[2] || '0').replace('R$', '').replace('.', '').replace(',', '.')) || 0,
          });
        }
      }
    }

    // Parse Jogos
    const matches: Match[] = [];
    if (jogosRows.length > 1) {
      for (let i = 1; i < jogosRows.length; i++) {
        const row = jogosRows[i];
        if (row && (row[0] || row[1])) {
          matches.push({
            id: row[0] || `M00${i}`,
            data: row[1] || '',
            horario: row[2] || '16:00',
            mandante: row[3] || 'Fluminense',
            visitante: row[4] || '',
          });
        }
      }
    }

    // Parse Escala (Assignments)
    const assignments: Assignment[] = [];
    if (escalaRows.length > 1) {
      for (let i = 1; i < escalaRows.length; i++) {
        const row = escalaRows[i];
        if (row && (row[0] || row[1] || row[2])) {
          assignments.push({
            id: row[0] || `ASG_${Date.now()}_${i}`,
            matchId: row[1] || '',
            cpf: row[2] || '',
            operacaoCodigo: row[3] || '',
            funcao: row[4] || '',
          });
        }
      }
    }

    return {
      success: true,
      message: 'Dados importados diretamente da planilha pública com sucesso!',
      data: { sales, employees, operations, matches, assignments },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Falha ao buscar dados da planilha pública.',
    };
  }
}
