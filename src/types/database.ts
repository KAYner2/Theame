// src/types/database.ts

/** Статус наличия товара на складе */
export type AvailabilityStatus =
  | "in_stock"
  | "out_of_stock"
  | "limited"
  | "pre_order";

/** Категория товара */
export interface Category {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Вариант товара (S, M, "21", и т.д.) */
export interface ProductVariant {
  id: string;
  product_id: string;
  name: string; // метка на кружке
  composition?: string | null;
  price: number;
  sort_order: number;
  created_at: string;
  updated_at?: string | null;
}

/** Товар */
export interface Product {
  id: string;
  name: string;
  slug?: string | null;

  description?: string | null;
  detailed_description?: string | null;
  care_instructions?: string | null;

  composition?: string[] | null;
  composition_raw?: string | null;

  colors?: string[] | null;

  gift_info?: string | null;
  guarantee_info?: string | null;
  delivery_info?: string | null;
  size_info?: string | null;

  availability_status?: AvailabilityStatus | null;
  price?: number | null;

  category_id?: string | null;
  category_ids?: string[];

  image_url?: string | null;
  gallery_urls?: string[] | null;

  is_featured: boolean;
  is_active: boolean;
  show_on_homepage: boolean;

  sort_order: number;

  created_at: string;
  updated_at: string;

  category?: Category | null;

  show_substitution_note?: boolean;
  substitution_note_text?: string | null;

  product_variants?: ProductVariant[];
}

/** Отзыв клиента */
export interface Review {
  id: string;
  client_name: string;
  client_avatar_url?: string | null;
  rating: number;
  comment: string;
  is_approved: boolean;
  is_active: boolean;
  publication_date?: string | null;
  created_at: string;
  updated_at: string;
}

/** DTO для создания категории */
export interface CreateCategoryDto {
  name: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
  slug?: string | null;
}

/** DTO для создания товара */
export interface CreateProductDto {
  name: string;
  slug?: string | null;

  description?: string;
  detailed_description?: string;
  care_instructions?: string;

  composition?: string[];
  colors?: string[];

  gift_info?: string;
  guarantee_info?: string;
  delivery_info?: string;
  size_info?: string;

  availability_status?: AvailabilityStatus;
  price?: number;

  category_id?: string;

  image_url?: string;
  gallery_urls?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  show_on_homepage?: boolean;
  sort_order?: number;

  show_substitution_note?: boolean;
  substitution_note_text?: string | null;
}

/** DTO для обновления товара */
export type UpdateProductDto = Partial<CreateProductDto>;

/** DTO для создания варианта товара */
export interface CreateProductVariantDto {
  product_id: string;
  name: string;
  price: number;
  composition?: string | null;
  sort_order?: number;
}

/** DTO для обновления варианта товара */
export type UpdateProductVariantDto = Partial<CreateProductVariantDto>;

/** DTO для создания отзыва */
export interface CreateReviewDto {
  client_name: string;
  client_avatar_url?: string;
  rating: number;
  comment: string;
  is_approved?: boolean;
  is_active?: boolean;
  publication_date?: string;
}

/** Hero-слайд */
export interface HeroSlide {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** DTO для создания Hero-слайда */
export interface CreateHeroSlideDto {
  title?: string;
  subtitle?: string;
  image_url: string;
  sort_order?: number;
  is_active?: boolean;
}

/** Финальное определение базы */
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: CreateCategoryDto;
        Update: Partial<CreateCategoryDto>;
      };
      products: {
        Row: Product;
        Insert: CreateProductDto;
        Update: UpdateProductDto;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: CreateProductVariantDto;
        Update: UpdateProductVariantDto;
      };
      reviews: {
        Row: Review;
        Insert: CreateReviewDto;
        Update: Partial<CreateReviewDto>;
      };
      hero_slides: {
        Row: HeroSlide;
        Insert: CreateHeroSlideDto;
        Update: Partial<CreateHeroSlideDto>;
      };
      // ⚡️ можно добавить recommendations и другие таблицы аналогично
    };
  };
}
