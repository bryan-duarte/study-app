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
      certifications: {
        Row: {
          created_at: string
          description: string | null
          exam_code: string | null
          id: string
          is_active: boolean
          name: string
          provider: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_code?: string | null
          id?: string
          is_active?: boolean
          name: string
          provider?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          provider?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      question_tags: {
        Row: {
          created_at: string
          id: string
          question_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_tags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          certification_id: string | null
          created_at: string | null
          difficulty: string | null
          domain: string | null
          id: string
          options: Json
          title: string
          topic: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          certification_id?: string | null
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          id?: string
          options: Json
          title: string
          topic?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          certification_id?: string | null
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          id?: string
          options?: Json
          title?: string
          topic?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_analytics: {
        Row: {
          completed_at: string | null
          correct_count: number
          created_at: string | null
          id: string
          percentage: number
          score: number
          session_id: string | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_count: number
          created_at?: string | null
          id?: string
          percentage: number
          score: number
          session_id?: string | null
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string | null
          id?: string
          percentage?: number
          score?: number
          session_id?: string | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_complete: boolean
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_questions: {
        Row: {
          answered_at: string | null
          created_at: string | null
          id: string
          is_correct: boolean | null
          question_id: string
          question_order: number
          selected_option_id: string | null
          session_id: string
        }
        Insert: {
          answered_at?: string | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          question_order: number
          selected_option_id?: string | null
          session_id: string
        }
        Update: {
          answered_at?: string | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          question_order?: number
          selected_option_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          answered_question_ids: string[]
          answers: Json
          completed_at: string | null
          confirmed_answers: Json
          created_at: string | null
          current_index: number
          current_session_question_ids: string[]
          id: string
          is_complete: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answered_question_ids?: string[]
          answers?: Json
          completed_at?: string | null
          confirmed_answers?: Json
          created_at?: string | null
          current_index?: number
          current_session_question_ids?: string[]
          id?: string
          is_complete?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answered_question_ids?: string[]
          answers?: Json
          completed_at?: string | null
          confirmed_answers?: Json
          created_at?: string | null
          current_index?: number
          current_session_question_ids?: string[]
          id?: string
          is_complete?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_question_history: {
        Row: {
          created_at: string | null
          first_answered_at: string
          id: string
          is_correct: boolean | null
          last_answered_at: string | null
          question_id: string
          selected_option_id: string | null
          times_answered: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          first_answered_at?: string
          id?: string
          is_correct?: boolean | null
          last_answered_at?: string | null
          question_id: string
          selected_option_id?: string | null
          times_answered?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_answered_at?: string
          id?: string
          is_correct?: boolean | null
          last_answered_at?: string | null
          question_id?: string
          selected_option_id?: string | null
          times_answered?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_user_question_answer: {
        Args: {
          p_is_correct: boolean
          p_question_id: string
          p_selected_option_id: string
          p_user_id: string
        }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
