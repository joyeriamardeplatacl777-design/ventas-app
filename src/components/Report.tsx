import React from 'react';
import { formatCLP } from '../utils/format';

interface ReportProps {
  summaryRef: React.RefObject<HTMLDivElement>;
  reportPeriod: 'today' | 'week' | 'month' | 'year' | 'date';
  getPeriodName: (p: ReportProps['reportPeriod']) => string;
  salesSummary: { total: number; mayor: number; detalle: number; arreglos: number; grabados: number; efectivo: number; tarjeta: number; transferencia: number; credito: number; };
  expensesSummary: { total: number; compras: number; servicios: number; suministros: number; transporte: number; marketing: number; equipamiento: number; mantenimiento: number; gastos_generales: number; personal: number; impuestos: number; otros: number; };
  salesCount: number;
  expensesCount: number;
  netProfit: number;
  onDownloadImage: () => void;
}

function ReportComponent({ summaryRef, reportPeriod, getPeriodName, salesSummary, expensesSummary, salesCount, expensesCount, netProfit, onDownloadImage }: ReportProps) {
  return (
    <div className="space-y-4">
      <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Resumen Financiero</h2>
          <button
            onClick={onDownloadImage}
            className="flex items-center px-4 py-2 bg-[#d4af37] hover:bg-[#b8962e] text-[#111111] rounded-2xl shadow-md"
          >
            Descargar imagen
          </button>
        </div>

        <div ref={summaryRef}>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-[#d4af37]/20">
              <div className="text-sm text-[#333]">TOTAL INGRESOS</div>
              <div className="text-2xl font-bold">{formatCLP(salesSummary.total)}</div>
              <div className="text-sm text-[#333]">{salesCount} ventas</div>
              {salesCount > 0 && (
                <div className="text-xs text-[#555]">{formatCLP(salesSummary.total / salesCount)} promedio</div>
              )}
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#d4af37]/20">
              <div className="text-sm text-[#333]">TOTAL EGRESOS</div>
              <div className="text-2xl font-bold">{formatCLP(expensesSummary.total)}</div>
              <div className="text-sm text-[#333]">{expensesCount} gastos</div>
              {expensesCount > 0 && (
                <div className="text-xs text-[#555]">{formatCLP(expensesSummary.total / expensesCount)} promedio</div>
              )}
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#d4af37]/20">
              <div className="text-sm text-[#333]">GANANCIA NETA</div>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCLP(netProfit)}</div>
              <div className="text-sm text-[#333]">{netProfit >= 0 ? 'Ganancia' : 'Pérdida'}</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-[#333]">
            {getPeriodName(reportPeriod)}
          </div>
        </div>
      </div>
    </div>
  );
}

export const Report = React.memo(ReportComponent);

