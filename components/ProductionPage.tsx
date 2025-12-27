
import React, { useState, useEffect } from 'react';
import { Plus, Truck, Save, X, TrendingUp, Edit2, Trash2, DollarSign } from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { HarvestLoad, Plot } from '../types';

const MOISTURE_BASE = 14;

export default function ProductionPage() {
  const [loads, setLoads] = useState<HarvestLoad[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLoadId, setEditingLoadId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    plot_id: '', 
    weight_kg: '', 
    moisture_percent: '', 
    price_per_bag: '',
    destination: '', 
    truck_plate: '' 
  });

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [l, p] = await Promise.all([mockApi.getProduction(), mockApi.getPlots()]);
    setLoads(l); setPlots(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const plot = plots.find(p => p.id === parseInt(form.plot_id));
    if(!plot) return;

    const grossWeight = parseFloat(form.weight_kg);
    const moisture = parseFloat(form.moisture_percent);
    const price = parseFloat(form.price_per_bag) || 0;
    
    // Cálculo do Peso Líquido Comercial (Desconto de Umidade)
    const correctionFactor = moisture > MOISTURE_BASE 
      ? (100 - moisture) / (100 - MOISTURE_BASE) 
      : 1;
    
    const netWeight = grossWeight * correctionFactor;
    const netBags = netWeight / 60;
    const totalValue = netBags * price;

    await mockApi.saveHarvestLoad({
      date: form.date,
      plot_id: plot.id,
      plot_name: plot.name,
      weight_kg: grossWeight, // Guardamos o bruto físico
      moisture_percent: moisture,
      price_per_bag: price,
      total_value: totalValue,
      destination: form.destination,
      truck_plate: form.truck_plate
    }, editingLoadId || undefined);

    resetForm();
    load();
  };

  const resetForm = () => {
    setForm({ 
      date: new Date().toISOString().split('T')[0], 
      plot_id: '', 
      weight_kg: '', 
      moisture_percent: '', 
      price_per_bag: '',
      destination: '', 
      truck_plate: '' 
    });
    setShowForm(false);
    setEditingLoadId(null);
  };

  const handleEditLoad = (l: HarvestLoad) => {
    setForm({
      date: l.date,
      plot_id: l.plot_id.toString(),
      weight_kg: l.weight_kg.toString(),
      moisture_percent: l.moisture_percent.toString(),
      price_per_bag: l.price_per_bag?.toString() || '',
      destination: l.destination,
      truck_plate: l.truck_plate
    });
    setEditingLoadId(l.id);
    setShowForm(true);
  };

  const handleDeleteLoad = async (id: number) => {
    if(confirm('Excluir esta carga?')) {
      await mockApi.deleteHarvestLoad(id);
      load();
    }
  };

  // Cálculo dos totais para os cards (usando volume bruto para volume físico e total_value para financeiro)
  const totalWeight = loads.reduce((a, b) => a + b.weight_kg, 0);
  const totalFinancial = loads.reduce((a, b) => a + (b.total_value || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Produção & Cargas</h1>
          <p className="text-slate-500 text-sm md:text-base">Acompanhamento de colheita e faturamento</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingLoadId(null); }} className="w-full md:w-auto flex items-center justify-center space-x-2 bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all font-bold">
          <Plus className="w-5 h-5" />
          <span>Registrar Carga</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregas</p>
            <p className="text-xl font-black text-slate-900">{loads.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume Bruto (Ton)</p>
            <p className="text-xl font-black text-slate-900">{(totalWeight / 1000).toFixed(1)}t</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center font-black">
            60
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume Bruto (sc)</p>
            <p className="text-xl font-black text-slate-900">{(totalWeight / 60).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Faturamento Real</p>
            <p className="text-xl font-black text-emerald-700">R$ {totalFinancial.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
               <h2 className="text-lg font-bold text-slate-900">
                {editingLoadId ? 'Editar Ticket de Carga' : 'Novo Ticket de Colheita'}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Talhão de Origem</label>
                  <select required value={form.plot_id} onChange={e => setForm({...form, plot_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {plots.map(p => <option key={p.id} value={p.id}>{p.name} ({p.crop_type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Placa do Caminhão</label>
                  <input type="text" required value={form.truck_plate} onChange={e => setForm({...form, truck_plate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="ABC-1234" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Peso Líquido Campo (KG)</label>
                  <input type="number" required value={form.weight_kg} onChange={e => setForm({...form, weight_kg: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Umidade (%)</label>
                  <input type="number" step="0.1" required value={form.moisture_percent} onChange={e => setForm({...form, moisture_percent: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="14.0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço da Saca (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                    <input type="number" step="0.01" required value={form.price_per_bag} onChange={e => setForm({...form, price_per_bag: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0,00" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Destino / Silo</label>
                  <input type="text" required value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: Cooperativa Alfa" />
                </div>
              </div>
              
              <div className="pt-4">
                 <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2">
                   <Save className="w-5 h-5" />
                   <span>{editingLoadId ? 'Salvar Alterações' : 'Finalizar Ticket de Carga'}</span>
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-400 font-bold border-b border-slate-100">
                <th className="px-6 py-4 text-left">Data</th>
                <th className="px-6 py-4 text-left">Talhão</th>
                <th className="px-6 py-4 text-left">Caminhão</th>
                <th className="px-6 py-4 text-right">Volume Bruto</th>
                <th className="px-6 py-4 text-right">Umid.</th>
                <th className="px-6 py-4 text-right">Preço/sc</th>
                <th className="px-6 py-4 text-right">Valor Total (Líq.)</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loads.slice().reverse().map(l => (
                <tr key={l.id} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(l.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{l.plot_name}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{l.truck_plate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-slate-900">{(l.weight_kg / 60).toFixed(0)} <small className="text-[10px] text-slate-400 uppercase">sc</small></div>
                    <div className="text-[10px] text-slate-400">{(l.weight_kg / 1000).toFixed(1)}t</div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 font-medium">{l.moisture_percent}%</td>
                  <td className="px-6 py-4 text-right text-slate-600 whitespace-nowrap">R$ {l.price_per_bag?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600 whitespace-nowrap">R$ {l.total_value?.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right flex justify-end space-x-1">
                    <button onClick={() => handleEditLoad(l)} className="p-2 text-slate-300 hover:text-blue-500 transition-all"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => handleDeleteLoad(l.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
              {loads.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma carga registrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
