import { Sale, Employee, Operation, Match, Assignment, PendingTask } from '../types';
import { getScriptUrl } from './storage';
import { parseMoney } from './money';

/**
 * Versão do código do Apps Script que este app espera.
 * Sempre que APPS_SCRIPT_CODE mudar, aumente este número: o app avisa quando a planilha
 * ainda está com uma versão antiga publicada.
 */
export const SCRIPT_VERSION = 2;

export interface AppData {
  sales: Sale[];
  employees: Employee[];
  operations: Operation[];
  matches: Match[];
  assignments: Assignment[];
  pendingTasks: PendingTask[];
}

export interface PushResult {
  success: boolean;
  message: string;
  /** true quando a planilha respondeu, mas com um Apps Script antigo (que não grava pendências). */
  outdated?: boolean;
}

/** Código que deve estar colado em Extensões > Apps Script da planilha. */
export const APPS_SCRIPT_CODE = `// Gestão Maracanã - Fluminense | versão ${SCRIPT_VERSION}
var SCRIPT_VERSION = ${SCRIPT_VERSION};

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return jsonOut({ status: "ok", version: SCRIPT_VERSION, message: "Web App do app Gestão Maracanã está ativo!" });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var contents = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
    var data = contents ? JSON.parse(contents) : {};

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss && data.sheetId) ss = SpreadsheetApp.openById(data.sheetId);
    if (!ss) return jsonOut({ status: "error", version: SCRIPT_VERSION, message: "Planilha não encontrada." });

    if (data.salesHeader) updateSheet(ss, ["Venda", "Vendas"], data.salesHeader, data.sales || []);
    if (data.employeesHeader) updateSheet(ss, ["Funcionarios", "Funcionários"], data.employeesHeader, data.employees || []);
    if (data.operationsHeader) updateSheet(ss, ["Operacoes", "Operações"], data.operationsHeader, data.operations || []);
    if (data.matchesHeader) updateSheet(ss, ["Jogos"], data.matchesHeader, data.matches || []);
    if (data.assignmentsHeader) updateSheet(ss, ["Escala"], data.assignmentsHeader, data.assignments || []);
    if (data.pendenciasHeader) updateSheet(ss, ["Pendencia", "Pendencias", "Pendência", "Pendências"], data.pendenciasHeader, data.pendencias || []);

    SpreadsheetApp.flush();
    return jsonOut({ status: "success", version: SCRIPT_VERSION, savedAt: new Date().toISOString() });
  } catch (err) {
    return jsonOut({ status: "error", version: SCRIPT_VERSION, message: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function updateSheet(ss, names, headers, rows) {
  var sheet = null;
  for (var i = 0; i < names.length && !sheet; i++) sheet = ss.getSheetByName(names[i]);
  if (!sheet) sheet = ss.insertSheet(names[0]);

  // CPF e IDs como texto, para não perder zeros à esquerda
  sheet.getRange(1, 1, Math.max(rows.length + 1, 1), headers.length).setNumberFormat("@");
  for (var c = 0; c < headers.length; c++) {
    if (headers[c] === "venda" || headers[c] === "meta") {
      sheet.getRange(2, c + 1, Math.max(rows.length, 1), 1).setNumberFormat("#,##0.00");
    }
  }

  sheet.clearContents();
  var values = [headers].concat(rows);
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
}`;

/**
 * Converte CSV em linhas/colunas.
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
      if (row.some((c) => c.length > 0)) lines.push(row);
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((c) => c.length > 0)) lines.push(row);
  }

  return lines;
}

export function extractSpreadsheetId(input: string): string {
  const clean = (input || '').trim();
  const match = clean.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match && match[1] ? match[1] : clean;
}

/** CPF sempre com 11 dígitos (a planilha pode ter perdido zeros à esquerda). */
function normalizeCpf(cpf: string): string {
  const digits = (cpf || '').replace(/\D/g, '');
  return digits ? digits.padStart(11, '0') : '';
}

/**
 * Envia todos os dados para a planilha via Apps Script e LÊ a resposta,
 * para só dizer "salvo" quando a planilha confirmar.
 */
export async function pushAllToGoogleSheets(spreadsheetId: string, data: AppData): Promise<PushResult> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return { success: false, message: 'Link do Web App (Apps Script) não configurado.' };
  }

  const payload = {
    sheetId: extractSpreadsheetId(spreadsheetId),
    salesHeader: ['codigo', 'data', 'mandante', 'visitante', 'operacao', 'venda'],
    sales: data.sales.map((s) => [s.codigo, s.data, s.mandante, s.visitante, s.operacao, s.venda]),
    employeesHeader: ['cpf', 'nome', 'email', 'celular', 'setor', 'empresa', 'funcao'],
    employees: data.employees.map((e) => [e.cpf, e.nome, e.email, e.celular, e.setor, e.empresa, e.funcaoDefault || 'Atendente']),
    operationsHeader: ['codigo', 'operacao', 'meta'],
    operations: data.operations.map((o) => [o.codigo, o.operacao, o.meta]),
    matchesHeader: ['codigo', 'data', 'horario', 'mandante', 'visitante'],
    matches: data.matches.map((m) => [m.id, m.data, m.horario, m.mandante, m.visitante]),
    assignmentsHeader: ['id', 'jogoId', 'cpf', 'operacaoCodigo', 'funcao'],
    assignments: data.assignments.map((a) => [a.id, a.matchId, a.cpf, a.operacaoCodigo, a.funcao || '']),
    pendenciasHeader: ['id', 'jogoId', 'titulo', 'concluida', 'observacao', 'dataCriacao'],
    pendencias: data.pendingTasks.map((t) => [t.id, t.matchId, t.titulo, t.concluida ? 'Sim' : 'Não', t.observacao || '', t.dataCriacao || '']),
  };

  let json: any;
  try {
    // text/plain evita a verificação prévia (preflight) de CORS; o Apps Script responde com CORS liberado.
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      return {
        success: false,
        message:
          'A planilha respondeu algo inesperado. Confira se o Web App foi implantado com acesso "Qualquer pessoa".',
      };
    }
  } catch (err) {
    console.warn('Erro enviando para o Apps Script:', err);
    return { success: false, message: 'Sem conexão com a planilha. Os dados ficam guardados aqui e serão enviados de novo.' };
  }

  if (json?.status !== 'success') {
    return { success: false, message: json?.message || 'A planilha recusou os dados.' };
  }

  if (!json.version || json.version < SCRIPT_VERSION) {
    return {
      success: false,
      outdated: true,
      message:
        'O Apps Script da planilha está desatualizado e não grava as pendências. Atualize o código em Google Sheets > Atualizar código da planilha.',
    };
  }

  return { success: true, message: 'Tudo salvo na planilha.' };
}

/** Consulta a versão do Apps Script publicado (GET). */
export async function checkScriptVersion(): Promise<{ ok: boolean; version?: number; message: string }> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) return { ok: false, message: 'Link do Web App não configurado.' };
  try {
    const res = await fetch(scriptUrl, { method: 'GET', redirect: 'follow' });
    const json = JSON.parse(await res.text());
    const version = Number(json?.version) || 1;
    if (version < SCRIPT_VERSION) {
      return { ok: false, version, message: `Script da planilha desatualizado (versão ${version}). Atualize para a versão ${SCRIPT_VERSION}.` };
    }
    return { ok: true, version, message: `Conectado. Script da planilha na versão ${version}.` };
  } catch {
    return { ok: false, message: 'Não foi possível falar com o Web App. Confira o link e se o acesso está como "Qualquer pessoa".' };
  }
}

/**
 * Lê os dados da planilha (precisa estar compartilhada como "Qualquer pessoa com o link pode ver").
 */
export async function pullFromGoogleSheets(
  spreadsheetId: string
): Promise<{ success: boolean; message: string; data?: AppData }> {
  try {
    const cleanSheetId = extractSpreadsheetId(spreadsheetId);
    if (!cleanSheetId) throw new Error('ID da Planilha não informado.');

    const fetchSheetRows = async (tabName: string): Promise<string[][]> => {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanSheetId}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tabName)}`;
      const res = await fetch(gvizUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Falha ao ler a aba "${tabName}".`);
      const text = (await res.text()).trim();
      if (text.startsWith('<') || text.includes('google.visualization.Query.setResponse')) {
        throw new Error(`A planilha não está pública ou a aba "${tabName}" deu erro.`);
      }
      return parseCSV(text);
    };

    // IMPORTANTE: o GViz devolve a PRIMEIRA aba da planilha quando a aba pedida não existe.
    // Por isso conferimos o cabeçalho antes de aceitar as linhas; sem isso, as linhas da aba
    // "Venda" eram importadas como pendências e apagavam as pendências salvas.
    const normalize = (v: string) =>
      (v || '').toString().trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const headerMatches = (rows: string[][], expected: string[]) =>
      rows.length > 0 && expected.every((h, idx) => normalize(rows[0][idx]) === normalize(h));

    const readTab = async (expectedHeader: string[], ...tabNames: string[]): Promise<string[][]> => {
      for (const tab of tabNames) {
        try {
          const rows = await fetchSheetRows(tab);
          if (headerMatches(rows, expectedHeader)) return rows;
        } catch (err) {
          console.warn(`Leitura da aba "${tab}" falhou.`, err);
        }
      }
      return [];
    };

    const [vendaRows, funcRows, opsRows, jogosRows, escalaRows, pendenciasRows] = await Promise.all([
      readTab(['codigo', 'data', 'mandante', 'visitante', 'operacao'], 'Venda', 'Vendas'),
      readTab(['cpf', 'nome'], 'Funcionarios', 'Funcionários'),
      readTab(['codigo', 'operacao', 'meta'], 'Operacoes', 'Operações'),
      readTab(['codigo', 'data', 'horario'], 'Jogos'),
      readTab(['id', 'jogoId', 'cpf'], 'Escala'),
      readTab(['id', 'jogoId', 'titulo'], 'Pendencia', 'Pendencias', 'Pendência', 'Pendências'),
    ]);

    const sales: Sale[] = vendaRows
      .slice(1)
      .filter((row) => row[0])
      .map((row) => ({
        codigo: row[0],
        data: row[1] || '',
        mandante: row[2] || '',
        visitante: row[3] || '',
        operacao: row[4] || '',
        venda: parseMoney(row[5]),
      }));

    const employees: Employee[] = funcRows
      .slice(1)
      .filter((row) => row[0] || row[1])
      .map((row, i) => ({
        cpf: normalizeCpf(row[0]) || `0000000000${i + 1}`,
        nome: row[1] || `Funcionário ${i + 1}`,
        email: row[2] || '',
        celular: row[3] || '',
        setor: row[4] || '1,2,3,4,5,6',
        empresa: row[5] || 'FMS',
        funcaoDefault: row[6] || 'Atendente',
      }));

    const operations: Operation[] = opsRows
      .slice(1)
      .filter((row) => row[0] || row[1])
      .map((row, i) => ({
        codigo: row[0] || `O${String(i + 1).padStart(9, '0')}`,
        operacao: row[1] || `Operação ${i + 1}`,
        meta: parseMoney(row[2]),
      }));

    const matches: Match[] = jogosRows
      .slice(1)
      .filter((row) => row[0] || row[1])
      .map((row, i) => ({
        id: row[0] || `M00${i + 1}`,
        data: row[1] || '',
        horario: row[2] || '16:00',
        mandante: row[3] || 'Fluminense',
        visitante: row[4] || '',
      }));

    const assignments: Assignment[] = escalaRows
      .slice(1)
      .filter((row) => row[0] || row[1] || row[2])
      .map((row, i) => ({
        id: row[0] || `ASG_${Date.now()}_${i}`,
        matchId: row[1] || '',
        cpf: normalizeCpf(row[2]),
        operacaoCodigo: row[3] || '',
        funcao: row[4] || '',
      }));

    const pendingTasks: PendingTask[] = pendenciasRows
      .slice(1)
      .filter((row) => row[0] || row[1] || row[2])
      .map((row, i) => ({
        id: row[0] || `TASK_${Date.now()}_${i}`,
        matchId: row[1] || '',
        titulo: row[2] || '',
        concluida: ['sim', 'true', '1'].includes((row[3] || '').toLowerCase()),
        observacao: row[4] || '',
        dataCriacao: row[5] || '',
      }));

    return {
      success: true,
      message: 'Dados carregados da planilha.',
      data: { sales, employees, operations, matches, assignments, pendingTasks },
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Falha ao ler a planilha.' };
  }
}
