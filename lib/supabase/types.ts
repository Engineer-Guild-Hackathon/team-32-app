export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      daily_usage: {
        Row: {
          created_at: string
          inflight: number
          updated_at: string
          used: number
          user_id: string
          ymd: string
        }
        Insert: {
          created_at?: string
          inflight?: number
          updated_at?: string
          used?: number
          user_id: string
          ymd: string
        }
        Update: {
          created_at?: string
          inflight?: number
          updated_at?: string
          used?: number
          user_id?: string
          ymd?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          created_at: string
          embedding: number[] | null
          id: string
          image_path: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          created_at?: string
          embedding?: number[] | null
          id?: string
          image_path: string
          user_id?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string
          embedding?: number[] | null
          id?: string
          image_path?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          frame_type: Database["public"]["Enums"]["frame_type"] | null
          full_body_image_path: string | null
          id: string
          personal_color: Database["public"]["Enums"]["personal_color"] | null
        }
        Insert: {
          created_at?: string
          frame_type?: Database["public"]["Enums"]["frame_type"] | null
          full_body_image_path?: string | null
          id?: string
          personal_color?: Database["public"]["Enums"]["personal_color"] | null
        }
        Update: {
          created_at?: string
          frame_type?: Database["public"]["Enums"]["frame_type"] | null
          full_body_image_path?: string | null
          id?: string
          personal_color?: Database["public"]["Enums"]["personal_color"] | null
        }
        Relationships: []
      }
      usage_requests: {
        Row: {
          completed_at: string | null
          request_id: string
          reserved_at: string
          status: string
          user_id: string
          ymd: string
        }
        Insert: {
          completed_at?: string | null
          request_id: string
          reserved_at?: string
          status: string
          user_id: string
          ymd: string
        }
        Update: {
          completed_at?: string | null
          request_id?: string
          reserved_at?: string
          status?: string
          user_id?: string
          ymd?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string
          plan: Database["public"]["Enums"]["plan"]
          user_id: string
        }
        Insert: {
          created_at?: string
          plan?: Database["public"]["Enums"]["plan"]
          user_id: string
        }
        Update: {
          created_at?: string
          plan?: Database["public"]["Enums"]["plan"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finalize_usage_failure: {
        Args: { p_request_id: string; p_user_id: string; p_ymd: string }
        Returns: undefined
      }
      finalize_usage_success: {
        Args: { p_request_id: string; p_user_id: string; p_ymd: string }
        Returns: undefined
      }
      get_usage_status: {
        Args: { p_limit: number; p_user_id: string; p_ymd?: string }
        Returns: {
          can_reserve: boolean
          inflight: number
          remaining: number
          used: number
        }[]
      }
      reserve_usage: {
        Args: {
          p_limit: number
          p_request_id: string
          p_user_id: string
          p_ymd: string
        }
        Returns: boolean
      }
      search_items_by_vector: {
        Args: {
          query_embedding: number[]
          match_count?: number
          filter_category?: string | null
        }
        Returns: {
          item_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      frame_type: "straight" | "wave" | "natural"
      item_category: "tops" | "bottoms" | "shoes" | "accessories"
      personal_color: "spring" | "summer" | "autumn" | "winter"
      plan: "free" | "pro"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      frame_type: ["straight", "wave", "natural"],
      item_category: ["tops", "bottoms", "shoes", "accessories"],
      personal_color: ["spring", "summer", "autumn", "winter"],
      plan: ["free", "pro"],
    },
  },
} as const
