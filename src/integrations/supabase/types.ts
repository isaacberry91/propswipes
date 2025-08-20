export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      matches: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          property_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          property_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          property_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          marketing_emails: boolean | null
          match_notifications: boolean | null
          message_notifications: boolean | null
          profile_id: string
          property_updates: boolean | null
          updated_at: string
          weekly_digest: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          marketing_emails?: boolean | null
          match_notifications?: boolean | null
          message_notifications?: boolean | null
          profile_id: string
          property_updates?: boolean | null
          updated_at?: string
          weekly_digest?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          marketing_emails?: boolean | null
          match_notifications?: boolean | null
          message_notifications?: boolean | null
          profile_id?: string
          property_updates?: boolean | null
          updated_at?: string
          weekly_digest?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          daily_likes_reset_date: string | null
          daily_likes_used: number | null
          deleted_at: string | null
          display_name: string | null
          id: string
          location: string | null
          phone: string | null
          properties_listed: number | null
          two_factor_contact: string | null
          two_factor_enabled: boolean | null
          two_factor_method: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_likes_reset_date?: string | null
          daily_likes_used?: number | null
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          properties_listed?: number | null
          two_factor_contact?: string | null
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_likes_reset_date?: string | null
          daily_likes_used?: number | null
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          properties_listed?: number | null
          two_factor_contact?: string | null
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          images: string[] | null
          latitude: number | null
          longitude: number | null
          owner_id: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          square_feet: number | null
          state: string
          status: Database["public"]["Enums"]["property_status"] | null
          title: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          longitude?: number | null
          owner_id: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          state: string
          status?: Database["public"]["Enums"]["property_status"] | null
          title: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          longitude?: number | null
          owner_id?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          state?: string
          status?: Database["public"]["Enums"]["property_status"] | null
          title?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_swipes: {
        Row: {
          created_at: string
          id: string
          is_liked: boolean
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_liked: boolean
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_liked?: boolean
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_swipes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_swipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          apple_receipt_data: string | null
          apple_transaction_id: string | null
          auto_renew: boolean | null
          created_at: string
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_end: string
          subscription_start: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          apple_receipt_data?: string | null
          apple_transaction_id?: string | null
          auto_renew?: boolean | null
          created_at?: string
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_end: string
          subscription_start?: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          apple_receipt_data?: string | null
          apple_transaction_id?: string | null
          auto_renew?: boolean | null
          created_at?: string
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_end?: string
          subscription_start?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_codes: {
        Row: {
          code: string
          contact: string
          created_at: string
          expires_at: string
          id: string
          type: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          contact: string
          created_at?: string
          expires_at: string
          id?: string
          type: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          contact?: string
          created_at?: string
          expires_at?: string
          id?: string
          type?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          push_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          push_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          push_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_2fa_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_profile_with_email: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          email: string
          id: string
          location: string
          phone: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }[]
      }
      get_user_profile_id_for_auth_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_subscription_tier: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_active_subscription: {
        Args: {
          tier: Database["public"]["Enums"]["subscription_tier"]
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      property_status: "pending" | "approved" | "rejected"
      property_type:
        | "house"
        | "apartment"
        | "condo"
        | "townhouse"
        | "studio"
        | "office"
        | "retail"
        | "warehouse"
        | "industrial"
        | "land"
      subscription_status: "active" | "expired" | "cancelled" | "pending"
      subscription_tier:
        | "buyer_pro"
        | "seller_basic"
        | "seller_professional"
        | "seller_enterprise"
      user_type: "buyer" | "seller" | "agent"
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
    Enums: {
      property_status: ["pending", "approved", "rejected"],
      property_type: [
        "house",
        "apartment",
        "condo",
        "townhouse",
        "studio",
        "office",
        "retail",
        "warehouse",
        "industrial",
        "land",
      ],
      subscription_status: ["active", "expired", "cancelled", "pending"],
      subscription_tier: [
        "buyer_pro",
        "seller_basic",
        "seller_professional",
        "seller_enterprise",
      ],
      user_type: ["buyer", "seller", "agent"],
    },
  },
} as const
