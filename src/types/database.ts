// Database types for content management

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  detailed_description?: string;
  care_instructions?: string;
  composition?: string[];
  colors?: string[];
  gift_info?: string;
  guarantee_info?: string;
  delivery_info?: string;
  size_info?: string;
  availability_status?: string;
  price?: number;
  category_id?: string;
  image_url?: string;
  gallery_urls?: string[];
  is_featured: boolean;
  is_active: boolean;
  show_on_homepage: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Review {
  id: string;
  client_name: string;
  client_avatar_url?: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  detailed_description?: string;
  care_instructions?: string;
  composition?: string[];
  colors?: string[];
  gift_info?: string;
  guarantee_info?: string;
  delivery_info?: string;
  size_info?: string;
  availability_status?: string;
  price?: number;
  category_id?: string;
  image_url?: string;
  gallery_urls?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  show_on_homepage?: boolean;
  sort_order?: number;
}

export interface CreateReviewDto {
  client_name: string;
  client_avatar_url?: string;
  rating: number;
  comment: string;
  is_approved?: boolean;
  is_active?: boolean;
}

export interface HeroSlide {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHeroSlideDto {
  title?: string;
  subtitle?: string;
  image_url: string;
  sort_order?: number;
  is_active?: boolean;
}