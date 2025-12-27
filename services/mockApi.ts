
import { Machine, Plot, MachineryUsage, FuelRefill, InputItem, InputApplication, HarvestLoad, CropPrice } from '../types';

const STORAGE_KEYS = {
  MACHINES: 'agro_machines',
  PLOTS: 'agro_plots',
  USAGE: 'agro_usage',
  FUEL: 'agro_fuel',
  INPUTS: 'agro_inputs',
  APPLICATIONS: 'agro_apps',
  PRODUCTION: 'agro_production',
  PRICES: 'agro_crop_prices'
};

const initialPlots: Plot[] = [
  { id: 1, name: 'Talhão Norte', area_hectares: 50, crop_type: 'Soja', season: '24/25' },
  { id: 2, name: 'Talhão Sul', area_hectares: 120, crop_type: 'Milho', season: '24/25' },
];

const initialPrices: CropPrice[] = [
  { crop_type: 'Soja', price_per_bag: 125.50 },
  { crop_type: 'Milho', price_per_bag: 58.00 },
  { crop_type: 'Trigo', price_per_bag: 85.00 },
  { crop_type: 'Algodão', price_per_bag: 140.00 },
];

function get<T>(key: string, initial: T): T {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : initial;
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const mockApi = {
  getMachines: async (): Promise<Machine[]> => get(STORAGE_KEYS.MACHINES, []),
  saveMachine: async (machine: Omit<Machine, 'id'>, id?: number) => {
    const list = await mockApi.getMachines();
    if (id) {
      const index = list.findIndex(m => m.id === id);
      list[index] = { ...machine, id };
    } else {
      const nextId = Math.max(0, ...list.map(m => m.id)) + 1;
      list.push({ ...machine, id: nextId });
    }
    save(STORAGE_KEYS.MACHINES, list);
  },
  deleteMachine: async (id: number) => {
    const list = (await mockApi.getMachines()).filter(m => m.id !== id);
    save(STORAGE_KEYS.MACHINES, list);
  },

  getPlots: async (): Promise<Plot[]> => get(STORAGE_KEYS.PLOTS, initialPlots),
  savePlot: async (plot: Omit<Plot, 'id'>, id?: number) => {
    const list = await mockApi.getPlots();
    if (id) {
      const index = list.findIndex(p => p.id === id);
      list[index] = { ...plot, id };
    } else {
      const nextId = Math.max(0, ...list.map(p => p.id)) + 1;
      list.push({ ...plot, id: nextId });
    }
    save(STORAGE_KEYS.PLOTS, list);
  },
  deletePlot: async (id: number) => {
    const list = (await mockApi.getPlots()).filter(p => p.id !== id);
    save(STORAGE_KEYS.PLOTS, list);
  },

  getCropPrices: async (): Promise<CropPrice[]> => get(STORAGE_KEYS.PRICES, initialPrices),
  saveCropPrice: async (price: CropPrice) => {
    const list = await mockApi.getCropPrices();
    const index = list.findIndex(p => p.crop_type === price.crop_type);
    if (index !== -1) list[index] = price;
    else list.push(price);
    save(STORAGE_KEYS.PRICES, list);
  },

  getInputs: async (): Promise<InputItem[]> => get(STORAGE_KEYS.INPUTS, []),
  // Fix: Added missing saveInput method used in InputsPage.tsx
  saveInput: async (input: Omit<InputItem, 'id'>, id?: number) => {
    const list = await mockApi.getInputs();
    if (id) {
      const index = list.findIndex(i => i.id === id);
      list[index] = { ...input, id };
    } else {
      const nextId = Math.max(0, ...list.map(i => i.id)) + 1;
      list.push({ ...input, id: nextId });
    }
    save(STORAGE_KEYS.INPUTS, list);
  },
  // Fix: Added missing deleteInput method used in InputsPage.tsx
  deleteInput: async (id: number) => {
    const list = (await mockApi.getInputs()).filter(i => i.id !== id);
    save(STORAGE_KEYS.INPUTS, list);
  },

  getApplications: async (): Promise<InputApplication[]> => get(STORAGE_KEYS.APPLICATIONS, []),
  saveApplication: async (app: Omit<InputApplication, 'id'>, id?: number) => {
    const list = await mockApi.getApplications();
    const nextId = id || Math.max(0, ...list.map(a => a.id)) + 1;
    if (id) {
      const idx = list.findIndex(a => a.id === id);
      list[idx] = { ...app, id };
    } else {
      list.push({ ...app, id: nextId });
    }
    save(STORAGE_KEYS.APPLICATIONS, list);
  },
  deleteApplication: async (id: number) => {
    const list = (await mockApi.getApplications()).filter(a => a.id !== id);
    save(STORAGE_KEYS.APPLICATIONS, list);
  },

  getProduction: async (): Promise<HarvestLoad[]> => get(STORAGE_KEYS.PRODUCTION, []),
  saveHarvestLoad: async (load: Omit<HarvestLoad, 'id'>, id?: number) => {
    const list = await mockApi.getProduction();
    const nextId = id || Math.max(0, ...list.map(l => l.id)) + 1;
    if (id) {
      const idx = list.findIndex(l => l.id === id);
      list[idx] = { ...load, id };
    } else {
      list.push({ ...load, id: nextId });
    }
    save(STORAGE_KEYS.PRODUCTION, list);
  },
  deleteHarvestLoad: async (id: number) => {
    const list = (await mockApi.getProduction()).filter(l => l.id !== id);
    save(STORAGE_KEYS.PRODUCTION, list);
  },

  getUsage: async (): Promise<MachineryUsage[]> => get(STORAGE_KEYS.USAGE, []),
  saveUsage: async (usage: Omit<MachineryUsage, 'id'>, id?: number) => {
    const list = await mockApi.getUsage();
    const nextId = id || Math.max(0, ...list.map(u => u.id)) + 1;
    if (id) {
      const idx = list.findIndex(u => u.id === id);
      list[idx] = { ...usage, id };
    } else {
      list.push({ ...usage, id: nextId });
    }
    save(STORAGE_KEYS.USAGE, list);
  },
  deleteUsage: async (id: number) => {
    const list = (await mockApi.getUsage()).filter(u => u.id !== id);
    save(STORAGE_KEYS.USAGE, list);
  },

  getFuel: async (): Promise<FuelRefill[]> => get(STORAGE_KEYS.FUEL, []),
  saveFuel: async (fuel: Omit<FuelRefill, 'id'>, id?: number) => {
    const list = await mockApi.getFuel();
    const nextId = id || Math.max(0, ...list.map(f => f.id)) + 1;
    if (id) {
      const idx = list.findIndex(f => f.id === id);
      list[idx] = { ...fuel, id };
    } else {
      list.push({ ...fuel, id: nextId });
    }
    save(STORAGE_KEYS.FUEL, list);
  },
  deleteFuel: async (id: number) => {
    const list = (await mockApi.getFuel()).filter(f => f.id !== id);
    save(STORAGE_KEYS.FUEL, list);
  },
};
