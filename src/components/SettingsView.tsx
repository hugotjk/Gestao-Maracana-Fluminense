import React, { useState } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FileDown,
  Loader2,
  Copy,
  Code2,
  Link2,
  PlugZap,
} from 'lucide-react';
import { getSpreadsheetId, setSpreadsheetId, getScriptUrl, setScriptUrl } from '../lib/storage';
import { APPS_SCRIPT_CODE, SCRIPT_VERSION, checkScriptVersion, extractSpreadsheetId } from '../lib/googleSheets';
import { exportFullDatabaseXLSX } from '../lib/excel';
import { useSyncStatus, flush } from '../lib/sync';
import { Sale, Employee, Operation, Match, Assignment, PendingTask } from '../types';

interface SettingsViewProps {
  sales: Sale[];
  employees: Employee[];
  operations: Operation[];
  matches: Match[];
  assignments: Assignment[];
  pendingTasks: PendingTask[];
  isLoadingSheet: boolean;
  onReloadFromSheet: () => Promise<{ success: boolean; message: string }>;
}

type Msg = { type: 'success' | 'error' | 'info'; text: string } | null;

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const sync = useSyncStatus();
  const [sheetInput, setSheetInput] = useState(getSpreadsheetId());
  const [scriptInput, setScriptInput] = useState(getScriptUrl());
  const [msg, setMsg] = useState<Msg>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(sync.state === 'outdated');

  const sheetId = extractSpreadsheetId(sheetInput);
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  const busy = sync.state === 'saving' || sync.state === 'pending' || props.isLoadingSheet;

  const handleSaveLinks = async () => {
    setSpreadsheetId(extractSpreadsheetId(sheetInput));
    setScriptUrl(scriptInput);
    setSheetInput(extractSpreadsheetId(sheetInput));
    await handleTest();
  };

  const handleTest = async () => {
    setTesting(true);
    const res = await checkScriptVersion();
    setTesting(false);
    setMsg({ type: res.ok ? 'success' : 'error', text: res.message });
    if (!res.ok && res.version) setShowCode(true);
  };

  const handleSendNow = async () => {
    setMsg(null);
    await flush();
  };

  const handleReload = async () => {
    const ok = window.confirm(
      'Isto troca os dados deste aparelho pelos que estão na planilha. Alterações deste aparelho que ainda não foram salvas serão perdidas. Continuar?'
    );
    if (!ok) return;
    const res = await props.onReloadFromSheet();
    setMsg({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const lastSyncText = sync.lastSync
    ? new Date(sync.lastSync).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : 'nunca';

  const statusStyle =
    sync.state === 'saved'
      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
      : sync.state === 'error' || sync.state === 'outdated'
      ? 'bg-rose-50 border-rose-300 text-rose-900'
      : 'bg-amber-50 border-amber-300 text-amber-900';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Status */}
      <div className={`p-5 rounded-2xl border flex items-start gap-3 ${statusStyle}`}>
        {sync.state === 'saved' ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
        ) : sync.state === 'error' || sync.state === 'outdated' ? (
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
        ) : (
          <Loader2 className="w-6 h-6 text-amber-600 animate-spin flex-shrink-0" />
        )}
        <div className="space-y-1 text-sm">
          <p className="font-bold">
            {sync.state === 'saved' && 'Tudo salvo na planilha'}
            {sync.state === 'pending' && 'Alterações aguardando envio'}
            {sync.state === 'saving' && 'Salvando na planilha…'}
            {sync.state === 'error' && 'Não foi possível salvar na planilha'}
            {sync.state === 'outdated' && 'O código da planilha precisa ser atualizado'}
          </p>
          <p className="text-xs opacity-90">{sync.message}</p>
          <p className="text-xs opacity-70">Último salvamento confirmado: {lastSyncText}</p>
          {(sync.state === 'error' || sync.state === 'outdated') && (
            <p className="text-xs opacity-90">
              Seus dados continuam guardados neste aparelho e serão enviados assim que o problema for resolvido.
            </p>
          )}
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : msg.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Ações */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#8A0029]" />
          Planilha
        </h3>
        <p className="text-xs text-slate-600">
          Tudo o que você cadastra é salvo neste aparelho e enviado sozinho para a planilha em poucos segundos. Os botões
          abaixo só são necessários em casos especiais.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionButton
            icon={<UploadCloud className="w-4 h-4" />}
            title="Enviar tudo agora"
            desc="Força o envio dos dados deste aparelho para a planilha."
            onClick={handleSendNow}
            disabled={busy}
          />
          <ActionButton
            icon={<DownloadCloud className="w-4 h-4" />}
            title="Recarregar da planilha"
            desc="Traz para este aparelho o que está na planilha (ex.: alterou direto no Google Sheets)."
            onClick={handleReload}
            disabled={busy}
          />
          <ActionButton
            icon={<FileDown className="w-4 h-4" />}
            title="Baixar backup em Excel"
            desc="Baixa um arquivo .xlsx com todas as abas, para guardar uma cópia."
            onClick={() => exportFullDatabaseXLSX(props)}
          />
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="text-left p-4 rounded-xl border border-slate-200 hover:border-[#006633] hover:bg-emerald-50/40 transition-all"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <ExternalLink className="w-4 h-4" /> Abrir a planilha
            </span>
            <span className="block text-xs text-slate-500 mt-1">Abre o Google Sheets em outra aba.</span>
          </a>
        </div>
      </div>

      {/* Links */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#8A0029]" />
          Conexão
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Link ou ID da planilha</label>
            <input
              type="text"
              value={sheetInput}
              onChange={(e) => setSheetInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              A planilha precisa estar compartilhada como “Qualquer pessoa com o link pode ver” para o app conseguir ler.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Link do Web App (Apps Script)</label>
            <input
              type="text"
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSaveLinks}
              className="px-4 py-2 rounded-lg bg-[#006633] text-white text-xs font-bold hover:bg-emerald-800"
            >
              Salvar links
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlugZap className="w-3.5 h-3.5" />}
              Testar conexão
            </button>
          </div>
        </div>
      </div>

      {/* Código do Apps Script */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <button
          onClick={() => setShowCode(!showCode)}
          className="w-full flex items-center justify-between text-sm font-bold text-slate-800 uppercase tracking-wider"
        >
          <span className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#8A0029]" />
            Atualizar código da planilha (versão {SCRIPT_VERSION})
          </span>
          <span className="text-xs text-slate-500 normal-case">{showCode ? 'ocultar' : 'mostrar'}</span>
        </button>

        {showCode && (
          <div className="space-y-3 text-xs text-slate-700">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Clique em <strong>Copiar código</strong> abaixo.
              </li>
              <li>
                Na planilha, abra <strong>Extensões → Apps Script</strong>, apague o código que está lá, cole o novo e
                clique no disquete (Salvar).
              </li>
              <li>
                Clique em <strong>Implantar → Gerenciar implantações</strong>, no lápis (Editar), escolha{' '}
                <strong>Versão: Nova versão</strong> e clique em <strong>Implantar</strong>. O link continua o mesmo.
              </li>
              <li>
                Confira se “Quem pode acessar” está como <strong>Qualquer pessoa</strong>.
              </li>
              <li>
                Volte aqui e clique em <strong>Testar conexão</strong>.
              </li>
            </ol>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copiado!' : 'Copiar código'}
            </button>
            <pre className="bg-slate-950 text-emerald-200 p-4 rounded-xl overflow-auto max-h-72 text-[11px] leading-relaxed">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const ActionButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ icon, title, desc, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="text-left p-4 rounded-xl border border-slate-200 hover:border-[#006633] hover:bg-emerald-50/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
      {icon} {title}
    </span>
    <span className="block text-xs text-slate-500 mt-1">{desc}</span>
  </button>
);
