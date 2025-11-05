import React from 'react';
import { Sale, SaleForm, Client } from '../types';
import { formatCLP } from '../utils/format';

interface SalesProps {
  clients: Client[];
  sales: Sale[];
  saleForm: SaleForm;
  setSaleForm: (v: SaleForm) => void;
  clientSearchTerm: string;
  setClientSearchTerm: (v: string) => void;
  showClientDropdown: boolean;
  setShowClientDropdown: (v: boolean) => void;
  getFilteredClients: () => Client[];
  selectClientFromSearch: (c: Client) => void;
  clearClientSearch: () => void;
  addSale: () => void;
  editingSale: Sale | null;
  cancelEditSale: () => void;
  editSale: (s: Sale) => void;
  deleteSale: (id: number) => void;
}

export function Sales({
  clients,
  sales,
  saleForm,
  setSaleForm,
  clientSearchTerm,
  setClientSearchTerm,
  showClientDropdown,
  setShowClientDropdown,
  getFilteredClients,
  selectClientFromSearch,
  clearClientSearch,
  addSale,
  editingSale,
  cancelEditSale,
  editSale,
  deleteSale,
}: SalesProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{editingSale ? 'Modificar Venta' : 'Registrar Venta'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <div className="relative">
              <div className="flex">
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => {
                    setClientSearchTerm(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre, teléfono o correo"
                />
                {saleForm.clientId ? (
                  <button type="button" onClick={clearClientSearch} className="px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800">×</button>
                ) : (
                  <button type="button" onClick={() => setShowClientDropdown(!showClientDropdown)} className="px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800">?</button>
                )}
              </div>
              {showClientDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {(() => {
                    const filtered = clientSearchTerm.trim() ? getFilteredClients() : clients;
                    if (clients.length === 0) {
                      return (
                        <div className="p-3 text-gray-500 text-center">
                          <div className="mb-2">No hay clientes registrados</div>
                        </div>
                      );
                    }
                    if (filtered.length === 0 && clientSearchTerm.trim()) {
                      return (
                        <div className="p-3 text-gray-500 text-center">
                          <div className="mb-2">No se encontraron clientes</div>
                        </div>
                      );
                    }
                    return filtered.map((client) => (
                      <button key={client.id} type="button" onClick={() => selectClientFromSearch(client)} className="w-full text-left p-3 hover:bg-gray-100">
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-600">{client.phone && `+56 ${client.phone}`} {client.email && client.email}</div>
                      </button>
                    ));
                  })()}
                </div>
              )}
              {showClientDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowClientDropdown(false)} />}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={saleForm.category}
              onChange={(e) => setSaleForm({ ...saleForm, category: e.target.value as Sale['category'] })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="mayor">Venta al por mayor</option>
              <option value="detalle">Venta al detalle</option>
              <option value="arreglos">Arreglos</option>
              <option value="grabados">Grabados</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP) *</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">$</span>
              <input
                type="text"
                value={saleForm.amount}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\D/g, '');
                  setSaleForm({ ...saleForm, amount: value });
                }}
                className="flex-1 p-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500"
                placeholder="50.000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
            <select
              value={saleForm.paymentMethod}
              onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value as Sale['paymentMethod'] })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="credito">Crédito</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              value={saleForm.description}
              onChange={(e) => setSaleForm({ ...saleForm, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={saleForm.date || ''}
              onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addSale}
              className="flex-1 bg-[#d4af37] hover:bg-[#b8962e] text-[#111111] py-2 px-4 rounded-md font-medium transition-colors"
            >
              {editingSale ? 'Actualizar' : 'Registrar'} Venta
            </button>
            {editingSale && (
              <button
                type="button"
                onClick={cancelEditSale}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-medium transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Ventas del Día</h2>
        <div className="max-h-96 overflow-y-auto">
          {sales.filter((s) => new Date(s.date).toDateString() === new Date().toDateString()).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay ventas hoy</p>
          ) : (
            <div className="space-y-3">
              {sales
                .filter((s) => new Date(s.date).toDateString() === new Date().toDateString())
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((sale) => (
                  <div key={sale.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{sale.clientName}</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div><span className="capitalize">{sale.category}</span></div>
                              <div><span className="capitalize">{sale.paymentMethod}</span></div>
                              {sale.description && <div className="truncate" title={sale.description}>{sale.description}</div>}
                              <div className="text-xs text-gray-500">{new Date(sale.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-yellow-700">{formatCLP(Number(sale.amount))}</p>
                            <div className="flex gap-1 mt-1 justify-end">
                              <button onClick={() => editSale(sale)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50" title="Editar venta">Editar</button>
                              <button onClick={() => deleteSale(sale.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Eliminar venta">Eliminar</button>
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

