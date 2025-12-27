
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Map, Save, X, TrendingUp, Leaf } from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { Plot, HarvestLoad } from '../types';

const CROP_OPTIONS = [
  'Soja', 'Milho', 'Trigo', 'Algodão', 'Café', 'Cana', 'Feijão', 'Outros'
];

const MOISTURE_BASE = 14; // Padrão comercial de umidade (%)

export default function PlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loads, setLoads] = useState<HarvestLoad[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', area_hectares: '', crop_type: 'Soja', season: '24/25' });

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [p, l] = await Promise.all([mockApi.getPlots(), mockApi.getProduction()]);
    setPlots(p);
    setLoads(l);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mockApi.savePlot({
      name: form.name,
      area_hectares: parseFloat(form.area_hectares),
      crop_type: form.crop_type,
      season: form.season
    }, editingId || undefined);
    reset();
    load();
  };

  const reset = () => {
    setForm({ name: '', area_hectares: '', crop_type: 'Soja', season: '24/25' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (p: Plot) => {
    setForm({ name: p.name, area_hectares: p.area_hectares.toString(), crop_type: p.crop_type, season: p.season });
    setEditingId(p.id);
    setShowForm(true);
  };

  const getPlotStats = (plotId: number, area: number) => {
    const plotLoads = loads.filter(l => l.plot_id === plotId);
    
    // Cálculo do Peso Líquido Corrigido (Liquidez Comercial)
    const netBags = plotLoads.reduce((sum, l) => {
      // Se umidade for maior que a base, aplica desconto. Se for menor, mantém o peso real (ou aplica bônus, mas o padrão é manter).
      const moisture = l.moisture_percent || MOISTURE_BASE;
      const correctionFactor = moisture > MOISTURE_BASE 
        ? (100 - moisture) / (100 - MOISTURE_BASE) 
        : 1;
      
      const netWeight = l.weight_kg * correctionFactor;
      return sum + (netWeight / 60);
    }, 0);

    const productivity = area > 0 ? netBags / area : 0;
    return { productivity, netBags };
  };

  const groupedPlots = plots.reduce((acc: Record<string, Plot[]>, plot) => {
    const crop = plot.crop_type || 'Indefinido';
    if (!acc[crop]) acc[crop] = [];
    acc[crop].push(plot);
    return acc;
  }, {});

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Gestão de Talhões</h1>
          <p className="text-slate-500 text-sm md:text-base">Mapeamento e controle de produtividade por área</p>
        </div>
        <button onClick={() => setShowForm(true)} className="w-full md:w-auto flex items-center justify-center space-x-2 bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all">
          <Plus className="w-5 h-5" />
          <span className="font-bold text-sm md:text-base">Novo Talhão</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Talhão' : 'Cadastrar Área'}</h2>
              <button onClick={reset} className="text-slate-400 hover:text-slate-600 p-2"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50" placeholder="Ex: Talhão 01" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Área (HA)</label>
                <input type="number" step="0.1" required value={form.area_hectares} onChange={e => setForm({...form, area_hectares: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50" placeholder="0.0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cultura</label>
                <select 
                  required 
                  value={form.crop_type} 
                  onChange={e => setForm({...form, crop_type: e.target.value})} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                >
                  {CROP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Safra</label>
                <input type="text" required value={form.season} onChange={e => setForm({...form, season: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50" placeholder="24/25" />
              </div>
              <div className="md:col-span-2 mt-4">
                 <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2">
                   <Save className="w-5 h-5" />
                   <span>Salvar Talhão</span>
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(Object.entries(groupedPlots) as [string, Plot[]][]).map(([crop, cropPlots]) => (
        <div key={crop} className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{crop}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {cropPlots.map(p => {
              const stats = getPlotStats(p.id, p.area_hectares);
              return (
                <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                      <Map className="w-6 h-6" />
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={async () => { if(confirm('Excluir?')) { await mockApi.deletePlot(p.id); load(); }}} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                  <p className="text-slate-500 text-sm mb-6">{p.season} • {p.area_hectares}ha</p>
                  <div className="bg-emerald-50 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Produtividade Líquida</span>
                      <span className="text-lg font-black text-emerald-700">{stats.productivity.toFixed(1)} <small className="text-[10px]">sc/ha</small></span>
                    </div>
                    <p className="text-[10px] text-emerald-600 opacity-60 italic">Total Corrigido (14% umid.): {stats.netBags.toFixed(0)} sacas</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
