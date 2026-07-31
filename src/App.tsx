import React, { useState, useEffect, useCallback } from 'react';
import { ViewTab, Match, Operation, Employee, Assignment, Sale } from './types';
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
  getActiveMatchId,
  setActiveMatchId,
  getSpreadsheetId,
} from './lib/storage';
import { initAuth, getAccessToken } from './lib/auth';
import { pushAllToGoogleSheets } from './lib/googleSheets';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { AssignmentsView } from './components/AssignmentsView';
import { EmployeesView } from './components/EmployeesView';
import { OperationsView } from './components/OperationsView';
import { MatchesView } from './components/MatchesView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Application Data States
  const [matches, setMatchesState] = useState<Match[]>([]);
  const [operations, setOperationsState] = useState<Operation[]>([]);
  const [employees, setEmployeesState] = useState<Employee[]>([]);
  const [assignments, setAssignmentsState] = useState<Assignment[]>([]);
  const [sales, setSalesState] = useState<Sale[]>([]);
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
    const loadedActiveId = getActiveMatchId();

    setMatchesState(loadedMatches);
    setOperationsState(loadedOperations);
    setEmployeesState(loadedEmployees);
    setAssignmentsState(loadedAssignments);
    setSalesState(loadedSales);
    setActiveMatchIdState(loadedActiveId);

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
      latestMatches: Match[]
    ) => {
      try {
        const token = authToken || (await getAccessToken());
        const sheetId = getSpreadsheetId();
        if (token && sheetId) {
          setIsSyncing(true);
          await pushAllToGoogleSheets(sheetId, token, {
            sales: latestSales,
            employees: latestEmployees,
            operations: latestOperations,
            matches: latestMatches,
          });
        }
      } catch (err) {
        console.error('Erro na sincronização automática em segundo plano:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [authToken]
  );

  // Set active match
  const handleSelectActiveMatch = (id: string) => {
    setActiveMatchIdState(id);
    setActiveMatchId(id);
  };

  // Match operations
  const handleAddMatch = (m: Match) => {
    const next = [...matches, m];
    setMatchesState(next);
    saveMatches(next);
    triggerAutoSync(sales, employees, operations, next);
  };

  const handleUpdateMatch = (m: Match) => {
    const next = matches.map((item) => (item.id === m.id ? m : item));
    setMatchesState(next);
    saveMatches(next);
    triggerAutoSync(sales, employees, operations, next);
  };

  const handleDeleteMatch = (id: string) => {
    const next = matches.filter((item) => item.id !== id);
    setMatchesState(next);
    saveMatches(next);
    triggerAutoSync(sales, employees, operations, next);
  };

  // Operations operations
  const handleAddOperation = (op: Operation) => {
    const next = [...operations, op];
    setOperationsState(next);
    saveOperations(next);
    triggerAutoSync(sales, employees, next, matches);
  };

  const handleUpdateOperation = (op: Operation) => {
    const next = operations.map((item) => (item.codigo === op.codigo ? op : item));
    setOperationsState(next);
    saveOperations(next);
    triggerAutoSync(sales, employees, next, matches);
  };

  const handleDeleteOperation = (codigo: string) => {
    const next = operations.filter((item) => item.codigo !== codigo);
    setOperationsState(next);
    saveOperations(next);
    triggerAutoSync(sales, employees, next, matches);
  };

  // Employee operations
  const handleAddEmployee = (emp: Employee) => {
    const next = [...employees, emp];
    setEmployeesState(next);
    saveEmployees(next);
    triggerAutoSync(sales, next, operations, matches);
  };

  const handleUpdateEmployee = (emp: Employee) => {
    const next = employees.map((item) => (item.cpf === emp.cpf ? emp : item));
    setEmployeesState(next);
    saveEmployees(next);
    triggerAutoSync(sales, next, operations, matches);
  };

  const handleDeleteEmployee = (cpf: string) => {
    const next = employees.filter((item) => item.cpf !== cpf);
    setEmployeesState(next);
    saveEmployees(next);
    triggerAutoSync(sales, next, operations, matches);
  };

  // Assignments operations
  const handleAddAssignment = (asg: Assignment) => {
    const next = [...assignments, asg];
    setAssignmentsState(next);
    saveAssignments(next);
  };

  const handleRemoveAssignment = (id: string) => {
    const next = assignments.filter((item) => item.id !== id);
    setAssignmentsState(next);
    saveAssignments(next);
  };

  // Sales operations
  const handleSaveSales = (updatedSales: Sale[]) => {
    setSalesState(updatedSales);
    saveSales(updatedSales);
    triggerAutoSync(updatedSales, employees, operations, matches);
  };

  const handleDeleteSale = (codigo: string) => {
    const next = sales.filter((item) => item.codigo !== codigo);
    setSalesState(next);
    saveSales(next);
    triggerAutoSync(next, employees, operations, matches);
  };

  // Bulk import from Google Sheets
  const handleImportData = (data: {
    sales: Sale[];
    employees: Employee[];
    operations: Operation[];
    matches: Match[];
  }) => {
    let newSales = sales;
    let newEmployees = employees;
    let newOperations = operations;
    let newMatches = matches;

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

    triggerAutoSync(newSales, newEmployees, newOperations, newMatches);
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

        {currentTab === 'configuracoes' && (
          <GoogleSheetsModal
            sales={sales}
            employees={employees}
            operations={operations}
            matches={matches}
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
