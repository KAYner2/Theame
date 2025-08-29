// src/types/database.ts

/** Статус наличия товара на складе */
export type AvailabilityStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'limited'
  | 'pre_order';

/** Категория товара */
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  /** Позиция для сортировки (меньше — выше) */
  sort_order: number;
  is_active: boolean;
  created_at: string; // ISO
  updated_at: string; // ISO
}

/** Товар */
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  detailed_description?: string | null;
  care_instructions?: string | null;

  /** Состав как массив удобен на фронте */
  composition?: string[] | null;

  composition_raw?: string | null;

  /** Цвета как массив */
  colors?: string[] | null;

  gift_info?: string | null;
  guarantee_info?: string | null;
  delivery_info?: string | null;
  size_info?: string | null;

  /** Статус наличия (см. AvailabilityStatus) */
  availability_status?: AvailabilityStatus | null;
  price?: number | null;

  /**
   * LEGACY: старая одиночная категория.
   * Оставлена, чтобы не падали старые места, постепенно выпилим.
   */
  category_id?: string | null;

  /**
   * НОВОЕ: массив категорий (приходит из view products_with_categories).
   * Пустой массив [], не null.
   */
  category_ids?: string[];

  /** Основное изображение */
  image_url?: string | null;

  /** До 4 изображений галереи */
  gallery_urls?: string[] | null;

  is_featured: boolean;
  is_active: boolean;
  show_on_homepage: boolean;

  /** Порядок сортировки (меньше — выше) */
  sort_order: number;

  created_at: string; // ISO
  updated_at: string; // ISO

  /** Опционально: если где-то делаешь join категории */
  category?: Category | null;

  /** Новые поля для пометки возможности замены */
  show_substitution_note?: boolean;
  substitution_note_text?: string | null;
}

/** Отзыв клиента */
export interface Review {
  id: string;
  client_name: string;
  client_avatar_url?: string | null;
  /** 1..5 */
  rating: number;
  comment: string;
  is_approved: boolean;
  is_active: boolean;
  publication_date?: string | null; // ISO (может отсутствовать)
  created_at: string; // ISO
  updated_at: string; // ISO
}

/** DTO для создания категории */
export interface CreateCategoryDto {
  name: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * DTO для создания товара.
 * Важно: категории теперь устанавливаются ОТДЕЛЬНО через RPC set_product_categories,
 * поэтому здесь category_ids не требуется. category_id (legacy) оставлен опционально.
 */
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
  availability_status?: AvailabilityStatus;
  price?: number;

  /** LEGACY: одиночная категория — не используем, но оставляем опционально */
  category_id?: string;

  image_url?: string;
  gallery_urls?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  show_on_homepage?: boolean;
  sort_order?: number;

  /** Новые поля сразу добавим и сюда */
  show_substitution_note?: boolean;
  substitution_note_text?: string | null;
}

/** DTO для создания отзыва */
export interface CreateReviewDto {
  client_name: string;
  client_avatar_url?: string;
  rating: number;
  comment: string;
  is_approved?: boolean;
  is_active?: boolean;
  publication_date?: string; // ISO
}

/** Hero-слайд на главной */
export interface HeroSlide {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string; // ISO
  updated_at: string; // ISO
}

/** DTO для создания Hero-слайда */
export interface CreateHeroSlideDto {
  title?: string;
  subtitle?: string;
  image_url: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug?: string | null;       // 👈 добавить
  // ...
}

export interface Product {
  id: string;
  name: string;
  slug?: string | null;       // 👈 добавить
  category?: Category | null; // уже есть у тебя
  // ...
}