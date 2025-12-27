
import React, { useState, useEffect } from 'react';
import { Plus, Beaker, Save, X, Activity, History, Edit2, Trash2, Trash } from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { InputItem, InputApplication, Plot, Machine, ApplicationItem } from '../types';

interface AppFormItem {
  input_id: string;
  quantity: string;
}

export default function InputsPage() {
  const [inputs, setInputs] = useState<InputItem[]>([]);
  const [apps, setApps] = useState<InputApplication[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  
  const [showItemForm, setShowItemForm] = useState(false);
  const [showAppForm, setShowAppForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingAppId, setEditingAppId] = useState<number | null>(null);

  const [itemForm, setItemForm] = useState({ name: '', unit: 'L' as 'L'|'KG'|'UN', price_per_unit: '', stock: '' });
  
  // App form with multiple items
  const [appForm, setAppForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    plot_id: '', 
    machine_id: '', 
    items: [{ input_id: '', quantity: '' }] as AppFormItem[]
  });

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [i, a, p, m] = await Promise.all([mockApi.getInputs(), mockApi.getApplications(), mockApi.getPlots(), mockApi.getMachines()]);
    setInputs(i); setApps(a); setPlots(p); setMachines(m);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mockApi.saveInput({ 
      name: itemForm.name, 
      unit: itemForm.unit, 
      price_per_unit: parseFloat(itemForm.price_per_unit), 
      stock: parseFloat(itemForm.stock) 
    }, editingItemId || undefined);
    
    setItemForm({ name: '', unit: 'L', price_per_unit: '', stock: '' });
    setShowItemForm(false);
    setEditingItemId(null);
    load();
  };

  const addAppItem = () => {
    setAppForm({ ...appForm, items: [...appForm.items, { input_id: '', quantity: '' }] });
  };

  const removeAppItem = (index: number) => {
    const newItems = [...appForm.items];
    newItems.splice(index, 1);
    setAppForm({ ...appForm, items: newItems });
  };

  const updateAppItem = (index: number, field: keyof AppFormItem, value: string) => {
    const newItems = [...appForm.items];
    newItems[index][field] = value;
    setAppForm({ ...appForm, items: newItems });
  };

  const handleAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const plot = plots.find(p => p.id === parseInt(appForm.plot_id));
    const machine = machines.find(m => m.id === parseInt(appForm.machine_id));
    
    if(!plot || !machine) return;

    const applicationItems: ApplicationItem[] = appForm.items
      .map(item => {
        const input = inputs.find(i => i.id === parseInt(item.input_id));
        if (!input) return null;
        const qty = parseFloat(item.quantity);
        return {
          input_id: input.id,
          input_name: input.name,
          quantity: qty,
          unit: input.unit,
          total_cost: input.price_per_unit * qty
        };
      })
      .filter((i): i is ApplicationItem => i !== null);

    if(applicationItems.length === 0) return;

    const totalCost = applicationItems.reduce((sum, i) => sum + i.total_cost, 0);

    await mockApi.saveApplication({
      date: appForm.date,
      plot_id: plot.id,
      plot_name: plot.name,
      machine_id: machine.id,
      machine_name: machine.name,
      items: applicationItems,
      total_application_cost: totalCost
    }, editingAppId || undefined);
    
    setAppForm({ 
      date: new Date().toISOString().split('T')[0], 
      plot_id: '', 
      machine_id: '', 
      items: [{ input_id: '', quantity: '' }] 
    });
    setShowAppForm(false);
    setEditingAppId(null);
    load();
  };

  const handleEditItem = (item: InputItem) => {
    setItemForm({
      name: item.name,
      unit: item.unit,
      price_per_unit: item.price_per_unit.toString(),
      stock: item.stock.toString()
    });
    setEditingItemId(item.id);
    setShowItemForm(true);
  };

  const handleEditApp = (a: InputApplication) => {
    setAppForm({
      date: a.date,
      plot_id: a.plot_id.toString(),
      machine_id: a.machine_id.toString(),
      items: a.items.map(item => ({
        input_id: item.input_id.toString(),
        quantity: item.quantity.toString()
      }))
    });
    setEditingAppId(a.id);
    setShowAppForm(true);
  };

  const handleDeleteItem = async (id: number) => {
    if(confirm('Excluir este item do estoque?')) {
      await mockApi.deleteInput(id);
      load();
    }
  };

  const handleDeleteApp = async (id: number) => {
    if(confirm('Excluir este registro de aplicação? (O estoque será devolvido)')) {
      await mockApi.deleteApplication(id);
      load();
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Insumos & Defensivos</h1>
          <p className="text-slate-500 text-sm md:text-base">Gestão de estoque e aplicações de campo</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          <button onClick={() => { setShowItemForm(true); setEditingItemId(null); }} className="flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm">
            <Plus className="w-4 h-4" />
            <span>Estoque</span>
          </button>
          <button onClick={() => { setShowAppForm(true); setEditingAppId(null); }} className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all font-bold text-sm">
            <Activity className="w-4 h-4" />
            <span>Aplicar</span>
          </button>
        </div>
      </div>

      {(showItemForm || showAppForm) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
               <h2 className="text-lg font-bold text-slate-900">
                {showItemForm ? (editingItemId ? 'Editar Insumo' : 'Novo Insumo') : 
                 (editingAppId ? 'Editar Aplicação' : 'Lançar Aplicação (Calda)')}
              </h2>
              <button onClick={() => { setShowItemForm(false); setShowAppForm(false); setEditingItemId(null); setEditingAppId(null); }} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 md:p-8">
              {showItemForm && (
                <form onSubmit={handleItemSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Produto</label>
                      <input type="text" required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50" placeholder="Ex: Glifosato" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unidade</label>
                      <select value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value as any})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none">
                        <option value="L">L</option>
                        <option value="KG">KG</option>
                        <option value="UN">UN</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço Un.</label>
                      <input type="number" step="0.01" required value={itemForm.price_per_unit} onChange={e => setItemForm({...itemForm, price_per_unit: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Qtd em Estoque</label>
                      <input type="number" step="0.1" required value={itemForm.stock} onChange={e => setItemForm({...itemForm, stock: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all mt-4">
                    {editingItemId ? 'Atualizar' : 'Salvar'} Item
                  </button>
                </form>
              )}

              {showAppForm && (
                <form onSubmit={handleAppSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                      <input type="date" required value={appForm.date} onChange={e => setAppForm({...appForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Talhão Alvo</label>
                      <select required value={appForm.plot_id} onChange={e => setAppForm({...appForm, plot_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none">
                        <option value="">Selecione...</option>
                        {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Máquina</label>
                      <select required value={appForm.machine_id} onChange={e => setAppForm({...appForm, machine_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none">
                        <option value="">Selecione...</option>
                        {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                       <h3 className="text-sm font-bold text-slate-700">Composição da Calda</h3>
                       <button type="button" onClick={addAppItem} className="text-xs font-bold text-emerald-600 flex items-center space-x-1 hover:text-emerald-700">
                          <Plus className="w-3 h-3" />
                          <span>Adicionar Produto</span>
                       </button>
                    </div>
                    
                    <div className="space-y-3">
                      {appForm.items.map((item, index) => (
                        <div key={index} className="flex items-end space-x-3 bg-slate-50 p-4 rounded-2xl relative group">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Insumo</label>
                            <select 
                              required 
                              value={item.input_id} 
                              onChange={e => updateAppItem(index, 'input_id', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none"
                            >
                              <option value="">Produto...</option>
                              {inputs.map(i => <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit})</option>)}
                            </select>
                          </div>
                          <div className="w-24">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantidade</label>
                            <input 
                              type="number" 
                              step="0.01"
                              required 
                              value={item.quantity} 
                              onChange={e => updateAppItem(index, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none" 
                              placeholder="0.0"
                            />
                          </div>
                          {appForm.items.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeAppItem(index)}
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2">
                    <Save className="w-5 h-5" />
                    <span>{editingAppId ? 'Salvar Alterações' : 'Confirmar Aplicação de Calda'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Beaker className="w-5 h-5 text-emerald-500" />
            <span>Estoque de Insumos</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {inputs.map(i => (
              <div key={i.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm group relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-900 text-sm">{i.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-black ${i.stock < 50 ? 'text-red-500' : 'text-slate-400'}`}>
                      {i.stock} {i.unit}
                    </span>
                    <div className="flex space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditItem(i)} className="text-slate-400 hover:text-blue-500"><Edit2 className="w-3 h-3"/></button>
                      <button onClick={() => handleDeleteItem(i.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div className={`h-full ${i.stock < 50 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{width: `${Math.min(100, (i.stock/1000)*100)}%`}}></div>
                </div>
              </div>
            ))}
            {inputs.length === 0 && <p className="text-slate-400 text-center py-10 italic text-xs">Vazio</p>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm md:text-base">
              <History className="w-5 h-5 text-slate-400" />
              <span>Histórico de Aplicações</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-400 font-bold border-b border-slate-100">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">Data</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">Talhão</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">Calda / Mix</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right">Custo Total</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {apps.slice().reverse().map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4 text-slate-500 whitespace-nowrap">{new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-900 truncate max-w-[80px] md:max-w-none">{a.plot_name}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-slate-700">
                       <div className="flex flex-wrap gap-1">
                          {a.items.map((item, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                              {item.input_name} ({item.quantity}{item.unit})
                            </span>
                          ))}
                       </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold text-emerald-600 whitespace-nowrap">R${a.total_application_cost.toFixed(0)}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right flex justify-end space-x-1">
                      <button onClick={() => handleEditApp(a)} className="p-1 text-slate-300 hover:text-blue-500"><Edit2 className="w-3 h-3 md:w-4 md:h-4"/></button>
                      <button onClick={() => handleDeleteApp(a.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3 md:w-4 md:h-4"/></button>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-xs">Sem aplicações</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
