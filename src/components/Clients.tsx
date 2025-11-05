import React from 'react';
import { Client, ClientForm, ClientType } from '../types';

interface ClientsProps {
  clients: Client[];
  clientForm: ClientForm;
  setClientForm: (v: ClientForm) => void;
  editingClient: Client | null;
  addClient: () => void;
  editClient: (c: Client) => void;
  cancelEditClient: () => void;
  deleteClient: (id: string) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clientSearchList: string;
  setClientSearchList: (v: string) => void;
  filteredClientList: Client[];
}

export function Clients({
  clients,
  clientForm,
  setClientForm,
  editingClient,
  addClient,
  editClient,
  cancelEditClient,
  deleteClient,
  handlePhoneChange,
  handleNameChange,
  clientSearchList,
  setClientSearchList,
  filteredClientList,
}: ClientsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{editingClient ? 'Modificar Cliente' : 'Registrar Cliente'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={clientForm.name}
              onChange={handleNameChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del cliente"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={clientForm.phone}
                onChange={handlePhoneChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="987654321"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="correo@ejemplo.cl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={clientForm.type}
              onChange={(e) => setClientForm({ ...clientForm, type: e.target.value as ClientType })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="detalle">Detalle</option>
              <option value="mayorista">Mayorista</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addClient}
              className="flex-1 bg-[#d4af37] hover:bg-[#b8962e] text-[#111111] py-2 px-4 rounded-md font-medium transition-colors"
            >
              {editingClient ? 'Actualizar' : 'Registrar'} Cliente
            </button>
            {editingClient && (
              <button
                type="button"
                onClick={cancelEditClient}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-medium transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Clientes</h2>
          <input
            type="text"
            value={clientSearchList}
            onChange={(e) => setClientSearchList(e.target.value)}
            className="p-2 border rounded-md"
            placeholder="Buscar cliente"
          />
        </div>

        {filteredClientList.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay clientes registrados</p>
        ) : (
          <div className="space-y-2">
            {filteredClientList.map((client) => (
              <div key={client.id} className="p-3 border rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-gray-600">{client.phone && `+56 ${client.phone}`} {client.email}</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600" onClick={() => editClient(client)}>Editar</button>
                  <button className="text-red-600" onClick={() => deleteClient(client.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

