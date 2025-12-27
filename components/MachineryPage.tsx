
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tractor, Clock, Fuel, X, Save, Activity, Activity as Gauge } from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { Machine, Plot, MachineryUsage, FuelRefill } from '../types';

export default function MachineryPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [usage, setUsage] = useState<MachineryUsage[]>([]);
  const [fuelRefills, setFuelRefills] = useState<FuelRefill[]>([]);
  
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingUsageId, setEditingUsageId] = useState<number | null>(null);
  const [editingFuelId, setEditingFuelId] = useState<number | null>(null);

  const [machineForm, setMachineForm] = useState<{
    name: string;
    type: string;
    model: string;
    year: string;
    status: Machine['status'];
  }>({
    name: '',
    type: '',
    model: '',
    year: '',
    status: 'Ativo',
  });

  const [usageForm, setUsageForm] = useState({
    machinery_id: '',
    plot_id: '',
    usage_date: new Date().toISOString().split('T')[0],
    hours_used: '',
    fuel_consumed: '',
    notes: '',
  });

  const [fuelForm, setFuelForm] = useState({
    machinery_id: '',
    refill_date: new Date().toISOString().split('T')[0],
    quantity_liters: '',
    price_per_liter: '',
    odometer_reading: '',
    notes: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [m, p, u, f] = await Promise.all([
      mockApi.getMachines(),
      mockApi.getPlots(),
      mockApi.getUsage(),
      mockApi.getFuel()
    ]);
    setMachines(m);
    setPlots(p);
    setUsage(u);
    setFuelRefills(f);
  };

  const handleMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mockApi.saveMachine({
      name: machineForm.name,
      type: machineForm.type,
      model: machineForm.model,
      year: parseInt(machineForm.year),
      status: machineForm.status,
    }, editingId || undefined);

    resetMachineForm();
    loadAll();
  };

  const resetMachineForm = () => {
    setMachineForm({ name: '', type: '', model: '', year: '', status: 'Ativo' });
    setShowMachineForm(false);
    setEditingId(null);
  };

  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const machine = machines.find(m => m.id === parseInt(usageForm.machinery_id));
    const plot = plots.find(p => p.id === parseInt(usageForm.plot_id));
    
    await mockApi.saveUsage({
      machinery_id: parseInt(usageForm.machinery_id),
      machinery_name: machine?.name || '?',
      plot_id: parseInt(usageForm.plot_id),
      plot_name: plot?.name || '?',
      usage_date: usageForm.usage_date,
      hours_used: parseFloat(usageForm.hours_used),
      fuel_consumed: parseFloat(usageForm.fuel_consumed) || 0,
      notes: usageForm.notes,
    }, editingUsageId || undefined);

    setUsageForm({ machinery_id: '', plot_id: '', usage_date: new Date().toISOString().split('T')[0], hours_used: '', fuel_consumed: '', notes: '' });
    setShowUsageForm(false);
    setEditingUsageId(null);
    loadAll();
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const machine = machines.find(m => m.id === parseInt(fuelForm.machinery_id));
    const quantity = parseFloat(fuelForm.quantity_liters);
    const pricePerLiter = fuelForm.price_per_liter ? parseFloat(fuelForm.price_per_liter) : null;
    const totalCost = pricePerLiter ? quantity * pricePerLiter : null;
    
    await mockApi.saveFuel({
      machinery_id: parseInt(fuelForm.machinery_id),
      machinery_name: machine?.name || '?',
      refill_date: fuelForm.refill_date,
      quantity_liters: quantity,
      price_per_liter: pricePerLiter,
      total_cost: totalCost,
      odometer_reading: fuelForm.odometer_reading ? parseFloat(fuelForm.odometer_reading) : null,
      notes: fuelForm.notes || null,
    }, editingFuelId || undefined);

    setFuelForm({ machinery_id: '', refill_date: new Date().toISOString().split('T')[0], quantity_liters: '', price_per_liter: '', odometer_reading: '', notes: '' });
    setShowFuelForm(false);
    setEditingFuelId(null);
    loadAll();
  };

  const handleEditMachine = (machine: Machine) => {
    setMachineForm({
      name: machine.name,
      type: machine.type,
      model: machine.model,
      year: machine.year.toString(),
      status: machine.status,
    });
    setEditingId(machine.id);
    setShowMachineForm(true);
  };

  const handleEditUsage = (u: MachineryUsage) => {
    setUsageForm({
      machinery_id: u.machinery_id.toString(),
      plot_id: u.plot_id.toString(),
      usage_date: u.usage_date,
      hours_used: u.hours_used.toString(),
      fuel_consumed: u.fuel_consumed.toString(),
      notes: u.notes,
    });
    setEditingUsageId(u.id);
    setShowUsageForm(true);
  };

  const handleEditFuel = (f: FuelRefill) => {
    setFuelForm({
      machinery_id: f.machinery_id.toString(),
      refill_date: f.refill_date,
      quantity_liters: f.quantity_liters.toString(),
      price_per_liter: f.price_per_liter?.toString() || '',
      odometer_reading: f.odometer_reading?.toString() || '',
      notes: f.notes || '',
    });
    setEditingFuelId(f.id);
    setShowFuelForm(true);
  };

  // CÁLCULO CORRIGIDO: Total Abastecido / Total Horas Trabalhadas
  const getMachineConsumption = (machineId: number) => {
    const machineUsage = usage.filter(u => u.machinery_id === machineId);
    const machineRefills = fuelRefills.filter(f => f.machinery_id === machineId);
    
    const totalHours = machineUsage.reduce((sum, u) => sum + u.hours_used, 0);
    const totalFuelAbastecido = machineRefills.reduce((sum, f) => sum + f.quantity_liters, 0);
    
    return totalHours > 0 ? totalFuelAbastecido / totalHours : 0;
  };

  const statusColors: Record<string, string> = {
    'Ativo': 'bg-green-100 text-green-700 border-green-200',
    'Manutenção': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Inativo': 'bg-red-100 text-red-700 border-red-200',
  };

  const totalFuelCost = fuelRefills.reduce((sum, refill) => sum + (refill.total_cost || 0), 0);
  const totalFuelVolume = fuelRefills.reduce((sum, refill) => sum + refill.quantity_liters, 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Frota de Máquinas</h1>
          <p className="text-slate-500 text-sm md:text-base">Gestão operacional e eficiência de combustível</p>
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => { setShowFuelForm(true); setEditingFuelId(null); }}
            className="flex items-center justify-center space-x-2 bg-orange-500 text-white px-4 py-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
          >
            <Fuel className="w-4 h-4" />
            <span className="font-bold text-sm">Abastecer</span>
          </button>
          <button
            onClick={() => { setShowUsageForm(true); setEditingUsageId(null); }}
            className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
          >
            <Clock className="w-4 h-4" />
            <span className="font-bold text-sm text-nowrap">Registrar Uso</span>
          </button>
          <button
            onClick={() => { setShowMachineForm(true); setEditingId(null); }}
            className="col-span-2 flex items-center justify-center space-x-2 bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="font-bold text-sm">Nova Máquina</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-orange-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-100 text-xs md:text-sm font-semibold uppercase tracking-wider">Custo Total Diesel</span>
            <Fuel className="w-5 h-5 md:w-6 md:h-6 opacity-40" />
          </div>
          <div className="text-2xl md:text-4xl font-black">
            R$ {totalFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-4 flex items-center space-x-2 text-orange-100">
            <span className="text-xs">Volume acumulado:</span>
            <span className="font-bold text-sm">{totalFuelVolume.toFixed(1)} L</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-100 text-xs md:text-sm font-semibold uppercase tracking-wider">Frota Operacional</span>
            <Activity className="w-5 h-5 md:w-6 md:h-6 opacity-40" />
          </div>
          <div className="text-2xl md:text-4xl font-black">
            {machines.length} Máquinas
          </div>
          <div className="mt-4 flex items-center space-x-2 text-indigo-100">
            <span className="text-xs">Status Ativo:</span>
            <span className="font-bold text-sm">{machines.filter(m => m.status === 'Ativo').length} unidades</span>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Tractor className="w-5 h-5 text-emerald-600" />
          <span>Frota Cadastrada</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {machines.map((machine) => {
            const avgCons = getMachineConsumption(machine.id);
            const totalHours = usage.filter(u => u.machinery_id === machine.id).reduce((a, b) => a + b.hours_used, 0);
            return (
              <div key={machine.id} className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <Tractor className="w-7 h-7" />
                  </div>
                  <div className="flex space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditMachine(machine)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={async () => { if(confirm('Excluir?')) { await mockApi.deleteMachine(machine.id); loadAll(); }}} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{machine.name}</h3>
                <p className="text-slate-500 text-xs mb-4">{machine.type} • {machine.model} ({machine.year})</p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Horímetro Total</p>
                    <p className="text-sm font-bold text-slate-700">{totalHours.toFixed(1)} h</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-600 uppercase flex items-center space-x-1">
                      <Gauge className="w-3 h-3" />
                      <span>Méd. Real</span>
                    </p>
                    <p className="text-sm font-black text-orange-700">
                      {avgCons > 0 ? `${avgCons.toFixed(1)} L/h` : '---'}
                    </p>
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-full text-xs font-bold text-center border ${statusColors[machine.status]}`}>
                  {machine.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forms Modal (Machine, Fuel, Usage) */}
      {(showMachineForm || showFuelForm || showUsageForm) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
               <h2 className="text-lg font-bold text-slate-900">
                {showMachineForm ? (editingId ? 'Editar Máquina' : 'Nova Máquina') : 
                 showFuelForm ? (editingFuelId ? 'Editar Abastecimento' : 'Registrar Abastecimento') : 
                 (editingUsageId ? 'Editar Uso' : 'Registrar Uso')}
              </h2>
              <button onClick={() => { setShowMachineForm(false); setShowFuelForm(false); setShowUsageForm(false); setEditingId(null); setEditingUsageId(null); setEditingFuelId(null); }} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 md:p-8">
              {showMachineForm && (
                <form onSubmit={handleMachineSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome</label>
                      <input type="text" required value={machineForm.name} onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50" placeholder="Ex: Trator John Deere" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo</label>
                      <input type="text" required value={machineForm.type} onChange={(e) => setMachineForm({ ...machineForm, type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50" placeholder="Trator" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Modelo</label>
                      <input type="text" required value={machineForm.model} onChange={(e) => setMachineForm({ ...machineForm, model: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50" placeholder="6145J" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ano</label>
                      <input type="number" required value={machineForm.year} onChange={(e) => setMachineForm({ ...machineForm, year: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50" placeholder="2021" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                      <select value={machineForm.status} onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value as any })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50">
                        <option value="Ativo">Ativo</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all mt-4 flex items-center justify-center space-x-2">
                    <Save className="w-5 h-5" />
                    <span>{editingId ? 'Atualizar Máquina' : 'Salvar Nova Máquina'}</span>
                  </button>
                </form>
              )}

              {showFuelForm && (
                <form onSubmit={handleFuelSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Máquina</label>
                    <select required value={fuelForm.machinery_id} onChange={(e) => setFuelForm({ ...fuelForm, machinery_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50">
                      <option value="">Selecione...</option>
                      {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                      <input type="date" required value={fuelForm.refill_date} onChange={(e) => setFuelForm({ ...fuelForm, refill_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Qtd (L)</label>
                      <input type="number" step="0.01" required value={fuelForm.quantity_liters} onChange={(e) => setFuelForm({ ...fuelForm, quantity_liters: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50" placeholder="150" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço p/ Litro</label>
                      <input type="number" step="0.01" value={fuelForm.price_per_liter} onChange={(e) => setFuelForm({ ...fuelForm, price_per_liter: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50" placeholder="5.89" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Horímetro</label>
                      <input type="number" step="0.1" value={fuelForm.odometer_reading} onChange={(e) => setFuelForm({ ...fuelForm, odometer_reading: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50" placeholder="1250.0" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all mt-4">{editingFuelId ? 'Atualizar Abastecimento' : 'Registrar Abastecimento'}</button>
                </form>
              )}

              {showUsageForm && (
                <form onSubmit={handleUsageSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Máquina</label>
                      <select required value={usageForm.machinery_id} onChange={(e) => setUsageForm({ ...usageForm, machinery_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50">
                        <option value="">Selecione...</option>
                        {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Talhão</label>
                      <select required value={usageForm.plot_id} onChange={(e) => setUsageForm({ ...usageForm, plot_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50">
                        <option value="">Selecione...</option>
                        {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Horas</label>
                      <input type="number" step="0.1" required value={usageForm.hours_used} onChange={(e) => setUsageForm({ ...usageForm, hours_used: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" placeholder="8.0" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Consumo Estimado (L)</label>
                      <input type="number" step="0.1" value={usageForm.fuel_consumed} onChange={(e) => setUsageForm({ ...usageForm, fuel_consumed: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" placeholder="Opcional" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Observações</label>
                    <textarea value={usageForm.notes} onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-24 bg-slate-50" placeholder="Ex: Preparo de solo..."></textarea>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all mt-4">{editingUsageId ? 'Atualizar Uso' : 'Registrar Uso'}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tables for History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm md:text-base">Histórico de Uso</h3>
            <span className="text-[10px] md:text-xs text-slate-500">Últimos registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">Data</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">Máquina</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right">Horas</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usage.slice(-5).reverse().map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4 text-slate-500 whitespace-nowrap">{new Date(u.usage_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-900 truncate max-w-[80px] md:max-w-none">{u.machinery_name}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold text-blue-600">{u.hours_used}h</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right flex justify-end space-x-1">
                      <button onClick={() => handleEditUsage(u)} className="p-1 text-slate-300 hover:text-blue-500"><Edit2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                      <button onClick={async () => { if(confirm('Excluir?')) { await mockApi.deleteUsage(u.id); loadAll(); }}} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm md:text-base">Abastecimentos</h3>
            <span className="text-[10px] md:text-xs text-slate-500">Últimos registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">Data</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">Litros</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right">Custo</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fuelRefills.slice(-5).reverse().map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4 text-slate-500 whitespace-nowrap">{new Date(f.refill_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-900">{f.quantity_liters}L</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold text-orange-600 truncate">R${f.total_cost?.toFixed(0)}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right flex justify-end space-x-1">
                      <button onClick={() => handleEditFuel(f)} className="p-1 text-slate-300 hover:text-orange-500"><Edit2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                      <button onClick={async () => { if(confirm('Excluir?')) { await mockApi.deleteFuel(f.id); loadAll(); }}} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
