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
      game_suggestions: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          game_name: string
          id: string
          image_url: string | null
          platform: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          game_name: string
          id?: string
          image_url?: string | null
          platform: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          game_name?: string
          id?: string
          image_url?: string | null
          platform?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          platform: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          platform?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          platform?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          gamer_tag_psn: string | null
          gamer_tag_steam: string | null
          gamer_tag_xbox: string | null
          id: string
          total_losses: number | null
          total_wagered: number | null
          total_wins: number | null
          updated_at: string | null
          user_id: string
          username: string | null
          wallet_balance: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          gamer_tag_psn?: string | null
          gamer_tag_steam?: string | null
          gamer_tag_xbox?: string | null
          id?: string
          total_losses?: number | null
          total_wagered?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          wallet_balance?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          gamer_tag_psn?: string | null
          gamer_tag_steam?: string | null
          gamer_tag_xbox?: string | null
          id?: string
          total_losses?: number | null
          total_wagered?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      tournament_matches: {
        Row: {
          completed_at: string | null
          confirmed_by_organizer: boolean | null
          created_at: string
          id: string
          match_number: number
          player1_id: string | null
          player1_reported_winner: string | null
          player2_id: string | null
          player2_reported_winner: string | null
          result_disputed: boolean | null
          round_number: number
          scheduled_time: string | null
          status: string
          tournament_id: string
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          confirmed_by_organizer?: boolean | null
          created_at?: string
          id?: string
          match_number: number
          player1_id?: string | null
          player1_reported_winner?: string | null
          player2_id?: string | null
          player2_reported_winner?: string | null
          result_disputed?: boolean | null
          round_number: number
          scheduled_time?: string | null
          status?: string
          tournament_id: string
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          confirmed_by_organizer?: boolean | null
          created_at?: string
          id?: string
          match_number?: number
          player1_id?: string | null
          player1_reported_winner?: string | null
          player2_id?: string | null
          player2_reported_winner?: string | null
          result_disputed?: boolean | null
          round_number?: number
          scheduled_time?: string | null
          status?: string
          tournament_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          bracket_position: number
          eliminated_at: string | null
          entry_paid: number
          id: string
          joined_at: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          bracket_position: number
          eliminated_at?: string | null
          entry_paid: number
          id?: string
          joined_at?: string
          tournament_id: string
          user_id: string
        }
        Update: {
          bracket_position?: number
          eliminated_at?: string | null
          entry_paid?: number
          id?: string
          joined_at?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          creator_id: string
          current_participants: number | null
          description: string | null
          entry_fee: number
          game_id: string
          id: string
          max_participants: number
          platform: string
          prize_pool: number | null
          start_time: string | null
          status: string
          title: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          current_participants?: number | null
          description?: string | null
          entry_fee: number
          game_id: string
          id?: string
          max_participants: number
          platform: string
          prize_pool?: number | null
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          current_participants?: number | null
          description?: string | null
          entry_fee?: number
          game_id?: string
          id?: string
          max_participants?: number
          platform?: string
          prize_pool?: number | null
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wager_participants: {
        Row: {
          id: string
          joined_at: string | null
          stake_paid: number
          status: string | null
          user_id: string
          wager_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          stake_paid: number
          status?: string | null
          user_id: string
          wager_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          stake_paid?: number
          status?: string | null
          user_id?: string
          wager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wager_participants_wager_id_fkey"
            columns: ["wager_id"]
            isOneToOne: false
            referencedRelation: "wagers"
            referencedColumns: ["id"]
          },
        ]
      }
      wagers: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          end_time: string | null
          game_id: string
          game_mode: string | null
          id: string
          max_participants: number | null
          platform: string
          stake_amount: number
          start_time: string | null
          status: string | null
          title: string
          total_pot: number | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          end_time?: string | null
          game_id: string
          game_mode?: string | null
          id?: string
          max_participants?: number | null
          platform: string
          stake_amount: number
          start_time?: string | null
          status?: string | null
          title: string
          total_pot?: number | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          end_time?: string | null
          game_id?: string
          game_mode?: string | null
          id?: string
          max_participants?: number | null
          platform?: string
          stake_amount?: number
          start_time?: string | null
          status?: string | null
          title?: string
          total_pot?: number | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wagers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
