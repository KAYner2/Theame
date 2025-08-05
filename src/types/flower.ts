export interface Flower {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  inStock: boolean;
  quantity: number;
  colors: string[];
  size: 'small' | 'medium' | 'large';
  occasion: string[];
}

export interface CartItem extends Flower {
  cartQuantity: number;
}

export type FlowerCategory = 'roses' | 'tulips' | 'peonies' | 'sunflowers' | 'lavender' | 'mixed';