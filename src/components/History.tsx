import React from 'react';
import { formatCLP, formatCLDateTime } from '../utils/format';

interface HistoryTotals {
  total: number;
  mayor: number;
  detalle: number;
}

interface HistoryProps {
  historyRef: React.RefObject<HTMLDivElement>;
  filter: 'all' | 'mayor' | 'detalle';
  setFilter: (v: 'all' | 'mayor' | 'detalle') => void;
  historyQuery: string;
  setHistoryQuery: (v: string) => void;
  salesFilteredForHistory: Array<{
    id: number;
    date: string;
    clientName: string;
    category: 'mayor' | 'detalle' | string;
    amount: number;
    paymentMethod: string;
    description?: string;
  }>;
  historyTotals: HistoryTotals;
  downloadSalesHistoryCSV: () => void;
  downloadHistoryAsText: () => void;
  onExportImage: () => void;
}

function HistoryComponent({
  historyRef,
  filter,
  setFilter,
  historyQuery,
  setHistoryQuery,
  salesFilteredForHistory,
  historyTotals,
  downloadSalesHistoryCSV,
  downloadHistoryAsText,
  onExportImage,
}: HistoryProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-[#d4af37]">Historial de Ventas</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-2xl text-sm font-medium border ${
              filter === 'all'
                ? 'bg-[#d4af37] text-[#111111] border-[#d4af37]'
                : 'bg-white/10 text-white border-[#d4af37]/30 hover:bg-white/20'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('mayor')}
            className={`px-3 py-2 rounded-2xl text-sm font-medium border ${
              filter === 'mayor'
                ? 'bg-[#d4af37] text-[#111111] border-[#d4af37]'
                : 'bg-white/10 text-white border-[#d4af37]/30 hover:bg-white/20'
            }`}
          >
            Mayorista
          </button>
          <button
            onClick={() => setFilter('detalle')}
            className={`px-3 py-2 rounded-2xl text-sm font-medium border ${
              filter === 'detalle'
                ? 'bg-[#d4af37] text-[#111111] border-[#d4af37]'
                : 'bg-white/10 text-white border-[#d4af37]/30 hover:bg-white/20'
            }`}
          >
            Detalle
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          type="text"
          value={historyQuery}
          onChange={(e) => setHistoryQuery(e.target.value)}
          placeholder="Buscar por nombre o fecha (dd, mm, aaaa, dd/mm/aaaa)"
          className="w-full md:w-1/2 p-2 border border-[#d4af37]/30 rounded-2xl bg-[#f9f7f3] text-[#111111]"
        />
        <div className="flex gap-2">
          <button
            onClick={onExportImage}
            className="bg-[#d4af37] hover:bg-[#b8962e] text-[#111111] px-4 py-2 rounded-2xl shadow-md transition-colors"
          >
            Exportar Imagen
          </button>
          <button
            onClick={downloadSalesHistoryCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors"
          >
            Descargar CSV
          </button>
          <button
            onClick={downloadHistoryAsText}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors flex items-center gap-2"
          >
            Descargar TXT
          </button>
        </div>
      </div>

      <div ref={historyRef} className="overflow-x-auto border border-[#d4af37]/20 rounded-2xl bg-[#f9f7f3] text-[#111111]">
        <table id="history-table" className="min-w-full text-sm">
          <thead className="bg-[#d4af37] text-[#111111]">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Cliente</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Monto</th>
              <th className="px-3 py-2 text-left">Método de pago</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-left">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d4af37]/15">
            {salesFilteredForHistory.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[#333]/70">Sin resultados</td>
              </tr>
            ) : (
              salesFilteredForHistory.map((s) => (
                <tr key={s.id} className="hover:bg-black/5">
                  <td className="px-3 py-2 whitespace-nowrap">{formatCLDateTime(new Date(s.date))}</td>
                  <td className="px-3 py-2">{s.clientName}</td>
                  <td className="px-3 py-2">
                    {s.category === 'mayor' ? 'Mayorista' : s.category === 'detalle' ? 'Detalle' : s.category}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatCLP(s.amount)}</td>
                  <td className="px-3 py-2 capitalize">{s.paymentMethod}</td>
                  <td className="px-3 py-2 max-w-[360px] truncate" title={s.description || ''}>{s.description}</td>
                  <td className="px-3 py-2">{s.id}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-black/5 text-[#111]">
              <td className="px-3 py-2 font-semibold" colSpan={2}>Totales</td>
              <td className="px-3 py-2">
                <div className="text-xs text-[#111]/80">Mayorista: {formatCLP(historyTotals.mayor)}</div>
                <div className="text-xs text-[#111]/80">Detalle: {formatCLP(historyTotals.detalle)}</div>
              </td>
              <td className="px-3 py-2 font-semibold">{formatCLP(historyTotals.total)}</td>
              <td className="px-3 py-2" colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export const History = React.memo(HistoryComponent);

