import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, Mail, DollarSign, Calendar, Download, Plus, Trash2, Edit2, Save, Shield, Database, AlertCircle } from 'lucide-react';
import { Client,ClientForm, Sale, ExpenseForm, ClientType, LoginForm, Expense, SaleForm } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import html2canvas from 'html2canvas';


// Función para formatear pesos chilenos
const formatCLP = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    currencyDisplay: 'symbol', // muestra "$"
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const SalesManagementSystem = () => {
  const [clients, setClients] = useLocalStorage<Client[]>('clients', []);
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', []);
  const [editingExpense, setEditingExpense] = useState<ExpenseForm | null>(null);
  type Tab = 'clients' | 'sales' | 'expenses' | 'report' | 'backup';
  const [activeTab, setActiveTab] = useState('clients');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [showBackupSuccess, setShowBackupSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientForm, setClientForm] = useState<ClientForm>({
    name: '',
    phone: '',
    email: '',
    type: 'detalle',
  });
  // Aquí asegúrate de usar SaleForm, no Sale
  const [saleForm, setSaleForm] = useState<SaleForm>({
    clientId: '',
    category: 'detalle',
    amount: '', // string porque es input
    paymentMethod: 'efectivo',
    description: ''
  });

  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({
    category: 'compras',
    amount: '',
    description: '',
    fundingSource: 'efectivo_caja',
    supplier: '',
    receiptNumber: ''
  });
  const formattedExpenseAmount = expenseForm.amount
    ? Number.parseInt(expenseForm.amount, 10).toLocaleString('es-CL')
    : '';
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({ username: '', password: '',});

  const [loginError, setLoginError] = useState('');
  const [reportPeriod, setReportPeriod] = useState<Period>('today');
  type HistoryFilter = 'all' | 'today' | 'range' | 'date';
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [specificDate, setSpecificDate] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const summaryRef = useRef<HTMLDivElement | null>(null);

  // Función para mostrar mensaje de éxito
  const showSuccess = (message: string) => {
    setShowSuccessMessage(message);
    setTimeout(() => {
      setShowSuccessMessage('');
    }, 4000);
  };

  // Cargar datos al inicializar
  useEffect(() => {
    loadLastBackupDate();
    
    const savedAuth = sessionStorage.getItem('backup_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Cargar fecha del último respaldo
  const downloadSummaryAsImage = async () => {
    if (!summaryRef.current) {
      alert('No se encontró el resumen para capturar.');
      return;
    }

    try {
      const captureOptions: any = {
        background: '#ffffff',
        scale: window.devicePixelRatio > 1 ? 2 : 1.5,
      };

      const canvas = await html2canvas(summaryRef.current, captureOptions);


      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'reporte-diario.png';
      link.click();
      showSuccess('✅ Resumen descargado como imagen');
    } catch (error) {
      console.error('Error al generar la imagen del resumen:', error);
      alert('No fue posible generar la imagen del resumen.');
    }
  };

  const loadLastBackupDate = () => {
    const lastBackupStr = localStorage.getItem('sales_system_last_backup');
    if (lastBackupStr) {
      setLastBackup(new Date(lastBackupStr));
    }
  };

  // Agregar egreso
  const addExpense = () => {
    const amountInput = expenseForm.amount;
    const trimmedDescription = expenseForm.description.trim();

    if (!amountInput || !trimmedDescription) {
      alert('¡El monto y la descripción son obligatorios!');
      return;
    }

    const cleanedAmount = amountInput
      .replace(/\s/g, '')
      .replace(/[^0-9.,-]/g, '');

    let normalizedAmount = cleanedAmount.replace(/,/g, '.');
    if (!normalizedAmount) {
      alert('¡Por favor ingresa un monto válido!');
      return;
    }

    const decimalSeparatorIndex = normalizedAmount.lastIndexOf('.');
    if (decimalSeparatorIndex !== -1) {
      const integerPart = normalizedAmount.slice(0, decimalSeparatorIndex).replace(/\./g, '');
      const decimalPart = normalizedAmount.slice(decimalSeparatorIndex + 1);
      normalizedAmount = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
    } else {
      normalizedAmount = normalizedAmount.replace(/\./g, '');
    }

    const numericAmount = Number.parseFloat(normalizedAmount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert('¡Por favor ingresa un monto válido!');
      return;
    }

    const normalizedExpenseData = {
      category: expenseForm.category,
      amount: numericAmount,
      description: trimmedDescription,
      fundingSource: expenseForm.fundingSource,
      supplier: (expenseForm.supplier || '').trim(),
      receiptNumber: (expenseForm.receiptNumber || '').trim(),
    };

    let updatedExpenses: Expense[];

    if (editingExpense) {
      updatedExpenses = expenses.map((expense) =>
        expense.id === editingExpense.id
          ? {
              ...expense,
              ...normalizedExpenseData,
              updatedAt: new Date().toISOString(),
            }
          : expense
      );

      setEditingExpense(null);
      showSuccess(`✅ Egreso modificado - ${formatCLP(numericAmount)}`);
    } else {
      const newExpense: Expense = {
        id: Date.now(),
        ...normalizedExpenseData,
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      updatedExpenses = [...expenses, newExpense];
      showSuccess(`✅ Egreso registrado - ${formatCLP(numericAmount)}`);
    }

    setExpenses(updatedExpenses);

    setExpenseForm({
      category: 'compras',
      amount: '',
      description: '',
      fundingSource: 'efectivo_caja',
      supplier: '',
      receiptNumber: '',
    });
  };

    
  // Editar egreso
  const editExpense = (expense: ExpenseForm): void => {
    const normalizedAmount = String(expense.amount ?? '').replace(/\D/g, '');
    const sanitizedAmount = normalizedAmount ? Number.parseInt(normalizedAmount, 10).toString() : '';

    setExpenseForm({
      category: expense.category,
      amount: sanitizedAmount,
      description: expense.description,
      fundingSource: expense.fundingSource,
      supplier: expense.supplier || '',
      receiptNumber: expense.receiptNumber || ''
    });

    setEditingExpense({
      ...expense,
      amount: sanitizedAmount,
    });
    setActiveTab('expenses');

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Cancelar edición de egreso
  const cancelEditExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: 'compras',
      amount: '',
      description: '',
      fundingSource: 'efectivo_caja',
      supplier: '',
      receiptNumber: ''
    }as ExpenseForm); // Aseguramos que cumple con el tipo
  };

  // Eliminar egreso
  const deleteExpense = (expenseId: number): void => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      alert('Egreso no encontrado.');
      return;
    }
    
    const confirmMsg = `¿Eliminar este egreso?\n\nDescripción: ${expense.description}\nMonto: ${formatCLP(Number(expense.amount))}\nCategoría: ${expense.category}\nFecha: ${new Date(expense.date).toLocaleString('es-CL')}`;
    
    if (window.confirm(confirmMsg)) {
      try {
        const updatedExpenses = expenses.filter(e => e.id !== expenseId);
        setExpenses(updatedExpenses);
        showSuccess(`✅ Egreso eliminado correctamente`);
      } catch (error) {
        console.error('Error eliminando egreso:', error);
        alert('Error al eliminar el egreso.');
      }
    }
  };

  // Validar solo números para teléfono
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value: string = e.target.value;
    const numbersOnly: string = value.replace(/\D/g, ''); // elimina todo lo que no sea número

    setClientForm({
      ...clientForm,
      phone: numbersOnly.slice(0, 9) // Asegura máximo 9 dígitos
    });
  };


  // Validar solo letras para nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value: string = e.target.value;

  // Solo letras (mayúsculas, minúsculas, tildes, ñ, Ñ y espacios)
  const filteredValue: string = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');

  setClientForm({
    ...clientForm,
    name: filteredValue.trimStart() // Evita espacios al inicio
  });
};


  // Agregar cliente
  // Agregar cliente
  const addClient = () => {
    const trimmedName = clientForm.name.trim();
    const trimmedPhone = clientForm.phone.trim();
    const trimmedEmail = clientForm.email.trim();

    if (!trimmedName) {
      alert('¡El nombre del cliente es obligatorio!');
      return;
    }

    if (trimmedPhone && trimmedPhone.length !== 9) {
      alert('¡El teléfono debe tener 9 dígitos!');
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      alert('¡El correo no tiene un formato válido!');
      return;
    }

    const duplicate = clients.find((c) =>
      c.id !== editingClient?.id && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      alert('¡Ya existe un cliente con este nombre!');
      return;
    }

    const normalizedClientData = {
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      type: clientForm.type as ClientType,
    };

    let updatedClients: Client[];

    if (editingClient) {
      updatedClients = clients.map((client) =>
        client.id === editingClient.id
          ? {
              ...client,
              ...normalizedClientData,
              updatedAt: new Date().toISOString(),
            }
          : client
      );

      setEditingClient(null);
      showSuccess(`¡Éxito. Cliente "${trimmedName}" se modificó correctamente`);
    } else {
      const newClient: Client = {
        id: crypto.randomUUID(),
        ...normalizedClientData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      updatedClients = [...clients, newClient];
      showSuccess(`¡Éxito. Cliente "${trimmedName}" registrado exitosamente`);
    }

    setClients(updatedClients);

    setClientForm({
      name: '',
      phone: '',
      email: '',
      type: 'detalle' as ClientType,
    });
  };





  // Editar cliente
  const editClient = (client: Client): void => {
    setClientForm({
      name: client.name,
      phone: client.phone,
      email: client.email,
      type: client.type as ClientType, // Lo casteamos
  });

  setEditingClient(client);
};


  // Cancelar edición de cliente
  const cancelEditClient = () => {
    setEditingClient(null);
    setClientForm({ name: '', phone: '', email: '', type: 'detalle' });
  };

  // Eliminar cliente
  const deleteClient = (clientId: string) => {
    const confirmed = window.confirm('¿Seguro que deseas eliminar este cliente?');
    if (!confirmed) return;

    const updated = clients.filter(c => c.id !== clientId);
    setClients(updated);

    // Si se estaba editando este cliente, reseteamos el formulario
    if (editingClient && editingClient.id === clientId) {
      cancelEditClient();
    }

    showSuccess('✅ Cliente eliminado correctamente');
  };

  // Agregar venta
// Agregar venta
const addSale = () => {
  if (!saleForm.clientId || !saleForm.amount) {
    alert('¡Debes seleccionar un cliente y un monto válido!');
    return;
  }

  // Buscar cliente
  const client = clients.find(c => c.id === saleForm.clientId);
  if (!client) {
    alert('Cliente no encontrado.');
    return;
  }

  // Convertir monto string a número
  const numericAmount = parseFloat(saleForm.amount.replace(/[^\d]/g, ""));
  if (isNaN(numericAmount) || numericAmount <= 0) {
    alert('¡Por favor ingresa un monto válido!');
    return;
  }

  let updatedSales: Sale[];

  if (editingSale) {
    // Editar venta existente
    updatedSales = sales.map((sale) =>
      sale.id === editingSale.id
        ? {
            ...sale,
            clientId: saleForm.clientId,
            clientName: client.name,
            category: saleForm.category,
            amount: numericAmount,
            paymentMethod: saleForm.paymentMethod,
            description: saleForm.description,
            updatedAt: new Date().toISOString(),
          }
        : sale
    );

    setEditingSale(null);
    showSuccess(`✅ Venta modificada correctamente - ${formatCLP(numericAmount)}`);
  } else {
    // Crear nueva venta
    const newSale: Sale = {
      id: Date.now(),
      clientId: saleForm.clientId,
      clientName: client.name,
      category: saleForm.category,
      amount: numericAmount,
      paymentMethod: saleForm.paymentMethod,
      description: saleForm.description,
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updatedSales = [...sales, newSale];
    showSuccess(`✅ Venta registrada exitosamente - ${formatCLP(numericAmount)}`);
  }

  // Actualizar ventas
  setSales(updatedSales);

  // Resetear formulario
  setSaleForm({
    clientId: "",
    category: "detalle",
    amount: "",
    paymentMethod: "efectivo",
    description: "",
  });
  setClientSearchTerm("");
};


// Editar venta
const editSale = (sale: Sale) => {
  const client = clients.find(c => c.id === sale.clientId);

  const formValues: SaleForm = {
    clientId: sale.clientId,
    category: sale.category,
    amount: sale.amount.toString(), // Convertir number a string
    paymentMethod: sale.paymentMethod,
    description: sale.description || ''
  };

  setSaleForm(formValues); // Ya es SaleForm válido
  setClientSearchTerm(client ? client.name : '');
  setEditingSale(sale);
  setShowClientDropdown(false);
  setActiveTab('sales');

  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 100);
};


// Cancelar edición de venta
const cancelEditSale = () => {
  setEditingSale(null);
  setSaleForm({
    clientId: '',
    category: 'detalle',
    amount: '',
    paymentMethod: 'efectivo',
    description: ''
  });
  setClientSearchTerm('');
  setShowClientDropdown(false);
}


  const deleteSale = (saleId: number) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
      alert('Venta no encontrada.');
      return;
    }

    const confirmMsg = `¿Eliminar esta venta?\n\nCliente: ${sale.clientName}\nMonto: ${formatCLP(sale.amount)}\nCategoría: ${sale.category}\nFecha: ${new Date(sale.date).toLocaleString('es-CL')}`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const updatedSales = sales.filter(s => s.id !== saleId);
      setSales(updatedSales);

      if (editingSale?.id === saleId) {
        cancelEditSale();
      }

      showSuccess('✅ Venta eliminada correctamente');
    } catch (error) {
      console.error('Error eliminando venta:', error);
      alert('Error al eliminar la venta.');
    }
  };
  // Filtrar clientes por búsqueda
  const getFilteredClients = () => {
    if (!clientSearchTerm.trim()) return clients;
    
    return clients.filter(client => 
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.phone.includes(clientSearchTerm) ||
      client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.type.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  };

  // Seleccionar cliente desde búsqueda
  const selectClientFromSearch = (client: Client): void => {
    setSaleForm({...saleForm, clientId: client.id.toString()});
    setClientSearchTerm(client.name);
    setShowClientDropdown(false);
  };

  // Limpiar búsqueda de cliente
  const clearClientSearch = () => {
    setClientSearchTerm('');
    setSaleForm({...saleForm, clientId: ''});
    setShowClientDropdown(false);
  };

  // Crear respaldo completo
  const createFullBackup = () => {
    const backupData = {
      clients: clients,
      sales: sales,
      expenses: expenses,
      backup_date: new Date().toISOString(),
      version: '1.0',
      system: 'Sales Management System'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo-completo-${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const now = new Date().toISOString();
    localStorage.setItem('sales_system_last_backup', now);
    setLastBackup(new Date(now));
    
    setShowBackupSuccess(true);
    setTimeout(() => setShowBackupSuccess(false), 3000);
  };

  // Restaurar desde respaldo modificado pero de verficar despues
  const restoreFromBackup = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        
        if (!result) {
          alert('No se pudo leer el archivo de respaldo.');
          return;
        }

        const backupData = JSON.parse(result as string);

        if (window.confirm('¿Estás seguro de restaurar este respaldo? Se reemplazarán todos los datos actuales.')) {
          setClients(backupData.clients);
          setSales(backupData.sales);
          setExpenses(backupData.expenses || []);
          
          alert(`Respaldo restaurado exitosamente!\nFecha del respaldo: ${new Date(backupData.backup_date).toLocaleString('es-ES')}\nClientes: ${backupData.clients.length}\nVentas: ${backupData.sales.length}\nEgresos: ${(backupData.expenses || []).length}`);
        }
      } catch (error) {
        alert('Error al leer el archivo de respaldo.');
        console.error('Error restaurando respaldo:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
 // Confirmar despues
  // Verificar si necesita respaldo
  const checkAutoBackup = () => {
    if (!lastBackup) {
      return true;
    }
    const daysSinceBackup = Math.floor((new Date().getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceBackup >= 7;
  };

  // Limpiar todos los datos
  const clearAllData = () => {
    if (window.confirm('⚠️ ATENCIÓN: ¿Estás seguro de eliminar TODOS los datos?\n\nEsto eliminará:\n• Todos los clientes\n• Todas las ventas\n• Todos los egresos\n• Todo el historial\n\nEsta acción NO se puede deshacer.')) {
      if (window.confirm('⚠️ CONFIRMACIÓN FINAL: ¿Realmente quieres eliminar todo?')) {
        try {
          localStorage.removeItem('sales_system_clients');
          localStorage.removeItem('sales_system_sales');
          localStorage.removeItem('sales_system_expenses');
          localStorage.removeItem('sales_system_last_backup');
          
          setClients([]);
          setSales([]);
          setExpenses([]);
          setLastBackup(null);
          
          alert('¡Todos los datos han sido eliminados!');
        } catch (error) {
          console.error('Error eliminando datos:', error);
          alert('Error al eliminar los datos.');
        }
      }
    }
  };

  // Calcular resumen de transacciones
  const getTransactionsSummary = (period = 'today') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let start: Date, end: Date;
    switch (period) {
      case 'today':
        start = today;
        end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        start = today;
        end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
    }
    
    const periodSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= start && saleDate <= end;
    });

    const periodExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });

    const salesSummary = {
      mayor: 0,
      detalle: 0,
      arreglos: 0,
      grabados: 0,
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      credito: 0,
      total: 0
    };

    const expensesSummary = {
      compras: 0,
      servicios: 0,
      suministros: 0,
      transporte: 0,
      marketing: 0,
      equipamiento: 0,
      mantenimiento: 0,
      gastos_generales: 0,
      personal: 0,
      impuestos: 0,
      otros: 0,
      total: 0
    };

    periodSales.forEach(sale => {
      salesSummary[sale.category] += sale.amount;
      salesSummary[sale.paymentMethod] += sale.amount;
      salesSummary.total += sale.amount;
    });

    periodExpenses.forEach(expense => {
      expensesSummary[expense.category] += expense.amount;
      expensesSummary.total += expense.amount;
    });

    return { 
      sales: salesSummary, 
      expenses: expensesSummary,
      salesCount: periodSales.length,
      expensesCount: periodExpenses.length,
      netProfit: salesSummary.total - expensesSummary.total
    };
  };

  // Obtener nombre del período
  type Period = 'today' | 'week' | 'month' | 'year';
  const getPeriodName = (period: Period): string => {
    const now = new Date();
    switch (period) {
      case 'today':
        return `Hoy - ${now.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `Esta Semana - ${startOfWeek.toLocaleDateString('es-ES')} al ${endOfWeek.toLocaleDateString('es-ES')}`;
      case 'month':
        return `Este Mes - ${now.toLocaleDateString('es-ES', { 
          month: 'long', 
          year: 'numeric' 
        })}`;
      case 'year':
        return `Este Año - ${now.getFullYear()}`;
      default:
        return '';
    }
  };

  const { sales: salesSummary, expenses: expensesSummary, salesCount, expensesCount, netProfit } = getTransactionsSummary(reportPeriod);
  const needsBackup = checkAutoBackup();

  const isExpenseFormDisabled = (): boolean => {
    return (
      !expenseForm.amount.trim() ||
      !expenseForm.description.trim() ||
      !expenseForm.category ||
      !expenseForm.fundingSource
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
          Sistema de Registro de Ventas y Egresos
        </h1>
        
        {/* Indicadores de estado */}
        <div className="flex justify-center gap-4 mb-4 flex-wrap">
          <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 flex items-center">
            <Save className="mr-2 text-green-600" size={16} />
            <span className="text-green-700 text-sm">Guardado automático</span>
          </div>
          
          <div className={`border rounded-lg px-3 py-2 flex items-center ${
            needsBackup ? 'bg-yellow-100 border-yellow-300' : 'bg-blue-100 border-blue-300'
          }`}>
            <Shield className={`mr-2 ${needsBackup ? 'text-yellow-600' : 'text-blue-600'}`} size={16} />
            <span className={`text-sm ${needsBackup ? 'text-yellow-700' : 'text-blue-700'}`}>
              {lastBackup 
                ? `Último respaldo: ${lastBackup.toLocaleDateString('es-ES')}`
                : 'Sin respaldos'
              }
            </span>
          </div>
          
          <div className="bg-purple-100 border border-purple-300 rounded-lg px-3 py-2 flex items-center">
            <Database className="mr-2 text-purple-600" size={16} />
            <span className="text-purple-700 text-sm">
              {clients.length} clientes • {sales.length} ventas • {expenses.length} egresos
            </span>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {showSuccessMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center animate-pulse">
            <div className="flex items-center justify-center">
              <span className="text-lg">{showSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* Mensaje de respaldo */}
        {showBackupSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center">
            ¡Respaldo creado exitosamente!
          </div>
        )}

        {/* Alerta de respaldo */}
        {needsBackup && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="mr-2" size={20} />
              <span>Se recomienda crear un respaldo</span>
            </div>
            <button
              onClick={createFullBackup}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
            >
              Crear Respaldo
            </button>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg p-1 shadow-md">
          {['clients', 'sales', 'expenses', 'report', 'backup'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'clients' && 'Clientes'}
              {tab === 'sales' && 'Ventas'}
              {tab === 'expenses' && 'Egresos'}
              {tab === 'report' && 'Resumen'}
              {tab === 'backup' && 'Respaldos'}
            </button>
          ))}
        </div>
      </div>

      {/* Sección de Respaldos */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-center mb-6">Acceso a Respaldos</h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Usuario"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full p-3 border rounded-md"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full p-3 border rounded-md"
                />
                
                {loginError && (
                  <div className="bg-red-100 text-red-700 p-3 rounded">
                    {loginError}
                  </div>
                )}
                
                <button
                  onClick={() => {
                    if (
                      (loginForm.username === 'admin' && loginForm.password === 'admin123') ||
                      (loginForm.username === 'gerente' && loginForm.password === 'gerente123') ||
                      (loginForm.username === 'supervisor' && loginForm.password === 'super123')
                    ) {
                      setIsAuthenticated(true);
                      setLoginError('');
                      setLoginForm({ username: '', password: '' });
                      sessionStorage.setItem('backup_auth', 'true');
                    } else {
                      setLoginError('Usuario o contraseña incorrectos');
                    }
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md font-medium"
                >
                  Iniciar Sesión
                </button>
                
                <button
                  onClick={() => setActiveTab('clients')}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md"
                >
                  Cancelar
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">Credenciales:</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div><strong>admin</strong> / <strong>admin123</strong></div>
                  <div><strong>gerente</strong> / <strong>gerente123</strong></div>
                  <div><strong>supervisor</strong> / <strong>super123</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold flex items-center">
                  <Shield className="mr-2" size={24} />
                  Sistema de Respaldos
                </h2>
                <button
                  onClick={() => {
                    setIsAuthenticated(false);
                    setActiveTab('clients');
                    setLoginForm({ username: '', password: '' });
                    setLoginError('');
                    sessionStorage.removeItem('backup_auth');
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
                >
                  Cerrar Sesión
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Crear Respaldo</h3>
                  <p className="text-gray-600 mb-4">Descarga todos tus datos</p>
                  <button
                    onClick={createFullBackup}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-md font-medium"
                  >
                    Descargar Respaldo
                  </button>
                  <div className="mt-3 text-sm text-gray-500">
                    <p>{clients.length} clientes</p>
                    <p>{sales.length} ventas</p>
                    <p>{expenses.length} egresos</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Restaurar</h3>
                  <p className="text-gray-600 mb-4">Sube un archivo de respaldo</p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={restoreFromBackup}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-md font-medium"
                  >
                    Seleccionar Archivo
                  </button>
                  
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-semibold text-red-800 mb-2">⚠️ Zona de Peligro</h4>
                    <button
                      onClick={clearAllData}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm"
                    >
                      Eliminar Todos los Datos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sección de Egresos */}
      {activeTab === 'expenses' && (
        <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
        <DollarSign className="mr-2 text-red-500" size={20} />
        {editingExpense ? 'Modificar Egreso' : 'Registrar Egreso'}
          </h2>
          <div className="space-y-4">
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={expenseForm.category}
            onChange={(e) =>
              setExpenseForm({
              ...expenseForm,
              category: e.target.value as ExpenseForm['category'],
            })
          }
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
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-red-50 text-red-600 text-sm font-medium">
              -$
            </span>
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
            onChange={(e) =>
              setExpenseForm({
              ...expenseForm,
              fundingSource: e.target.value as 'efectivo_caja' | 'banco' | 'tarjeta',
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        required
          >
            <option value="efectivo_caja">Efectivo de Caja</option>
            <option value="cuenta_corriente">Cuenta Corriente</option>
            <option value="cuenta_ahorro">Cuenta de Ahorros</option>
            <option value="tarjeta_debito">Tarjeta de Débito</option>
            <option value="tarjeta_credito">Tarjeta de Crédito</option>
            <option value="ventas_hoy">Ventas del Día</option>
            <option value="prestamo">Préstamo</option>
            <option value="credito_proveedor">Crédito con Proveedor</option>
            <option value="otros">Otros</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
          <textarea
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Describe el gasto..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
          <input
            type="text"
            value={expenseForm.supplier}
            onChange={(e) => setExpenseForm({...expenseForm, supplier: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre del proveedor o empresa"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">N° Boleta/Factura</label>
          <input
            type="text"
            value={expenseForm.receiptNumber}
            onChange={(e) => setExpenseForm({...expenseForm, receiptNumber: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Número de documento"
          />
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
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Egresos del Día</h2>
      <div className="max-h-96 overflow-y-auto">
        {expenses.filter(expense => new Date(expense.date).toDateString() === new Date().toDateString()).length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay egresos hoy</p>
        ) : (
          <div className="space-y-3">
            {expenses
              .filter(expense => new Date(expense.date).toDateString() === new Date().toDateString())
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(expense => (
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
                          {expense.supplier && (
                            <div>Proveedor: {expense.supplier}</div>
                          )}
                          {expense.receiptNumber && (
                            <div>Doc: {expense.receiptNumber}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(expense.date).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-red-600">
                          -{formatCLP(Number(expense.amount))}
                        </p>
                        <div className="flex gap-1 mt-1 justify-end">
                          <button
                            onClick={() =>
                              editExpense({
                                ...expense,
                                amount: expense.amount.toString(), // Convertir number a string
                              })
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
)}

      {/* Sección de Clientes */}
      {activeTab === 'clients' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <User className="mr-2" size={20} />
              {editingClient ? 'Modificar Cliente' : 'Registrar Cliente'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={handleNameChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre completo del cliente"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +56
                  </span>
                  <input
                    type="tel"
                    value={clientForm.phone}
                    onChange={handlePhoneChange}
                    placeholder="912345678"
                    maxLength={9}
                    className="flex-1 p-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={clientForm.type}
                  onChange={(e) => setClientForm({...clientForm, type: e.target.value as ClientType})}
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
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <Plus className="mr-2" size={16} />
                  {editingClient ? 'Actualizar' : 'Agregar'}
                </button>
                {editingClient && (
                  <button
                    type="button"
                    onClick={cancelEditClient}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Lista de Clientes</h2>
            <div className="max-h-96 overflow-y-auto">
              {clients.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay clientes registrados</p>
              ) : (
                <div className="space-y-3">
                  {clients.map(client => (
                    <div key={client.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{client.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            {client.phone && (
                              <div className="flex items-center">
                                <Phone size={12} className="mr-1" />
                                +56 {client.phone}
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center">
                                <Mail size={12} className="mr-1" />
                                {client.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            client.type === 'mayorista'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {client.type}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => editClient(client)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Editar cliente"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Eliminar cliente"
                            >
                              <Trash2 size={14} />
                            </button>
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
      )}

      {/* Sección de Ventas */}
      {activeTab === 'sales' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DollarSign className="mr-2" size={20} />
              {editingSale ? 'Modificar Venta' : 'Registrar Venta'}
            </h2>
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
                        if (!e.target.value.trim()) {
                          setSaleForm({...saleForm, clientId: ''});
                        }
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Buscar cliente..."
                      required
                    />
                    {clientSearchTerm ? (
                      <button
                        type="button"
                        onClick={clearClientSearch}
                        className="px-3 border border-l-0 border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      >
                        ?
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowClientDropdown(!showClientDropdown)}
                        className="px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                      >
                        ?
                      </button>
                    )}
                  </div>
                  
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {(() => {
                        const filteredClients = clientSearchTerm.trim() ? getFilteredClients() : clients;
                        
                        if (clients.length === 0) {
                          return (
                            <div className="p-3 text-gray-500 text-center">
                              <div className="mb-2">No hay clientes registrados</div>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('clients');
                                  setShowClientDropdown(false);
                                }}
                                className="text-blue-500 hover:text-blue-700 text-sm underline"
                              >
                                Registrar primer cliente
                              </button>
                            </div>
                          );
                        }
                        
                        if (filteredClients.length === 0 && clientSearchTerm.trim()) {
                          return (
                            <div className="p-3 text-gray-500 text-center">
                              <div className="mb-2">No se encontraron clientes</div>
                            </div>
                          );
                        }
                        
                        return filteredClients.map(client => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => selectClientFromSearch(client)}
                            className="w-full text-left p-3 hover:bg-gray-100"
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-600">
                              {client.phone && `+56 ${client.phone}`} {client.email && client.email}
                            </div>
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                  
                  {showClientDropdown && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowClientDropdown(false)}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={saleForm.category}
                  onChange={(e) =>
                    setSaleForm({
                    ...saleForm,
                    category: e.target.value as Sale['category'], // Aquí el cast
                  })
                }
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
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">
                    $
                  </span>
                  <input
                    type="text"
                    value={saleForm.amount}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/\D/g, '');
                      
                      if (value === '') {
                        setSaleForm({...saleForm, amount: ''});
                        return;
                      }
                      
                      const numericValue = parseInt(value);
                      if (!isNaN(numericValue)) {
                        const formattedValue = numericValue.toLocaleString('es-CL');
                        setSaleForm({...saleForm, amount: formattedValue});
                      }
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500"
                    placeholder="15.000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select
                  value={saleForm.paymentMethod}
                  onChange={(e) =>
                    setSaleForm({
                      ...saleForm,
                      paymentMethod: e.target.value as Sale['paymentMethod'], // Cast al tipo correcto
                    })
                  }
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
                <textarea
                  value={saleForm.description}
                  onChange={(e) => setSaleForm({...saleForm, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addSale}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                  disabled={clients.length === 0 || !saleForm.clientId || !saleForm.amount.replace(/\D/g, '')}
                >
                  <Plus className="mr-2" size={16} />
                  {editingSale ? 'Actualizar' : 'Registrar'}
                </button>
                {editingSale && (
                  <button
                    type="button"
                    onClick={cancelEditSale}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Ventas del Día</h2>
            <div className="max-h-96 overflow-y-auto">
              {sales.filter(sale => new Date(sale.date).toDateString() === new Date().toDateString()).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay ventas hoy</p>
              ) : (
                <div className="space-y-3">
                  {sales
                    .filter(sale => new Date(sale.date).toDateString() === new Date().toDateString())
                    .map(sale => (
                    <div key={sale.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium">{sale.clientName}</h3>
                              <div className="text-sm text-gray-600">
                                <span className="capitalize">{sale.category}</span> • 
                                <span className="capitalize ml-1">{sale.paymentMethod}</span>
                              </div>
                              {sale.description && (
                                <p className="text-sm text-gray-500 mt-1">{sale.description}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-green-600">
                                {formatCLP(sale.amount)}
                              </p>
                              <div className="flex gap-1 mt-1 justify-end">
                                <button
                                  onClick={() => editSale(sale)}
                                  className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                                  title="Editar venta"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => deleteSale(sale.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                  title="Eliminar venta"
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
      )}

      {/* Resumen Financiero */}
      {activeTab === 'report' && (
        <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold flex items-center">
              <Calendar className="mr-2" size={24} />
              Resumen Financiero
            </h2>
            
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Período:</label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value as Period)}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="today">Hoy</option>
                  <option value="week">Esta Semana</option>
                  <option value="month">Este Mes</option>
                  <option value="year">Este año</option>
                </select>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  // Crear el contenido HTML del reporte
                  const reportHTML = `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Reporte Financiero - ${getPeriodName(reportPeriod)}</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; }
                        .header h1 { color: #1f2937; margin-bottom: 10px; }
                        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
                        .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; }
                        .summary-card.green { background: #f0fdf4; border-color: #bbf7d0; }
                        .summary-card.red { background: #fef2f2; border-color: #fecaca; }
                        .summary-card.blue { background: #eff6ff; border-color: #bfdbfe; }
                        .summary-card h3 { margin-bottom: 10px; font-size: 16px; }
                        .summary-card .amount { font-size: 24px; font-weight: bold; margin: 10px 0; }
                        .green .amount { color: #059669; }
                        .red .amount { color: #dc2626; }
                        .blue .amount { color: #2563eb; }
                        .details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
                        .details-section h4 { border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
                        .detail-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f3f4f6; }
                        .detail-row:last-child { border-bottom: none; }
                        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
                        @media print { body { margin: 0; } }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>Reporte Financiero</h1>
                        <h2>${getPeriodName(reportPeriod)}</h2>
                        <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
                      </div>

                      <div class="summary-grid">
                        <div class="summary-card green">
                          <h3>TOTAL INGRESOS</h3>
                          <div class="amount">${formatCLP(salesSummary.total)}</div>
                          <div>${salesCount} ventas</div>
                          ${salesCount > 0 ? `<div>${formatCLP(salesSummary.total / salesCount)} promedio</div>` : ''}
                        </div>
                        <div class="summary-card red">
                          <h3>TOTAL EGRESOS</h3>
                          <div class="amount">${formatCLP(expensesSummary.total)}</div>
                          <div>${expensesCount} gastos</div>
                          ${expensesCount > 0 ? `<div>${formatCLP(expensesSummary.total / expensesCount)} promedio</div>` : ''}
                        </div>
                        <div class="summary-card ${netProfit >= 0 ? 'blue' : 'red'}">
                          <h3>GANANCIA NETA</h3>
                          <div class="amount">${formatCLP(netProfit)}</div>
                          <div>${netProfit >= 0 ? 'Ganancia' : 'Pérdida'}</div>
                        </div>
                      </div>

                      <div class="details-grid">
                        <div class="details-section">
                          <h4>Ingresos por Categoría</h4>
                          <div class="detail-row"><span>Por mayor:</span><span>${formatCLP(salesSummary.mayor)}</span></div>
                          <div class="detail-row"><span>Detalle:</span><span>${formatCLP(salesSummary.detalle)}</span></div>
                          <div class="detail-row"><span>Arreglos:</span><span>${formatCLP(salesSummary.arreglos)}</span></div>
                          <div class="detail-row"><span>Grabados:</span><span>${formatCLP(salesSummary.grabados)}</span></div>
                        </div>
                        <div class="details-section">
                          <h4>Egresos por Categoría</h4>
                          <div class="detail-row"><span>Compras:</span><span>${formatCLP(expensesSummary.compras)}</span></div>
                          <div class="detail-row"><span>Servicios:</span><span>${formatCLP(expensesSummary.servicios)}</span></div>
                          <div class="detail-row"><span>Suministros:</span><span>${formatCLP(expensesSummary.suministros)}</span></div>
                          <div class="detail-row"><span>Transporte:</span><span>${formatCLP(expensesSummary.transporte)}</span></div>
                          <div class="detail-row"><span>Otros:</span><span>${formatCLP(expensesSummary.marketing + expensesSummary.equipamiento + expensesSummary.mantenimiento + expensesSummary.gastos_generales + expensesSummary.personal + expensesSummary.impuestos + expensesSummary.otros)}</span></div>
                        </div>
                        <div class="details-section">
                          <h4>Métodos de Pago</h4>
                          <div class="detail-row"><span>Efectivo:</span><span>${formatCLP(salesSummary.efectivo)}</span></div>
                          <div class="detail-row"><span>Tarjeta:</span><span>${formatCLP(salesSummary.tarjeta)}</span></div>
                          <div class="detail-row"><span>Transferencia:</span><span>${formatCLP(salesSummary.transferencia)}</span></div>
                          <div class="detail-row"><span>Crédito:</span><span>${formatCLP(salesSummary.credito)}</span></div>
                        </div>
                      </div>

                      <div class="footer">
                        <p>Sistema de Registro de Ventas y Egresos | Reporte generado automáticamente</p>
                      </div>
                    </body>
                    </html>
                  `;

                  // Crear y descargar el archivo HTML
                  const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  
                  // Generar nombre del archivo con fecha y período
                  const today = new Date();
                  const dateStr = today.toLocaleDateString('es-CL').replace(/\//g, '-');
                  const periodStr = reportPeriod === 'today' ? 'diario' : 
                                   reportPeriod === 'week' ? 'semanal' : 'mensual';
                  
                  link.download = `reporte-${periodStr}-${dateStr}.html`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  
                  // Mostrar mensaje de éxito
                  showSuccess(`✅ Reporte ${periodStr} descargado correctamente como archivo HTML`);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
              >
                <Download className="mr-2" size={16} />
                Descargar Reporte
              </button>
              <button
                type="button"
                onClick={downloadSummaryAsImage}
                className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                <span className="mr-2" role="img" aria-hidden="true">📸</span>
                Descargar como imagen
              </button>
            </div>
          </div>

          <div ref={summaryRef} className="bg-white p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Resumen - {reportPeriod === 'today' ? 'Diario' : reportPeriod === 'week' ? 'Semanal' : 'Mensual'}
              </h1>
              <p className="text-gray-600">{getPeriodName(reportPeriod)}</p>
              <div className="mt-2 flex justify-center items-center gap-4">
                <span className="text-sm text-green-600">Ingresos: {salesCount}</span>
                <span className="text-sm text-red-600">Egresos: {expensesCount}</span>
                <span className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Neto: {formatCLP(netProfit)}
                </span>
              </div>
            </div>

            {salesCount === 0 && expensesCount === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Calendar size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No hay transacciones en este período
                </h3>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-700">Ingresos por Categoría</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Por mayor:</span>
                        <span className="font-semibold text-green-600">{formatCLP(salesSummary.mayor)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Detalle:</span>
                        <span className="font-semibold text-green-600">{formatCLP(salesSummary.detalle)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Arreglos:</span>
                        <span className="font-semibold text-green-600">{formatCLP(salesSummary.arreglos)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Grabados:</span>
                        <span className="font-semibold text-green-600">{formatCLP(salesSummary.grabados)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-700">Egresos por Categoría</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Compras:</span>
                        <span className="font-semibold text-red-600">{formatCLP(expensesSummary.compras)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Servicios:</span>
                        <span className="font-semibold text-red-600">{formatCLP(expensesSummary.servicios)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Suministros:</span>
                        <span className="font-semibold text-red-600">{formatCLP(expensesSummary.suministros)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Transporte:</span>
                        <span className="font-semibold text-red-600">{formatCLP(expensesSummary.transporte)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Otros:</span>
                        <span className="font-semibold text-red-600">{formatCLP(
                          expensesSummary.marketing + expensesSummary.equipamiento + 
                          expensesSummary.mantenimiento + expensesSummary.gastos_generales + 
                          expensesSummary.personal + expensesSummary.impuestos + expensesSummary.otros
                        )}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-blue-700">Métodos de Pago</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Efectivo:</span>
                        <span className="font-semibold text-blue-600">{formatCLP(salesSummary.efectivo)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Tarjeta:</span>
                        <span className="font-semibold text-blue-600">{formatCLP(salesSummary.tarjeta)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Transferencia:</span>
                        <span className="font-semibold text-blue-600">{formatCLP(salesSummary.transferencia)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Crédito:</span>
                        <span className="font-semibold text-blue-600">{formatCLP(salesSummary.credito)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200">
                    <h3 className="text-lg font-bold text-green-800 mb-2">TOTAL INGRESOS</h3>
                    <p className="text-3xl font-bold text-green-600 mb-1">
                      {formatCLP(salesSummary.total)}
                    </p>
                    <div className="text-sm text-green-700">
                      {salesCount} ventas
                      {salesCount > 0 && (
                        <div>{formatCLP(salesSummary.total / salesCount)} promedio</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg text-center border border-red-200">
                    <h3 className="text-lg font-bold text-red-800 mb-2">TOTAL EGRESOS</h3>
                    <p className="text-3xl font-bold text-red-600 mb-1">
                      {formatCLP(expensesSummary.total)}
                    </p>
                    <div className="text-sm text-red-700">
                      {expensesCount} gastos
                      {expensesCount > 0 && (
                        <div>{formatCLP(expensesSummary.total / expensesCount)} promedio</div>
                      )}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg text-center border-2 ${
                    netProfit >= 0 
                      ? 'bg-gradient-to-r from-blue-50 to-green-100 border-green-300' 
                      : 'bg-gradient-to-r from-yellow-50 to-red-100 border-red-300'
                  }`}>
                    <h3 className={`text-lg font-bold mb-2 ${netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      GANANCIA NETA
                    </h3>
                    <p className={`text-3xl font-bold mb-1 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCLP(netProfit)}
                    </p>
                    <div className={`text-sm ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {netProfit >= 0 ? 'Ganancia' : 'Pérdida'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManagementSystem;









