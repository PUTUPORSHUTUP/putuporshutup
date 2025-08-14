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
      admin_metrics_daily: {
        Row: {
          created_at: string
          day: string
          failures: number
          matches_created: number
          payouts_cents: number
          payouts_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          day: string
          failures?: number
          matches_created?: number
          payouts_cents?: number
          payouts_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: string
          failures?: number
          matches_created?: number
          payouts_cents?: number
          payouts_count?: number
          updated_at?: string
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
      api_configurations: {
        Row: {
          config_key: string
          config_value: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          enc_key: string
          id: string
          provider: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          enc_key: string
          id?: string
          provider: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          enc_key?: string
          id?: string
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_verification_stats: {
        Row: {
          automated_verifications: number | null
          cost_savings: number | null
          created_at: string | null
          date: string | null
          game_name: string
          id: string
          manual_verifications: number | null
          revenue_generated: number | null
          updated_at: string | null
          verification_count: number | null
        }
        Insert: {
          automated_verifications?: number | null
          cost_savings?: number | null
          created_at?: string | null
          date?: string | null
          game_name: string
          id?: string
          manual_verifications?: number | null
          revenue_generated?: number | null
          updated_at?: string | null
          verification_count?: number | null
        }
        Update: {
          automated_verifications?: number | null
          cost_savings?: number | null
          created_at?: string | null
          date?: string | null
          game_name?: string
          id?: string
          manual_verifications?: number | null
          revenue_generated?: number | null
          updated_at?: string | null
          verification_count?: number | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      automated_actions: {
        Row: {
          action_data: Json | null
          action_type: string
          automation_type: string
          created_at: string | null
          error_message: string | null
          id: string
          processing_time_ms: number | null
          success: boolean | null
          target_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          automation_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          success?: boolean | null
          target_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          automation_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          success?: boolean | null
          target_id?: string | null
        }
        Relationships: []
      }
      automated_tournaments: {
        Row: {
          auto_created: boolean | null
          automation_schedule: Json
          created_at: string | null
          id: string
          next_execution: string | null
          participant_target: number | null
          revenue_target: number | null
          status: string | null
          tournament_id: string | null
          xbox_server_assigned: boolean | null
        }
        Insert: {
          auto_created?: boolean | null
          automation_schedule: Json
          created_at?: string | null
          id?: string
          next_execution?: string | null
          participant_target?: number | null
          revenue_target?: number | null
          status?: string | null
          tournament_id?: string | null
          xbox_server_assigned?: boolean | null
        }
        Update: {
          auto_created?: boolean | null
          automation_schedule?: Json
          created_at?: string | null
          id?: string
          next_execution?: string | null
          participant_target?: number | null
          revenue_target?: number | null
          status?: string | null
          tournament_id?: string | null
          xbox_server_assigned?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "automated_tournaments_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_config: {
        Row: {
          automation_type: string
          config_data: Json
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          run_frequency_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          automation_type: string
          config_data?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_frequency_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          automation_type?: string
          config_data?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_frequency_minutes?: number | null
          updated_at?: string | null
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
          max_skill_rating: number | null
          min_skill_rating: number | null
          override_reason: string | null
          platform: string
          result_proof_url: string | null
          settled_at: string | null
          settlement_attempts: number | null
          skill_tier_restriction:
            | Database["public"]["Enums"]["skill_tier"][]
            | null
          stake_amount: number
          start_time: string | null
          stat_criteria: Json | null
          status: string | null
          team_size: number | null
          tier_locked: boolean | null
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
          max_skill_rating?: number | null
          min_skill_rating?: number | null
          override_reason?: string | null
          platform: string
          result_proof_url?: string | null
          settled_at?: string | null
          settlement_attempts?: number | null
          skill_tier_restriction?:
            | Database["public"]["Enums"]["skill_tier"][]
            | null
          stake_amount: number
          start_time?: string | null
          stat_criteria?: Json | null
          status?: string | null
          team_size?: number | null
          tier_locked?: boolean | null
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
          max_skill_rating?: number | null
          min_skill_rating?: number | null
          override_reason?: string | null
          platform?: string
          result_proof_url?: string | null
          settled_at?: string | null
          settlement_attempts?: number | null
          skill_tier_restriction?:
            | Database["public"]["Enums"]["skill_tier"][]
            | null
          stake_amount?: number
          start_time?: string | null
          stat_criteria?: Json | null
          status?: string | null
          team_size?: number | null
          tier_locked?: boolean | null
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
      demo_matches: {
        Row: {
          created_at: string
          ends_at: string | null
          game: string
          id: string
          mode: string
          platform: string
          starts_at: string
          state: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          game?: string
          id?: string
          mode?: string
          platform?: string
          starts_at: string
          state?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          game?: string
          id?: string
          mode?: string
          platform?: string
          starts_at?: string
          state?: string
        }
        Relationships: []
      }
      demo_participants: {
        Row: {
          id: string
          joined_at: string
          match_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          match_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          match_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "demo_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_response: string | null
          archived: boolean
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
          archived?: boolean
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
          archived?: boolean
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
      dynamic_pricing_rules: {
        Row: {
          base_price: number
          created_at: string | null
          current_price: number | null
          demand_multiplier: number | null
          game_id: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          max_price: number | null
          min_price: number | null
          supply_multiplier: number | null
        }
        Insert: {
          base_price?: number
          created_at?: string | null
          current_price?: number | null
          demand_multiplier?: number | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          max_price?: number | null
          min_price?: number | null
          supply_multiplier?: number | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          current_price?: number | null
          demand_multiplier?: number | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          max_price?: number | null
          min_price?: number | null
          supply_multiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_pricing_rules_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
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
      fraud_flags: {
        Row: {
          created_at: string | null
          details: Json | null
          flag: Database["public"]["Enums"]["fraud_flag_type"]
          id: string
          result_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          flag: Database["public"]["Enums"]["fraud_flag_type"]
          id?: string
          result_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          flag?: Database["public"]["Enums"]["fraud_flag_type"]
          id?: string
          result_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_flags_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "fraud_match_results"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_match_results: {
        Row: {
          created_at: string | null
          entry_fee_cents: number
          game: string
          id: string
          loser: string
          mode: string
          screenshot_hash: string | null
          winner: string
        }
        Insert: {
          created_at?: string | null
          entry_fee_cents: number
          game: string
          id?: string
          loser: string
          mode: string
          screenshot_hash?: string | null
          winner: string
        }
        Update: {
          created_at?: string | null
          entry_fee_cents?: number
          game?: string
          id?: string
          loser?: string
          mode?: string
          screenshot_hash?: string | null
          winner?: string
        }
        Relationships: []
      }
      fraud_patterns: {
        Row: {
          auto_action: string | null
          created_at: string | null
          detection_criteria: Json
          id: string
          is_active: boolean | null
          pattern_name: string
          pattern_type: string
          severity_level: string | null
        }
        Insert: {
          auto_action?: string | null
          created_at?: string | null
          detection_criteria: Json
          id?: string
          is_active?: boolean | null
          pattern_name: string
          pattern_type: string
          severity_level?: string | null
        }
        Update: {
          auto_action?: string | null
          created_at?: string | null
          detection_criteria?: Json
          id?: string
          is_active?: boolean | null
          pattern_name?: string
          pattern_type?: string
          severity_level?: string | null
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
      function_errors: {
        Row: {
          created_at: string | null
          error_code: number | null
          error_message: string | null
          function_name: string
          id: number
          request_headers: Json | null
        }
        Insert: {
          created_at?: string | null
          error_code?: number | null
          error_message?: string | null
          function_name: string
          id?: number
          request_headers?: Json | null
        }
        Update: {
          created_at?: string | null
          error_code?: number | null
          error_message?: string | null
          function_name?: string
          id?: number
          request_headers?: Json | null
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
          allowed_proof_types: Json | null
          api_access: boolean
          auto_forfeit_minutes: number | null
          auto_forfeit_timer_minutes: number | null
          automated_score_detection: boolean | null
          challenge_type: string
          created_at: string
          cross_platform_supported: boolean | null
          detailed_notes: string | null
          dispute_handler: boolean | null
          game: string
          game_modes: Json | null
          host_verification_method: string | null
          id: string
          match_type: Json | null
          max_players: number | null
          platforms: string
          proof_method: string
          proof_type: string | null
          requires_host_verification: boolean | null
          result_options: Json | null
          result_submission: boolean | null
          result_types: string[] | null
          setup_guide: string | null
          setup_instructions: string | null
          show_timer: boolean | null
          timeout_failsafe: boolean | null
          trend_score: number | null
          updated_at: string
        }
        Insert: {
          allowed_proof_types?: Json | null
          api_access?: boolean
          auto_forfeit_minutes?: number | null
          auto_forfeit_timer_minutes?: number | null
          automated_score_detection?: boolean | null
          challenge_type: string
          created_at?: string
          cross_platform_supported?: boolean | null
          detailed_notes?: string | null
          dispute_handler?: boolean | null
          game: string
          game_modes?: Json | null
          host_verification_method?: string | null
          id?: string
          match_type?: Json | null
          max_players?: number | null
          platforms: string
          proof_method?: string
          proof_type?: string | null
          requires_host_verification?: boolean | null
          result_options?: Json | null
          result_submission?: boolean | null
          result_types?: string[] | null
          setup_guide?: string | null
          setup_instructions?: string | null
          show_timer?: boolean | null
          timeout_failsafe?: boolean | null
          trend_score?: number | null
          updated_at?: string
        }
        Update: {
          allowed_proof_types?: Json | null
          api_access?: boolean
          auto_forfeit_minutes?: number | null
          auto_forfeit_timer_minutes?: number | null
          automated_score_detection?: boolean | null
          challenge_type?: string
          created_at?: string
          cross_platform_supported?: boolean | null
          detailed_notes?: string | null
          dispute_handler?: boolean | null
          game?: string
          game_modes?: Json | null
          host_verification_method?: string | null
          id?: string
          match_type?: Json | null
          max_players?: number | null
          platforms?: string
          proof_method?: string
          proof_type?: string | null
          requires_host_verification?: boolean | null
          result_options?: Json | null
          result_submission?: boolean | null
          result_types?: string[] | null
          setup_guide?: string | null
          setup_instructions?: string | null
          show_timer?: boolean | null
          timeout_failsafe?: boolean | null
          trend_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      game_modes: {
        Row: {
          created_at: string | null
          display_name: string | null
          enabled: boolean | null
          game_id: string | null
          game_key: string | null
          id: string
          is_active: boolean | null
          max_players: number | null
          min_players: number | null
          mode_description: string | null
          mode_key: string | null
          mode_name: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          enabled?: boolean | null
          game_id?: string | null
          game_key?: string | null
          id?: string
          is_active?: boolean | null
          max_players?: number | null
          min_players?: number | null
          mode_description?: string | null
          mode_key?: string | null
          mode_name?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          enabled?: boolean | null
          game_id?: string | null
          game_key?: string | null
          id?: string
          is_active?: boolean | null
          max_players?: number | null
          min_players?: number | null
          mode_description?: string | null
          mode_key?: string | null
          mode_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_modes_registry"
            columns: ["game_key"]
            isOneToOne: false
            referencedRelation: "game_registry"
            referencedColumns: ["game_key"]
          },
          {
            foreignKeyName: "game_modes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_presence: {
        Row: {
          activity_state: string
          created_at: string
          current_game: string | null
          game_title_id: string | null
          id: string
          is_online: boolean
          last_seen_at: string
          updated_at: string
          user_id: string
          xbox_xuid: string | null
        }
        Insert: {
          activity_state?: string
          created_at?: string
          current_game?: string | null
          game_title_id?: string | null
          id?: string
          is_online?: boolean
          last_seen_at?: string
          updated_at?: string
          user_id: string
          xbox_xuid?: string | null
        }
        Update: {
          activity_state?: string
          created_at?: string
          current_game?: string | null
          game_title_id?: string | null
          id?: string
          is_online?: boolean
          last_seen_at?: string
          updated_at?: string
          user_id?: string
          xbox_xuid?: string | null
        }
        Relationships: []
      }
      game_registry: {
        Row: {
          display_name: string
          enabled: boolean
          game_key: string
        }
        Insert: {
          display_name: string
          enabled?: boolean
          game_key: string
        }
        Update: {
          display_name?: string
          enabled?: boolean
          game_key?: string
        }
        Relationships: []
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
      health_log: {
        Row: {
          created_at: string | null
          db_ok: boolean | null
          details: Json | null
          id: string
          queue_fresh: boolean | null
          rotation_fresh: boolean | null
          status: string
        }
        Insert: {
          created_at?: string | null
          db_ok?: boolean | null
          details?: Json | null
          id?: string
          queue_fresh?: boolean | null
          rotation_fresh?: boolean | null
          status: string
        }
        Update: {
          created_at?: string | null
          db_ok?: boolean | null
          details?: Json | null
          id?: string
          queue_fresh?: boolean | null
          rotation_fresh?: boolean | null
          status?: string
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
      market_engine_errors: {
        Row: {
          created_at: string | null
          environment: Json | null
          error: string
          id: number
          stack: string | null
        }
        Insert: {
          created_at?: string | null
          environment?: Json | null
          error: string
          id?: number
          stack?: string | null
        }
        Update: {
          created_at?: string | null
          environment?: Json | null
          error?: string
          id?: number
          stack?: string | null
        }
        Relationships: []
      }
      market_events: {
        Row: {
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_type: string
          id: number
          match_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_type: string
          id?: number
          match_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_type?: string
          id?: number
          match_id?: string | null
        }
        Relationships: []
      }
      market_match_results: {
        Row: {
          created_at: string
          id: string
          match_id: string
          placement: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          placement: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          placement?: number
          user_id?: string
        }
        Relationships: []
      }
      market_matches: {
        Row: {
          created_at: string
          game_key: string | null
          id: string
          player_a: string | null
          player_b: string | null
          stake_cents: number
          status: string
        }
        Insert: {
          created_at?: string
          game_key?: string | null
          id?: string
          player_a?: string | null
          player_b?: string | null
          stake_cents?: number
          status?: string
        }
        Update: {
          created_at?: string
          game_key?: string | null
          id?: string
          player_a?: string | null
          player_b?: string | null
          stake_cents?: number
          status?: string
        }
        Relationships: []
      }
      market_payouts: {
        Row: {
          amount_cents: number
          created_at: string
          error: string | null
          id: string
          match_id: string
          status: string
          winner_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          error?: string | null
          id?: string
          match_id: string
          status?: string
          winner_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          error?: string | null
          id?: string
          match_id?: string
          status?: string
          winner_id?: string
        }
        Relationships: []
      }
      market_queue: {
        Row: {
          created_at: string
          game_key: string | null
          id: string
          stake_cents: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_key?: string | null
          id?: string
          stake_cents: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_key?: string | null
          id?: string
          stake_cents?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      market_wallet_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          reason: string
          ref_match: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          reason: string
          ref_match?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          reason?: string
          ref_match?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_wallets: {
        Row: {
          balance_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_cycle_state: {
        Row: {
          id: number
          idx: number
          last_created: string | null
        }
        Insert: {
          id?: number
          idx?: number
          last_created?: string | null
        }
        Update: {
          id?: number
          idx?: number
          last_created?: string | null
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
            foreignKeyName: "match_notifications_match_queue_id_fkey"
            columns: ["match_queue_id"]
            isOneToOne: false
            referencedRelation: "v_joinable_matches"
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
          avoid_pros: boolean | null
          created_at: string
          id: string
          max_queue_time_minutes: number
          max_skill_gap: number | null
          max_stake: number
          min_stake: number
          preferred_challenge_types: string[] | null
          preferred_games: string[]
          preferred_platforms: string[]
          preferred_tiers: Database["public"]["Enums"]["skill_tier"][] | null
          skill_matching_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_match_enabled?: boolean
          avoid_pros?: boolean | null
          created_at?: string
          id?: string
          max_queue_time_minutes?: number
          max_skill_gap?: number | null
          max_stake?: number
          min_stake?: number
          preferred_challenge_types?: string[] | null
          preferred_games?: string[]
          preferred_platforms?: string[]
          preferred_tiers?: Database["public"]["Enums"]["skill_tier"][] | null
          skill_matching_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_match_enabled?: boolean
          avoid_pros?: boolean | null
          created_at?: string
          id?: string
          max_queue_time_minutes?: number
          max_skill_gap?: number | null
          max_stake?: number
          min_stake?: number
          preferred_challenge_types?: string[] | null
          preferred_games?: string[]
          preferred_platforms?: string[]
          preferred_tiers?: Database["public"]["Enums"]["skill_tier"][] | null
          skill_matching_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_queue: {
        Row: {
          automated: boolean | null
          entry_fee: number | null
          expires_at: string
          game_id: string
          game_mode_key: string | null
          id: string
          matched_at: string | null
          matched_with_user_id: string | null
          payout_type: string | null
          platform: string
          queue_status: string
          queued_at: string
          stake_amount: number
          user_id: string
          vip_required: boolean | null
          wager_id: string | null
        }
        Insert: {
          automated?: boolean | null
          entry_fee?: number | null
          expires_at: string
          game_id: string
          game_mode_key?: string | null
          id?: string
          matched_at?: string | null
          matched_with_user_id?: string | null
          payout_type?: string | null
          platform: string
          queue_status?: string
          queued_at?: string
          stake_amount: number
          user_id: string
          vip_required?: boolean | null
          wager_id?: string | null
        }
        Update: {
          automated?: boolean | null
          entry_fee?: number | null
          expires_at?: string
          game_id?: string
          game_mode_key?: string | null
          id?: string
          matched_at?: string | null
          matched_with_user_id?: string | null
          payout_type?: string | null
          platform?: string
          queue_status?: string
          queued_at?: string
          stake_amount?: number
          user_id?: string
          vip_required?: boolean | null
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
      match_results: {
        Row: {
          assists: number | null
          created_at: string | null
          damage_dealt: number | null
          deaths: number | null
          id: string
          kills: number | null
          match_id: string
          placement: number
          player_id: string
          score: number | null
        }
        Insert: {
          assists?: number | null
          created_at?: string | null
          damage_dealt?: number | null
          deaths?: number | null
          id?: string
          kills?: number | null
          match_id: string
          placement: number
          player_id: string
          score?: number | null
        }
        Update: {
          assists?: number | null
          created_at?: string | null
          damage_dealt?: number | null
          deaths?: number | null
          id?: string
          kills?: number | null
          match_id?: string
          placement?: number
          player_id?: string
          score?: number | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          game_key: string
          game_mode_key: string | null
          id: string
          player_a: string
          player_b: string
          stake_cents: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_key: string
          game_mode_key?: string | null
          id?: string
          player_a: string
          player_b: string
          stake_cents: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_key?: string
          game_mode_key?: string | null
          id?: string
          player_a?: string
          player_b?: string
          stake_cents?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
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
      passive_income_metrics: {
        Row: {
          automation_efficiency_score: number | null
          created_at: string | null
          date: string | null
          hourly_revenue: number | null
          id: string
          matches_facilitated: number | null
          total_daily_revenue: number | null
          tournaments_created: number | null
          xbox_uptime_hours: number | null
        }
        Insert: {
          automation_efficiency_score?: number | null
          created_at?: string | null
          date?: string | null
          hourly_revenue?: number | null
          id?: string
          matches_facilitated?: number | null
          total_daily_revenue?: number | null
          tournaments_created?: number | null
          xbox_uptime_hours?: number | null
        }
        Update: {
          automation_efficiency_score?: number | null
          created_at?: string | null
          date?: string | null
          hourly_revenue?: number | null
          id?: string
          matches_facilitated?: number | null
          total_daily_revenue?: number | null
          tournaments_created?: number | null
          xbox_uptime_hours?: number | null
        }
        Relationships: []
      }
      payout_automation_log: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          event_type: string
          id: string
          payout_amount: number | null
          processed_at: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          event_type: string
          id?: string
          payout_amount?: number | null
          processed_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payout_amount?: number | null
          processed_at?: string | null
          status?: string
          winner_id?: string | null
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
      platform_revenue: {
        Row: {
          amount: number
          automated: boolean | null
          created_at: string | null
          fee_percentage: number | null
          id: string
          original_amount: number | null
          processing_status: string | null
          revenue_type: string
          source_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          automated?: boolean | null
          created_at?: string | null
          fee_percentage?: number | null
          id?: string
          original_amount?: number | null
          processing_status?: string | null
          revenue_type: string
          source_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          automated?: boolean | null
          created_at?: string | null
          fee_percentage?: number | null
          id?: string
          original_amount?: number | null
          processing_status?: string | null
          revenue_type?: string
          source_id?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      player_skill_ratings: {
        Row: {
          average_kd: number | null
          created_at: string
          game_id: string
          id: string
          last_match_at: string | null
          losses: number
          matches_played: number
          skill_rating: number
          skill_tier: Database["public"]["Enums"]["skill_tier"]
          tier_locked_until: string | null
          updated_at: string
          user_id: string
          verified_stats: boolean | null
          win_rate: number | null
          wins: number
        }
        Insert: {
          average_kd?: number | null
          created_at?: string
          game_id: string
          id?: string
          last_match_at?: string | null
          losses?: number
          matches_played?: number
          skill_rating?: number
          skill_tier?: Database["public"]["Enums"]["skill_tier"]
          tier_locked_until?: string | null
          updated_at?: string
          user_id: string
          verified_stats?: boolean | null
          win_rate?: number | null
          wins?: number
        }
        Update: {
          average_kd?: number | null
          created_at?: string
          game_id?: string
          id?: string
          last_match_at?: string | null
          losses?: number
          matches_played?: number
          skill_rating?: number
          skill_tier?: Database["public"]["Enums"]["skill_tier"]
          tier_locked_until?: string | null
          updated_at?: string
          user_id?: string
          verified_stats?: boolean | null
          win_rate?: number | null
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_skill_ratings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_skill_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      player_stats: {
        Row: {
          challenge_id: string | null
          created_at: string
          game_name: string
          id: string
          match_date: string
          platform: string
          stats_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string
          game_name: string
          id?: string
          match_date?: string
          platform: string
          stats_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          created_at?: string
          game_name?: string
          id?: string
          match_date?: string
          platform?: string
          stats_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      posters: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          event_type: string | null
          featured: boolean
          id: string
          image_url: string
          is_active: boolean
          is_archived: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_type?: string | null
          featured?: boolean
          id?: string
          image_url: string
          is_active?: boolean
          is_archived?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_type?: string | null
          featured?: boolean
          id?: string
          image_url?: string
          is_active?: boolean
          is_archived?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_automation: {
        Row: {
          auto_adjust: boolean | null
          base_entry_fee: number | null
          created_at: string | null
          current_price: number | null
          demand_factor: number | null
          game_id: string | null
          id: string
          last_adjustment: string | null
          peak_multiplier: number | null
        }
        Insert: {
          auto_adjust?: boolean | null
          base_entry_fee?: number | null
          created_at?: string | null
          current_price?: number | null
          demand_factor?: number | null
          game_id?: string | null
          id?: string
          last_adjustment?: string | null
          peak_multiplier?: number | null
        }
        Update: {
          auto_adjust?: boolean | null
          base_entry_fee?: number | null
          created_at?: string | null
          current_price?: number | null
          demand_factor?: number | null
          game_id?: string | null
          id?: string
          last_adjustment?: string | null
          peak_multiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_automation_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
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
          is_test: boolean | null
          is_test_account: boolean | null
          is_test_user: boolean | null
          is_vip: boolean | null
          is_vip_trial: boolean | null
          last_ip: unknown | null
          last_used: string | null
          payoneer_email: string | null
          premium_expires_at: string | null
          total_losses: number | null
          total_wagered: number | null
          total_wins: number | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          vip_access: boolean | null
          vip_expires: string | null
          vip_trial_start: string | null
          wallet_balance: number
          xbox_gamer_score: number | null
          xbox_gamertag: string | null
          xbox_linked_at: string | null
          xbox_profile_picture: string | null
          xbox_xuid: string | null
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
          is_test?: boolean | null
          is_test_account?: boolean | null
          is_test_user?: boolean | null
          is_vip?: boolean | null
          is_vip_trial?: boolean | null
          last_ip?: unknown | null
          last_used?: string | null
          payoneer_email?: string | null
          premium_expires_at?: string | null
          total_losses?: number | null
          total_wagered?: number | null
          total_wins?: number | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          vip_access?: boolean | null
          vip_expires?: string | null
          vip_trial_start?: string | null
          wallet_balance?: number
          xbox_gamer_score?: number | null
          xbox_gamertag?: string | null
          xbox_linked_at?: string | null
          xbox_profile_picture?: string | null
          xbox_xuid?: string | null
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
          is_test?: boolean | null
          is_test_account?: boolean | null
          is_test_user?: boolean | null
          is_vip?: boolean | null
          is_vip_trial?: boolean | null
          last_ip?: unknown | null
          last_used?: string | null
          payoneer_email?: string | null
          premium_expires_at?: string | null
          total_losses?: number | null
          total_wagered?: number | null
          total_wins?: number | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          vip_access?: boolean | null
          vip_expires?: string | null
          vip_trial_start?: string | null
          wallet_balance?: number
          xbox_gamer_score?: number | null
          xbox_gamertag?: string | null
          xbox_linked_at?: string | null
          xbox_profile_picture?: string | null
          xbox_xuid?: string | null
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
      revenue_automation: {
        Row: {
          automation_type: string
          created_at: string | null
          current_revenue_rate: number | null
          id: string
          is_active: boolean | null
          optimization_rules: Json | null
          target_revenue_per_hour: number | null
          updated_at: string | null
        }
        Insert: {
          automation_type: string
          created_at?: string | null
          current_revenue_rate?: number | null
          id?: string
          is_active?: boolean | null
          optimization_rules?: Json | null
          target_revenue_per_hour?: number | null
          updated_at?: string | null
        }
        Update: {
          automation_type?: string
          created_at?: string | null
          current_revenue_rate?: number | null
          id?: string
          is_active?: boolean | null
          optimization_rules?: Json | null
          target_revenue_per_hour?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          breach_check: boolean
          fraud_detection: boolean
          id: number
          lockout_duration_minutes: number
          max_login_attempts: number
          otp_expiry_minutes: number
          updated_at: string
        }
        Insert: {
          breach_check?: boolean
          fraud_detection?: boolean
          id?: number
          lockout_duration_minutes?: number
          max_login_attempts?: number
          otp_expiry_minutes?: number
          updated_at?: string
        }
        Update: {
          breach_check?: boolean
          fraud_detection?: boolean
          id?: number
          lockout_duration_minutes?: number
          max_login_attempts?: number
          otp_expiry_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      security_settings_audit: {
        Row: {
          after_json: Json | null
          before_json: Json | null
          changed_at: string
          changed_by: string | null
          id: number
        }
        Insert: {
          after_json?: Json | null
          before_json?: Json | null
          changed_at?: string
          changed_by?: string | null
          id?: number
        }
        Update: {
          after_json?: Json | null
          before_json?: Json | null
          changed_at?: string
          changed_by?: string | null
          id?: number
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
      simulation_errors: {
        Row: {
          env: Json | null
          error: string
          id: number
          stack: string | null
          timestamp: string | null
        }
        Insert: {
          env?: Json | null
          error: string
          id?: number
          stack?: string | null
          timestamp?: string | null
        }
        Update: {
          env?: Json | null
          error?: string
          id?: number
          stack?: string | null
          timestamp?: string | null
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
      soft_launch_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number
          recorded_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      sponsor_logos: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          logo_url: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          logo_url: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          logo_url?: string
          name?: string
        }
        Relationships: []
      }
      sponsor_performance: {
        Row: {
          clicks_to_site: number | null
          hashtag_uses: number | null
          id: string
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
          id?: string
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
          id?: string
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
      sponsored_tournaments: {
        Row: {
          created_at: string
          description: string | null
          entry_fee: number
          game_id: string | null
          id: string
          max_participants: number
          platform: string
          prize_pool: number
          scheduled_date: string
          sponsor_name: string
          status: string
          title: string
          tournament_id: string | null
          tournament_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_fee?: number
          game_id?: string | null
          id?: string
          max_participants?: number
          platform?: string
          prize_pool?: number
          scheduled_date: string
          sponsor_name?: string
          status?: string
          title: string
          tournament_id?: string | null
          tournament_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_fee?: number
          game_id?: string | null
          id?: string
          max_participants?: number
          platform?: string
          prize_pool?: number
          scheduled_date?: string
          sponsor_name?: string
          status?: string
          title?: string
          tournament_id?: string | null
          tournament_type?: string
          updated_at?: string
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
      subscription_revenue: {
        Row: {
          amount: number
          billing_period: string
          created_at: string | null
          id: string
          next_billing_date: string | null
          status: string | null
          stripe_subscription_id: string | null
          subscription_tier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          billing_period: string
          created_at?: string | null
          id?: string
          next_billing_date?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          subscription_tier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          billing_period?: string
          created_at?: string | null
          id?: string
          next_billing_date?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string
          updated_at?: string | null
          user_id?: string | null
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
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          metric_value: number | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          threshold_value: number | null
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metric_value?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
          threshold_value?: number | null
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metric_value?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          threshold_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tier_protection_rules: {
        Row: {
          created_at: string
          game_id: string
          id: string
          max_entry_fee: number
          max_rating_difference: number
          min_matches_required: number
          protected: boolean
          tier: Database["public"]["Enums"]["skill_tier"]
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          max_entry_fee: number
          max_rating_difference?: number
          min_matches_required?: number
          protected?: boolean
          tier: Database["public"]["Enums"]["skill_tier"]
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          max_entry_fee?: number
          max_rating_difference?: number
          min_matches_required?: number
          protected?: boolean
          tier?: Database["public"]["Enums"]["skill_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "tier_protection_rules_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_announcements: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          entry_fee: number
          game_id: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          max_participants: number
          platform: string
          prize_details: string | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          entry_fee?: number
          game_id?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          max_participants?: number
          platform: string
          prize_details?: string | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          entry_fee?: number
          game_id?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          max_participants?: number
          platform?: string
          prize_details?: string | null
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_entries: {
        Row: {
          created_at: string
          email: string
          gamertag: string
          id: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          gamertag: string
          id?: string
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          gamertag?: string
          id?: string
          tournament_id?: string
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
      tournament_posters: {
        Row: {
          cover_art_url: string
          created_at: string
          episode_number: number
          id: string
          mint_timestamp: string
          poster_title: string
          rarity_level: string | null
          season_number: number
          series_name: string
          tournament_id: string
        }
        Insert: {
          cover_art_url: string
          created_at?: string
          episode_number: number
          id?: string
          mint_timestamp?: string
          poster_title: string
          rarity_level?: string | null
          season_number: number
          series_name: string
          tournament_id: string
        }
        Update: {
          cover_art_url?: string
          created_at?: string
          episode_number?: number
          id?: string
          mint_timestamp?: string
          poster_title?: string
          rarity_level?: string | null
          season_number?: number
          series_name?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_posters_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          created_at: string
          id: string
          payment_status: string
          registered_at: string
          skill_rating: number | null
          stake_paid: number | null
          status: string
          team_name: string | null
          tournament_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_status?: string
          registered_at?: string
          skill_rating?: number | null
          stake_paid?: number | null
          status?: string
          team_name?: string | null
          tournament_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_status?: string
          registered_at?: string
          skill_rating?: number | null
          stake_paid?: number | null
          status?: string
          team_name?: string | null
          tournament_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tournament_templates: {
        Row: {
          collectible_series: string | null
          cover_art_url: string | null
          created_at: string | null
          entry_fee: number | null
          game_id: string | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          poster_title_template: string | null
          prize_distribution: Json | null
          schedule_cron: string
          template_name: string
          title_variations: Json | null
          tournament_settings: Json | null
        }
        Insert: {
          collectible_series?: string | null
          cover_art_url?: string | null
          created_at?: string | null
          entry_fee?: number | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          poster_title_template?: string | null
          prize_distribution?: Json | null
          schedule_cron: string
          template_name: string
          title_variations?: Json | null
          tournament_settings?: Json | null
        }
        Update: {
          collectible_series?: string | null
          cover_art_url?: string | null
          created_at?: string | null
          entry_fee?: number | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          poster_title_template?: string | null
          prize_distribution?: Json | null
          schedule_cron?: string
          template_name?: string
          title_variations?: Json | null
          tournament_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_templates_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          auto_verification: boolean | null
          collectible_series: string | null
          cover_art_url: string | null
          created_at: string
          created_by_automation: boolean | null
          creator_id: string
          current_participants: number | null
          custom_rules: string | null
          description: string | null
          entry_fee: number
          episode_number: number | null
          game_id: string
          id: string
          max_participants: number
          platform: string
          poster_title: string | null
          prize_pool: number | null
          proof_required: boolean | null
          registration_closes_at: string | null
          registration_opens_at: string | null
          season_number: number | null
          sponsor_cost: number | null
          sponsored: boolean | null
          sponsorship_tier: string | null
          start_time: string | null
          status: string
          title: string
          tournament_status: string | null
          tournament_type: string | null
          updated_at: string
          verification_threshold: number | null
          winner_id: string | null
        }
        Insert: {
          auto_verification?: boolean | null
          collectible_series?: string | null
          cover_art_url?: string | null
          created_at?: string
          created_by_automation?: boolean | null
          creator_id: string
          current_participants?: number | null
          custom_rules?: string | null
          description?: string | null
          entry_fee: number
          episode_number?: number | null
          game_id: string
          id?: string
          max_participants: number
          platform: string
          poster_title?: string | null
          prize_pool?: number | null
          proof_required?: boolean | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          season_number?: number | null
          sponsor_cost?: number | null
          sponsored?: boolean | null
          sponsorship_tier?: string | null
          start_time?: string | null
          status?: string
          title: string
          tournament_status?: string | null
          tournament_type?: string | null
          updated_at?: string
          verification_threshold?: number | null
          winner_id?: string | null
        }
        Update: {
          auto_verification?: boolean | null
          collectible_series?: string | null
          cover_art_url?: string | null
          created_at?: string
          created_by_automation?: boolean | null
          creator_id?: string
          current_participants?: number | null
          custom_rules?: string | null
          description?: string | null
          entry_fee?: number
          episode_number?: number | null
          game_id?: string
          id?: string
          max_participants?: number
          platform?: string
          poster_title?: string | null
          prize_pool?: number | null
          proof_required?: boolean | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          season_number?: number | null
          sponsor_cost?: number | null
          sponsored?: boolean | null
          sponsorship_tier?: string | null
          start_time?: string | null
          status?: string
          title?: string
          tournament_status?: string | null
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          challenge_id: string | null
          created_at: string | null
          id: string
          match_id: string | null
          metadata: Json | null
          reason: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          metadata?: Json | null
          reason: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          metadata?: Json | null
          reason?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_cents: number
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance_cents?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance_cents?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      xbox_api_calls: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          method: string
          rate_limit_remaining: number | null
          rate_limit_reset: string | null
          response_status: number | null
          response_time_ms: number | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          method?: string
          rate_limit_remaining?: number | null
          rate_limit_reset?: string | null
          response_status?: number | null
          response_time_ms?: number | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          rate_limit_remaining?: number | null
          rate_limit_reset?: string | null
          response_status?: number | null
          response_time_ms?: number | null
        }
        Relationships: []
      }
      xbox_automation_status: {
        Row: {
          active_lobbies: number | null
          automation_config: Json | null
          created_at: string | null
          current_lobbies: number | null
          id: string
          is_active: boolean | null
          last_heartbeat: string | null
          last_updated: string | null
          max_lobbies: number | null
          revenue_generated_today: number | null
          revenue_today: number | null
          status: string | null
          updated_at: string | null
          uptime_hours: number | null
          xbox_console_id: string
        }
        Insert: {
          active_lobbies?: number | null
          automation_config?: Json | null
          created_at?: string | null
          current_lobbies?: number | null
          id?: string
          is_active?: boolean | null
          last_heartbeat?: string | null
          last_updated?: string | null
          max_lobbies?: number | null
          revenue_generated_today?: number | null
          revenue_today?: number | null
          status?: string | null
          updated_at?: string | null
          uptime_hours?: number | null
          xbox_console_id: string
        }
        Update: {
          active_lobbies?: number | null
          automation_config?: Json | null
          created_at?: string | null
          current_lobbies?: number | null
          id?: string
          is_active?: boolean | null
          last_heartbeat?: string | null
          last_updated?: string | null
          max_lobbies?: number | null
          revenue_generated_today?: number | null
          revenue_today?: number | null
          status?: string | null
          updated_at?: string | null
          uptime_hours?: number | null
          xbox_console_id?: string
        }
        Relationships: []
      }
      xbox_integration: {
        Row: {
          console_ip: unknown
          enc_api_key: string
          id: number
          status: string
          updated_at: string
        }
        Insert: {
          console_ip: unknown
          enc_api_key: string
          id?: number
          status?: string
          updated_at?: string
        }
        Update: {
          console_ip?: unknown
          enc_api_key?: string
          id?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      xbox_leaderboard_stats: {
        Row: {
          avg_kd_ratio: number | null
          best_winstreak: number
          challenges_won: number
          created_at: string
          current_winstreak: number
          gamertag: string
          id: string
          last_match_at: string | null
          matches_played: number
          skill_rating: number
          tier: string
          total_assists: number
          total_deaths: number
          total_kills: number
          total_score: number
          total_winnings: number
          updated_at: string
          user_id: string | null
          xuid: string
        }
        Insert: {
          avg_kd_ratio?: number | null
          best_winstreak?: number
          challenges_won?: number
          created_at?: string
          current_winstreak?: number
          gamertag: string
          id?: string
          last_match_at?: string | null
          matches_played?: number
          skill_rating?: number
          tier?: string
          total_assists?: number
          total_deaths?: number
          total_kills?: number
          total_score?: number
          total_winnings?: number
          updated_at?: string
          user_id?: string | null
          xuid: string
        }
        Update: {
          avg_kd_ratio?: number | null
          best_winstreak?: number
          challenges_won?: number
          created_at?: string
          current_winstreak?: number
          gamertag?: string
          id?: string
          last_match_at?: string | null
          matches_played?: number
          skill_rating?: number
          tier?: string
          total_assists?: number
          total_deaths?: number
          total_kills?: number
          total_score?: number
          total_winnings?: number
          updated_at?: string
          user_id?: string | null
          xuid?: string
        }
        Relationships: []
      }
      xbox_match_history: {
        Row: {
          assists: number
          challenge_id: string | null
          created_at: string
          deaths: number
          game_mode: string
          id: string
          kills: number
          match_duration: number | null
          match_end_time: string | null
          match_id: string
          match_start_time: string | null
          placement: number | null
          raw_match_data: Json | null
          score: number
          verification_source: string
          verified_at: string
          xuid: string
        }
        Insert: {
          assists?: number
          challenge_id?: string | null
          created_at?: string
          deaths?: number
          game_mode: string
          id?: string
          kills?: number
          match_duration?: number | null
          match_end_time?: string | null
          match_id: string
          match_start_time?: string | null
          placement?: number | null
          raw_match_data?: Json | null
          score?: number
          verification_source?: string
          verified_at?: string
          xuid: string
        }
        Update: {
          assists?: number
          challenge_id?: string | null
          created_at?: string
          deaths?: number
          game_mode?: string
          id?: string
          kills?: number
          match_duration?: number | null
          match_end_time?: string | null
          match_id?: string
          match_start_time?: string | null
          placement?: number | null
          raw_match_data?: Json | null
          score?: number
          verification_source?: string
          verified_at?: string
          xuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "xbox_match_history_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      xbox_verification_queue: {
        Row: {
          attempts: number
          challenge_id: string
          created_at: string
          error_message: string | null
          id: string
          max_attempts: number
          next_retry_at: string | null
          priority: number
          processed_at: string | null
          status: string
          submitted_stats: Json
          user_id: string
          verification_result: Json | null
          xuid: string
        }
        Insert: {
          attempts?: number
          challenge_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          next_retry_at?: string | null
          priority?: number
          processed_at?: string | null
          status?: string
          submitted_stats: Json
          user_id: string
          verification_result?: Json | null
          xuid: string
        }
        Update: {
          attempts?: number
          challenge_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          next_retry_at?: string | null
          priority?: number
          processed_at?: string | null
          status?: string
          submitted_stats?: Json
          user_id?: string
          verification_result?: Json | null
          xuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "xbox_verification_queue_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_joinable_matches: {
        Row: {
          automated: boolean | null
          creator_username: string | null
          entry_fee: number | null
          expires_at: string | null
          game_id: string | null
          game_mode_key: string | null
          game_name: string | null
          id: string | null
          matched_at: string | null
          matched_with_user_id: string | null
          payout_type: string | null
          platform: string | null
          queue_status: string | null
          queued_at: string | null
          stake_amount: number | null
          user_id: string | null
          vip_required: boolean | null
          wager_id: string | null
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
    }
    Functions: {
      admin_event_force_payout: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      admin_event_force_refund: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      admin_kpis_last24: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_metrics_rollup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      api_key_get: {
        Args: { p_provider: string }
        Returns: string
      }
      api_key_put: {
        Args: { p_plain: string; p_provider: string }
        Returns: string
      }
      atomic_market_cycle: {
        Args: {
          crash_rate?: number
          force_no_crash?: boolean
          min_players?: number
        }
        Returns: Json
      }
      atomic_market_cycle_v2: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_function_diagnostics: {
        Args: Record<PropertyKey, never>
        Returns: {
          error_types: string[]
          function_name: string
          last_error_time: string
          recent_errors: number
        }[]
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_max_attempts?: number
          p_time_window_minutes?: number
          p_user_id: string
        }
        Returns: boolean
      }
      check_rls_policy_coverage: {
        Args: Record<PropertyKey, never>
        Returns: {
          needs_attention: boolean
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      cleanup_expired_otp: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_queue_entries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      close_stale_matches: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      db_market_payout_safe: {
        Args: { p_match_id: string; p_pot_cents: number }
        Returns: number
      }
      db_market_run: {
        Args: { p_auto_seed?: boolean; p_mode_key?: string }
        Returns: Json
      }
      db_market_run_prod: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      deploy_emergency_users: {
        Args: { user_count?: number }
        Returns: Json
      }
      detect_suspicious_stats: {
        Args: { game_mode?: string; stats_data: Json; user_id_param: string }
        Returns: boolean
      }
      emergency_rollback: {
        Args: { reason?: string }
        Returns: Json
      }
      flag_multi_account: {
        Args: { p_res: string }
        Returns: undefined
      }
      flag_rapid_rematch: {
        Args: { p_res: string }
        Returns: undefined
      }
      flag_screenshot_reused: {
        Args: { p_res: string }
        Returns: undefined
      }
      flag_win_streak: {
        Args: { p_res: string }
        Returns: undefined
      }
      generate_automated_tournaments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_challenge_results: {
        Args: { challenge_id: string; user_ids: string[] }
        Returns: undefined
      }
      generate_secure_otp: {
        Args: {
          p_email?: string
          p_phone?: string
          p_purpose: string
          p_user_id: string
        }
        Returns: {
          expires_at: string
          otp_code: string
        }[]
      }
      generate_system_alert: {
        Args: {
          p_alert_type: string
          p_message: string
          p_metadata?: Json
          p_severity: string
        }
        Returns: string
      }
      get_admin_analytics: {
        Args: { hide_test_data?: boolean }
        Returns: {
          active_premium_users: number
          new_users_this_week: number
          total_challenges: number
          total_deposits: number
          total_tournaments: number
          total_users: number
          total_withdrawals: number
          tournaments_this_week: number
          transactions_today: number
        }[]
      }
      get_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_auth_diagnostics: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          error_message: string
          error_time: string
          event_type: string
          match_id: string
          status: string
        }[]
      }
      get_available_test_users: {
        Args: { max_users?: number; min_balance?: number }
        Returns: {
          user_id: string
          wallet_balance: number
        }[]
      }
      get_payout_guard: {
        Args: Record<PropertyKey, never>
        Returns: {
          challenge_id: string
          error_message: string
          participant_count: number
          payout_amount: number
          payout_status: string
          processed_at: string
          settled_at: string
          settlement_attempts: number
          status: string
          total_pot: number
          winner_id: string
        }[]
      }
      get_platform_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_test_user_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          last_used: string
          status: string
          username: string
          wallet_balance: number
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
          visits_this_week: number
          visits_today: number
        }[]
      }
      get_xbox_profile: {
        Args: { gamertag: string }
        Returns: {
          gamer_score: number
          last_played: string
          xuid: string
        }[]
      }
      has_vip_access: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      has_vip_access_v2: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_wallet_balance: {
        Args:
          | {
              amount_param: number
              challenge_id_param?: string
              match_id_param?: string
              reason_param?: string
              user_id_param: string
            }
          | { amount_param: number; user_id_param: string }
        Returns: undefined
      }
      ingest_results: {
        Args: { p_match_id: string; p_mode_key: string }
        Returns: undefined
      }
      ingest_results_apex: {
        Args: { p_match_id: string; p_mode_key: string }
        Returns: undefined
      }
      ingest_results_cod6: {
        Args: { p_match_id: string; p_mode_key: string }
        Returns: undefined
      }
      ingest_results_fn: {
        Args: { p_match_id: string; p_mode_key: string }
        Returns: undefined
      }
      ingest_results_rl: {
        Args: { p_match_id: string; p_mode_key: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_service_role: {
        Args: Record<PropertyKey, never>
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
      join_challenge_atomic: {
        Args: {
          p_challenge_id: string
          p_stake_amount: number
          p_user_id: string
        }
        Returns: undefined
      }
      live_events_list_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          ends_at: string
          entry_fee_cents: number
          id: string
          max_players: number
          mode_key: string
          mode_label: string
          payout_label: string
          players: number
          prize_pool_cents: number
          public_url: string
          starts_at: string
          status: string
          title: string
        }[]
      }
      live_events_list_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          ends_at: string
          entry_fee_cents: number
          id: string
          max_players: number
          mode_key: string
          mode_label: string
          payout_label: string
          players: number
          prize_pool_cents: number
          public_url: string
          starts_at: string
          status: string
          title: string
        }[]
      }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_target_user_id?: string
        }
        Returns: undefined
      }
      log_event: {
        Args: { details: string; event_type: string }
        Returns: undefined
      }
      log_function_error: {
        Args: {
          error_code?: number
          error_message?: string
          function_name: string
          request_headers?: Json
        }
        Returns: undefined
      }
      log_market_event: {
        Args: { details?: Json; event_type: string; match_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: { p_details?: Json; p_event_type: string; p_user_id?: string }
        Returns: undefined
      }
      log_security_violation: {
        Args: { p_details?: Json; p_user_id?: string; p_violation_type: string }
        Returns: undefined
      }
      manage_test_users: {
        Args: { action: string; username?: string; wallet_balance?: number }
        Returns: Json
      }
      manual_payout: {
        Args: { admin_override?: boolean; match_id: string }
        Returns: Json
      }
      mark_challenge_settled: {
        Args: { p_challenge_id: string }
        Returns: boolean
      }
      market_payout_safe: {
        Args: { p_match_id: string; p_total_pot_cents: number }
        Returns: number
      }
      market_wallet_credit: {
        Args: {
          p_amount_cents: number
          p_reason: string
          p_ref_match: string
          p_user_id: string
        }
        Returns: undefined
      }
      queue_test_players: {
        Args: { p_count?: number; p_mode_key?: string }
        Returns: Json
      }
      refund_all_challenge_players: {
        Args: { challenge_id: string; reason: string }
        Returns: {
          refund_amount: number
          user_id: string
        }[]
      }
      safe_nextval: {
        Args: { sequence_name: string }
        Returns: number
      }
      schedule_otp_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      secure_increment_wallet_balance: {
        Args: {
          p_amount: number
          p_challenge_id?: string
          p_reason?: string
          p_requires_admin?: boolean
          p_user_id: string
        }
        Returns: Json
      }
      secure_join_challenge_atomic: {
        Args: {
          p_challenge_id: string
          p_stake_amount: number
          p_user_id: string
        }
        Returns: Json
      }
      secure_settle_challenge: {
        Args: { p_challenge_id: string }
        Returns: boolean
      }
      secure_update_transaction_status: {
        Args: { p_new_status: string; p_transaction_id: string }
        Returns: undefined
      }
      security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          severity: string
          status: string
        }[]
      }
      security_settings_get: {
        Args: Record<PropertyKey, never>
        Returns: {
          breach_check: boolean
          fraud_detection: boolean
          id: number
          lockout_duration_minutes: number
          max_login_attempts: number
          otp_expiry_minutes: number
          updated_at: string
        }
      }
      security_settings_save: {
        Args: {
          p_breach: boolean
          p_fraud: boolean
          p_lockout: number
          p_max_attempts: number
          p_otp: number
        }
        Returns: {
          breach_check: boolean
          fraud_detection: boolean
          id: number
          lockout_duration_minutes: number
          max_login_attempts: number
          otp_expiry_minutes: number
          updated_at: string
        }
      }
      settle_challenge_payouts: {
        Args: { challenge_id: string }
        Returns: undefined
      }
      setup_test_profiles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      start_vip_trial: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      start_vip_trial_v2: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_xbox_leaderboard_stats: {
        Args: {
          p_assists: number
          p_deaths: number
          p_kills: number
          p_score: number
          p_winnings?: number
          p_won_challenge?: boolean
          p_xuid: string
        }
        Returns: undefined
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      verify_otp: {
        Args: { p_otp_code: string; p_purpose: string; p_user_id: string }
        Returns: boolean
      }
      wallet_debit_safe: {
        Args: {
          p_amount: number
          p_match: string
          p_reason: string
          p_user: string
        }
        Returns: undefined
      }
      weekly_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      xbox_configure: {
        Args: { p_api_key: string; p_console_ip: string }
        Returns: Json
      }
    }
    Enums: {
      fraud_flag_type:
        | "WIN_STREAK"
        | "RAPID_REMATCH"
        | "SCREENSHOT_REUSED"
        | "MULTI_ACCOUNT"
      skill_tier:
        | "novice"
        | "amateur"
        | "intermediate"
        | "advanced"
        | "expert"
        | "pro"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      fraud_flag_type: [
        "WIN_STREAK",
        "RAPID_REMATCH",
        "SCREENSHOT_REUSED",
        "MULTI_ACCOUNT",
      ],
      skill_tier: [
        "novice",
        "amateur",
        "intermediate",
        "advanced",
        "expert",
        "pro",
      ],
    },
  },
} as const
