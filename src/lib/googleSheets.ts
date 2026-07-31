import { Sale, Employee, Operation, Match } from '../types';

export interface SyncStatus {
  lastSynced?: string;
  isSyncing: boolean;
  error?: string;
  connected: boolean;
}

/**
 * Pushes local data directly to Google Sheets API using user OAuth access token
 */
export async function pushAllToGoogleSheets(
  spreadsheetId: string,
  accessToken: string,
  data: {
    sales: Sale[];
    employees: Employee[];
    operations: Operation[];
    matches: Match[];
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanSheetId = spreadsheetId.trim();
    if (!cleanSheetId) {
      throw new Error('ID da Planilha não foi informado.');
    }

    // Helper to clear and update a tab
    const updateTab = async (range: string, values: any[][]) => {
      // Clear
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}/values/${encodeURIComponent(
          range
        )}:clear`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Append/Update
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}/values/${encodeURIComponent(
          range
        )}?valueInputOption=USER_ENTERED`,
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
        const errData = await response.json();
        throw new Error(errData?.error?.message || `Erro ao atualizar a aba ${range}`);
      }
    };

    // 1. Aba Venda
    const vendaValues = [
      ['codigo', 'data', 'mandante', 'visitante', 'operacao', 'venda'],
      ...data.sales.map((s) => [
        s.codigo,
        s.data,
        s.mandante,
        s.visitante,
        s.operacao,
        s.venda,
      ]),
    ];
    await updateTab('Venda!A1:F', vendaValues);

    // 2. Aba Funcionarios
    const funcValues = [
      ['cpf', 'nome', 'email', 'celular', 'setor', 'empresa', 'funcao'],
      ...data.employees.map((e) => [
        e.cpf,
        e.nome,
        e.email,
        e.celular,
        e.setor,
        e.empresa,
        e.funcaoDefault || 'Atendente',
      ]),
    ];
    await updateTab('Funcionarios!A1:G', funcValues);

    // 3. Aba Operacoes
    const opsValues = [
      ['codigo', 'operacao', 'meta'],
      ...data.operations.map((o) => [o.codigo, o.operacao, o.meta]),
    ];
    await updateTab('Operacoes!A1:C', opsValues);

    // 4. Aba Jogos
    const jogosValues = [
      ['codigo', 'data', 'horario', 'mandante', 'visitante'],
      ...data.matches.map((m) => [m.id, m.data, m.horario, m.mandante, m.visitante]),
    ];
    await updateTab('Jogos!A1:E', jogosValues);

    return {
      success: true,
      message: 'Planilha do Google Sheets sincronizada com sucesso!',
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
 * Pulls data from public Google Sheet or OAuth Google Sheets API
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
  };
}> {
  try {
    const cleanSheetId = spreadsheetId.trim();
    if (!cleanSheetId) {
      throw new Error('ID da Planilha não informado.');
    }

    const fetchRange = async (tabName: string) => {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}/values/${encodeURIComponent(
        tabName
      )}`;
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Não foi possível ler a aba ${tabName}`);
      }
      const json = await res.json();
      return json.values || [];
    };

    const vendaRows = await fetchRange('Venda!A1:F1000');
    const funcRows = await fetchRange('Funcionarios!A1:G1000');
    const opsRows = await fetchRange('Operacoes!A1:C1000');
    const jogosRows = await fetchRange('Jogos!A1:E1000');

    // Parse Vendas
    const sales: Sale[] = [];
    if (vendaRows.length > 1) {
      for (let i = 1; i < vendaRows.length; i++) {
        const row = vendaRows[i];
        if (row[0]) {
          sales.push({
            codigo: row[0] || `V${String(i).padStart(9, '0')}`,
            data: row[1] || '',
            mandante: row[2] || '',
            visitante: row[3] || '',
            operacao: row[4] || '',
            venda: parseFloat(row[5]) || 0,
          });
        }
      }
    }

    // Parse Funcionarios
    const employees: Employee[] = [];
    if (funcRows.length > 1) {
      for (let i = 1; i < funcRows.length; i++) {
        const row = funcRows[i];
        if (row[0] || row[1]) {
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
        if (row[0] || row[1]) {
          operations.push({
            codigo: row[0] || `O${String(i).padStart(9, '0')}`,
            operacao: row[1] || `Operação ${i}`,
            meta: parseFloat(row[2]) || 0,
          });
        }
      }
    }

    // Parse Jogos
    const matches: Match[] = [];
    if (jogosRows.length > 1) {
      for (let i = 1; i < jogosRows.length; i++) {
        const row = jogosRows[i];
        if (row[0] || row[1]) {
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

    return {
      success: true,
      message: 'Dados importados com sucesso da planilha!',
      data: { sales, employees, operations, matches },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Falha ao buscar dados do Google Sheets.',
    };
  }
}
