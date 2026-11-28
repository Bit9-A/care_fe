export interface SpecialtyRead {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface SpecialtyCreate {
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}
