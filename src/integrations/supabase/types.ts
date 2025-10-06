export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          sort_order: number | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      new_clients: {
        Row: {
          bonus_amount: number
          created_at: string
          id: string
          is_used: boolean
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          bonus_amount?: number
          created_at?: string
          id?: string
          is_used?: boolean
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          bonus_amount?: number
          created_at?: string
          id?: string
          is_used?: boolean
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          card_wishes: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_date: string | null
          delivery_time: string | null
          delivery_type: string | null
          discount_amount: number | null
          district: string | null
          id: string
          items: Json
          notes: string | null
          order_comment: string | null
          order_status: string | null
          payment_method: string | null
          promo_code: string | null
          recipient_address: string | null
          recipient_name: string | null
          recipient_phone: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          card_wishes?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_time?: string | null
          delivery_type?: string | null
          discount_amount?: number | null
          district?: string | null
          id?: string
          items: Json
          notes?: string | null
          order_comment?: string | null
          order_status?: string | null
          payment_method?: string | null
          promo_code?: string | null
          recipient_address?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          card_wishes?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_time?: string | null
          delivery_type?: string | null
          discount_amount?: number | null
          district?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_comment?: string | null
          order_status?: string | null
          payment_method?: string | null
          promo_code?: string | null
          recipient_address?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_recommendations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          source_category_id: string | null
          target_category_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          source_category_id?: string | null
          target_category_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          source_category_id?: string | null
          target_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_source_category_id_fkey"
            columns: ["source_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability_status: string | null
          care_instructions: string | null
          category_id: string | null
          colors: string[] | null
          composition: string[] | null
          created_at: string
          delivery_info: string | null
          description: string | null
          detailed_description: string | null
          gallery_urls: string[] | null
          gift_info: string | null
          guarantee_info: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number | null
          show_on_homepage: boolean | null
          size_info: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          availability_status?: string | null
          care_instructions?: string | null
          category_id?: string | null
          colors?: string[] | null
          composition?: string[] | null
          created_at?: string
          delivery_info?: string | null
          description?: string | null
          detailed_description?: string | null
          gallery_urls?: string[] | null
          gift_info?: string | null
          guarantee_info?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price?: number | null
          show_on_homepage?: boolean | null
          size_info?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          availability_status?: string | null
          care_instructions?: string | null
          category_id?: string | null
          colors?: string[] | null
          composition?: string[] | null
          created_at?: string
          delivery_info?: string | null
          description?: string | null
          detailed_description?: string | null
          gallery_urls?: string[] | null
          gift_info?: string | null
          guarantee_info?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number | null
          show_on_homepage?: boolean | null
          size_info?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          customer_phone: string | null
          id: string
          order_id: string | null
          promo_code_id: string
          used_at: string
        }
        Insert: {
          customer_phone?: string | null
          id?: string
          order_id?: string | null
          promo_code_id: string
          used_at?: string
        }
        Update: {
          customer_phone?: string | null
          id?: string
          order_id?: string | null
          promo_code_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_amount: number
          discount_type: string
          expires_at: string | null
          id: string
          is_active: boolean
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_amount: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_amount?: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_avatar_url: string | null
          client_name: string
          comment: string
          created_at: string
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          rating: number
          updated_at: string
        }
        Insert: {
          client_avatar_url?: string | null
          client_name: string
          comment: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          rating: number
          updated_at?: string
        }
        Update: {
          client_avatar_url?: string | null
          client_name?: string
          comment?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }

/* ────────────────────────────────
   ▼▼▼  НОВЫЕ ТАБЛИЦЫ (обновлённые) ▼▼▼
   ──────────────────────────────── */

variant_products: {
  Row: {
    id: number
    name: string
    slug: string
    description: string | null
    detailed_description: string | null
    image_url: string | null
    gallery_urls: string[] | null
    is_active: boolean
    is_featured: boolean | null
    show_on_homepage: boolean | null
    sort_order: number
    availability_status: string | null
    delivery_info: string | null
    gift_info: string | null
    guarantee_info: string | null
    care_instructions: string | null
    size_info: string | null
    tags: string[] | null
    seo_title: string | null
    seo_description: string | null
    seo_canonical: string | null
    og_image_url: string | null
    min_price_cache: number | null
    max_price_cache: number | null
    published_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    name: string
    slug: string
    description?: string | null
    detailed_description?: string | null
    image_url?: string | null
    gallery_urls?: string[] | null
    is_active?: boolean
    is_featured?: boolean | null
    show_on_homepage?: boolean | null
    sort_order?: number
    availability_status?: string | null
    delivery_info?: string | null
    gift_info?: string | null
    guarantee_info?: string | null
    care_instructions?: string | null
    size_info?: string | null
    tags?: string[] | null
    seo_title?: string | null
    seo_description?: string | null
    seo_canonical?: string | null
    og_image_url?: string | null
    min_price_cache?: number | null
    max_price_cache?: number | null
    published_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    name?: string
    slug?: string
    description?: string | null
    detailed_description?: string | null
    image_url?: string | null
    gallery_urls?: string[] | null
    is_active?: boolean
    is_featured?: boolean | null
    show_on_homepage?: boolean | null
    sort_order?: number
    availability_status?: string | null
    delivery_info?: string | null
    gift_info?: string | null
    guarantee_info?: string | null
    care_instructions?: string | null
    size_info?: string | null
    tags?: string[] | null
    seo_title?: string | null
    seo_description?: string | null
    seo_canonical?: string | null
    og_image_url?: string | null
    min_price_cache?: number | null
    max_price_cache?: number | null
    published_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}


product_variants: {
  Row: {
    id: number
    product_id: number
    title: string                   // подпись кружка («S», «21», …)
    composition: string | null      // «6 роз», «3 шара» (короткое описание/состав)
    description: string | null      // длинное описание (опц.)
    price: number                   // цена этого варианта
    image_url: string | null        // фото варианта
    gallery_urls: string[] | null   // мини-галерея (опц.)
    is_active: boolean
    sort_order: number              // порядок отображения
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    product_id: number
    title: string
    composition?: string | null
    description?: string | null
    price: number
    image_url?: string | null
    gallery_urls?: string[] | null
    is_active?: boolean
    sort_order?: number
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    product_id?: number
    title?: string
    composition?: string | null
    description?: string | null
    price?: number
    image_url?: string | null
    gallery_urls?: string[] | null
    is_active?: boolean
    sort_order?: number
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "product_variants_product_id_fkey"
      columns: ["product_id"]
      isOneToOne: false
      referencedRelation: "variant_products"
      referencedColumns: ["id"]
    }
  ]
}



variant_product_categories: {
  Row: {
    product_id: number
    category_id: string // uuid
  }
  Insert: {
    product_id: number
    category_id: string
  }
  Update: {
    product_id?: number
    category_id?: string
  }
  Relationships: [
    {
      foreignKeyName: "variant_product_categories_product_id_fkey"
      columns: ["product_id"]
      isOneToOne: false
      referencedRelation: "variant_products"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "variant_product_categories_category_id_fkey"
      columns: ["category_id"]
      isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
  ]
}
    }
    Views: {
      [_ in never]: never
      // Если создашь view `variant_products_with_categories`, добавим сюда.
    }
    Functions: {
      generate_admin_token: {
        Args: { p_username: string; p_password: string }
        Returns: string
      }
      verify_admin_password: {
        Args: { p_username: string; p_password: string }
        Returns: boolean
      }

      /* ────────────────────────────────
         ▼▼▼  НОВАЯ ФУНКЦИЯ RPC  ▼▼▼
         ──────────────────────────────── */
      set_variant_product_categories: {
        Args: {
          p_product_id: number
          p_category_ids: string[] | null // uuid[]
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
