import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileDown,
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
  Trash2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  DEFAULT_SHEET_ID,
  getSpreadsheetId,
  setSpreadsheetId,
  getScriptUrl,
  setScriptUrl,
  clearAllLocalData,
  getStoredAssignments,
  getStoredPendingTasks,
} from '../lib/storage';
import { pushAllToGoogleSheets, pullFromGoogleSheets } from '../lib/googleSheets';
import { exportFullDatabaseXLSX } from '../lib/excel';
import { googleSignIn, logout, initAuth, getAccessToken } from '../lib/auth';
import { Sale, Employee, Operation, Match, Assignment, PendingTask } from '../types';

interface GoogleSheetsModalProps {
  sales: Sale[];
  employees: Employee[];
  operations: Operation[];
  matches: Match[];
  assignments?: Assignment[];
  pendingTasks?: PendingTask[];
  onImportData: (data: {
    sales: Sale[];
    employees: Employee[];
    operations: Operation[];
    matches: Match[];
    assignments?: Assignment[];
    pendingTasks?: PendingTask[];
  }) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  sales,
  employees,
  operations,
  matches,
  assignments = [],
  pendingTasks = [],
  onImportData,
}) => {
  const [sheetIdInput, setSheetIdInput] = useState<string>(getSpreadsheetId());
  const [scriptUrlInput, setScriptUrlInput] = useState<string>(getScriptUrl());
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const appsScriptCode = `function doGet(e) {
  if (e && e.parameter && e.parameter.payload) {
    return doPost(e);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "Web App do Fluminense App está ativo!" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = "";
    if (e && e.postData && e.postData.contents) {
      contents = e.postData.contents;
    } else if (e && e.parameter && e.parameter.payload) {
      contents = e.parameter.payload;
    }
    var data = contents ? JSON.parse(contents) : {};
    
    var ss = null;
    try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch(err) {}
    if (!ss && data.sheetId) {
      try { ss = SpreadsheetApp.openById(data.sheetId); } catch(err) {}
    }
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Planilha não encontrada." })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.salesHeader) updateSheet(ss, "Venda", data.salesHeader, data.sales || []);
    if (data.employeesHeader) updateSheet(ss, "Funcionarios", data.employeesHeader, data.employees || []);
    if (data.operationsHeader) updateSheet(ss, "Operacoes", data.operationsHeader, data.operations || []);
    if (data.matchesHeader) updateSheet(ss, "Jogos", data.matchesHeader, data.matches || []);
    if (data.assignmentsHeader) updateSheet(ss, "Escala", data.assignmentsHeader, data.assignments || []);
    if (data.pendenciasHeader) updateSheet(ss, "Pendencia", data.pendenciasHeader, data.pendencias || []);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateSheet(ss, sheetName, headers, rows) {
  var sheet = null;
  if (sheetName === "Pendencia" || sheetName === "Pendencias") {
    var pNames = ["Pendencia", "Pendencias", "Pendência", "Pendências"];
    for (var p = 0; p < pNames.length; p++) {
      sheet = ss.getSheetByName(pNames[p]);
      if (sheet) break;
    }
  } else {
    sheet = ss.getSheetByName(sheetName);
  }
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clear();
  sheet.appendRow(headers);
  if (rows && rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleSaveScriptUrl = async () => {
    const cleanUrl = scriptUrlInput.trim();
    setScriptUrl(cleanUrl);

    if (cleanUrl) {
      setStatusMessage({
        type: 'info',
        text: 'URL do Web App salva! Alimentando sua planilha agora...',
      });

      const currentToken = token || (await getAccessToken());
      setIsSyncing(true);

      const res = await pushAllToGoogleSheets(sheetIdInput, currentToken || '', {
        sales,
        employees,
        operations,
        matches,
        assignments: getStoredAssignments(),
        pendingTasks: getStoredPendingTasks(),
      });

      setIsSyncing(false);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Auto-Sync ativado com sucesso! Todos os seus cadastros atuais foram enviados para a planilha.',
        });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } else {
      setStatusMessage({
        type: 'info',
        text: 'URL do Web App removida.',
      });
    }
  };

  const handleClearLocalData = () => {
    if (window.confirm('Tem certeza que deseja apagar todos os dados salvos localmente no aplicativo?')) {
      clearAllLocalData();
      onImportData({ sales: [], employees: [], operations: [], matches: [], assignments: [] });
      setStatusMessage({ type: 'success', text: 'Todos os dados locais foram limpos. O app está sem nenhum dado fake.' });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setStatusMessage({ type: 'info', text: 'Conectado ao Google! Enviando cadastros para a planilha...' });

        const syncRes = await pushAllToGoogleSheets(sheetIdInput, res.accessToken, {
          sales,
          employees,
          operations,
          matches,
          assignments: getStoredAssignments(),
          pendingTasks: getStoredPendingTasks(),
        });

        if (syncRes.success) {
          setStatusMessage({
            type: 'success',
            text: `Conectado como ${res.user.displayName || res.user.email}! A partir de agora, qualquer novo cadastro alimentará a planilha AUTOMATICAMENTE.`,
          });
        } else {
          setStatusMessage({ type: 'error', text: syncRes.message });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Falha na autenticação com o Google.' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setStatusMessage({ type: 'info', text: 'Sessão do Google encerrada.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveSheetId = () => {
    let cleanId = sheetIdInput.trim();
    if (cleanId.includes('docs.google.com/spreadsheets/d/')) {
      const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanId = match[1];
      }
    }
    setSpreadsheetId(cleanId);
    setSheetIdInput(cleanId);
    setStatusMessage({ type: 'success', text: 'ID da Planilha salvo com sucesso!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handlePushToSheets = async () => {
    const currentToken = token || (await getAccessToken());
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Sincronizando dados com o Google Sheets...' });

    // Try push
    const res = await pushAllToGoogleSheets(sheetIdInput, currentToken || '', {
      sales,
      employees,
      operations,
      matches,
      assignments,
      pendingTasks,
    });

    setIsSyncing(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Erro na sincronização. Certifique-se de estar conectado com sua Conta Google com permissão de edição na planilha.',
      });
    }
  };

  const handlePullFromSheets = async () => {
    const currentToken = token || (await getAccessToken());
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Buscando dados atualizados do Google Sheets...' });

    const res = await pullFromGoogleSheets(sheetIdInput, currentToken);
    setIsSyncing(false);

    if (res.success && res.data) {
      onImportData(res.data);
      setStatusMessage({ type: 'success', text: 'Dados atualizados da planilha com sucesso!' });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleExportBackup = () => {
    exportFullDatabaseXLSX(sales, employees, operations, matches);
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetIdInput || DEFAULT_SHEET_ID}/edit`;

  return (
    <div id="sheets-modal-root" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#006633]" />
            Integração com Google Sheets (Planilha Google)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Mantenha seu banco de dados 100% sincronizado nas abas: <strong>Venda</strong>, <strong>Funcionarios</strong>, <strong>Operacoes</strong> e <strong>Jogos</strong>
          </p>
        </div>

        <a
          href={sheetUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-[#006633] font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-300 transition-all shadow-2xs"
        >
          <span>Abrir Planilha no Google</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Why Public Sheet & Web App Explanation */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl text-xs space-y-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[#006633] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              Como funciona a Sincronização em Tempo Real Sem Pedir Login?
            </h4>
            <p className="text-slate-700 leading-relaxed">
              • <strong>Para Carregar Dados da Planilha (Pull):</strong> Funciona 100% direto em qualquer planilha pública (&quot;Qualquer pessoa com o link pode ver&quot;). Não precisa de nenhum login!
            </p>
            <p className="text-slate-700 leading-relaxed">
              • <strong>Para Alimentar a Planilha Automaticamente ao Cadastrar (Push):</strong> O Google exige que a gravação seja autorizada. Para enviar os cadastros do app para a planilha <strong>SEM PRECISAR DE LOGIN</strong>, basta colar o código gratuito do <strong>Apps Script</strong> na sua planilha (passo a passo abaixo).
            </p>
          </div>
        </div>
      </div>

      {/* Sheet Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-[#8A0029]" />
          1. ID ou URL da Planilha Google
        </h3>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            ID ou Link da Planilha no Google Sheets:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={sheetIdInput}
              onChange={(e) => setSheetIdInput(e.target.value)}
              placeholder="Cole o ID ou link da planilha..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
            <button
              onClick={handleSaveSheetId}
              className="bg-[#006633] hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Salvar ID
            </button>
          </div>
          <p className="text-2xs text-slate-400">
            Link Padrão Detectado: <span className="font-mono text-slate-600">1LSacDLpH7y4M8s2H8627FnAxS0IvFe54ACK9rE4BErs</span>
          </p>
        </div>
      </div>

      {/* Web App Script Setup (Automatic Push Without Login) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#006633]" />
              2. Sincronização Automática Sem Login (Apps Script Web App)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure uma vez na sua planilha para que cada venda ou cadastro salve na planilha em tempo real automaticamente.
            </p>
          </div>
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código Apps Script'}</span>
          </button>
        </div>

        {/* Step-by-step instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Passo 1: Abrir Apps Script</span>
            Na sua planilha do Google, clique em <strong>Extensões</strong> &gt; <strong>Apps Script</strong>.
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Passo 2: Colar o Código</span>
            Apague o texto padrão, cole o código (botão acima) e clique em <strong>Salvar (ícone de disquete)</strong>.
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Passo 3: Implantar Web App</span>
            Clique em <strong>Implantar</strong> &gt; <strong>Nova Implantação</strong> (ou Gerenciar implantações &gt; Nova Versão) &gt; <strong>App da Web</strong> &gt; Quem pode acessar: <strong>Qualquer pessoa</strong>.
          </div>
        </div>

        {/* Script URL input */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700">
            Cole aqui o URL do Web App gerado no Passo 3:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={scriptUrlInput}
              onChange={(e) => setScriptUrlInput(e.target.value)}
              placeholder="Ex: https://script.google.com/macros/s/.../exec"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
            <button
              onClick={handleSaveScriptUrl}
              className="bg-[#006633] hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Ativar Auto-Sync
            </button>
          </div>
        </div>
      </div>

      {/* Sync Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Push */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006633] flex items-center justify-center font-bold mb-3">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Enviar para Planilha (Push)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Escreve todos os cadastros do App diretamente na sua planilha Google.
            </p>
          </div>
          <button
            onClick={handlePushToSheets}
            disabled={isSyncing}
            className="w-full mt-4 bg-[#006633] hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Sincronizar Agora</span>
          </button>
        </div>

        {/* Pull */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-3">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Trazer da Planilha (Pull)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Carrega os dados existentes na planilha do Google Sheets para o aplicativo.
            </p>
          </div>
          <button
            onClick={handlePullFromSheets}
            disabled={isSyncing}
            className="w-full mt-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Carregar Dados</span>
          </button>
        </div>

        {/* Local Backup */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3">
              <FileDown className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Backup Excel (XLSX)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Exporta um arquivo .xlsx offline com todas as 4 abas para o seu computador.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar XLSX</span>
          </button>
        </div>

        {/* Reset Local Data */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Zerar Dados do App
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Limpa a memória local para começar do zero (apenas com o que você cadastrar).
            </p>
          </div>
          <button
            onClick={handleClearLocalData}
            className="w-full mt-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Zerar Dados Locais</span>
          </button>
        </div>
      </div>

      {/* Tabs Mapping Information */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Estrutura Mapeada das Abas na Planilha
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 mb-2">
              Aba 1: Venda
            </span>
            <ul className="text-slate-600 space-y-1 font-mono">
              <li>• codigo (ex: V000000001)</li>
              <li>• data</li>
              <li>• mandante</li>
              <li>• visitante</li>
              <li>• operacao</li>
              <li>• venda</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 mb-2">
              Aba 2: Funcionarios
            </span>
            <ul className="text-slate-600 space-y-1 font-mono">
              <li>• cpf</li>
              <li>• nome</li>
              <li>• email</li>
              <li>• celular</li>
              <li>• setor</li>
              <li>• empresa</li>
              <li>• funcao</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 mb-2">
              Aba 3: Operacoes
            </span>
            <ul className="text-slate-600 space-y-1 font-mono">
              <li>• codigo (ex: O000000001)</li>
              <li>• operacao</li>
              <li>• meta</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 mb-2">
              Aba 4: Jogos
            </span>
            <ul className="text-slate-600 space-y-1 font-mono">
              <li>• codigo (ex: M001)</li>
              <li>• data</li>
              <li>• horario</li>
              <li>• mandante</li>
              <li>• visitante</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
