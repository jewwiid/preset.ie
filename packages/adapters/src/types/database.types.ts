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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      age_verification_logs: {
        Row: {
          created_at: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string
          verification_data: Json | null
          verification_method: string
          verification_type: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success: boolean
          user_agent?: string | null
          user_id: string
          verification_data?: Json | null
          verification_method: string
          verification_type: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
          verification_data?: Json | null
          verification_method?: string
          verification_type?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      api_providers: {
        Row: {
          api_key_encrypted: string
          base_url: string
          cost_per_request: number
          created_at: string | null
          health_check_url: string | null
          id: string
          is_active: boolean | null
          last_health_check: string | null
          name: string
          priority: number | null
          rate_limit_per_minute: number | null
          success_rate_24h: number | null
        }
        Insert: {
          api_key_encrypted: string
          base_url: string
          cost_per_request: number
          created_at?: string | null
          health_check_url?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          name: string
          priority?: number | null
          rate_limit_per_minute?: number | null
          success_rate_24h?: number | null
        }
        Update: {
          api_key_encrypted?: string
          base_url?: string
          cost_per_request?: number
          created_at?: string | null
          health_check_url?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          name?: string
          priority?: number | null
          rate_limit_per_minute?: number | null
          success_rate_24h?: number | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          applicant_user_id: string
          applied_at: string | null
          gig_id: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          updated_at: string | null
        }
        Insert: {
          applicant_user_id: string
          applied_at?: string | null
          gig_id: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
        }
        Update: {
          applicant_user_id?: string
          applied_at?: string | null
          gig_id?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_user_id_fkey"
            columns: ["applicant_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      aspect_ratios: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          background_color: string | null
          category: Database["public"]["Enums"]["badge_category"]
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_automatic: boolean | null
          name: string
          points: number | null
          rarity: string | null
          requires_approval: boolean | null
          slug: string
          type: Database["public"]["Enums"]["badge_type"]
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          category: Database["public"]["Enums"]["badge_category"]
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_automatic?: boolean | null
          name: string
          points?: number | null
          rarity?: string | null
          requires_approval?: boolean | null
          slug: string
          type: Database["public"]["Enums"]["badge_type"]
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          category?: Database["public"]["Enums"]["badge_category"]
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_automatic?: boolean | null
          name?: string
          points?: number | null
          rarity?: string | null
          requires_approval?: boolean | null
          slug?: string
          type?: Database["public"]["Enums"]["badge_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_angles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      camera_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      cinematic_presets: {
        Row: {
          category: string
          created_at: string | null
          description: string
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          parameters: Json
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          parameters: Json
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          parameters?: Json
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      collab_applications: {
        Row: {
          applicant_id: string
          application_type: string
          created_at: string | null
          id: string
          message: string | null
          portfolio_url: string | null
          project_id: string
          role_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_id: string
          application_type: string
          created_at?: string | null
          id?: string
          message?: string | null
          portfolio_url?: string | null
          project_id: string
          role_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string
          application_type?: string
          created_at?: string | null
          id?: string
          message?: string | null
          portfolio_url?: string | null
          project_id?: string
          role_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_applications_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "collab_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_gear_offers: {
        Row: {
          created_at: string | null
          daily_rate_cents: number | null
          gear_request_id: string | null
          id: string
          listing_id: string | null
          message: string | null
          offer_type: string
          offerer_id: string
          project_id: string
          status: string | null
          total_price_cents: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_rate_cents?: number | null
          gear_request_id?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          offer_type: string
          offerer_id: string
          project_id: string
          status?: string | null
          total_price_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_rate_cents?: number | null
          gear_request_id?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          offer_type?: string
          offerer_id?: string
          project_id?: string
          status?: string | null
          total_price_cents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_gear_offers_gear_request_id_fkey"
            columns: ["gear_request_id"]
            isOneToOne: false
            referencedRelation: "collab_gear_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_gear_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_gear_offers_offerer_id_fkey"
            columns: ["offerer_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_gear_offers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_gear_requests: {
        Row: {
          borrow_preferred: boolean | null
          category: string
          created_at: string | null
          equipment_spec: string | null
          id: string
          max_daily_rate_cents: number | null
          project_id: string
          quantity: number | null
          retainer_acceptable: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          borrow_preferred?: boolean | null
          category: string
          created_at?: string | null
          equipment_spec?: string | null
          id?: string
          max_daily_rate_cents?: number | null
          project_id: string
          quantity?: number | null
          retainer_acceptable?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          borrow_preferred?: boolean | null
          category?: string
          created_at?: string | null
          equipment_spec?: string | null
          id?: string
          max_daily_rate_cents?: number | null
          project_id?: string
          quantity?: number | null
          retainer_acceptable?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_gear_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_participants: {
        Row: {
          id: string
          joined_at: string | null
          project_id: string
          role_id: string | null
          role_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          project_id: string
          role_id?: string | null
          role_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          project_id?: string
          role_id?: string | null
          role_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_participants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_participants_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "collab_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_projects: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          end_date: string | null
          id: string
          moodboard_id: string | null
          start_date: string | null
          status: string | null
          synopsis: string | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          moodboard_id?: string | null
          start_date?: string | null
          status?: string | null
          synopsis?: string | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          moodboard_id?: string | null
          start_date?: string | null
          status?: string | null
          synopsis?: string | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_projects_moodboard_id_fkey"
            columns: ["moodboard_id"]
            isOneToOne: false
            referencedRelation: "moodboards"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_roles: {
        Row: {
          compensation_details: string | null
          created_at: string | null
          headcount: number | null
          id: string
          is_paid: boolean | null
          project_id: string
          role_name: string
          skills_required: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          compensation_details?: string | null
          created_at?: string | null
          headcount?: number | null
          id?: string
          is_paid?: boolean | null
          project_id: string
          role_name: string
          skills_required?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          compensation_details?: string | null
          created_at?: string | null
          headcount?: number | null
          id?: string
          is_paid?: boolean | null
          project_id?: string
          role_name?: string
          skills_required?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      color_palettes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      compatibility_history: {
        Row: {
          calculated_at: string | null
          compatibility_score: number
          id: string
          match_factors: Json
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          calculated_at?: string | null
          compatibility_score: number
          id?: string
          match_factors: Json
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          calculated_at?: string | null
          compatibility_score?: number
          id?: string
          match_factors?: Json
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      composition_techniques: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      credit_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          notification_channels: string[] | null
          threshold_value: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          notification_channels?: string[] | null
          threshold_value?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          notification_channels?: string[] | null
          threshold_value?: number | null
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          is_active: boolean | null
          name: string
          price_usd: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          id: string
          is_active?: boolean | null
          name: string
          price_usd: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price_usd?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_pools: {
        Row: {
          auto_refill_amount: number | null
          auto_refill_threshold: number | null
          available_balance: number | null
          cost_per_credit: number
          created_at: string | null
          id: string
          last_refill_at: string | null
          provider: string
          status: string | null
          total_consumed: number | null
          total_purchased: number | null
          updated_at: string | null
        }
        Insert: {
          auto_refill_amount?: number | null
          auto_refill_threshold?: number | null
          available_balance?: number | null
          cost_per_credit: number
          created_at?: string | null
          id?: string
          last_refill_at?: string | null
          provider: string
          status?: string | null
          total_consumed?: number | null
          total_purchased?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_refill_amount?: number | null
          auto_refill_threshold?: number | null
          available_balance?: number | null
          cost_per_credit?: number
          created_at?: string | null
          id?: string
          last_refill_at?: string | null
          provider?: string
          status?: string | null
          total_consumed?: number | null
          total_purchased?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_purchase_requests: {
        Row: {
          amount_requested: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          estimated_cost: number
          id: string
          provider: string
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount_requested: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          estimated_cost: number
          id?: string
          provider: string
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount_requested?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          estimated_cost?: number
          id?: string
          provider?: string
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          api_request_id: string | null
          cost_usd: number | null
          created_at: string | null
          credits_used: number
          enhancement_type: string | null
          error_message: string | null
          id: string
          moodboard_id: string | null
          provider: string | null
          status: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          api_request_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          credits_used: number
          enhancement_type?: string | null
          error_message?: string | null
          id?: string
          moodboard_id?: string | null
          provider?: string | null
          status?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          api_request_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          credits_used?: number
          enhancement_type?: string | null
          error_message?: string | null
          id?: string
          moodboard_id?: string | null
          provider?: string | null
          status?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_moodboard_id_fkey"
            columns: ["moodboard_id"]
            isOneToOne: false
            referencedRelation: "moodboards"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_usage_summary: {
        Row: {
          created_at: string | null
          date: string
          failed_requests: number | null
          free_tier_usage: number | null
          id: string
          plus_tier_usage: number | null
          pro_tier_usage: number | null
          successful_requests: number | null
          total_cost_usd: number | null
          total_credits_consumed: number | null
          total_requests: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          failed_requests?: number | null
          free_tier_usage?: number | null
          id?: string
          plus_tier_usage?: number | null
          pro_tier_usage?: number | null
          successful_requests?: number | null
          total_cost_usd?: number | null
          total_credits_consumed?: number | null
          total_requests?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          failed_requests?: number | null
          free_tier_usage?: number | null
          id?: string
          plus_tier_usage?: number | null
          pro_tier_usage?: number | null
          successful_requests?: number | null
          total_cost_usd?: number | null
          total_credits_consumed?: number | null
          total_requests?: number | null
        }
        Relationships: []
      }
      depth_of_field: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      director_styles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      domain_events: {
        Row: {
          aggregate_id: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string
          payload: Json
        }
        Insert: {
          aggregate_id: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at: string
          payload: Json
        }
        Update: {
          aggregate_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          payload?: Json
        }
        Relationships: []
      }
      enhancement_tasks: {
        Row: {
          api_task_id: string | null
          cost_usd: number | null
          created_at: string | null
          enhancement_type: string
          error_message: string | null
          error_type: string | null
          failed_at: string | null
          id: string
          input_image_url: string
          moodboard_id: string | null
          moodboard_item_index: number | null
          prompt: string
          provider: string | null
          refund_processed_at: string | null
          refunded: boolean | null
          result_url: string | null
          status: string | null
          strength: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_task_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          enhancement_type: string
          error_message?: string | null
          error_type?: string | null
          failed_at?: string | null
          id?: string
          input_image_url: string
          moodboard_id?: string | null
          moodboard_item_index?: number | null
          prompt: string
          provider?: string | null
          refund_processed_at?: string | null
          refunded?: boolean | null
          result_url?: string | null
          status?: string | null
          strength?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_task_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          enhancement_type?: string
          error_message?: string | null
          error_type?: string | null
          failed_at?: string | null
          id?: string
          input_image_url?: string
          moodboard_id?: string | null
          moodboard_item_index?: number | null
          prompt?: string
          provider?: string | null
          refund_processed_at?: string | null
          refunded?: boolean | null
          result_url?: string | null
          status?: string | null
          strength?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enhancement_tasks_moodboard_id_fkey"
            columns: ["moodboard_id"]
            isOneToOne: false
            referencedRelation: "moodboards"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_requests: {
        Row: {
          category: string | null
          condition_preference: string | null
          created_at: string | null
          delivery_acceptable: boolean | null
          description: string | null
          equipment_type: string | null
          expires_at: string | null
          id: string
          latitude: number | null
          location_city: string | null
          location_country: string | null
          longitude: number | null
          max_daily_rate_cents: number | null
          max_distance_km: number | null
          max_purchase_price_cents: number | null
          max_total_cents: number | null
          min_rating: number | null
          pickup_preferred: boolean | null
          rental_end_date: string | null
          rental_start_date: string | null
          request_type: string
          requester_id: string
          status: string | null
          title: string
          updated_at: string | null
          urgent: boolean | null
          verified_users_only: boolean | null
        }
        Insert: {
          category?: string | null
          condition_preference?: string | null
          created_at?: string | null
          delivery_acceptable?: boolean | null
          description?: string | null
          equipment_type?: string | null
          expires_at?: string | null
          id?: string
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          longitude?: number | null
          max_daily_rate_cents?: number | null
          max_distance_km?: number | null
          max_purchase_price_cents?: number | null
          max_total_cents?: number | null
          min_rating?: number | null
          pickup_preferred?: boolean | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          request_type?: string
          requester_id: string
          status?: string | null
          title: string
          updated_at?: string | null
          urgent?: boolean | null
          verified_users_only?: boolean | null
        }
        Update: {
          category?: string | null
          condition_preference?: string | null
          created_at?: string | null
          delivery_acceptable?: boolean | null
          description?: string | null
          equipment_type?: string | null
          expires_at?: string | null
          id?: string
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          longitude?: number | null
          max_daily_rate_cents?: number | null
          max_distance_km?: number | null
          max_purchase_price_cents?: number | null
          max_total_cents?: number | null
          min_rating?: number | null
          pickup_preferred?: boolean | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          request_type?: string
          requester_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          urgent?: boolean | null
          verified_users_only?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      era_emulations: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      eye_contacts: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      foreground_elements: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      gig_notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          location_radius: number | null
          max_budget: number | null
          min_budget: number | null
          notify_on_match: boolean | null
          preferred_purposes: string[] | null
          preferred_styles: string[] | null
          preferred_vibes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_radius?: number | null
          max_budget?: number | null
          min_budget?: number | null
          notify_on_match?: boolean | null
          preferred_purposes?: string[] | null
          preferred_styles?: string[] | null
          preferred_vibes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_radius?: number | null
          max_budget?: number | null
          min_budget?: number | null
          notify_on_match?: boolean | null
          preferred_purposes?: string[] | null
          preferred_styles?: string[] | null
          preferred_vibes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gigs: {
        Row: {
          applicant_preferences: Json | null
          application_deadline: string
          boost_level: number | null
          city: string | null
          comp_details: string | null
          comp_type: Database["public"]["Enums"]["compensation_type"]
          country: string | null
          created_at: string | null
          description: string
          end_time: string
          id: string
          location: unknown | null
          location_text: string
          max_applicants: number
          owner_user_id: string
          purpose: string | null
          radius_meters: number | null
          safety_notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["gig_status"] | null
          style_tags: string[] | null
          title: string
          updated_at: string | null
          usage_rights: string
          vibe_tags: string[] | null
        }
        Insert: {
          applicant_preferences?: Json | null
          application_deadline: string
          boost_level?: number | null
          city?: string | null
          comp_details?: string | null
          comp_type: Database["public"]["Enums"]["compensation_type"]
          country?: string | null
          created_at?: string | null
          description: string
          end_time: string
          id?: string
          location?: unknown | null
          location_text: string
          max_applicants?: number
          owner_user_id: string
          purpose?: string | null
          radius_meters?: number | null
          safety_notes?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["gig_status"] | null
          style_tags?: string[] | null
          title: string
          updated_at?: string | null
          usage_rights: string
          vibe_tags?: string[] | null
        }
        Update: {
          applicant_preferences?: Json | null
          application_deadline?: string
          boost_level?: number | null
          city?: string | null
          comp_details?: string | null
          comp_type?: Database["public"]["Enums"]["compensation_type"]
          country?: string | null
          created_at?: string | null
          description?: string
          end_time?: string
          id?: string
          location?: unknown | null
          location_text?: string
          max_applicants?: number
          owner_user_id?: string
          purpose?: string | null
          radius_meters?: number | null
          safety_notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["gig_status"] | null
          style_tags?: string[] | null
          title?: string
          updated_at?: string | null
          usage_rights?: string
          vibe_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "gigs_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      lens_types: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      lighting_styles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      listing_availability: {
        Row: {
          created_at: string
          end_date: string
          id: string
          kind: string
          listing_id: string
          notes: string | null
          ref_order_id: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          kind: string
          listing_id: string
          notes?: string | null
          ref_order_id?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          kind?: string
          listing_id?: string
          notes?: string | null
          ref_order_id?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_availability_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_enhancements: {
        Row: {
          amount_cents: number
          created_at: string | null
          duration_days: number
          enhancement_type: string
          expires_at: string
          id: string
          listing_id: string
          payment_intent_id: string | null
          starts_at: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string | null
          duration_days: number
          enhancement_type: string
          expires_at: string
          id?: string
          listing_id: string
          payment_intent_id?: string | null
          starts_at: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          duration_days?: number
          enhancement_type?: string
          expires_at?: string
          id?: string
          listing_id?: string
          payment_intent_id?: string | null
          starts_at?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_enhancements_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_enhancements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          listing_id: string
          path: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          listing_id: string
          path: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          path?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          boost_level: number | null
          borrow_ok: boolean
          category: string | null
          condition: string | null
          created_at: string
          current_enhancement_type: string | null
          deposit_cents: number | null
          description: string | null
          enhancement_expires_at: string | null
          id: string
          latitude: number | null
          location_city: string | null
          location_country: string | null
          longitude: number | null
          mode: string
          owner_id: string
          premium_badge: boolean | null
          quantity: number
          rent_day_cents: number | null
          rent_week_cents: number | null
          retainer_cents: number | null
          retainer_mode: string
          sale_price_cents: number | null
          status: string
          title: string
          updated_at: string
          verified_badge: boolean | null
          verified_only: boolean
        }
        Insert: {
          boost_level?: number | null
          borrow_ok?: boolean
          category?: string | null
          condition?: string | null
          created_at?: string
          current_enhancement_type?: string | null
          deposit_cents?: number | null
          description?: string | null
          enhancement_expires_at?: string | null
          id?: string
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          longitude?: number | null
          mode?: string
          owner_id: string
          premium_badge?: boolean | null
          quantity?: number
          rent_day_cents?: number | null
          rent_week_cents?: number | null
          retainer_cents?: number | null
          retainer_mode?: string
          sale_price_cents?: number | null
          status?: string
          title: string
          updated_at?: string
          verified_badge?: boolean | null
          verified_only?: boolean
        }
        Update: {
          boost_level?: number | null
          borrow_ok?: boolean
          category?: string | null
          condition?: string | null
          created_at?: string
          current_enhancement_type?: string | null
          deposit_cents?: number | null
          description?: string | null
          enhancement_expires_at?: string | null
          id?: string
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          longitude?: number | null
          mode?: string
          owner_id?: string
          premium_badge?: boolean | null
          quantity?: number
          rent_day_cents?: number | null
          rent_week_cents?: number | null
          retainer_cents?: number | null
          retainer_mode?: string
          sale_price_cents?: number | null
          status?: string
          title?: string
          updated_at?: string
          verified_badge?: boolean | null
          verified_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      location_types: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      marketplace_disputes: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string
          order_type: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id: string
          order_type: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          order_type?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_disputes_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_disputes_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          id: string
          order_id: string
          order_type: string
          rating: number
          response: string | null
          subject_user_id: string
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          order_type: string
          rating: number
          response?: string | null
          subject_user_id: string
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          order_type?: string
          rating?: number
          response?: string | null
          subject_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_interactions: {
        Row: {
          compatibility_score: number | null
          context_data: Json | null
          created_at: string | null
          id: string
          interaction_type: string
          match_factors: Json | null
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          compatibility_score?: number | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          interaction_type: string
          match_factors?: Json | null
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          compatibility_score?: number | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          match_factors?: Json | null
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          ai_metadata: Json | null
          blurhash: string | null
          bucket: string
          cinematic_tags: string[] | null
          created_at: string | null
          duration: number | null
          exif_json: Json | null
          gig_id: string | null
          height: number | null
          id: string
          owner_user_id: string
          palette: Json | null
          path: string
          type: Database["public"]["Enums"]["media_type"]
          visibility: Database["public"]["Enums"]["showcase_visibility"] | null
          width: number | null
        }
        Insert: {
          ai_metadata?: Json | null
          blurhash?: string | null
          bucket: string
          cinematic_tags?: string[] | null
          created_at?: string | null
          duration?: number | null
          exif_json?: Json | null
          gig_id?: string | null
          height?: number | null
          id?: string
          owner_user_id: string
          palette?: Json | null
          path: string
          type: Database["public"]["Enums"]["media_type"]
          visibility?: Database["public"]["Enums"]["showcase_visibility"] | null
          width?: number | null
        }
        Update: {
          ai_metadata?: Json | null
          blurhash?: string | null
          bucket?: string
          cinematic_tags?: string[] | null
          created_at?: string | null
          duration?: number | null
          exif_json?: Json | null
          gig_id?: string | null
          height?: number | null
          id?: string
          owner_user_id?: string
          palette?: Json | null
          path?: string
          type?: Database["public"]["Enums"]["media_type"]
          visibility?: Database["public"]["Enums"]["showcase_visibility"] | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          body: string
          context_type: string | null
          conversation_id: string | null
          created_at: string | null
          from_user_id: string
          gig_id: string
          id: string
          listing_id: string | null
          offer_id: string | null
          read_at: string | null
          rental_order_id: string | null
          sale_order_id: string | null
          status: string | null
          to_user_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          body: string
          context_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          from_user_id: string
          gig_id: string
          id?: string
          listing_id?: string | null
          offer_id?: string | null
          read_at?: string | null
          rental_order_id?: string | null
          sale_order_id?: string | null
          status?: string | null
          to_user_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          body?: string
          context_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          from_user_id?: string
          gig_id?: string
          id?: string
          listing_id?: string | null
          offer_id?: string | null
          read_at?: string | null
          rental_order_id?: string | null
          sale_order_id?: string | null
          status?: string | null
          to_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_rental_order_id_fkey"
            columns: ["rental_order_id"]
            isOneToOne: false
            referencedRelation: "rental_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sale_order_id_fkey"
            columns: ["sale_order_id"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          admin_user_id: string
          content_type: string | null
          created_at: string | null
          duration_hours: number | null
          expires_at: string | null
          id: string
          metadata: Json | null
          reason: string
          report_id: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          target_content_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          content_type?: string | null
          created_at?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          report_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          target_content_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          content_type?: string | null
          created_at?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          report_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          target_content_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "admin_reports_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      moodboard_items: {
        Row: {
          attribution: string | null
          blurhash: string | null
          created_at: string | null
          enhancement_prompt: string | null
          height: number | null
          id: string
          moodboard_id: string | null
          original_image_id: string | null
          palette: string[] | null
          position: number
          source: string
          thumbnail_url: string | null
          url: string
          width: number | null
        }
        Insert: {
          attribution?: string | null
          blurhash?: string | null
          created_at?: string | null
          enhancement_prompt?: string | null
          height?: number | null
          id?: string
          moodboard_id?: string | null
          original_image_id?: string | null
          palette?: string[] | null
          position?: number
          source: string
          thumbnail_url?: string | null
          url: string
          width?: number | null
        }
        Update: {
          attribution?: string | null
          blurhash?: string | null
          created_at?: string | null
          enhancement_prompt?: string | null
          height?: number | null
          id?: string
          moodboard_id?: string | null
          original_image_id?: string | null
          palette?: string[] | null
          position?: number
          source?: string
          thumbnail_url?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "moodboard_items_moodboard_id_fkey"
            columns: ["moodboard_id"]
            isOneToOne: false
            referencedRelation: "moodboards"
            referencedColumns: ["id"]
          },
        ]
      }
      moodboards: {
        Row: {
          ai_analysis_status: string | null
          ai_analyzed_at: string | null
          ai_provider: string | null
          created_at: string | null
          enhancement_log: Json | null
          generated_prompts: string[] | null
          gig_id: string | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          items: Json
          mood_descriptors: string[] | null
          owner_user_id: string
          palette: Json | null
          source_breakdown: Json | null
          summary: string | null
          tags: string[] | null
          template_description: string | null
          template_name: string | null
          title: string | null
          total_cost: number | null
          updated_at: string | null
          vibe_ids: string[] | null
          vibe_summary: string | null
        }
        Insert: {
          ai_analysis_status?: string | null
          ai_analyzed_at?: string | null
          ai_provider?: string | null
          created_at?: string | null
          enhancement_log?: Json | null
          generated_prompts?: string[] | null
          gig_id?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          items?: Json
          mood_descriptors?: string[] | null
          owner_user_id: string
          palette?: Json | null
          source_breakdown?: Json | null
          summary?: string | null
          tags?: string[] | null
          template_description?: string | null
          template_name?: string | null
          title?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vibe_ids?: string[] | null
          vibe_summary?: string | null
        }
        Update: {
          ai_analysis_status?: string | null
          ai_analyzed_at?: string | null
          ai_provider?: string | null
          created_at?: string | null
          enhancement_log?: Json | null
          generated_prompts?: string[] | null
          gig_id?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          items?: Json
          mood_descriptors?: string[] | null
          owner_user_id?: string
          palette?: Json | null
          source_breakdown?: Json | null
          summary?: string | null
          tags?: string[] | null
          template_description?: string | null
          template_name?: string | null
          title?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vibe_ids?: string[] | null
          vibe_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moodboards_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moodboards_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          application_notifications: boolean | null
          badge_count_enabled: boolean | null
          booking_notifications: boolean | null
          created_at: string | null
          digest_frequency: string | null
          dispute_notifications: boolean | null
          email_enabled: boolean | null
          gig_notifications: boolean | null
          id: string
          in_app_enabled: boolean | null
          listing_notifications: boolean | null
          marketing_notifications: boolean | null
          marketplace_notifications: boolean | null
          message_notifications: boolean | null
          offer_notifications: boolean | null
          order_notifications: boolean | null
          payment_notifications: boolean | null
          push_enabled: boolean | null
          review_notifications: boolean | null
          sound_enabled: boolean | null
          system_notifications: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          vibration_enabled: boolean | null
        }
        Insert: {
          application_notifications?: boolean | null
          badge_count_enabled?: boolean | null
          booking_notifications?: boolean | null
          created_at?: string | null
          digest_frequency?: string | null
          dispute_notifications?: boolean | null
          email_enabled?: boolean | null
          gig_notifications?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          listing_notifications?: boolean | null
          marketing_notifications?: boolean | null
          marketplace_notifications?: boolean | null
          message_notifications?: boolean | null
          offer_notifications?: boolean | null
          order_notifications?: boolean | null
          payment_notifications?: boolean | null
          push_enabled?: boolean | null
          review_notifications?: boolean | null
          sound_enabled?: boolean | null
          system_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          vibration_enabled?: boolean | null
        }
        Update: {
          application_notifications?: boolean | null
          badge_count_enabled?: boolean | null
          booking_notifications?: boolean | null
          created_at?: string | null
          digest_frequency?: string | null
          dispute_notifications?: boolean | null
          email_enabled?: boolean | null
          gig_notifications?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          listing_notifications?: boolean | null
          marketing_notifications?: boolean | null
          marketplace_notifications?: boolean | null
          message_notifications?: boolean | null
          offer_notifications?: boolean | null
          order_notifications?: boolean | null
          payment_notifications?: boolean | null
          push_enabled?: boolean | null
          review_notifications?: boolean | null
          sound_enabled?: boolean | null
          system_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          vibration_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_data: Json | null
          action_url: string | null
          avatar_url: string | null
          category: string
          created_at: string | null
          delivered_at: string | null
          delivered_email: boolean | null
          delivered_in_app: boolean | null
          delivered_push: boolean | null
          dismissed_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          read_at: string | null
          recipient_id: string
          related_application_id: string | null
          related_gig_id: string | null
          related_listing_id: string | null
          related_offer_id: string | null
          related_rental_order_id: string | null
          related_review_id: string | null
          related_sale_order_id: string | null
          scheduled_for: string | null
          sender_id: string | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          action_data?: Json | null
          action_url?: string | null
          avatar_url?: string | null
          category: string
          created_at?: string | null
          delivered_at?: string | null
          delivered_email?: boolean | null
          delivered_in_app?: boolean | null
          delivered_push?: boolean | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          recipient_id: string
          related_application_id?: string | null
          related_gig_id?: string | null
          related_listing_id?: string | null
          related_offer_id?: string | null
          related_rental_order_id?: string | null
          related_review_id?: string | null
          related_sale_order_id?: string | null
          scheduled_for?: string | null
          sender_id?: string | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          action_data?: Json | null
          action_url?: string | null
          avatar_url?: string | null
          category?: string
          created_at?: string | null
          delivered_at?: string | null
          delivered_email?: boolean | null
          delivered_in_app?: boolean | null
          delivered_push?: boolean | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          recipient_id?: string
          related_application_id?: string | null
          related_gig_id?: string | null
          related_listing_id?: string | null
          related_offer_id?: string | null
          related_rental_order_id?: string | null
          related_review_id?: string | null
          related_sale_order_id?: string | null
          scheduled_for?: string | null
          sender_id?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_application_id_fkey"
            columns: ["related_application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_gig_id_fkey"
            columns: ["related_gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_listing_id_fkey"
            columns: ["related_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_offer_id_fkey"
            columns: ["related_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_rental_order_id_fkey"
            columns: ["related_rental_order_id"]
            isOneToOne: false
            referencedRelation: "rental_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_review_id_fkey"
            columns: ["related_review_id"]
            isOneToOne: false
            referencedRelation: "marketplace_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_sale_order_id_fkey"
            columns: ["related_sale_order_id"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          context: string
          created_at: string
          expires_at: string | null
          from_user: string
          id: string
          listing_id: string
          payload: Json
          status: string
          to_user: string
          updated_at: string
        }
        Insert: {
          context: string
          created_at?: string
          expires_at?: string | null
          from_user: string
          id?: string
          listing_id: string
          payload: Json
          status?: string
          to_user: string
          updated_at?: string
        }
        Update: {
          context?: string
          created_at?: string
          expires_at?: string | null
          from_user?: string
          id?: string
          listing_id?: string
          payload?: Json
          status?: string
          to_user?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_credit_consumption: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          id: string
          operation_type: string
          provider: string
          provider_credits_consumed: number
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          operation_type: string
          provider: string
          provider_credits_consumed: number
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          operation_type?: string
          provider?: string
          provider_credits_consumed?: number
          user_id?: string | null
        }
        Relationships: []
      }
      platform_credits: {
        Row: {
          created_at: string | null
          credit_ratio: number | null
          current_balance: number | null
          id: string
          low_balance_threshold: number | null
          provider: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_ratio?: number | null
          current_balance?: number | null
          id?: string
          low_balance_threshold?: number | null
          provider: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_ratio?: number | null
          current_balance?: number | null
          id?: string
          low_balance_threshold?: number | null
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      playground_gallery: {
        Row: {
          created_at: string | null
          description: string | null
          edit_id: string | null
          file_size: number | null
          format: string | null
          generation_metadata: Json | null
          height: number | null
          id: string
          image_url: string
          media_type: string | null
          project_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          used_in_moodboard: boolean | null
          used_in_showcase: boolean | null
          user_id: string
          video_duration: number | null
          video_format: string | null
          video_resolution: string | null
          video_url: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          edit_id?: string | null
          file_size?: number | null
          format?: string | null
          generation_metadata?: Json | null
          height?: number | null
          id?: string
          image_url: string
          media_type?: string | null
          project_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          used_in_moodboard?: boolean | null
          used_in_showcase?: boolean | null
          user_id: string
          video_duration?: number | null
          video_format?: string | null
          video_resolution?: string | null
          video_url?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          edit_id?: string | null
          file_size?: number | null
          format?: string | null
          generation_metadata?: Json | null
          height?: number | null
          id?: string
          image_url?: string
          media_type?: string | null
          project_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          used_in_moodboard?: boolean | null
          used_in_showcase?: boolean | null
          user_id?: string
          video_duration?: number | null
          video_format?: string | null
          video_resolution?: string | null
          video_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playground_gallery_edit_id_fkey"
            columns: ["edit_id"]
            isOneToOne: false
            referencedRelation: "playground_image_edits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playground_gallery_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "playground_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      playground_image_edits: {
        Row: {
          created_at: string | null
          credits_used: number | null
          edit_prompt: string | null
          edit_type: string
          edited_image_url: string
          id: string
          original_image_url: string
          processing_time_ms: number | null
          project_id: string
          strength: number | null
          style_preset: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_used?: number | null
          edit_prompt?: string | null
          edit_type: string
          edited_image_url: string
          id?: string
          original_image_url: string
          processing_time_ms?: number | null
          project_id: string
          strength?: number | null
          style_preset?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_used?: number | null
          edit_prompt?: string | null
          edit_type?: string
          edited_image_url?: string
          id?: string
          original_image_url?: string
          processing_time_ms?: number | null
          project_id?: string
          strength?: number | null
          style_preset?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playground_image_edits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "playground_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      playground_projects: {
        Row: {
          aspect_ratio: string | null
          created_at: string | null
          credits_used: number | null
          description: string | null
          generated_images: Json | null
          id: string
          last_generated_at: string | null
          metadata: Json | null
          negative_prompt: string | null
          prompt: string
          resolution: string | null
          selected_image_url: string | null
          status: string | null
          style: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string | null
          credits_used?: number | null
          description?: string | null
          generated_images?: Json | null
          id?: string
          last_generated_at?: string | null
          metadata?: Json | null
          negative_prompt?: string | null
          prompt: string
          resolution?: string | null
          selected_image_url?: string | null
          status?: string | null
          style?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string | null
          credits_used?: number | null
          description?: string | null
          generated_images?: Json | null
          id?: string
          last_generated_at?: string | null
          metadata?: Json | null
          negative_prompt?: string | null
          prompt?: string
          resolution?: string | null
          selected_image_url?: string | null
          status?: string | null
          style?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      playground_video_generations: {
        Row: {
          aspect_ratio: string | null
          created_at: string | null
          description: string | null
          duration: number
          file_size: number | null
          format: string | null
          generation_metadata: Json | null
          id: string
          project_id: string | null
          resolution: string
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string | null
          description?: string | null
          duration: number
          file_size?: number | null
          format?: string | null
          generation_metadata?: Json | null
          id?: string
          project_id?: string | null
          resolution: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number
          file_size?: number | null
          format?: string | null
          generation_metadata?: Json | null
          id?: string
          project_id?: string | null
          resolution?: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "playground_video_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "playground_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_images: {
        Row: {
          created_at: string | null
          id: string
          image_type: string
          image_url: string
          original_gallery_id: string | null
          preset_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_type: string
          image_url: string
          original_gallery_id?: string | null
          preset_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_type?: string
          image_url?: string
          original_gallery_id?: string | null
          preset_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preset_images_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_usage_log: {
        Row: {
          context_id: string | null
          created_at: string | null
          id: string
          preset_id: string
          usage_type: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          created_at?: string | null
          id?: string
          preset_id: string
          usage_type: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          created_at?: string | null
          id?: string
          preset_id?: string
          usage_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preset_usage_log_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "user_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      presets: {
        Row: {
          ai_metadata: Json | null
          category: string | null
          created_at: string | null
          description: string | null
          generation_mode: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          last_used_at: string | null
          name: string
          negative_prompt: string | null
          prompt_template: string | null
          seedream_config: Json | null
          style_settings: Json | null
          technical_settings: Json | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          ai_metadata?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          generation_mode?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          name: string
          negative_prompt?: string | null
          prompt_template?: string | null
          seedream_config?: Json | null
          style_settings?: Json | null
          technical_settings?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          ai_metadata?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          generation_mode?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          name?: string
          negative_prompt?: string | null
          prompt_template?: string | null
          seedream_config?: Json | null
          style_settings?: Json | null
          technical_settings?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string
          handle: string
          id: string
          instagram_handle: string | null
          showcase_ids: string[] | null
          style_tags: string[] | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name: string
          handle: string
          id?: string
          instagram_handle?: string | null
          showcase_ids?: string[] | null
          style_tags?: string[] | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string
          handle?: string
          id?: string
          instagram_handle?: string | null
          showcase_ids?: string[] | null
          style_tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_audit_log: {
        Row: {
          created_at: string | null
          credits_refunded: number
          error_message: string | null
          id: string
          new_balance: number | null
          platform_loss: number | null
          previous_balance: number | null
          processed_by: string | null
          refund_reason: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits_refunded: number
          error_message?: string | null
          id?: string
          new_balance?: number | null
          platform_loss?: number | null
          previous_balance?: number | null
          processed_by?: string | null
          refund_reason?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits_refunded?: number
          error_message?: string | null
          id?: string
          new_balance?: number | null
          platform_loss?: number | null
          previous_balance?: number | null
          processed_by?: string | null
          refund_reason?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_audit_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "enhancement_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_policies: {
        Row: {
          created_at: string | null
          description: string | null
          error_type: string
          id: string
          refund_percentage: number | null
          should_refund: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          error_type: string
          id?: string
          refund_percentage?: number | null
          should_refund?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          error_type?: string
          id?: string
          refund_percentage?: number | null
          should_refund?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      rental_orders: {
        Row: {
          calculated_total_cents: number
          created_at: string
          credits_tx_id: string | null
          currency: string
          day_rate_cents: number
          deposit_cents: number
          end_date: string
          id: string
          listing_id: string
          owner_id: string
          pickup_location: string | null
          renter_id: string
          retainer_cents: number
          retainer_mode: string
          return_location: string | null
          special_instructions: string | null
          start_date: string
          status: string
          stripe_pi_id: string | null
          updated_at: string
        }
        Insert: {
          calculated_total_cents: number
          created_at?: string
          credits_tx_id?: string | null
          currency?: string
          day_rate_cents: number
          deposit_cents?: number
          end_date: string
          id?: string
          listing_id: string
          owner_id: string
          pickup_location?: string | null
          renter_id: string
          retainer_cents?: number
          retainer_mode: string
          return_location?: string | null
          special_instructions?: string | null
          start_date: string
          status?: string
          stripe_pi_id?: string | null
          updated_at?: string
        }
        Update: {
          calculated_total_cents?: number
          created_at?: string
          credits_tx_id?: string | null
          currency?: string
          day_rate_cents?: number
          deposit_cents?: number
          end_date?: string
          id?: string
          listing_id?: string
          owner_id?: string
          pickup_location?: string | null
          renter_id?: string
          retainer_cents?: number
          retainer_mode?: string
          return_location?: string | null
          special_instructions?: string | null
          start_date?: string
          status?: string
          stripe_pi_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_orders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_orders_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content_type: string
          created_at: string | null
          description: string
          evidence_urls: string[] | null
          id: string
          priority: string | null
          reason: string
          reported_content_id: string | null
          reported_user_id: string | null
          reporter_user_id: string
          resolution_action: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          description: string
          evidence_urls?: string[] | null
          id?: string
          priority?: string | null
          reason: string
          reported_content_id?: string | null
          reported_user_id?: string | null
          reporter_user_id: string
          resolution_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          description?: string
          evidence_urls?: string[] | null
          id?: string
          priority?: string | null
          reason?: string
          reported_content_id?: string | null
          reported_user_id?: string | null
          reporter_user_id?: string
          resolution_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      request_conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          request_id: string
          requester_id: string
          responder_id: string
          response_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          request_id: string
          requester_id: string
          responder_id: string
          response_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          request_id?: string
          requester_id?: string
          responder_id?: string
          response_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "equipment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_conversations_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_conversations_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_conversations_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "request_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      request_responses: {
        Row: {
          available_end_date: string | null
          available_start_date: string | null
          condition: string | null
          created_at: string | null
          id: string
          listing_id: string | null
          message: string | null
          offered_daily_rate_cents: number | null
          offered_price_cents: number | null
          offered_total_cents: number | null
          request_id: string
          responder_id: string
          response_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          available_end_date?: string | null
          available_start_date?: string | null
          condition?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          offered_daily_rate_cents?: number | null
          offered_price_cents?: number | null
          offered_total_cents?: number | null
          request_id: string
          responder_id: string
          response_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          available_end_date?: string | null
          available_start_date?: string | null
          condition?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          offered_daily_rate_cents?: number | null
          offered_price_cents?: number | null
          offered_total_cents?: number | null
          request_id?: string
          responder_id?: string
          response_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_responses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "equipment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_responses_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          gig_id: string
          id: string
          rating: number
          reviewed_user_id: string
          reviewer_user_id: string
          tags: string[] | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          gig_id: string
          id?: string
          rating: number
          reviewed_user_id: string
          reviewer_user_id: string
          tags?: string[] | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          gig_id?: string
          id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_user_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_orders: {
        Row: {
          buyer_id: string
          created_at: string
          credits_tx_id: string | null
          currency: string
          id: string
          listing_id: string
          notes: string | null
          owner_id: string
          quantity: number
          shipping_address: Json | null
          status: string
          stripe_pi_id: string | null
          total_cents: number
          tracking_number: string | null
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          credits_tx_id?: string | null
          currency?: string
          id?: string
          listing_id: string
          notes?: string | null
          owner_id: string
          quantity?: number
          shipping_address?: Json | null
          status?: string
          stripe_pi_id?: string | null
          total_cents: number
          tracking_number?: string | null
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          credits_tx_id?: string | null
          currency?: string
          id?: string
          listing_id?: string
          notes?: string | null
          owner_id?: string
          quantity?: number
          shipping_address?: Json | null
          status?: string
          stripe_pi_id?: string | null
          total_cents?: number
          tracking_number?: string | null
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_orders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_gigs: {
        Row: {
          created_at: string | null
          gig_id: string
          id: string
          saved_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gig_id: string
          id?: string
          saved_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          gig_id?: string
          id?: string
          saved_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_gigs_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_moods: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      shot_sizes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      showcase_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          showcase_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          showcase_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          showcase_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "showcase_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_comments_showcase_id_fkey"
            columns: ["showcase_id"]
            isOneToOne: false
            referencedRelation: "showcases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_likes: {
        Row: {
          created_at: string | null
          id: string
          showcase_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          showcase_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          showcase_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_likes_showcase_id_fkey"
            columns: ["showcase_id"]
            isOneToOne: false
            referencedRelation: "showcases"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_media: {
        Row: {
          created_at: string | null
          id: string
          media_id: string
          showcase_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_id: string
          showcase_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          media_id?: string
          showcase_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "showcase_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_media_showcase_id_fkey"
            columns: ["showcase_id"]
            isOneToOne: false
            referencedRelation: "showcases"
            referencedColumns: ["id"]
          },
        ]
      }
      showcases: {
        Row: {
          approved_by_creator_at: string | null
          approved_by_talent_at: string | null
          caption: string | null
          created_at: string | null
          created_from_moodboard: boolean | null
          created_from_playground: boolean | null
          creator_user_id: string
          description: string | null
          gig_id: string | null
          id: string
          individual_image_description: string | null
          individual_image_title: string | null
          individual_image_url: string | null
          likes_count: number | null
          media_count: number | null
          media_ids: string[]
          moodboard_id: string | null
          moodboard_palette: Json | null
          moodboard_summary: string | null
          palette: Json | null
          showcase_type: string | null
          tags: string[] | null
          talent_user_id: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          views_count: number | null
          visibility: Database["public"]["Enums"]["showcase_visibility"] | null
        }
        Insert: {
          approved_by_creator_at?: string | null
          approved_by_talent_at?: string | null
          caption?: string | null
          created_at?: string | null
          created_from_moodboard?: boolean | null
          created_from_playground?: boolean | null
          creator_user_id: string
          description?: string | null
          gig_id?: string | null
          id?: string
          individual_image_description?: string | null
          individual_image_title?: string | null
          individual_image_url?: string | null
          likes_count?: number | null
          media_count?: number | null
          media_ids: string[]
          moodboard_id?: string | null
          moodboard_palette?: Json | null
          moodboard_summary?: string | null
          palette?: Json | null
          showcase_type?: string | null
          tags?: string[] | null
          talent_user_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          views_count?: number | null
          visibility?: Database["public"]["Enums"]["showcase_visibility"] | null
        }
        Update: {
          approved_by_creator_at?: string | null
          approved_by_talent_at?: string | null
          caption?: string | null
          created_at?: string | null
          created_from_moodboard?: boolean | null
          created_from_playground?: boolean | null
          creator_user_id?: string
          description?: string | null
          gig_id?: string | null
          id?: string
          individual_image_description?: string | null
          individual_image_title?: string | null
          individual_image_url?: string | null
          likes_count?: number | null
          media_count?: number | null
          media_ids?: string[]
          moodboard_id?: string | null
          moodboard_palette?: Json | null
          moodboard_summary?: string | null
          palette?: Json | null
          showcase_type?: string | null
          tags?: string[] | null
          talent_user_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          views_count?: number | null
          visibility?: Database["public"]["Enums"]["showcase_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "showcases_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcases_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcases_moodboard_id_fkey"
            columns: ["moodboard_id"]
            isOneToOne: false
            referencedRelation: "moodboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcases_talent_user_id_fkey"
            columns: ["talent_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      subject_counts: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      subscription_benefits: {
        Row: {
          benefit_type: string
          benefit_value: Json
          created_at: string | null
          id: string
          last_reset_at: string | null
          monthly_limit: number | null
          subscription_tier: string
          updated_at: string | null
          used_this_month: number | null
          user_id: string
        }
        Insert: {
          benefit_type: string
          benefit_value?: Json
          created_at?: string | null
          id?: string
          last_reset_at?: string | null
          monthly_limit?: number | null
          subscription_tier: string
          updated_at?: string | null
          used_this_month?: number | null
          user_id: string
        }
        Update: {
          benefit_type?: string
          benefit_value?: Json
          created_at?: string | null
          id?: string
          last_reset_at?: string | null
          monthly_limit?: number | null
          subscription_tier?: string
          updated_at?: string | null
          used_this_month?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_benefits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          ai_cost_per_enhancement: number | null
          created_at: string | null
          display_name: string
          id: string
          max_ai_enhancements: number
          max_moodboards_per_day: number
          max_user_uploads: number
          name: string
        }
        Insert: {
          ai_cost_per_enhancement?: number | null
          created_at?: string | null
          display_name: string
          id?: string
          max_ai_enhancements?: number
          max_moodboards_per_day?: number
          max_user_uploads?: number
          name: string
        }
        Update: {
          ai_cost_per_enhancement?: number | null
          created_at?: string | null
          display_name?: string
          id?: string
          max_ai_enhancements?: number
          max_moodboards_per_day?: number
          max_user_uploads?: number
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          created_at: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          message: string
          metadata?: Json | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: []
      }
      time_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
      treatment_analytics: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          page_views: number | null
          pages_viewed: string[] | null
          referrer: string | null
          session_id: string | null
          time_on_page_seconds: number | null
          treatment_id: string
          user_agent: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          page_views?: number | null
          pages_viewed?: string[] | null
          referrer?: string | null
          session_id?: string | null
          time_on_page_seconds?: number | null
          treatment_id: string
          user_agent?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          page_views?: number | null
          pages_viewed?: string[] | null
          referrer?: string | null
          session_id?: string | null
          time_on_page_seconds?: number | null
          treatment_id?: string
          user_agent?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_analytics_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_assets: {
        Row: {
          asset_id: string | null
          asset_metadata: Json | null
          asset_type: string
          asset_url: string | null
          created_at: string | null
          id: string
          position_order: number | null
          treatment_id: string
        }
        Insert: {
          asset_id?: string | null
          asset_metadata?: Json | null
          asset_type: string
          asset_url?: string | null
          created_at?: string | null
          id?: string
          position_order?: number | null
          treatment_id: string
        }
        Update: {
          asset_id?: string | null
          asset_metadata?: Json | null
          asset_type?: string
          asset_url?: string | null
          created_at?: string | null
          id?: string
          position_order?: number | null
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_assets_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_sharing: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          permission_level: string
          shared_with_email: string | null
          shared_with_user_id: string | null
          treatment_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          permission_level?: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          treatment_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          permission_level?: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_sharing_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_versions: {
        Row: {
          change_summary: string | null
          created_at: string | null
          created_by: string
          id: string
          json_content: Json
          treatment_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          json_content: Json
          treatment_id: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          json_content?: Json
          treatment_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "treatment_versions_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          cover_image_id: string | null
          cover_image_url: string | null
          created_at: string | null
          format: Database["public"]["Enums"]["treatment_format"]
          id: string
          is_public: boolean
          json_content: Json
          moodboard_id: string | null
          outline_schema_version: number
          owner_id: string
          password_hash: string | null
          project_id: string | null
          published_at: string | null
          showcase_id: string | null
          status: Database["public"]["Enums"]["treatment_status"]
          theme: Database["public"]["Enums"]["treatment_theme"]
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          format?: Database["public"]["Enums"]["treatment_format"]
          id?: string
          is_public?: boolean
          json_content?: Json
          moodboard_id?: string | null
          outline_schema_version?: number
          owner_id: string
          password_hash?: string | null
          project_id?: string | null
          published_at?: string | null
          showcase_id?: string | null
          status?: Database["public"]["Enums"]["treatment_status"]
          theme?: Database["public"]["Enums"]["treatment_theme"]
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          format?: Database["public"]["Enums"]["treatment_format"]
          id?: string
          is_public?: boolean
          json_content?: Json
          moodboard_id?: string | null
          outline_schema_version?: number
          owner_id?: string
          password_hash?: string | null
          project_id?: string | null
          published_at?: string | null
          showcase_id?: string | null
          status?: Database["public"]["Enums"]["treatment_status"]
          theme?: Database["public"]["Enums"]["treatment_theme"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_moodboard_id_fkey"
            columns: ["moodboard_id"]
            isOneToOne: false
            referencedRelation: "moodboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          gig_id: string
          id: string
          is_typing: boolean | null
          last_activity: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          gig_id: string
          id?: string
          is_typing?: boolean | null
          last_activity?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          gig_id?: string
          id?: string
          is_typing?: boolean | null
          last_activity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          awarded_by: string | null
          awarded_reason: string | null
          badge_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          user_id: string
          verified_data: Json | null
        }
        Insert: {
          awarded_at?: string | null
          awarded_by?: string | null
          awarded_reason?: string | null
          badge_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          user_id: string
          verified_data?: Json | null
        }
        Update: {
          awarded_at?: string | null
          awarded_by?: string | null
          awarded_reason?: string | null
          badge_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          user_id?: string
          verified_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credit_purchases: {
        Row: {
          amount_paid_usd: number
          created_at: string | null
          credits_purchased: number
          id: string
          package_id: string | null
          payment_provider: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount_paid_usd: number
          created_at?: string | null
          credits_purchased: number
          id?: string
          package_id?: string | null
          payment_provider?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount_paid_usd?: number
          created_at?: string | null
          credits_purchased?: number
          id?: string
          package_id?: string | null
          payment_provider?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          consumed_this_month: number | null
          created_at: string | null
          current_balance: number | null
          id: string
          last_reset_at: string | null
          lifetime_consumed: number | null
          monthly_allowance: number | null
          subscription_tier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          consumed_this_month?: number | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          last_reset_at?: string | null
          lifetime_consumed?: number | null
          monthly_allowance?: number | null
          subscription_tier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          consumed_this_month?: number | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          last_reset_at?: string | null
          lifetime_consumed?: number | null
          monthly_allowance?: number | null
          subscription_tier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_presets: {
        Row: {
          ai_metadata: Json | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          name: string
          negative_prompt: string | null
          prompt_template: string
          seedream_config: Json | null
          style_settings: Json | null
          technical_settings: Json | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          ai_metadata?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name: string
          negative_prompt?: string | null
          prompt_template: string
          seedream_config?: Json | null
          style_settings?: Json | null
          technical_settings?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          ai_metadata?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name?: string
          negative_prompt?: string | null
          prompt_template?: string
          seedream_config?: Json | null
          style_settings?: Json | null
          technical_settings?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          allow_stranger_messages: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          message_notifications: boolean | null
          privacy_level: string | null
          profile_id: string | null
          profile_visibility: string | null
          push_notifications: boolean | null
          show_contact_info: boolean | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_stranger_messages?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          message_notifications?: boolean | null
          privacy_level?: string | null
          profile_id?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          show_contact_info?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_stranger_messages?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          message_notifications?: boolean | null
          privacy_level?: string | null
          profile_id?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          show_contact_info?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_violations: {
        Row: {
          created_at: string | null
          description: string
          evidence_urls: string[] | null
          expires_at: string | null
          id: string
          moderation_action_id: string | null
          report_id: string | null
          severity: string
          user_id: string
          violation_type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          evidence_urls?: string[] | null
          expires_at?: string | null
          id?: string
          moderation_action_id?: string | null
          report_id?: string | null
          severity: string
          user_id: string
          violation_type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          evidence_urls?: string[] | null
          expires_at?: string | null
          id?: string
          moderation_action_id?: string | null
          report_id?: string | null
          severity?: string
          user_id?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_violations_moderation_action_id_fkey"
            columns: ["moderation_action_id"]
            isOneToOne: false
            referencedRelation: "admin_moderation_audit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_violations_moderation_action_id_fkey"
            columns: ["moderation_action_id"]
            isOneToOne: false
            referencedRelation: "moderation_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_violations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "admin_reports_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_violations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_verified_at: string | null
          id: string
          id_verified_at: string | null
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verified_at?: string | null
          id: string
          id_verified_at?: string | null
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verified_at?: string | null
          id?: string
          id_verified_at?: string | null
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          account_status: string | null
          age_verified: boolean | null
          age_verified_at: string | null
          available_for_travel: boolean | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          clothing_sizes: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string
          editing_software: string[] | null
          equipment_list: string[] | null
          eye_color: string | null
          first_name: string | null
          hair_color: string | null
          handle: string
          has_studio: boolean | null
          header_banner_position: string | null
          header_banner_url: string | null
          height_cm: number | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          instagram_handle: string | null
          languages: string[] | null
          last_name: string | null
          measurements: string | null
          phone_number: string | null
          piercings: boolean | null
          portfolio_url: string | null
          account_type: Database["public"]["Enums"]["user_role"][] | null
          shoe_size: string | null
          specializations: string[] | null
          studio_address: string | null
          studio_name: string | null
          style_tags: string[] | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          talent_categories: string[] | null
          tattoos: boolean | null
          tiktok_handle: string | null
          travel_radius_km: number | null
          typical_turnaround_days: number | null
          updated_at: string | null
          user_id: string
          verification_attempts: number | null
          verification_method: string | null
          verified_id: boolean | null
          vibe_tags: string[] | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          account_status?: string | null
          age_verified?: boolean | null
          age_verified_at?: string | null
          available_for_travel?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          clothing_sizes?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name: string
          editing_software?: string[] | null
          equipment_list?: string[] | null
          eye_color?: string | null
          first_name?: string | null
          hair_color?: string | null
          handle: string
          has_studio?: boolean | null
          header_banner_position?: string | null
          header_banner_url?: string | null
          height_cm?: number | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          instagram_handle?: string | null
          languages?: string[] | null
          last_name?: string | null
          measurements?: string | null
          phone_number?: string | null
          piercings?: boolean | null
          portfolio_url?: string | null
          account_type?: Database["public"]["Enums"]["user_role"][] | null
          shoe_size?: string | null
          specializations?: string[] | null
          studio_address?: string | null
          studio_name?: string | null
          style_tags?: string[] | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          talent_categories?: string[] | null
          tattoos?: boolean | null
          tiktok_handle?: string | null
          travel_radius_km?: number | null
          typical_turnaround_days?: number | null
          updated_at?: string | null
          user_id: string
          verification_attempts?: number | null
          verification_method?: string | null
          verified_id?: boolean | null
          vibe_tags?: string[] | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          account_status?: string | null
          age_verified?: boolean | null
          age_verified_at?: string | null
          available_for_travel?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          clothing_sizes?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string
          editing_software?: string[] | null
          equipment_list?: string[] | null
          eye_color?: string | null
          first_name?: string | null
          hair_color?: string | null
          handle?: string
          has_studio?: boolean | null
          header_banner_position?: string | null
          header_banner_url?: string | null
          height_cm?: number | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          instagram_handle?: string | null
          languages?: string[] | null
          last_name?: string | null
          measurements?: string | null
          phone_number?: string | null
          piercings?: boolean | null
          portfolio_url?: string | null
          account_type?: Database["public"]["Enums"]["user_role"][] | null
          shoe_size?: string | null
          specializations?: string[] | null
          studio_address?: string | null
          studio_name?: string | null
          style_tags?: string[] | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          talent_categories?: string[] | null
          tattoos?: boolean | null
          tiktok_handle?: string | null
          travel_radius_km?: number | null
          typical_turnaround_days?: number | null
          updated_at?: string | null
          user_id?: string
          verification_attempts?: number | null
          verification_method?: string | null
          verified_id?: boolean | null
          vibe_tags?: string[] | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      verification_badges: {
        Row: {
          badge_type: string
          expires_at: string | null
          id: string
          issued_at: string | null
          issued_by: string
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
          verification_request_id: string | null
        }
        Insert: {
          badge_type: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
          verification_request_id?: string | null
        }
        Update: {
          badge_type?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
          verification_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_badges_verification_request_id_fkey"
            columns: ["verification_request_id"]
            isOneToOne: false
            referencedRelation: "admin_verification_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_badges_verification_request_id_fkey"
            columns: ["verification_request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          additional_info_request: string | null
          created_at: string | null
          document_types: string[]
          document_urls: string[]
          expires_at: string | null
          id: string
          metadata: Json | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          verification_type: string
        }
        Insert: {
          additional_info_request?: string | null
          created_at?: string | null
          document_types: string[]
          document_urls: string[]
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          verification_type: string
        }
        Update: {
          additional_info_request?: string | null
          created_at?: string | null
          document_types?: string[]
          document_urls?: string[]
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          verification_type?: string
        }
        Relationships: []
      }
      violation_thresholds: {
        Row: {
          action_type: string
          auto_apply: boolean | null
          created_at: string | null
          id: string
          severity_threshold: string
          violation_count: number
        }
        Insert: {
          action_type: string
          auto_apply?: boolean | null
          created_at?: string | null
          id?: string
          severity_threshold: string
          violation_count: number
        }
        Update: {
          action_type?: string
          auto_apply?: boolean | null
          created_at?: string | null
          id?: string
          severity_threshold?: string
          violation_count?: number
        }
        Relationships: []
      }
      weather_conditions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_age_verification_queue: {
        Row: {
          account_status: string | null
          active_badges: Json | null
          age_verified: boolean | null
          age_verified_at: string | null
          calculated_age: number | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          handle: string | null
          user_id: string | null
          verification_attempts: number | null
          verification_method: string | null
        }
        Relationships: []
      }
      admin_moderation_audit: {
        Row: {
          action_type: string | null
          admin_handle: string | null
          admin_name: string | null
          admin_user_id: string | null
          content_type: string | null
          created_at: string | null
          duration_hours: number | null
          expires_at: string | null
          id: string | null
          metadata: Json | null
          reason: string | null
          report_id: string | null
          report_reason: string | null
          reported_content_type: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoker_name: string | null
          target_content_id: string | null
          target_handle: string | null
          target_name: string | null
          target_user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "admin_reports_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_reports_dashboard: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          evidence_urls: string[] | null
          id: string | null
          priority: string | null
          reason: string | null
          reported_content_id: string | null
          reported_handle: string | null
          reported_name: string | null
          reported_user_id: string | null
          reported_user_risk_score: number | null
          reported_user_violations: number | null
          reporter_handle: string | null
          reporter_name: string | null
          reporter_user_id: string | null
          resolution_action: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolver_name: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      admin_verification_dashboard: {
        Row: {
          active_badges_count: number | null
          additional_info_request: string | null
          created_at: string | null
          document_types: string[] | null
          document_urls: string[] | null
          expires_at: string | null
          id: string | null
          metadata: Json | null
          previous_rejections: number | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_name: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_email: string | null
          user_handle: string | null
          user_id: string | null
          user_name: string | null
          verification_type: string | null
        }
        Relationships: []
      }
      admin_violation_stats: {
        Row: {
          active_violations: number | null
          critical_violations: number | null
          minor_violations: number | null
          moderate_violations: number | null
          severe_violations: number | null
          total_violations: number | null
          unique_violators: number | null
          violations_24h: number | null
          violations_30d: number | null
          violations_7d: number | null
        }
        Relationships: []
      }
      admin_violations_dashboard: {
        Row: {
          active_violation_count: number | null
          created_at: string | null
          critical_count: number | null
          description: string | null
          enforcement_action: string | null
          enforcement_expires: string | null
          evidence_urls: string[] | null
          expires_at: string | null
          id: string | null
          minor_count: number | null
          moderate_count: number | null
          moderation_action_id: string | null
          report_id: string | null
          report_reason: string | null
          reported_content_type: string | null
          risk_level: string | null
          severe_count: number | null
          severity: string | null
          total_violations: number | null
          user_handle: string | null
          user_id: string | null
          user_name: string | null
          violation_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_violations_moderation_action_id_fkey"
            columns: ["moderation_action_id"]
            isOneToOne: false
            referencedRelation: "admin_moderation_audit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_violations_moderation_action_id_fkey"
            columns: ["moderation_action_id"]
            isOneToOne: false
            referencedRelation: "moderation_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_violations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "admin_reports_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_violations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      notification_delivery_stats: {
        Row: {
          avg_time_to_read_minutes: number | null
          category: string | null
          date: string | null
          delivered_email: number | null
          delivered_in_app: number | null
          delivered_push: number | null
          read_count: number | null
          total_sent: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      add_user_violation: {
        Args: {
          p_description: string
          p_evidence_urls?: string[]
          p_expires_in_days?: number
          p_report_id?: string
          p_severity: string
          p_user_id: string
          p_violation_type: string
        }
        Returns: {
          should_auto_enforce: boolean
          suggested_action: string
          total_violations: number
          violation_id: string
        }[]
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
        Returns: string
      }
      apply_moderation_action: {
        Args: {
          p_action_type: string
          p_admin_id: string
          p_duration_hours?: number
          p_reason: string
          p_report_id?: string
          p_target_user_id: string
        }
        Returns: string
      }
      apply_progressive_enforcement: {
        Args: { p_admin_id: string; p_user_id: string; p_violation_id: string }
        Returns: string
      }
      approve_verification_request: {
        Args: {
          p_badge_expires_in_days?: number
          p_request_id: string
          p_review_notes?: string
          p_reviewer_id: string
        }
        Returns: string
      }
      award_badge: {
        Args: {
          p_awarded_by?: string
          p_badge_slug: string
          p_reason?: string
          p_user_id: string
          p_verified_data?: Json
        }
        Returns: string
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_age: {
        Args: { birth_date: string }
        Returns: number
      }
      calculate_gig_compatibility: {
        Args: { p_gig_id: string; p_profile_id: string }
        Returns: {
          breakdown: Json
          score: number
        }[]
      }
      calculate_gig_compatibility_with_preferences: {
        Args: { p_gig_id: string; p_profile_id: string }
        Returns: {
          breakdown: Json
          score: number
        }[]
      }
      calculate_location_score: {
        Args: {
          gig_location: string
          travel_radius_km?: number
          user_city: string
          user_travels?: boolean
        }
        Returns: number
      }
      calculate_style_compatibility: {
        Args: { gig_tags: string[]; user_tags: string[] }
        Returns: number
      }
      calculate_user_matchmaking_metrics: {
        Args: { p_period: string; p_user_id: string }
        Returns: {
          applications_sent: number
          avg_compatibility: number
          engagement_score: number
          successful_matches: number
          total_interactions: number
        }[]
      }
      calculate_user_risk_score: {
        Args: { p_user_id: string }
        Returns: number
      }
      can_access_feature: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
      can_use_monthly_bump: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_refund_eligibility: {
        Args: { p_task_id: string }
        Returns: {
          credits_to_refund: number
          eligible: boolean
          reason: string
        }[]
      }
      cleanup_old_domain_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      consume_platform_credits: {
        Args: { p_cost: number; p_credits: number; p_provider: string }
        Returns: undefined
      }
      consume_user_credits: {
        Args: {
          p_credits: number
          p_enhancement_type: string
          p_user_id: string
        }
        Returns: {
          remaining_balance: number
        }[]
      }
      create_marketplace_conversation: {
        Args: {
          p_from_user_id: string
          p_initial_message?: string
          p_listing_id: string
          p_to_user_id: string
        }
        Returns: string
      }
      create_marketplace_notification: {
        Args: {
          p_action_data?: Json
          p_action_url?: string
          p_avatar_url?: string
          p_listing_id?: string
          p_message?: string
          p_offer_id?: string
          p_recipient_id: string
          p_rental_order_id?: string
          p_review_id?: string
          p_sale_order_id?: string
          p_sender_id?: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      create_treatment_version: {
        Args: { p_change_summary?: string; p_treatment_id: string }
        Returns: string
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
          | { column_name: string; schema_name: string; table_name: string }
          | { column_name: string; table_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      expire_equipment_requests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      expire_listing_enhancements: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      expire_old_violations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_suspensions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_verifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      extract_cinematic_tags: {
        Args: { metadata: Json }
        Returns: string[]
      }
      find_compatible_gigs_for_user: {
        Args: { p_limit?: number; p_profile_id: string }
        Returns: {
          comp_type: string
          compatibility_score: number
          description: string
          end_time: string
          gig_id: string
          location_text: string
          match_factors: Json
          start_time: string
          title: string
        }[]
      }
      find_compatible_users_for_contributor: {
        Args: { p_limit?: number; p_profile_id: string }
        Returns: {
          bio: string
          city: string
          compatibility_score: number
          display_name: string
          handle: string
          match_factors: Json
          user_id: string
        }[]
      }
      generate_conversation_id: {
        Args: { gig_uuid: string; user1_uuid: string; user2_uuid: string }
        Returns: string
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_compatibility_trends: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          avg_compatibility: number
          date: string
          total_calculations: number
        }[]
      }
      get_credit_packages: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          name: string
          price_usd: number
        }[]
      }
      get_gig_talent_recommendations: {
        Args: { p_gig_id: string; p_limit?: number }
        Returns: {
          data: Json
          id: string
          type: string
        }[]
      }
      get_gigs_near_location: {
        Args: {
          p_latitude: number
          p_limit?: number
          p_longitude: number
          p_radius_meters?: number
        }
        Returns: {
          distance_meters: number
          gig_id: string
          location_text: string
          title: string
        }[]
      }
      get_location_coordinates: {
        Args: { gig_id: string }
        Returns: {
          latitude: number
          longitude: number
        }[]
      }
      get_marketplace_conversation_context: {
        Args: { p_conversation_id: string }
        Returns: {
          listing_category: string
          listing_id: string
          listing_mode: string
          listing_title: string
          owner_handle: string
          owner_id: string
          owner_name: string
          owner_verified: boolean
        }[]
      }
      get_marketplace_conversation_participants: {
        Args: { p_conversation_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          handle: string
          user_id: string
          verified_id: boolean
        }[]
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_request_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_treatment_with_versions: {
        Args: { p_treatment_id: string }
        Returns: {
          treatment: Json
          versions: Json
        }[]
      }
      get_user_badges: {
        Args: { p_user_id: string }
        Returns: {
          awarded_at: string
          background_color: string
          badge_category: Database["public"]["Enums"]["badge_category"]
          badge_description: string
          badge_name: string
          badge_slug: string
          badge_type: Database["public"]["Enums"]["badge_type"]
          color: string
          icon: string
          is_featured: boolean
          rarity: string
          verified_data: Json
        }[]
      }
      get_user_gig_recommendations: {
        Args: { p_limit?: number; p_profile_id: string }
        Returns: {
          data: Json
          id: string
          type: string
        }[]
      }
      get_user_subscription_benefits: {
        Args: { p_user_id: string }
        Returns: {
          benefit_type: string
          benefit_value: Json
          monthly_limit: number
          remaining: number
          used_this_month: number
        }[]
      }
      get_user_verification_status: {
        Args: { p_user_id: string }
        Returns: {
          business_expires_at: string
          has_verified_business: boolean
          has_verified_identity: boolean
          has_verified_professional: boolean
          identity_expires_at: string
          professional_expires_at: string
        }[]
      }
      get_user_violation_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_violation_summary: {
        Args: { p_user_id: string }
        Returns: {
          active_violations: number
          critical_count: number
          last_violation_date: string
          minor_count: number
          moderate_count: number
          risk_level: string
          severe_count: number
          total_violations: number
        }[]
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_profile_views: {
        Args: { profile_id: string }
        Returns: undefined
      }
      initialize_subscription_benefits: {
        Args: {
          p_subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          p_user_id: string
        }
        Returns: undefined
      }
      is_user_suspended_or_banned: {
        Args: { p_user_id: string }
        Returns: {
          ban_reason: string
          is_banned: boolean
          is_suspended: boolean
          suspension_expires_at: string
        }[]
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      notify_listing_event: {
        Args: {
          p_custom_message?: string
          p_event_type: string
          p_listing_id: string
          p_recipient_id: string
          p_sender_id?: string
        }
        Returns: string
      }
      notify_order_event: {
        Args: {
          p_custom_message?: string
          p_event_type: string
          p_order_id: string
          p_order_type: string
          p_recipient_id: string
        }
        Returns: string
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: number
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      process_credit_refund: {
        Args: {
          p_credits?: number
          p_reason?: string
          p_task_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      refund_user_credits: {
        Args: {
          p_credits: number
          p_enhancement_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      reject_verification_request: {
        Args: {
          p_rejection_reason: string
          p_request_id: string
          p_review_notes?: string
          p_reviewer_id: string
        }
        Returns: undefined
      }
      remove_badge: {
        Args: { p_badge_slug: string; p_user_id: string }
        Returns: boolean
      }
      reset_monthly_subscription_benefits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      set_gig_location: {
        Args: { p_gig_id: string; p_latitude: number; p_longitude: number }
        Returns: boolean
      }
      set_gig_preferences: {
        Args: { p_gig_id: string; p_preferences: Json }
        Returns: boolean
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; rel?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; options?: string; radius: number }
          | { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { dm?: number; dx: number; dy: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { font?: Json; letters: string }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { from_proj: string; geom: unknown; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      sync_analytics_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      track_treatment_view: {
        Args: {
          p_ip_address?: unknown
          p_referrer?: string
          p_session_id?: string
          p_treatment_id: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_user_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_reference_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: {
          consumed_this_month: number | null
          created_at: string | null
          current_balance: number | null
          id: string
          last_reset_at: string | null
          lifetime_consumed: number | null
          monthly_allowance: number | null
          subscription_tier: string
          updated_at: string | null
          user_id: string | null
        }
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      validate_review_order_reference: {
        Args: { p_order_id: string; p_order_type: string }
        Returns: boolean
      }
      verify_user_age: {
        Args: {
          p_date_of_birth: string
          p_method?: string
          p_user_id: string
          p_verified_by?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      application_status:
        | "PENDING"
        | "SHORTLISTED"
        | "ACCEPTED"
        | "DECLINED"
        | "WITHDRAWN"
      badge_category:
        | "identity"
        | "platform"
        | "community"
        | "achievement"
        | "special"
      badge_type:
        | "verification"
        | "achievement"
        | "subscription"
        | "special"
        | "moderation"
      compensation_type: "TFP" | "PAID" | "EXPENSES"
      gig_purpose:
        | "PORTFOLIO"
        | "COMMERCIAL"
        | "EDITORIAL"
        | "FASHION"
        | "BEAUTY"
        | "LIFESTYLE"
        | "WEDDING"
        | "EVENT"
        | "PRODUCT"
        | "ARCHITECTURE"
        | "STREET"
        | "CONCEPTUAL"
        | "OTHER"
      gig_status:
        | "DRAFT"
        | "PUBLISHED"
        | "APPLICATIONS_CLOSED"
        | "BOOKED"
        | "COMPLETED"
        | "CANCELLED"
      media_type: "IMAGE" | "VIDEO" | "PDF"
      showcase_visibility: "DRAFT" | "PUBLIC" | "PRIVATE"
      subscription_status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "TRIAL"
      subscription_tier: "FREE" | "PLUS" | "PRO"
      treatment_format:
        | "film_tv"
        | "documentary"
        | "commercial_brand"
        | "music_video"
        | "short_social"
        | "corporate_promo"
      treatment_status: "draft" | "published" | "archived"
      treatment_theme:
        | "cinematic"
        | "minimal"
        | "editorial"
        | "bold_art"
        | "brand_deck"
      user_role: "CONTRIBUTOR" | "TALENT" | "ADMIN" | "USER" | "MODERATOR"
      verification_status: "UNVERIFIED" | "EMAIL_VERIFIED" | "ID_VERIFIED"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
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
      application_status: [
        "PENDING",
        "SHORTLISTED",
        "ACCEPTED",
        "DECLINED",
        "WITHDRAWN",
      ],
      badge_category: [
        "identity",
        "platform",
        "community",
        "achievement",
        "special",
      ],
      badge_type: [
        "verification",
        "achievement",
        "subscription",
        "special",
        "moderation",
      ],
      compensation_type: ["TFP", "PAID", "EXPENSES"],
      gig_purpose: [
        "PORTFOLIO",
        "COMMERCIAL",
        "EDITORIAL",
        "FASHION",
        "BEAUTY",
        "LIFESTYLE",
        "WEDDING",
        "EVENT",
        "PRODUCT",
        "ARCHITECTURE",
        "STREET",
        "CONCEPTUAL",
        "OTHER",
      ],
      gig_status: [
        "DRAFT",
        "PUBLISHED",
        "APPLICATIONS_CLOSED",
        "BOOKED",
        "COMPLETED",
        "CANCELLED",
      ],
      media_type: ["IMAGE", "VIDEO", "PDF"],
      showcase_visibility: ["DRAFT", "PUBLIC", "PRIVATE"],
      subscription_status: ["ACTIVE", "CANCELLED", "EXPIRED", "TRIAL"],
      subscription_tier: ["FREE", "PLUS", "PRO"],
      treatment_format: [
        "film_tv",
        "documentary",
        "commercial_brand",
        "music_video",
        "short_social",
        "corporate_promo",
      ],
      treatment_status: ["draft", "published", "archived"],
      treatment_theme: [
        "cinematic",
        "minimal",
        "editorial",
        "bold_art",
        "brand_deck",
      ],
      user_role: ["CONTRIBUTOR", "TALENT", "ADMIN", "USER", "MODERATOR"],
      verification_status: ["UNVERIFIED", "EMAIL_VERIFIED", "ID_VERIFIED"],
    },
  },
} as const
