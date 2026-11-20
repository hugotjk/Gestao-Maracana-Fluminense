import React, { useState, useEffect, useCallback } from 'react';
import { ViewTab, Match, Operation, Employee, Assignment, Sale, PendingTask } from './types';
import {
  getStoredMatches,
  saveMatches,
  getStoredOperations,
  saveOperations,
  getStoredEmployees,
  saveEmployees,
  getStoredAssignments,
  saveAssignments,
  getStoredSales,
  saveSales,
  getStoredPendingTasks,
  savePendingTasks,
  sortPendingTasks,
  getActiveMatchId,
  setActiveMatchId,
  getSpreadsheetId,
  hasUnsyncedChanges,
  sortMatchesByDate,
  sortEmployees,
  sortAssignmentsByOperation,
} from './lib/storage';
import { pullFromGoogleSheets, AppData } from './lib/googleSheets';
import { markChanged, flush as flushSync } from './lib/sync';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { AssignmentsView } from './components/AssignmentsView';
import { EmployeesView } from './components/EmployeesView';
import { OperationsView } from './components/OperationsView';
import { MatchesView } from './components/MatchesView';
import { PendingTasksView } from './components/PendingTasksView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Dados do app
  const [matches, setMatchesState] = useState<Match[]>([]);
  const [operations, setOperationsState] = useState<Operation[]>([]);
  const [employees, setEmployeesState] = useState<Employee[]>([]);
  const [assignments, setAssignmentsState] = useState<Assignment[]>([]);
  const [sales, setSalesState] = useState<Sale[]>([]);
  const [pendingTasks, setPendingTasksState] = useState<PendingTask[]>([]);
  const [activeMatchId, setActiveMatchIdState] = useState<string>('');
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(false);

  const loadFromDevice = useCallback(() => {
    const loadedOperations = getStoredOperations();
    const loadedEmployees = getStoredEmployees();
    setMatchesState(getStoredMatches());
    setOperationsState(loadedOperations);
    setEmployeesState(loadedEmployees);
    setAssignmentsState(sortAssignmentsByOperation(getStoredAssignments(), loadedOperations, loadedEmployees));
    setSalesState(getStoredSales());
    setPendingTasksState(getStoredPendingTasks());
    setActiveMatchIdState(getActiveMatchId());
  }, []);

  /** Grava no aparelho os dados vindos da planilha (só as abas que vieram com linhas). */
  const applySheetData = useCallback(
    (data: AppData) => {
      if (data.employees.length > 0) saveEmployees(sortEmployees(data.employees));
      if (data.operations.length > 0) saveOperations(data.operations);
      if (data.matches.length > 0) saveMatches(sortMatchesByDate(data.matches));
      if (data.sales.length > 0) saveSales(data.sales);
      if (data.assignments.length > 0) {
        saveAssignments(sortAssignmentsByOperation(data.assignments, data.operations, data.employees));
      }
      if (data.pendingTasks.length > 0) savePendingTasks(sortPendingTasks(data.pendingTasks));
      loadFromDevice();
    },
    [loadFromDevice]
  );

  /** Busca os dados da planilha. Se houver alterações não enviadas neste aparelho, elas têm prioridade. */
  const reloadFromSheet = useCallback(
    async (force = false): Promise<{ success: boolean; message: string }> => {
      if (!force && hasUnsyncedChanges()) {
        void flushSync();
        return { success: false, message: 'Há alterações deste aparelho ainda não enviadas; enviando primeiro.' };
      }
      setIsLoadingSheet(true);
      try {
        const res = await pullFromGoogleSheets(getSpreadsheetId());
        // Se o usuário alterou algo enquanto carregava, não sobrescreve.
        if (res.success && res.data && (force || !hasUnsyncedChanges())) {
          applySheetData(res.data);
        }
        return res;
      } finally {
        setIsLoadingSheet(false);
      }
    },
    [applySheetData]
  );

  // Ao abrir: carrega do aparelho e depois atualiza com a planilha
  useEffect(() => {
    loadFromDevice();
    void reloadFromSheet();
  }, [loadFromDevice, reloadFromSheet]);

  // Jogo ativo
  const handleSelectActiveMatch = (id: string) => {
    setActiveMatchIdState(id);
    setActiveMatchId(id);
  };

  // Jogos
  const updateMatches = (next: Match[]) => {
    const sorted = sortMatchesByDate(next);
    setMatchesState(sorted);
    saveMatches(sorted);
    markChanged();
  };
  const handleAddMatch = (m: Match) => updateMatches([...matches, m]);
  const handleUpdateMatch = (m: Match) => updateMatches(matches.map((item) => (item.id === m.id ? m : item)));
  const handleDeleteMatch = (id: string) => updateMatches(matches.filter((item) => item.id !== id));

  // Operações
  const updateOperations = (next: Operation[]) => {
    setOperationsState(next);
    saveOperations(next);
    markChanged();
  };
  const handleAddOperation = (op: Operation) => updateOperations([...operations, op]);
  const handleUpdateOperation = (op: Operation) =>
    updateOperations(operations.map((item) => (item.codigo === op.codigo ? op : item)));
  const handleDeleteOperation = (codigo: string) => updateOperations(operations.filter((item) => item.codigo !== codigo));

  // Funcionários
  const updateEmployees = (next: Employee[]) => {
    const sorted = sortEmployees(next);
    setEmployeesState(sorted);
    saveEmployees(sorted);
    markChanged();
  };
  const handleAddEmployee = (emp: Employee) => updateEmployees([...employees, emp]);
  const handleUpdateEmployee = (emp: Employee) =>
    updateEmployees(employees.map((item) => (item.cpf === emp.cpf ? emp : item)));
  const handleDeleteEmployee = (cpf: string) => updateEmployees(employees.filter((item) => item.cpf !== cpf));

  // Escala
  const updateAssignments = (next: Assignment[]) => {
    const sorted = sortAssignmentsByOperation(next, operations, employees);
    setAssignmentsState(sorted);
    saveAssignments(sorted);
    markChanged();
  };
  const handleAddAssignment = (asg: Assignment) => updateAssignments([...assignments, asg]);
  const handleUpdateAssignment = (asg: Assignment) =>
    updateAssignments(assignments.map((item) => (item.id === asg.id ? asg : item)));
  const handleRemoveAssignment = (id: string) => updateAssignments(assignments.filter((item) => item.id !== id));

  // Vendas
  const handleSaveSales = (updatedSales: Sale[]) => {
    setSalesState(updatedSales);
    saveSales(updatedSales);
    markChanged();
  };
  const handleDeleteSale = (codigo: string) => handleSaveSales(sales.filter((item) => item.codigo !== codigo));

  // Pendências
  const updatePendingTasks = (next: PendingTask[]) => {
    const sorted = sortPendingTasks(next);
    setPendingTasksState(sorted);
    savePendingTasks(sorted);
    markChanged();
  };
  const handleAddPendingTask = (task: PendingTask) => updatePendingTasks([...pendingTasks, task]);
  const handleUpdatePendingTask = (task: PendingTask) =>
    updatePendingTasks(pendingTasks.map((t) => (t.id === task.id ? task : t)));
  const handleDeletePendingTask = (id: string) => updatePendingTasks(pendingTasks.filter((t) => t.id !== id));

  return (
    <div id="app-wrapper" className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        matches={matches}
        activeMatchId={activeMatchId}
        onSelectActiveMatch={handleSelectActiveMatch}
        isLoadingSheet={isLoadingSheet}
      />

      <main id="app-main-content" className="flex-1 pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView
            sales={sales}
            operations={operations}
            matches={matches}
            activeMatchId={activeMatchId}
          />
        )}

        {currentTab === 'vendas' && (
          <SalesView
            sales={sales}
            operations={operations}
            matches={matches}
            activeMatchId={activeMatchId}
            onSaveSales={handleSaveSales}
            onDeleteSale={handleDeleteSale}
          />
        )}

        {currentTab === 'escala' && (
          <AssignmentsView
            assignments={assignments}
            employees={employees}
            operations={operations}
            matches={matches}
            activeMatchId={activeMatchId}
            onAddAssignment={handleAddAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onRemoveAssignment={handleRemoveAssignment}
          />
        )}

        {currentTab === 'funcionarios' && (
          <EmployeesView
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {currentTab === 'operacoes' && (
          <OperationsView
            operations={operations}
            onAddOperation={handleAddOperation}
            onUpdateOperation={handleUpdateOperation}
            onDeleteOperation={handleDeleteOperation}
          />
        )}

        {currentTab === 'jogos' && (
          <MatchesView
            matches={matches}
            activeMatchId={activeMatchId}
            onAddMatch={handleAddMatch}
            onUpdateMatch={handleUpdateMatch}
            onDeleteMatch={handleDeleteMatch}
            onSetActiveMatch={handleSelectActiveMatch}
          />
        )}

        {currentTab === 'pendencias' && (
          <PendingTasksView
            matches={matches}
            activeMatchId={activeMatchId}
            onSelectActiveMatch={handleSelectActiveMatch}
            pendingTasks={pendingTasks}
            onAddPendingTask={handleAddPendingTask}
            onUpdatePendingTask={handleUpdatePendingTask}
            onDeletePendingTask={handleDeletePendingTask}
          />
        )}

        {currentTab === 'configuracoes' && (
          <SettingsView
            sales={sales}
            employees={employees}
            operations={operations}
            matches={matches}
            assignments={assignments}
            pendingTasks={pendingTasks}
            isLoadingSheet={isLoadingSheet}
            onReloadFromSheet={() => reloadFromSheet(true)}
          />
        )}
      </main>

      <footer id="app-footer" className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p className="font-semibold text-slate-300">
            Fluminense Football Club - Sistema de Gestão Operacional de Estádio
          </p>
          <p className="text-slate-500">
            Dados salvos no aparelho e enviados automaticamente para a planilha do Google
          </p>
        </div>
      </footer>
    </div>
  );
}
