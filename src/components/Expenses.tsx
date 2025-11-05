import React from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { Expense, ExpenseForm } from '../types';
import { formatCLP } from '../utils/format';

interface ExpensesProps {
  expenseForm: ExpenseForm;
  setExpenseForm: (v: ExpenseForm) => void;
  editingExpense: ExpenseForm | null;
  addExpense: () => void;
  cancelEditExpense: () => void;
  editExpense: (e: ExpenseForm) => void;
  deleteExpense: (id: number) => void;
  expenses: Expense[];
}

export function Expenses({ expenseForm, setExpenseForm, editingExpense, addExpense, cancelEditExpense, editExpense, deleteExpense, expenses }: ExpensesProps) {
  const formattedExpenseAmount = expenseForm.amount ? Number.parseInt(expenseForm.amount, 10).toLocaleString('es-CL') : '';

  const isExpenseFormDisabled = (): boolean => {
    return (
      !expenseForm.amount.trim() ||
      !expenseForm.description.trim() ||
      !expenseForm.category ||
      !expenseForm.fundingSource
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <DollarSign className="mr-2 text-[#d4af37]" size={20} />
          {editingExpense ? 'Modificar Egreso' : 'Registrar Egreso'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseForm['category'] })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="compras">Compras de Mercancía</option>
              <option value="servicios">Servicios</option>
              <option value="suministros">Suministros</option>
              <option value="transporte">Transporte</option>
              <option value="marketing">Marketing/Publicidad</option>
              <option value="equipamiento">Equipamiento</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="gastos_generales">Gastos Generales</option>
              <option value="personal">Personal</option>
              <option value="impuestos">Impuestos</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP) *</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-red-50 text-red-600 text-sm font-medium">-
                $</span>
              <input
                type="text"
                value={formattedExpenseAmount}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  if (digitsOnly === '') {
                    setExpenseForm({ ...expenseForm, amount: '' });
                    return;
                  }
                  const normalizedDigits = Number.parseInt(digitsOnly, 10).toString();
                  setExpenseForm({ ...expenseForm, amount: normalizedDigits });
                }}
                className="flex-1 p-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500"
                placeholder="50.000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origen de los Fondos *</label>
            <select
              value={expenseForm.fundingSource}
              onChange={(e) => setExpenseForm({ ...expenseForm, fundingSource: e.target.value as ExpenseForm['fundingSource'] })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="efectivo_caja">Efectivo (Caja)</option>
              <option value="banco">Banco</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="cuenta_corriente">Cuenta Corriente</option>
              <option value="cuenta_ahorro">Cuenta de Ahorro</option>
              <option value="ventas_hoy">Ventas del Día</option>
              <option value="prestamo">Préstamo</option>
              <option value="credito_proveedor">Crédito de Proveedor</option>
              <option value="tarjeta_debito">Tarjeta Débito</option>
              <option value="tarjeta_credito">Tarjeta Crédito</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <input
              type="text"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Detalle del gasto"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input
                type="text"
                value={expenseForm.supplier}
                onChange={(e) => setExpenseForm({ ...expenseForm, supplier: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre proveedor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Boleta/Factura</label>
              <input
                type="text"
                value={expenseForm.receiptNumber}
                onChange={(e) => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Número de documento"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addExpense}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
              disabled={isExpenseFormDisabled()}
            >
              <Plus className="mr-2" size={16} />
              {editingExpense ? 'Actualizar' : 'Registrar'} Egreso
            </button>
            {editingExpense && (
              <button
                type="button"
                onClick={cancelEditExpense}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-medium transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Egresos del Día</h2>
        <div className="max-h-96 overflow-y-auto">
          {expenses.filter((e) => new Date(e.date).toDateString() === new Date().toDateString()).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay egresos hoy</p>
          ) : (
            <div className="space-y-3">
              {expenses
                .filter((e) => new Date(e.date).toDateString() === new Date().toDateString())
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense) => (
                  <div key={expense.id} className="border border-red-200 bg-red-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{expense.description}</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                <span className="capitalize">{expense.category.replace('_', ' ')}</span>
                              </div>
                              <div>
                                Origen: <span className="capitalize">{expense.fundingSource.replace('_', ' ')}</span>
                              </div>
                              {expense.supplier && <div>Proveedor: {expense.supplier}</div>}
                              {expense.receiptNumber && <div>Doc: {expense.receiptNumber}</div>}
                              <div className="text-xs text-gray-500">
                                {new Date(expense.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-red-600">-{formatCLP(Number(expense.amount))}</p>
                            <div className="flex gap-1 mt-1 justify-end">
                              <button
                                onClick={() =>
                                  editExpense({
                                    ...expense,
                                    amount: expense.amount.toString(),
                                  } as unknown as ExpenseForm)
                                }
                                className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                                title="Editar egreso"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title="Eliminar egreso"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
