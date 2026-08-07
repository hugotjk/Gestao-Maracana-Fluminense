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
  getScriptUrl,
  sortMatchesByDate,
  sortEmployees,
} from './lib/storage';
import { initAuth, getAccessToken } from './lib/auth';
import { pushAllToGoogleSheets, pullFromGoogleSheets } from './lib/googleSheets';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { AssignmentsView } from './components/AssignmentsView';
import { EmployeesView } from './components/EmployeesView';
import { OperationsView } from './components/OperationsView';
import { MatchesView } from './components/MatchesView';
import { PendingTasksView } from './components/PendingTasksView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Application Data States
  const [matches, setMatchesState] = useState<Match[]>([]);
  const [operations, setOperationsState] = useState<Operation[]>([]);
  const [employees, setEmployeesState] = useState<Employee[]>([]);
  const [assignments, setAssignmentsState] = useState<Assignment[]>([]);
  const [sales, setSalesState] = useState<Sale[]>([]);
  const [pendingTasks, setPendingTasksState] = useState<PendingTask[]>([]);
  const [activeMatchId, setActiveMatchIdState] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Initial Load from Storage & Auth listener
  useEffect(() => {
    const loadedMatches = getStoredMatches();
    const loadedOperations = getStoredOperations();
    const loadedEmployees = getStoredEmployees();
    const loadedAssignments = getStoredAssignments();
    const loadedSales = getStoredSales();
    const loadedPendingTasks = getStoredPendingTasks();
    const loadedActiveId = getActiveMatchId();

    setMatchesState(loadedMatches);
    setOperationsState(loadedOperations);
    setEmployeesState(loadedEmployees);
    setAssignmentsState(loadedAssignments);
    setSalesState(loadedSales);
    setPendingTasksState(loadedPendingTasks);
    setActiveMatchIdState(loadedActiveId);

    // Try pulling latest data from Google Sheets on load (e.g. for new devices or cross-device sync)
    const sheetId = getSpreadsheetId();
    if (sheetId) {
      setIsSyncing(true);
      pullFromGoogleSheets(sheetId)
        .then((res) => {
          if (res.success && res.data) {
            if (res.data.assignments && res.data.assignments.length > 0) {
              setAssignmentsState(res.data.assignments);
              saveAssignments(res.data.assignments);
            }
            if (res.data.employees && res.data.employees.length > 0) {
              const sorted = sortEmployees(res.data.employees);
              setEmployeesState(sorted);
              saveEmployees(sorted);
            }
            if (res.data.matches && res.data.matches.length > 0) {
              const sorted = sortMatchesByDate(res.data.matches);
              setMatchesState(sorted);
              saveMatches(sorted);
            }
            if (res.data.operations && res.data.operations.length > 0) {
              setOperationsState(res.data.operations);
              saveOperations(res.data.operations);
            }
            if (res.data.sales && res.data.sales.length > 0) {
              setSalesState(res.data.sales);
              saveSales(res.data.sales);
            }
            if (res.data.pendingTasks && res.data.pendingTasks.length > 0) {
              const sorted = sortPendingTasks(res.data.pendingTasks);
              setPendingTasksState(sorted);
              savePendingTasks(sorted);
            }
          }
        })
        .catch((err) => console.warn('Auto pull on load error:', err))
        .finally(() => setIsSyncing(false));
    }

    const unsubscribe = initAuth(
      (_user, token) => {
        setAuthToken(token);
      },
      () => {
        setAuthToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Automatic sync helper function
  const triggerAutoSync = useCallback(
    async (
      latestSales: Sale[],
      latestEmployees: Employee[],
      latestOperations: Operation[],
      latestMatches: Match[],
      latestAssignments?: Assignment[],
      latestPendingTasks?: PendingTask[]
    ) => {
      try {
        const token = authToken || (await getAccessToken());
        const sheetId = getSpreadsheetId();
        const scriptUrl = getScriptUrl();

        if ((token || scriptUrl) && sheetId) {
          setIsSyncing(true);
          await pushAllToGoogleSheets(sheetId, token || '', {
            sales: latestSales,
            employees: latestEmployees,
            operations: latestOperations,
            matches: latestMatches,
            assignments: latestAssignments || assignments,
            pendingTasks: latestPendingTasks || pendingTasks,
          });
        }
      } catch (err) {
        console.error('Erro na sincronização automática em segundo plano:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [authToken, assignments, pendingTasks]
  );

  // Set active match
  const handleSelectActiveMatch = (id: string) => {
    setActiveMatchIdState(id);
    setActiveMatchId(id);
  };

  // Match operations
  const handleAddMatch = (m: Match) => {
    const next = sortMatchesByDate([...matches, m]);
    setMatchesState(next);
    saveMatches(next);
    triggerAutoSync(sales, employees, operations, next, assignments, pendingTasks);
  };

  const handleUpdateMatch = (m: Match) => {
    const next = sortMatchesByDate(matches.map((item) => (item.id === m.id ? m : item)));
    setMatchesState(next);
    saveMatches(next);
    triggerAutoSync(sales, employees, operations, next, assignments, pendingTasks);
  };

  const handleDeleteMatch = (id: string) => {
    const next = sortMatchesByDate(matches.filter((item) => item.id !== id));
    setMatchesState(next);
    saveMatches(next);
    triggerAutoSync(sales, employees, operations, next, assignments, pendingTasks);
  };

  // Operations operations
  const handleAddOperation = (op: Operation) => {
    const next = [...operations, op];
    setOperationsState(next);
    saveOperations(next);
    triggerAutoSync(sales, employees, next, matches, assignments, pendingTasks);
  };

  const handleUpdateOperation = (op: Operation) => {
    const next = operations.map((item) => (item.codigo === op.codigo ? op : item));
    setOperationsState(next);
    saveOperations(next);
    triggerAutoSync(sales, employees, next, matches, assignments, pendingTasks);
  };

  const handleDeleteOperation = (codigo: string) => {
    const next = operations.filter((item) => item.codigo !== codigo);
    setOperationsState(next);
    saveOperations(next);
    triggerAutoSync(sales, employees, next, matches, assignments, pendingTasks);
  };

  // Employee operations
  const handleAddEmployee = (emp: Employee) => {
    const next = sortEmployees([...employees, emp]);
    setEmployeesState(next);
    saveEmployees(next);
    triggerAutoSync(sales, next, operations, matches, assignments, pendingTasks);
  };

  const handleUpdateEmployee = (emp: Employee) => {
    const next = sortEmployees(employees.map((item) => (item.cpf === emp.cpf ? emp : item)));
    setEmployeesState(next);
    saveEmployees(next);
    triggerAutoSync(sales, next, operations, matches, assignments, pendingTasks);
  };

  const handleDeleteEmployee = (cpf: string) => {
    const next = sortEmployees(employees.filter((item) => item.cpf !== cpf));
    setEmployeesState(next);
    saveEmployees(next);
    triggerAutoSync(sales, next, operations, matches, assignments, pendingTasks);
  };

  // Assignments operations
  const handleAddAssignment = (asg: Assignment) => {
    const next = [...assignments, asg];
    setAssignmentsState(next);
    saveAssignments(next);
    triggerAutoSync(sales, employees, operations, matches, next, pendingTasks);
  };

  const handleUpdateAssignment = (asg: Assignment) => {
    const next = assignments.map((item) => (item.id === asg.id ? asg : item));
    setAssignmentsState(next);
    saveAssignments(next);
    triggerAutoSync(sales, employees, operations, matches, next, pendingTasks);
  };

  const handleRemoveAssignment = (id: string) => {
    const next = assignments.filter((item) => item.id !== id);
    setAssignmentsState(next);
    saveAssignments(next);
    triggerAutoSync(sales, employees, operations, matches, next, pendingTasks);
  };

  // Sales operations
  const handleSaveSales = (updatedSales: Sale[]) => {
    setSalesState(updatedSales);
    saveSales(updatedSales);
    triggerAutoSync(updatedSales, employees, operations, matches, assignments, pendingTasks);
  };

  const handleDeleteSale = (codigo: string) => {
    const next = sales.filter((item) => item.codigo !== codigo);
    setSalesState(next);
    saveSales(next);
    triggerAutoSync(next, employees, operations, matches, assignments, pendingTasks);
  };

  // Pending tasks operations
  const handleAddPendingTask = (task: PendingTask) => {
    const next = sortPendingTasks([...pendingTasks, task]);
    setPendingTasksState(next);
    savePendingTasks(next);
    triggerAutoSync(sales, employees, operations, matches, assignments, next);
  };

  const handleUpdatePendingTask = (task: PendingTask) => {
    const updatedList = pendingTasks.map((t) => (t.id === task.id ? task : t));
    const next = sortPendingTasks(updatedList);
    setPendingTasksState(next);
    savePendingTasks(next);
    triggerAutoSync(sales, employees, operations, matches, assignments, next);
  };

  const handleDeletePendingTask = (id: string) => {
    const next = sortPendingTasks(pendingTasks.filter((t) => t.id !== id));
    setPendingTasksState(next);
    savePendingTasks(next);
    triggerAutoSync(sales, employees, operations, matches, assignments, next);
  };

  // Bulk import from Google Sheets
  const handleImportData = (data: {
    sales: Sale[];
    employees: Employee[];
    operations: Operation[];
    matches: Match[];
    assignments?: Assignment[];
    pendingTasks?: PendingTask[];
  }) => {
    let newSales = sales;
    let newEmployees = employees;
    let newOperations = operations;
    let newMatches = matches;
    let newAssignments = assignments;
    let newPendingTasks = pendingTasks;

    if (data.sales && data.sales.length > 0) {
      newSales = data.sales;
      setSalesState(newSales);
      saveSales(newSales);
    }
    if (data.employees && data.employees.length > 0) {
      newEmployees = data.employees;
      setEmployeesState(newEmployees);
      saveEmployees(newEmployees);
    }
    if (data.operations && data.operations.length > 0) {
      newOperations = data.operations;
      setOperationsState(newOperations);
      saveOperations(newOperations);
    }
    if (data.matches && data.matches.length > 0) {
      newMatches = data.matches;
      setMatchesState(newMatches);
      saveMatches(newMatches);
    }
    if (data.assignments && data.assignments.length > 0) {
      newAssignments = data.assignments;
      setAssignmentsState(newAssignments);
      saveAssignments(newAssignments);
    }
    if (data.pendingTasks && data.pendingTasks.length > 0) {
      newPendingTasks = sortPendingTasks(data.pendingTasks);
      setPendingTasksState(newPendingTasks);
      savePendingTasks(newPendingTasks);
    }

    triggerAutoSync(newSales, newEmployees, newOperations, newMatches, newAssignments, newPendingTasks);
  };

  return (
    <div id="app-wrapper" className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        matches={matches}
        activeMatchId={activeMatchId}
        onSelectActiveMatch={handleSelectActiveMatch}
        isSyncing={isSyncing}
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
          <GoogleSheetsModal
            sales={sales}
            employees={employees}
            operations={operations}
            matches={matches}
            assignments={assignments}
            pendingTasks={pendingTasks}
            onImportData={handleImportData}
          />
        )}
      </main>

      <footer id="app-footer" className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p className="font-semibold text-slate-300">
            Fluminense Football Club - Sistema de Gestão Operacional de Estádio
          </p>
          <p className="text-slate-500">
            Sincronização em tempo real com Google Sheets (Planilhas Google) & Gerador de Escalas em Excel (XLSX)
          </p>
        </div>
      </footer>
    </div>
  );
}
