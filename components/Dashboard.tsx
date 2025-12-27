
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Fuel, TrendingUp, Truck, Map, Leaf, DollarSign, ArrowUpRight, ArrowDownRight, Settings2, X, Target } from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { FuelRefill, MachineryUsage, HarvestLoad, InputApplication, Plot, CropPrice } from '../types';

const MOISTURE_BASE = 14;

const Dashboard: React.FC = () => {
  const [fuelData, setFuelData] = useState<FuelRefill[]>([]);
  const [usageData, setUsageData] = useState<MachineryUsage[]>([]);
  const [prodData, setProdData] = useState<HarvestLoad[]>([]);
  const [appData, setAppData] = useState<InputApplication[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [cropPrices, setCropPrices] = useState<CropPrice[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [f, u, p, a, plotsList, prices] = await Promise.all([
        mockApi.getFuel(),
        mockApi.getUsage(),
        mockApi.getProduction(),
        mockApi.getApplications(),
        mockApi.getPlots(),
        mockApi.getCropPrices()
      ]);
      setFuelData(f);
      setUsageData(u);
      setProdData(p);
      setAppData(a);
      setPlots(plotsList);
      setCropPrices(prices);
    };
    load();
  }, []);

  // Financial Calculations
  const totalFuelCost = fuelData.reduce((acc, f) => acc + (f.total_cost || 0), 0);
  const totalHours = usageData.reduce((acc, u) => acc + u.hours_used, 0);
  const fuelCostPerHour = totalHours > 0 ? totalFuelCost / totalHours : 0;

  const cropFinancials = plots.reduce((acc: any, plot) => {
    const crop = plot.crop_type || 'Indefinido';
    if (!acc[crop]) {
      acc[crop] = { area: 0, bags: 0, inputCost: 0, machineHours: 0, revenue: 0 };
    }
    acc[crop].area += plot.area_hectares;
    
    // Sum input applications for this plot
    const plotApps = appData.filter(app => app.plot_id === plot.id);
    acc[crop].inputCost += plotApps.reduce((sum, app) => sum + app.total_application_cost, 0);

    // Sum machine hours for this plot
    const plotUsage = usageData.filter(u => u.plot_id === plot.id);
    acc[crop].machineHours += plotUsage.reduce((sum, u) => sum + u.hours_used, 0);

    return acc;
  }, {});

  // Add Production Revenue - Now with moisture discount for accuracy
  prodData.forEach(load => {
    const plot = plots.find(p => p.id === load.plot_id);
    const crop = plot?.crop_type || 'Indefinido';
    if (cropFinancials[crop]) {
      const moisture = load.moisture_percent || MOISTURE_BASE;
      const correctionFactor = moisture > MOISTURE_BASE 
        ? (100 - moisture) / (100 - MOISTURE_BASE) 
        : 1;
      
      const netBags = (load.weight_kg * correctionFactor) / 60;
      cropFinancials[crop].bags += netBags;
      
      if (load.price_per_bag && load.price_per_bag > 0) {
        cropFinancials[crop].revenue += load.total_value;
      } else {
        const priceObj = cropPrices.find(p => p.crop_type === crop);
        cropFinancials[crop].revenue += netBags * (priceObj?.price_per_bag || 0);
      }
    }
  });

  const chartData = Object.entries(cropFinancials).map(([name, stats]: [string, any]) => {
    const totalCost = stats.inputCost + (stats.machineHours * fuelCostPerHour);
    const lucro = stats.revenue - totalCost;
    return {
      name,
      custo: parseFloat(totalCost.toFixed(2)),
      receita: parseFloat(stats.revenue.toFixed(2)),
      lucro: parseFloat(lucro.toFixed(2)),
      area: stats.area,
      produtividade: stats.area > 0 ? stats.bags / stats.area : 0,
      lucroPorHa: stats.area > 0 ? lucro / stats.area : 0
    };
  });

  const totalGlobalRevenue = chartData.reduce((acc, d) => acc + d.receita, 0);
  const totalGlobalCost = chartData.reduce((acc, d) => acc + d.custo, 0);
  const totalGlobalProfit = totalGlobalRevenue - totalGlobalCost;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Painel Financeiro</h1>
          <p className="text-slate-500 text-sm md:text-base">Análise de custos e receitas por cultura (Corrigido 14% umid.)</p>
        </div>
        <button 
          onClick={() => setShowPriceModal(true)}
          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </header>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          label="Saldo Geral (Lucro)" 
          value={`R$ ${totalGlobalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
          icon={DollarSign} 
          trend={totalGlobalProfit >= 0 ? 'up' : 'down'}
          color={totalGlobalProfit >= 0 ? 'emerald' : 'rose'}
        />
        <StatCard 
          label="Custos Totais" 
          value={`R$ ${totalGlobalCost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
          icon={ArrowDownRight} 
          color="rose"
        />
        <StatCard 
          label="Receita Bruta" 
          value={`R$ ${totalGlobalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
          icon={ArrowUpRight} 
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Financial Chart */}
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900">Comparativo por Cultura (R$)</h3>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                <span className="text-xs font-bold text-slate-400 uppercase">Custo</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                <span className="text-xs font-bold text-slate-400 uppercase">Receita</span>
              </div>
            </div>
          </div>
          <div className="h-72 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value) => `R$ ${parseFloat(value as string).toLocaleString('pt-BR')}`}
                />
                <Bar dataKey="custo" fill="#fb7185" radius={[6, 6, 0, 0]} barSize={25} />
                <Bar dataKey="receita" fill="#34d399" radius={[6, 6, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Culture Details List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-2">Resumo de Margem</h3>
          <div className="space-y-3">
            {chartData.map((data: any) => (
              <div key={data.name} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-slate-900">{data.name}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${data.lucro >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {((data.lucro / (data.custo || 1)) * 100).toFixed(1)}% ROI
                  </span>
                </div>
                
                {/* Average Stats Row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Prod. Média Líq.</p>
                    <p className="text-xs font-black text-slate-700">{data.produtividade.toFixed(1)} <span className="text-[10px] font-normal opacity-60">sc/ha</span></p>
                  </div>
                  <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Lucro Médio</p>
                    <p className={`text-xs font-black ${data.lucroPorHa >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      R$ {data.lucroPorHa.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/ha
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Investimento</p>
                    <p className="text-sm font-bold text-slate-700">R$ {data.custo.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resultado</p>
                    <p className={`text-sm font-black ${data.lucro >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      R$ {data.lucro.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {chartData.length === 0 && <p className="text-slate-400 text-center py-10 italic">Nenhum dado financeiro disponível.</p>}
          </div>
        </div>
      </div>

      {/* Market Prices Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Preços de Mercado (Estimados)</span>
              </h2>
              <button onClick={() => setShowPriceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 italic mb-4">Esses preços serão usados para calcular a receita de cargas que não possuem preço de venda registrado.</p>
              {['Soja', 'Milho', 'Trigo', 'Algodão', 'Café', 'Cana', 'Feijão'].map(crop => {
                const currentPrice = cropPrices.find(p => p.crop_type === crop)?.price_per_bag || 0;
                return (
                  <div key={crop} className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{crop}</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                      <input 
                        type="number" 
                        defaultValue={currentPrice}
                        onBlur={async (e) => {
                          const val = parseFloat(e.target.value);
                          await mockApi.saveCropPrice({ crop_type: crop, price_per_bag: val });
                          setCropPrices(await mockApi.getCropPrices());
                        }}
                        className="w-24 pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-right font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string, icon: any, color: string, trend?: 'up' | 'down' }> = ({ label, value, icon: Icon, color, trend }) => {
  const colors: any = {
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className={`w-12 h-12 ${colors[color]} rounded-2xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
          <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">{value}</p>
        </div>
        {trend && (
          <div className={`p-1 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
