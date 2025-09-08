export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          handle: string;
          avatar_url?: string;
          bio?: string;
          city?: string;
          role_flags: string[];
          style_tags: string[];
          subscription_tier: string;
          subscription_status: string;
          subscription_started_at: string;
          subscription_expires_at?: string;
          verified_id: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          handle: string;
          avatar_url?: string;
          bio?: string;
          city?: string;
          role_flags?: string[];
          style_tags?: string[];
          subscription_tier?: string;
          subscription_status?: string;
          subscription_started_at?: string;
          subscription_expires_at?: string;
          verified_id?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          handle?: string;
          avatar_url?: string;
          bio?: string;
          city?: string;
          role_flags?: string[];
          style_tags?: string[];
          subscription_tier?: string;
          subscription_status?: string;
          subscription_started_at?: string;
          subscription_expires_at?: string;
          verified_id?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      gigs: {
        Row: {
          id: string;
          owner_user_id: string;
          title: string;
          description: string;
          comp_type: string;
          comp_details?: string;
          location_text: string;
          location?: any;
          radius_meters?: number;
          start_time: string;
          end_time: string;
          application_deadline: string;
          max_applicants: number;
          usage_rights: string;
          safety_notes?: string;
          status: string;
          boost_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          title: string;
          description: string;
          comp_type: string;
          comp_details?: string;
          location_text: string;
          location?: any;
          radius_meters?: number;
          start_time: string;
          end_time: string;
          application_deadline: string;
          max_applicants?: number;
          usage_rights: string;
          safety_notes?: string;
          status?: string;
          boost_level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          title?: string;
          description?: string;
          comp_type?: string;
          comp_details?: string;
          location_text?: string;
          location?: any;
          radius_meters?: number;
          start_time?: string;
          end_time?: string;
          application_deadline?: string;
          max_applicants?: number;
          usage_rights?: string;
          safety_notes?: string;
          status?: string;
          boost_level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          gig_id: string;
          applicant_user_id: string;
          note?: string;
          status: string;
          applied_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gig_id: string;
          applicant_user_id: string;
          note?: string;
          status?: string;
          applied_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gig_id?: string;
          applicant_user_id?: string;
          note?: string;
          status?: string;
          applied_at?: string;
          updated_at?: string;
        };
      };
      showcases: {
        Row: {
          id: string;
          gig_id: string;
          creator_user_id: string;
          talent_user_id: string;
          caption?: string;
          tags: string[];
          palette?: any;
          approved_by_creator_at?: string;
          approved_by_talent_at?: string;
          visibility: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gig_id: string;
          creator_user_id: string;
          talent_user_id: string;
          caption?: string;
          tags?: string[];
          palette?: any;
          approved_by_creator_at?: string;
          approved_by_talent_at?: string;
          visibility?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gig_id?: string;
          creator_user_id?: string;
          talent_user_id?: string;
          caption?: string;
          tags?: string[];
          palette?: any;
          approved_by_creator_at?: string;
          approved_by_talent_at?: string;
          visibility?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}