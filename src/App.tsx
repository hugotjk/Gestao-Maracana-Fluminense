import React, { useState, useEffect } from 'react';
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
} from './lib/storage';

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

  // Initial Load from Storage
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
  }, []);

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
  };

  const handleUpdateMatch = (m: Match) => {
    const next = matches.map((item) => (item.id === m.id ? m : item));
    setMatchesState(next);
    saveMatches(next);
  };

  const handleDeleteMatch = (id: string) => {
    const next = matches.filter((item) => item.id !== id);
    setMatchesState(next);
    saveMatches(next);
  };

  // Operations operations
  const handleAddOperation = (op: Operation) => {
    const next = [...operations, op];
    setOperationsState(next);
    saveOperations(next);
  };

  const handleUpdateOperation = (op: Operation) => {
    const next = operations.map((item) => (item.codigo === op.codigo ? op : item));
    setOperationsState(next);
    saveOperations(next);
  };

  const handleDeleteOperation = (codigo: string) => {
    const next = operations.filter((item) => item.codigo !== codigo);
    setOperationsState(next);
    saveOperations(next);
  };

  // Employee operations
  const handleAddEmployee = (emp: Employee) => {
    const next = [...employees, emp];
    setEmployeesState(next);
    saveEmployees(next);
  };

  const handleUpdateEmployee = (emp: Employee) => {
    const next = employees.map((item) => (item.cpf === emp.cpf ? emp : item));
    setEmployeesState(next);
    saveEmployees(next);
  };

  const handleDeleteEmployee = (cpf: string) => {
    const next = employees.filter((item) => item.cpf !== cpf);
    setEmployeesState(next);
    saveEmployees(next);
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
  };

  const handleDeleteSale = (codigo: string) => {
    const next = sales.filter((item) => item.codigo !== codigo);
    setSalesState(next);
    saveSales(next);
  };

  // Bulk import from Google Sheets
  const handleImportData = (data: {
    sales: Sale[];
    employees: Employee[];
    operations: Operation[];
    matches: Match[];
  }) => {
    if (data.sales && data.sales.length > 0) {
      setSalesState(data.sales);
      saveSales(data.sales);
    }
    if (data.employees && data.employees.length > 0) {
      setEmployeesState(data.employees);
      saveEmployees(data.employees);
    }
    if (data.operations && data.operations.length > 0) {
      setOperationsState(data.operations);
      saveOperations(data.operations);
    }
    if (data.matches && data.matches.length > 0) {
      setMatchesState(data.matches);
      saveMatches(data.matches);
    }
  };

  return (
    <div id="app-wrapper" className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        matches={matches}
        activeMatchId={activeMatchId}
        onSelectActiveMatch={handleSelectActiveMatch}
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
