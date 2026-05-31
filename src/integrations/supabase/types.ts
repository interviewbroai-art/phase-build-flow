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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      interview_sessions: {
        Row: {
          communication_score: number | null
          company_type: string | null
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          depth: string
          difficulty: string
          duration_seconds: number
          experience_level: string
          feedback: Json | null
          id: string
          interview_type: string
          job_role: string
          language: string
          mode: string
          notes: string | null
          overall_score: number | null
          status: string
          technical_score: number | null
          user_id: string
        }
        Insert: {
          communication_score?: number | null
          company_type?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          depth?: string
          difficulty?: string
          duration_seconds?: number
          experience_level: string
          feedback?: Json | null
          id?: string
          interview_type: string
          job_role: string
          language?: string
          mode?: string
          notes?: string | null
          overall_score?: number | null
          status?: string
          technical_score?: number | null
          user_id: string
        }
        Update: {
          communication_score?: number | null
          company_type?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          depth?: string
          difficulty?: string
          duration_seconds?: number
          experience_level?: string
          feedback?: Json | null
          id?: string
          interview_type?: string
          job_role?: string
          language?: string
          mode?: string
          notes?: string | null
          overall_score?: number | null
          status?: string
          technical_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_paise: number
          created_at: string
          currency: string
          id: string
          method: string | null
          notes: Json | null
          paid_at: string | null
          plan: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          receipt_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          notes?: Json | null
          paid_at?: string | null
          plan: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          receipt_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          notes?: Json | null
          paid_at?: string | null
          plan?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          receipt_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          default_depth: string
          default_difficulty: string
          default_experience_level: string | null
          default_interview_mode: string
          default_job_role: string | null
          display_name: string | null
          id: string
          last_active_date: string | null
          level: number
          longest_streak: number
          onboarding_completed: boolean
          plan: string
          plan_expires_at: string | null
          plan_started_at: string | null
          preferred_language: string
          resume_summary: string | null
          resume_text: string | null
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          default_depth?: string
          default_difficulty?: string
          default_experience_level?: string | null
          default_interview_mode?: string
          default_job_role?: string | null
          display_name?: string | null
          id: string
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          onboarding_completed?: boolean
          plan?: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          preferred_language?: string
          resume_summary?: string | null
          resume_text?: string | null
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          default_depth?: string
          default_difficulty?: string
          default_experience_level?: string | null
          default_interview_mode?: string
          default_job_role?: string | null
          display_name?: string | null
          id?: string
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          onboarding_completed?: boolean
          plan?: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          preferred_language?: string
          resume_summary?: string | null
          resume_text?: string | null
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp_and_streak: {
        Args: { p_user: string; p_xp: number }
        Returns: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          default_depth: string
          default_difficulty: string
          default_experience_level: string | null
          default_interview_mode: string
          default_job_role: string | null
          display_name: string | null
          id: string
          last_active_date: string | null
          level: number
          longest_streak: number
          onboarding_completed: boolean
          plan: string
          plan_expires_at: string | null
          plan_started_at: string | null
          preferred_language: string
          resume_summary: string | null
          resume_text: string | null
          updated_at: string
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_interview_session: {
        Args: {
          p_communication: number
          p_confidence: number
          p_duration: number
          p_feedback?: Json
          p_overall: number
          p_session: string
          p_technical: number
        }
        Returns: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          default_depth: string
          default_difficulty: string
          default_experience_level: string | null
          default_interview_mode: string
          default_job_role: string | null
          display_name: string | null
          id: string
          last_active_date: string | null
          level: number
          longest_streak: number
          onboarding_completed: boolean
          plan: string
          plan_expires_at: string | null
          plan_started_at: string | null
          preferred_language: string
          resume_summary: string | null
          resume_text: string | null
          updated_at: string
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
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
