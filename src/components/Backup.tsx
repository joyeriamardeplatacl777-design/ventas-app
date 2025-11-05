import React from 'react';

interface BackupProps {
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  loginForm: { username: string; password: string };
  setLoginForm: (v: { username: string; password: string }) => void;
  loginError: string;
  setLoginError: (v: string) => void;
  lastBackup: Date | null;
  needsBackup: boolean;
  showBackupSuccess: boolean;
  counts: { clients: number; sales: number; expenses: number };
  onCreateBackup: () => void;
  onRestoreBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  clearAllData: () => void;
}

export const Backup = React.memo(function Backup({
  isAuthenticated,
  setIsAuthenticated,
  loginForm,
  setLoginForm,
  loginError,
  setLoginError,
  lastBackup,
  needsBackup,
  showBackupSuccess,
  counts,
  onCreateBackup,
  onRestoreBackup,
  fileInputRef,
  clearAllData,
}: BackupProps) {
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-center mb-6">Acceso a Respaldos</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Usuario"
            value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            className="w-full p-3 border rounded-md"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            className="w-full p-3 border rounded-md"
          />
          {loginError && <div className="bg-red-100 text-red-700 p-3 rounded">{loginError}</div>}
          <button
            onClick={() => {
              if (
                (loginForm.username === 'admin' && loginForm.password === 'admin123') ||
                (loginForm.username === 'gerente' && loginForm.password === 'gerente123') ||
                (loginForm.username === 'supervisor' && loginForm.password === 'super123')
              ) {
                setIsAuthenticated(true);
                sessionStorage.setItem('backup_auth', 'true');
                setLoginError('');
              } else {
                setLoginError('Credenciales inválidas');
              }
            }}
            className="w-full bg-[#d4af37] hover:bg-[#b8962e] text-[#111111] py-3 px-4 rounded-2xl font-medium shadow-md"
          >
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Sistema de Respaldos</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-4 border border-[#d4af37]/20">
            <h3 className="text-lg font-semibold mb-3">Crear Respaldo Completo</h3>
            <p className="text-[#333] mb-4">Guarda todos tus datos en un archivo JSON</p>
            <button
              onClick={onCreateBackup}
              className="w-full bg-[#d4af37] hover:bg-[#b8962e] text-[#111111] py-3 px-4 rounded-2xl font-medium shadow-md"
            >
              Crear Respaldo
            </button>
            {showBackupSuccess && (
              <div className="mt-3 bg-[#6abf69]/10 border border-[#6abf69]/40 text-[#6abf69] px-4 py-2 rounded-2xl text-center">
                Respaldo creado exitosamente
              </div>
            )}
            <div className="mt-3 text-sm text-[#555]">
              <p>Último respaldo: {lastBackup ? lastBackup.toLocaleDateString('es-ES') : 'Sin respaldos'}</p>
              <p className={needsBackup ? 'text-yellow-700' : ''}>{needsBackup ? 'Se recomienda crear un respaldo' : ''}</p>
            </div>
          </div>

          <div className="bg-[#f9f7f3] text-[#111111] rounded-2xl shadow-md p-4 border border-[#d4af37]/20">
            <h3 className="text-lg font-semibold mb-3">Restaurar</h3>
            <p className="text-[#333] mb-4">Sube un archivo de respaldo</p>
            <input type="file" accept=".json" onChange={onRestoreBackup} ref={fileInputRef} style={{ display: 'none' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[#d4af37] hover:bg-[#b8962e] text-[#111111] py-3 px-4 rounded-2xl font-medium shadow-md"
            >
              Seleccionar Archivo
            </button>
            <div className="mt-3 text-sm text-[#555]">
              <p>{counts.clients} clientes</p>
              <p>{counts.sales} ventas</p>
              <p>{counts.expenses} egresos</p>
            </div>

            <div className="mt-4 p-3 bg-[#b94a48]/10 border border-[#b94a48]/40 rounded-2xl">
              <h4 className="font-semibold text-red-800 mb-2">Zona de Peligro</h4>
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
    </div>
  );
});
