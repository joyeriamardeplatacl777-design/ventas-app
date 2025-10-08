export type ClientType = 'detalle' | 'mayorista';

export interface ClientForm {
  name: string;
  phone: string;
  email: string;
  type: ClientType;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: ClientType;
  createdAt: string;
  updatedAt?: string;
}

export interface Sale {
  id: number;
  clientId: string;
  category: 'mayor' | 'detalle' | 'arreglos' | 'grabados';
  amount: number; // ✅ Cambiado a number para consistencia
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
  description?: string;
  clientName: string;
  date: string;
  updatedAt?: string;
}

export interface SaleForm {
  clientId: string;
  category: Sale['category'];
  amount: string; // string porque viene del input
  paymentMethod: Sale['paymentMethod'];
  description: string;
}

export type FundingSource =
  | 'efectivo_caja'
  | 'banco'
  | 'tarjeta'
  | 'cuenta_corriente'
  | 'cuenta_ahorro'
  | 'ventas_hoy'
  | 'prestamo'
  | 'credito_proveedor'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'otros';

export type ExpenseCategory =
  | 'compras'
  | 'servicios'
  | 'suministros'
  | 'transporte'
  | 'marketing'
  | 'equipamiento'
  | 'mantenimiento'
  | 'gastos_generales'
  | 'personal'
  | 'impuestos'
  | 'otros';

export interface ExpenseForm {
  id?: number;
  category: ExpenseCategory;
  amount: string;
  description: string;
  fundingSource: FundingSource;
  supplier: string;
  receiptNumber: string;
  date?: string;
  updatedAt?: string;
}

export interface Expense extends Omit<ExpenseForm, 'amount'> {
  amount: number; // aquí ya se guarda como número
  id: number;
  date: string;
  updatedAt: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export type TabType = 'clients' | 'sales' | 'expenses' | 'report' | 'backup';
export type ReportPeriod = 'today' | 'week' | 'month' | 'year';


