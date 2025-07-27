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
      challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string | null
          stake_paid: number
          status: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string | null
          stake_paid: number
          status?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string | null
          stake_paid?: number
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_result_reports: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          reported_by: string
          winner_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          reported_by: string
          winner_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          reported_by?: string
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_result_reports_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_stats: {
        Row: {
          assists: number | null
          challenge_id: string
          created_at: string
          custom_stats: Json | null
          damage_dealt: number | null
          deaths: number | null
          id: string
          kills: number | null
          placement: number | null
          proof_url: string | null
          score: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          assists?: number | null
          challenge_id: string
          created_at?: string
          custom_stats?: Json | null
          damage_dealt?: number | null
          deaths?: number | null
          id?: string
          kills?: number | null
          placement?: number | null
          proof_url?: string | null
          score?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          assists?: number | null
          challenge_id?: string
          created_at?: string
          custom_stats?: Json | null
          damage_dealt?: number | null
          deaths?: number | null
          id?: string
          kills?: number | null
          placement?: number | null
          proof_url?: string | null
          score?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_stats_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_team_members: {
        Row: {
          id: string
          joined_at: string
          stake_paid: number
          status: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          stake_paid?: number
          status?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          stake_paid?: number
          status?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wager_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "challenge_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_teams: {
        Row: {
          captain_id: string
          challenge_id: string
          created_at: string
          id: string
          team_name: string
          team_number: number
          total_stake: number
          updated_at: string
        }
        Insert: {
          captain_id: string
          challenge_id: string
          created_at?: string
          id?: string
          team_name: string
          team_number: number
          total_stake?: number
          updated_at?: string
        }
        Update: {
          captain_id?: string
          challenge_id?: string
          created_at?: string
          id?: string
          team_name?: string
          team_number?: number
          total_stake?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_teams_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          admin_actioned_by: string | null
          admin_notes: string | null
          admin_override: boolean | null
          challenge_type: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          dispute_status: string | null
          end_time: string | null
          game_id: string
          game_mode: string | null
          id: string
          last_admin_action_at: string | null
          lobby_id: string | null
          max_participants: number | null
          override_reason: string | null
          platform: string
          result_proof_url: string | null
          stake_amount: number
          start_time: string | null
          stat_criteria: Json | null
          status: string | null
          team_size: number | null
          title: string
          total_pot: number | null
          updated_at: string | null
          verification_method: string | null
          winner_id: string | null
        }
        Insert: {
          admin_actioned_by?: string | null
          admin_notes?: string | null
          admin_override?: boolean | null
          challenge_type?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          dispute_status?: string | null
          end_time?: string | null
          game_id: string
          game_mode?: string | null
          id?: string
          last_admin_action_at?: string | null
          lobby_id?: string | null
          max_participants?: number | null
          override_reason?: string | null
          platform: string
          result_proof_url?: string | null
          stake_amount: number
          start_time?: string | null
          stat_criteria?: Json | null
          status?: string | null
          team_size?: number | null
          title: string
          total_pot?: number | null
          updated_at?: string | null
          verification_method?: string | null
          winner_id?: string | null
        }
        Update: {
          admin_actioned_by?: string | null
          admin_notes?: string | null
          admin_override?: boolean | null
          challenge_type?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          dispute_status?: string | null
          end_time?: string | null
          game_id?: string
          game_mode?: string | null
          id?: string
          last_admin_action_at?: string | null
          lobby_id?: string | null
          max_participants?: number | null
          override_reason?: string | null
          platform?: string
          result_proof_url?: string | null
          stake_amount?: number
          start_time?: string | null
          stat_criteria?: Json | null
          status?: string | null
          team_size?: number | null
          title?: string
          total_pot?: number | null
          updated_at?: string | null
          verification_method?: string | null
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
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_accounts: {
        Row: {
          amount: number
          created_at: string
          dispute_reason: string | null
          held_at: string
          id: string
          released_at: string | null
          released_to: string | null
          status: string
          updated_at: string
          user_id: string
          wager_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          dispute_reason?: string | null
          held_at?: string
          id?: string
          released_at?: string | null
          released_to?: string | null
          status?: string
          updated_at?: string
          user_id: string
          wager_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          dispute_reason?: string | null
          held_at?: string
          id?: string
          released_at?: string | null
          released_to?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          wager_id?: string
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          amount: number
          created_at: string
          escrow_account_id: string
          id: string
          metadata: Json | null
          processed_by: string | null
          reason: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          escrow_account_id: string
          id?: string
          metadata?: Json | null
          processed_by?: string | null
          reason?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          escrow_account_id?: string
          id?: string
          metadata?: Json | null
          processed_by?: string | null
          reason?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_escrow_account_id_fkey"
            columns: ["escrow_account_id"]
            isOneToOne: false
            referencedRelation: "escrow_accounts"
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
      game_api_integrations: {
        Row: {
          api_endpoint: string
          api_key_required: boolean | null
          created_at: string | null
          game_id: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: string
          rate_limit_per_minute: number | null
          stat_mappings: Json | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          api_key_required?: boolean | null
          created_at?: string | null
          game_id: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: string
          rate_limit_per_minute?: number | null
          stat_mappings?: Json | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          api_key_required?: boolean | null
          created_at?: string | null
          game_id?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: string
          rate_limit_per_minute?: number | null
          stat_mappings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_api_integrations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_matrix: {
        Row: {
          api_access: boolean
          challenge_type: string
          created_at: string
          game: string
          id: string
          platforms: string
          proof_method: string
          updated_at: string
        }
        Insert: {
          api_access?: boolean
          challenge_type: string
          created_at?: string
          game: string
          id?: string
          platforms: string
          proof_method?: string
          updated_at?: string
        }
        Update: {
          api_access?: boolean
          challenge_type?: string
          created_at?: string
          game?: string
          id?: string
          platforms?: string
          proof_method?: string
          updated_at?: string
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
      lobby_participants: {
        Row: {
          challenge_id: string | null
          id: string
          joined_at: string
          lobby_session_id: string
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          id?: string
          joined_at?: string
          lobby_session_id: string
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          id?: string
          joined_at?: string
          lobby_session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobby_participants_lobby_session_id_fkey"
            columns: ["lobby_session_id"]
            isOneToOne: false
            referencedRelation: "lobby_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_participants_wager_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      lobby_sessions: {
        Row: {
          created_by: string
          game_id: string
          id: string
          lobby_id: string
          max_participants: number
          platform: string
          session_end: string | null
          session_start: string
          status: string | null
        }
        Insert: {
          created_by: string
          game_id: string
          id?: string
          lobby_id: string
          max_participants: number
          platform: string
          session_end?: string | null
          session_start?: string
          status?: string | null
        }
        Update: {
          created_by?: string
          game_id?: string
          id?: string
          lobby_id?: string
          max_participants?: number
          platform?: string
          session_end?: string | null
          session_start?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lobby_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_payment_requests: {
        Row: {
          account_details: string | null
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          account_details?: string | null
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          account_details?: string | null
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          user_notes?: string | null
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
            referencedRelation: "challenges"
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
            referencedRelation: "challenges"
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
      otp_verifications: {
        Row: {
          attempts: number
          created_at: string
          email: string | null
          expires_at: string
          id: string
          max_attempts: number
          otp_code: string
          phone: string | null
          purpose: string
          updated_at: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          max_attempts?: number
          otp_code: string
          phone?: string | null
          purpose: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number
          otp_code?: string
          phone?: string | null
          purpose?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payoneer_email: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payoneer_email: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payoneer_email?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id?: string
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
          payoneer_email: string | null
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
          payoneer_email?: string | null
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
          payoneer_email?: string | null
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
      proof_submissions: {
        Row: {
          ai_analysis_notes: string | null
          ai_analysis_score: number | null
          challenge_id: string | null
          created_at: string | null
          id: string
          proof_type: string
          proof_url: string
          stats_claimed: Json | null
          submitted_by: string
          tournament_match_id: string | null
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          ai_analysis_notes?: string | null
          ai_analysis_score?: number | null
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          proof_type: string
          proof_url: string
          stats_claimed?: Json | null
          submitted_by: string
          tournament_match_id?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          ai_analysis_notes?: string | null
          ai_analysis_score?: number | null
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          proof_type?: string
          proof_url?: string
          stats_claimed?: Json | null
          submitted_by?: string
          tournament_match_id?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proof_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "proof_submissions_tournament_match_id_fkey"
            columns: ["tournament_match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      security_settings: {
        Row: {
          account_locked_until: string | null
          created_at: string
          failed_login_attempts: number
          id: string
          last_failed_login: string | null
          last_password_change: string | null
          lockout_duration_minutes: number
          max_login_attempts: number
          otp_expiry_minutes: number
          otp_method: string | null
          password_change_required: boolean
          two_factor_enabled: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_locked_until?: string | null
          created_at?: string
          failed_login_attempts?: number
          id?: string
          last_failed_login?: string | null
          last_password_change?: string | null
          lockout_duration_minutes?: number
          max_login_attempts?: number
          otp_expiry_minutes?: number
          otp_method?: string | null
          password_change_required?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_locked_until?: string | null
          created_at?: string
          failed_login_attempts?: number
          id?: string
          last_failed_login?: string | null
          last_password_change?: string | null
          lockout_duration_minutes?: number
          max_login_attempts?: number
          otp_expiry_minutes?: number
          otp_method?: string | null
          password_change_required?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string | null
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
      sponsor_performance: {
        Row: {
          clicks_to_site: number | null
          hashtag_uses: number | null
          logo_impressions: number | null
          mentions_in_match: number | null
          report_link: string | null
          social_reach: number | null
          sponsor_name: string | null
          tier: string | null
          tournament_id: string | null
          tournament_name: string | null
          winner_page_views: number | null
        }
        Insert: {
          clicks_to_site?: number | null
          hashtag_uses?: number | null
          logo_impressions?: number | null
          mentions_in_match?: number | null
          report_link?: string | null
          social_reach?: number | null
          sponsor_name?: string | null
          tier?: string | null
          tournament_id?: string | null
          tournament_name?: string | null
          winner_page_views?: number | null
        }
        Update: {
          clicks_to_site?: number | null
          hashtag_uses?: number | null
          logo_impressions?: number | null
          mentions_in_match?: number | null
          report_link?: string | null
          social_reach?: number | null
          sponsor_name?: string | null
          tier?: string | null
          tournament_id?: string | null
          tournament_name?: string | null
          winner_page_views?: number | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          budget_range: string | null
          company_name: string
          contact_person: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string | null
          selected_tier: string
          status: string | null
          tournament_preferences: string | null
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          company_name: string
          contact_person: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          selected_tier: string
          status?: string | null
          tournament_preferences?: string | null
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          company_name?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          selected_tier?: string
          status?: string | null
          tournament_preferences?: string | null
          updated_at?: string
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
      suspicious_activities: {
        Row: {
          activity_type: string
          auto_detected: boolean | null
          challenge_id: string | null
          created_at: string | null
          description: string
          id: string
          investigated_by: string | null
          investigation_notes: string | null
          severity: string | null
          status: string | null
          tournament_match_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          auto_detected?: boolean | null
          challenge_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          investigated_by?: string | null
          investigation_notes?: string | null
          severity?: string | null
          status?: string | null
          tournament_match_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          auto_detected?: boolean | null
          challenge_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          investigated_by?: string | null
          investigation_notes?: string | null
          severity?: string | null
          status?: string | null
          tournament_match_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspicious_activities_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicious_activities_tournament_match_id_fkey"
            columns: ["tournament_match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicious_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          flagged_reason: string | null
          id: string
          last_admin_action_at: string | null
          match_number: number
          override_reason: string | null
          player1_id: string | null
          player1_reported_winner: string | null
          player2_id: string | null
          player2_reported_winner: string | null
          proof_urls: string[] | null
          result_disputed: boolean | null
          result_proof_url: string | null
          round_number: number
          scheduled_time: string | null
          status: string
          tournament_id: string
          verification_score: number | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
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
          flagged_reason?: string | null
          id?: string
          last_admin_action_at?: string | null
          match_number: number
          override_reason?: string | null
          player1_id?: string | null
          player1_reported_winner?: string | null
          player2_id?: string | null
          player2_reported_winner?: string | null
          proof_urls?: string[] | null
          result_disputed?: boolean | null
          result_proof_url?: string | null
          round_number: number
          scheduled_time?: string | null
          status?: string
          tournament_id: string
          verification_score?: number | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
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
          flagged_reason?: string | null
          id?: string
          last_admin_action_at?: string | null
          match_number?: number
          override_reason?: string | null
          player1_id?: string | null
          player1_reported_winner?: string | null
          player2_id?: string | null
          player2_reported_winner?: string | null
          proof_urls?: string[] | null
          result_disputed?: boolean | null
          result_proof_url?: string | null
          round_number?: number
          scheduled_time?: string | null
          status?: string
          tournament_id?: string
          verification_score?: number | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
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
          auto_verification: boolean | null
          created_at: string
          creator_id: string
          current_participants: number | null
          custom_rules: string | null
          description: string | null
          entry_fee: number
          game_id: string
          id: string
          max_participants: number
          platform: string
          prize_pool: number | null
          proof_required: boolean | null
          sponsor_cost: number | null
          sponsored: boolean | null
          sponsorship_tier: string | null
          start_time: string | null
          status: string
          title: string
          tournament_type: string | null
          updated_at: string
          verification_threshold: number | null
          winner_id: string | null
        }
        Insert: {
          auto_verification?: boolean | null
          created_at?: string
          creator_id: string
          current_participants?: number | null
          custom_rules?: string | null
          description?: string | null
          entry_fee: number
          game_id: string
          id?: string
          max_participants: number
          platform: string
          prize_pool?: number | null
          proof_required?: boolean | null
          sponsor_cost?: number | null
          sponsored?: boolean | null
          sponsorship_tier?: string | null
          start_time?: string | null
          status?: string
          title: string
          tournament_type?: string | null
          updated_at?: string
          verification_threshold?: number | null
          winner_id?: string | null
        }
        Update: {
          auto_verification?: boolean | null
          created_at?: string
          creator_id?: string
          current_participants?: number | null
          custom_rules?: string | null
          description?: string | null
          entry_fee?: number
          game_id?: string
          id?: string
          max_participants?: number
          platform?: string
          prize_pool?: number | null
          proof_required?: boolean | null
          sponsor_cost?: number | null
          sponsored?: boolean | null
          sponsorship_tier?: string | null
          start_time?: string | null
          status?: string
          title?: string
          tournament_type?: string | null
          updated_at?: string
          verification_threshold?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_otp: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_queue_entries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_suspicious_stats: {
        Args: { user_id_param: string; stats_data: Json; game_mode?: string }
        Returns: boolean
      }
      generate_otp: {
        Args: {
          p_user_id: string
          p_purpose: string
          p_email?: string
          p_phone?: string
          p_expiry_minutes?: number
        }
        Returns: {
          otp_code: string
          expires_at: string
        }[]
      }
      generate_secure_otp: {
        Args: {
          p_user_id: string
          p_purpose: string
          p_email?: string
          p_phone?: string
        }
        Returns: {
          otp_code: string
          expires_at: string
        }[]
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
      verify_otp: {
        Args: { p_user_id: string; p_otp_code: string; p_purpose: string }
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
