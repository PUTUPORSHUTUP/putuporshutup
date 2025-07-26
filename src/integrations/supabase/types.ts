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
      activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      addiction_resources: {
        Row: {
          country_code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          phone_number: string | null
          resource_type: string
          title: string
          url: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string | null
          resource_type: string
          title: string
          url: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string | null
          resource_type?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_response: string | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          tournament_match_id: string | null
          type: string
          updated_at: string
          user_id: string
          wager_id: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          tournament_match_id?: string | null
          type: string
          updated_at?: string
          user_id: string
          wager_id?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          tournament_match_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          wager_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_tournament_match_id_fkey"
            columns: ["tournament_match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_wager_id_fkey"
            columns: ["wager_id"]
            isOneToOne: false
            referencedRelation: "wagers"
            referencedColumns: ["id"]
          },
        ]
      }
      flagged_matches: {
        Row: {
          created_at: string
          flag_reason: string
          flagged_by: string
          id: string
          mod_notes: string | null
          mod_recommendation: string | null
          priority: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tournament_match_id: string | null
          updated_at: string
          wager_id: string | null
        }
        Insert: {
          created_at?: string
          flag_reason: string
          flagged_by: string
          id?: string
          mod_notes?: string | null
          mod_recommendation?: string | null
          priority?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tournament_match_id?: string | null
          updated_at?: string
          wager_id?: string | null
        }
        Update: {
          created_at?: string
          flag_reason?: string
          flagged_by?: string
          id?: string
          mod_notes?: string | null
          mod_recommendation?: string | null
          priority?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tournament_match_id?: string | null
          updated_at?: string
          wager_id?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_modes: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          is_active: boolean | null
          max_players: number | null
          mode_description: string | null
          mode_name: string
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          max_players?: number | null
          mode_description?: string | null
          mode_name: string
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          max_players?: number | null
          mode_description?: string | null
          mode_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_modes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
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
      match_notifications: {
        Row: {
          created_at: string
          id: string
          match_queue_id: string
          matched_user_id: string
          message: string
          notification_type: string
          read: boolean
          user_id: string
          wager_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_queue_id: string
          matched_user_id: string
          message: string
          notification_type?: string
          read?: boolean
          user_id: string
          wager_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_queue_id?: string
          matched_user_id?: string
          message?: string
          notification_type?: string
          read?: boolean
          user_id?: string
          wager_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_notifications_match_queue_id_fkey"
            columns: ["match_queue_id"]
            isOneToOne: false
            referencedRelation: "match_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_notifications_wager_id_fkey"
            columns: ["wager_id"]
            isOneToOne: false
            referencedRelation: "wagers"
            referencedColumns: ["id"]
          },
        ]
      }
      match_preferences: {
        Row: {
          auto_match_enabled: boolean
          created_at: string
          id: string
          max_queue_time_minutes: number
          max_stake: number
          min_stake: number
          preferred_games: string[]
          preferred_platforms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_match_enabled?: boolean
          created_at?: string
          id?: string
          max_queue_time_minutes?: number
          max_stake?: number
          min_stake?: number
          preferred_games?: string[]
          preferred_platforms?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_match_enabled?: boolean
          created_at?: string
          id?: string
          max_queue_time_minutes?: number
          max_stake?: number
          min_stake?: number
          preferred_games?: string[]
          preferred_platforms?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_queue: {
        Row: {
          expires_at: string
          game_id: string
          id: string
          matched_at: string | null
          matched_with_user_id: string | null
          platform: string
          queue_status: string
          queued_at: string
          stake_amount: number
          user_id: string
          wager_id: string | null
        }
        Insert: {
          expires_at: string
          game_id: string
          id?: string
          matched_at?: string | null
          matched_with_user_id?: string | null
          platform: string
          queue_status?: string
          queued_at?: string
          stake_amount: number
          user_id: string
          wager_id?: string | null
        }
        Update: {
          expires_at?: string
          game_id?: string
          id?: string
          matched_at?: string | null
          matched_with_user_id?: string | null
          platform?: string
          queue_status?: string
          queued_at?: string
          stake_amount?: number
          user_id?: string
          wager_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_queue_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_queue_wager_id_fkey"
            columns: ["wager_id"]
            isOneToOne: false
            referencedRelation: "wagers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      player_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
          updated_at?: string
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
          is_admin: boolean | null
          is_premium: boolean | null
          premium_expires_at: string | null
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
          is_admin?: boolean | null
          is_premium?: boolean | null
          premium_expires_at?: string | null
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
          is_admin?: boolean | null
          is_premium?: boolean | null
          premium_expires_at?: string | null
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
      self_exclusions: {
        Row: {
          created_at: string
          end_date: string | null
          exclusion_type: string
          id: string
          is_active: boolean
          reason: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          exclusion_type: string
          id?: string
          is_active?: boolean
          reason?: string | null
          start_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          exclusion_type?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          page_path: string
          session_id: string | null
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_path?: string
          session_id?: string | null
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_path?: string
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tournament_matches: {
        Row: {
          admin_actioned_by: string | null
          admin_notes: string | null
          admin_override: boolean | null
          completed_at: string | null
          confirmed_by_organizer: boolean | null
          created_at: string
          dispute_status: string | null
          id: string
          last_admin_action_at: string | null
          match_number: number
          override_reason: string | null
          player1_id: string | null
          player1_reported_winner: string | null
          player2_id: string | null
          player2_reported_winner: string | null
          result_disputed: boolean | null
          result_proof_url: string | null
          round_number: number
          scheduled_time: string | null
          status: string
          tournament_id: string
          winner_id: string | null
        }
        Insert: {
          admin_actioned_by?: string | null
          admin_notes?: string | null
          admin_override?: boolean | null
          completed_at?: string | null
          confirmed_by_organizer?: boolean | null
          created_at?: string
          dispute_status?: string | null
          id?: string
          last_admin_action_at?: string | null
          match_number: number
          override_reason?: string | null
          player1_id?: string | null
          player1_reported_winner?: string | null
          player2_id?: string | null
          player2_reported_winner?: string | null
          result_disputed?: boolean | null
          result_proof_url?: string | null
          round_number: number
          scheduled_time?: string | null
          status?: string
          tournament_id: string
          winner_id?: string | null
        }
        Update: {
          admin_actioned_by?: string | null
          admin_notes?: string | null
          admin_override?: boolean | null
          completed_at?: string | null
          confirmed_by_organizer?: boolean | null
          created_at?: string
          dispute_status?: string | null
          id?: string
          last_admin_action_at?: string | null
          match_number?: number
          override_reason?: string | null
          player1_id?: string | null
          player1_reported_winner?: string | null
          player2_id?: string | null
          player2_reported_winner?: string | null
          result_disputed?: boolean | null
          result_proof_url?: string | null
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
      user_limits: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          limit_amount: number
          limit_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effective_date?: string
          id?: string
          limit_amount: number
          limit_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          limit_amount?: number
          limit_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: string
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
      wager_result_reports: {
        Row: {
          created_at: string
          id: string
          reported_by: string
          wager_id: string
          winner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reported_by: string
          wager_id: string
          winner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reported_by?: string
          wager_id?: string
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wager_result_reports_wager_id_fkey"
            columns: ["wager_id"]
            isOneToOne: false
            referencedRelation: "wagers"
            referencedColumns: ["id"]
          },
        ]
      }
      wagers: {
        Row: {
          admin_actioned_by: string | null
          admin_notes: string | null
          admin_override: boolean | null
          created_at: string | null
          creator_id: string
          description: string | null
          dispute_status: string | null
          end_time: string | null
          game_id: string
          game_mode: string | null
          id: string
          last_admin_action_at: string | null
          max_participants: number | null
          override_reason: string | null
          platform: string
          result_proof_url: string | null
          stake_amount: number
          start_time: string | null
          status: string | null
          title: string
          total_pot: number | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          admin_actioned_by?: string | null
          admin_notes?: string | null
          admin_override?: boolean | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          dispute_status?: string | null
          end_time?: string | null
          game_id: string
          game_mode?: string | null
          id?: string
          last_admin_action_at?: string | null
          max_participants?: number | null
          override_reason?: string | null
          platform: string
          result_proof_url?: string | null
          stake_amount: number
          start_time?: string | null
          status?: string | null
          title: string
          total_pot?: number | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          admin_actioned_by?: string | null
          admin_notes?: string | null
          admin_override?: boolean | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          dispute_status?: string | null
          end_time?: string | null
          game_id?: string
          game_mode?: string | null
          id?: string
          last_admin_action_at?: string | null
          max_participants?: number | null
          override_reason?: string | null
          platform?: string
          result_proof_url?: string | null
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
      cleanup_expired_queue_entries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_admin_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_deposits: number
          total_withdrawals: number
          active_premium_users: number
          total_users: number
          total_tournaments: number
          total_wagers: number
          transactions_today: number
          tournaments_this_week: number
          new_users_this_week: number
        }[]
      }
      get_user_role: {
        Args: { user_uuid?: string }
        Returns: string
      }
      get_visit_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_visits: number
          unique_visitors: number
          visits_today: number
          visits_this_week: number
        }[]
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_user_excluded: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_user_moderator: {
        Args: { user_uuid?: string }
        Returns: boolean
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
