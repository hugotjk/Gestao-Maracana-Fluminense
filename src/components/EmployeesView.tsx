import React, { useState } from 'react';
import { UserPlus, Search, Edit2, Trash2, CheckCircle2, Building, Mail, Phone, Hash, Shield, Star } from 'lucide-react';
import { Employee } from '../types';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (cpf: string) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [setor, setSetor] = useState('1,2,3,4,5,6');
  const [empresa, setEmpresa] = useState('FMS');
  const [funcaoDefault, setFuncaoDefault] = useState('Atendente');

  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const resetForm = () => {
    setNome('');
    setCpf('');
    setEmail('');
    setCelular('');
    setSetor('1,2,3,4,5,6');
    setEmpresa('FMS');
    setFuncaoDefault('Atendente');
    setEditingEmployee(null);
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setNome(emp.nome);
    setCpf(emp.cpf);
    setEmail(emp.email);
    setCelular(emp.celular);
    setSetor(emp.setor || '1,2,3,4,5,6');
    setEmpresa(emp.empresa || 'FMS');
    setFuncaoDefault(emp.funcaoDefault || 'Atendente');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCpf = cpf.replace(/\D/g, '');
    if (!cleanCpf || !nome.trim()) {
      setFeedback('Preencha o Nome e o CPF do funcionário.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const newEmp: Employee = {
      cpf: cleanCpf,
      nome: nome.trim(),
      email: email.trim() || 'email@email.com.br',
      celular: celular.replace(/\D/g, '') || '21999999999',
      setor: setor.trim() || '1,2,3,4,5,6',
      empresa: empresa.trim() || 'FMS',
      funcaoDefault: funcaoDefault.trim() || 'Atendente',
    };

    if (editingEmployee) {
      onUpdateEmployee(newEmp);
      setFeedback('Cadastro de funcionário atualizado com sucesso!');
    } else {
      // Check duplicate
      const exists = employees.some((e) => e.cpf === cleanCpf);
      if (exists) {
        setFeedback('Já existe um funcionário cadastrado com este CPF.');
        setTimeout(() => setFeedback(null), 3000);
        return;
      }
      onAddEmployee(newEmp);
      setFeedback('Funcionário cadastrado com sucesso!');
    }

    resetForm();
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredEmployees = employees
    .filter((emp) => {
      const q = searchTerm.toLowerCase();
      return (
        emp.nome.toLowerCase().includes(q) ||
        emp.cpf.includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.empresa.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const favA = a.favorito ? 1 : 0;
      const favB = b.favorito ? 1 : 0;
      if (favA !== favB) return favB - favA;
      return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    });

  return (
    <div id="employees-view-root" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title Card */}
      <div id="employees-title-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-[#006633]" />
            Cadastro de Funcionários
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cadastre equipes para atuação nos setores. Empresa padrão: <strong>FMS</strong> | Setores padrão: <strong>1,2,3,4,5,6</strong>
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {editingEmployee ? `Editando: ${editingEmployee.nome}` : 'Novo Cadastro de Funcionário'}
          </h3>
          {editingEmployee && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome Completo: *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: João da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              CPF (somente números): *
            </label>
            <input
              type="text"
              required
              disabled={!!editingEmployee}
              placeholder="Ex: 12345678900"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none disabled:bg-slate-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email de Contato:
            </label>
            <input
              type="email"
              placeholder="email@email.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>

          {/* Celular */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Celular / WhatsApp:
            </label>
            <input
              type="text"
              placeholder="Ex: 21999999999"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>

          {/* Setor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Setores Atendidos (padrão: 1,2,3,4,5,6):
            </label>
            <input
              type="text"
              placeholder="1,2,3,4,5,6"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>

          {/* Empresa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Empresa (padrão: FMS):
            </label>
            <input
              type="text"
              placeholder="FMS"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#006633] hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{editingEmployee ? 'Salvar Alterações' : 'Cadastrar Funcionário'}</span>
          </button>
        </div>
      </form>

      {/* Employees Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Funcionários Cadastrados ({employees.length})
            </h3>
            <p className="text-xs text-slate-500">
              Esta lista alimenta automaticamente a aba "Funcionarios" na Planilha Google
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006633]"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3 text-center">Fav</th>
                <th className="py-3 px-4">CPF</th>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Celular</th>
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.cpf} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onUpdateEmployee({ ...emp, favorito: !emp.favorito })}
                        className="p-1 rounded-md hover:bg-amber-100/60 transition-colors cursor-pointer"
                        title={emp.favorito ? 'Remover dos favoritos' : 'Marcar como favorito'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            emp.favorito
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300 hover:text-amber-400'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {emp.cpf}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {emp.nome}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.email}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.celular}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.setor}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-bold">
                      {emp.empresa}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleStartEdit(emp)}
                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteEmployee(emp.cpf)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
