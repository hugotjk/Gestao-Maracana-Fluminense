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
import { DEFAULT_SHEET_ID, getSpreadsheetId, setSpreadsheetId, clearAllLocalData } from '../lib/storage';
import { pushAllToGoogleSheets, pullFromGoogleSheets } from '../lib/googleSheets';
import { exportFullDatabaseXLSX } from '../lib/excel';
import { googleSignIn, logout, initAuth, getAccessToken } from '../lib/auth';
import { Sale, Employee, Operation, Match } from '../types';

interface GoogleSheetsModalProps {
  sales: Sale[];
  employees: Employee[];
  operations: Operation[];
  matches: Match[];
  onImportData: (data: {
    sales: Sale[];
    employees: Employee[];
    operations: Operation[];
    matches: Match[];
  }) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  sales,
  employees,
  operations,
  matches,
  onImportData,
}) => {
  const [sheetIdInput, setSheetIdInput] = useState<string>(getSpreadsheetId());
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleClearLocalData = () => {
    if (window.confirm('Tem certeza que deseja apagar todos os dados salvos localmente no aplicativo?')) {
      clearAllLocalData();
      onImportData({ sales: [], employees: [], operations: [], matches: [] });
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

      {/* Google Authentication Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#006633]" />
            Autenticação Google (Sincronização Automática)
          </h3>
          <p className="text-xs text-slate-500">
            Conecte sua conta Google uma vez. Ao cadastrar vendas, funcionários, setores ou jogos, o aplicativo alimentará sua planilha no Google Sheets <strong>automaticamente em tempo real</strong>, sem precisar clicar para enviar!
          </p>
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-emerald-400" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#006633] text-white flex items-center justify-center font-bold text-xs">
                  {(user.displayName || user.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <div className="text-xs">
                <p className="font-bold text-emerald-950">{user.displayName || 'Usuário Google'}</p>
                <p className="text-emerald-700 font-mono text-2xs">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                title="Sair da Conta Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isLoggingIn ? 'Conectando...' : 'Entrar com o Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sheet Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-[#8A0029]" />
          Configuração do Link / ID da Planilha
        </h3>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            ID ou URL da sua Planilha no Google Sheets:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={sheetIdInput}
              onChange={(e) => setSheetIdInput(e.target.value)}
              placeholder="Cole o ID ou link completo da planilha..."
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
