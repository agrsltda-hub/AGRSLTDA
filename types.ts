
export interface Machine {
  id: number;
  name: string;
  type: string;
  model: string;
  year: number;
  status: 'Ativo' | 'Manutenção' | 'Inativo';
}

export interface Plot {
  id: number;
  name: string;
  area_hectares: number;
  crop_type: string;
  season: string;
}

export interface CropPrice {
  crop_type: string;
  price_per_bag: number;
}

export interface InputItem {
  id: number;
  name: string;
  unit: 'L' | 'KG' | 'UN';
  price_per_unit: number;
  stock: number;
}

export interface ApplicationItem {
  input_id: number;
  input_name: string;
  quantity: number;
  unit: 'L' | 'KG' | 'UN';
  total_cost: number;
}

export interface InputApplication {
  id: number;
  date: string;
  plot_id: number;
  plot_name: string;
  machine_id: number;
  machine_name: string;
  items: ApplicationItem[];
  total_application_cost: number;
}

export interface HarvestLoad {
  id: number;
  date: string;
  plot_id: number;
  plot_name: string;
  weight_kg: number;
  moisture_percent: number;
  price_per_bag: number;
  total_value: number;
  destination: string;
  truck_plate: string;
}

export interface MachineryUsage {
  id: number;
  machinery_id: number;
  machinery_name: string;
  plot_id: number;
  plot_name: string;
  usage_date: string;
  hours_used: number;
  fuel_consumed: number;
  notes: string;
}

export interface FuelRefill {
  id: number;
  machinery_id: number;
  machinery_name: string;
  refill_date: string;
  quantity_liters: number;
  price_per_liter: number | null;
  total_cost: number | null;
  odometer_reading: number | null;
  notes: string | null;
}
