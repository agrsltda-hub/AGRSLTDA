
import React from 'react';
import { LayoutDashboard, Tractor, Map, Beaker, Truck, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Início', icon: LayoutDashboard, path: '/' },
    { name: 'Máquinas', icon: Tractor, path: '/machinery' },
    { name: 'Talhões', icon: Map, path: '/plots' },
    { name: 'Insumos', icon: Beaker, path: '/inputs' },
    { name: 'Produção', icon: Truck, path: '/production' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <Tractor className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AgroPro</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-all ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 mb-20 md:mb-0 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
