export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string | null
          energy_level: string
          hunger_level: string
          id: string
          notes: string | null
          pet_id: string
          stool_consistency: string
          thirst_level: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string | null
          energy_level: string
          hunger_level: string
          id?: string
          notes?: string | null
          pet_id: string
          stool_consistency: string
          thirst_level: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string | null
          energy_level?: string
          hunger_level?: string
          id?: string
          notes?: string | null
          pet_id?: string
          stool_consistency?: string
          thirst_level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_condition_summary"
            referencedColumns: ["pet_id"]
          },
          {
            foreignKeyName: "daily_checkins_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_knowledge: {
        Row: {
          age_group: string | null
          breeds_at_risk: string[] | null
          disease: string
          disease_category: string | null
          gender_risk: string | null
          id: number
          is_genetic: boolean | null
          is_vaccine_preventable: boolean | null
          pet_type: string | null
          recommended_tests: string | null
          region_climate: string | null
          seasonality: string | null
          symptoms: string[] | null
          watch_signs: string | null
        }
        Insert: {
          age_group?: string | null
          breeds_at_risk?: string[] | null
          disease: string
          disease_category?: string | null
          gender_risk?: string | null
          id?: number
          is_genetic?: boolean | null
          is_vaccine_preventable?: boolean | null
          pet_type?: string | null
          recommended_tests?: string | null
          region_climate?: string | null
          seasonality?: string | null
          symptoms?: string[] | null
          watch_signs?: string | null
        }
        Update: {
          age_group?: string | null
          breeds_at_risk?: string[] | null
          disease?: string
          disease_category?: string | null
          gender_risk?: string | null
          id?: number
          is_genetic?: boolean | null
          is_vaccine_preventable?: boolean | null
          pet_type?: string | null
          recommended_tests?: string | null
          region_climate?: string | null
          seasonality?: string | null
          symptoms?: string[] | null
          watch_signs?: string | null
        }
        Relationships: []
      }
      health_reports: {
        Row: {
          actual_report_date: string | null
          ai_analysis: string | null
          created_at: string | null
          extracted_text: string | null
          id: string
          image_url: string | null
          key_findings: string | null
          pet_id: string
          report_date: string
          report_type: string
          status: Database["public"]["Enums"]["report_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_report_date?: string | null
          ai_analysis?: string | null
          created_at?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          key_findings?: string | null
          pet_id: string
          report_date: string
          report_type: string
          status?: Database["public"]["Enums"]["report_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_report_date?: string | null
          ai_analysis?: string | null
          created_at?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          key_findings?: string | null
          pet_id?: string
          report_date?: string
          report_type?: string
          status?: Database["public"]["Enums"]["report_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_condition_summary"
            referencedColumns: ["pet_id"]
          },
          {
            foreignKeyName: "health_reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_logs: {
        Row: {
          created_at: string | null
          given_at: string
          given_by: string
          id: string
          medication_name: string
          notes: string | null
          prescription_id: string
        }
        Insert: {
          created_at?: string | null
          given_at: string
          given_by: string
          id?: string
          medication_name: string
          notes?: string | null
          prescription_id: string
        }
        Update: {
          created_at?: string | null
          given_at?: string
          given_by?: string
          id?: string
          medication_name?: string
          notes?: string | null
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_conditions: {
        Row: {
          condition_name: string
          created_at: string | null
          diagnosed_date: string | null
          id: string
          notes: string | null
          pet_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          condition_name: string
          created_at?: string | null
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          pet_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          condition_name?: string
          created_at?: string | null
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          pet_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_conditions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_condition_summary"
            referencedColumns: ["pet_id"]
          },
          {
            foreignKeyName: "pet_conditions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_parents: {
        Row: {
          added_by: string
          created_at: string | null
          id: string
          permissions: Json | null
          pet_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string | null
          id?: string
          permissions?: Json | null
          pet_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string | null
          id?: string
          permissions?: Json | null
          pet_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_parents_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_condition_summary"
            referencedColumns: ["pet_id"]
          },
          {
            foreignKeyName: "pet_parents_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: number
          age_months: number | null
          age_years: number | null
          breed: string
          created_at: string | null
          current_diet: string | null
          food_allergies: string[] | null
          gender: Database["public"]["Enums"]["pet_gender_new"] | null
          id: string
          is_spayed_neutered: boolean | null
          microchip_id: string | null
          name: string
          notes: string | null
          owner_id: string
          photo_url: string | null
          pre_existing_conditions: string[] | null
          reproductive_status: string | null
          special_conditions: string[] | null
          species: string
          type: Database["public"]["Enums"]["pet_type"]
          updated_at: string | null
          user_id: string
          weight: number
          weight_kg: number | null
        }
        Insert: {
          age: number
          age_months?: number | null
          age_years?: number | null
          breed: string
          created_at?: string | null
          current_diet?: string | null
          food_allergies?: string[] | null
          gender?: Database["public"]["Enums"]["pet_gender_new"] | null
          id?: string
          is_spayed_neutered?: boolean | null
          microchip_id?: string | null
          name: string
          notes?: string | null
          owner_id: string
          photo_url?: string | null
          pre_existing_conditions?: string[] | null
          reproductive_status?: string | null
          special_conditions?: string[] | null
          species: string
          type: Database["public"]["Enums"]["pet_type"]
          updated_at?: string | null
          user_id: string
          weight: number
          weight_kg?: number | null
        }
        Update: {
          age?: number
          age_months?: number | null
          age_years?: number | null
          breed?: string
          created_at?: string | null
          current_diet?: string | null
          food_allergies?: string[] | null
          gender?: Database["public"]["Enums"]["pet_gender_new"] | null
          id?: string
          is_spayed_neutered?: boolean | null
          microchip_id?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          photo_url?: string | null
          pre_existing_conditions?: string[] | null
          reproductive_status?: string | null
          special_conditions?: string[] | null
          species?: string
          type?: Database["public"]["Enums"]["pet_type"]
          updated_at?: string | null
          user_id?: string
          weight?: number
          weight_kg?: number | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          ai_analysis: string | null
          created_at: string | null
          extracted_text: string | null
          id: string
          image_url: string | null
          medications: Json | null
          pet_id: string
          prescribed_date: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          medications?: Json | null
          pet_id: string
          prescribed_date: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          medications?: Json | null
          pet_id?: string
          prescribed_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_condition_summary"
            referencedColumns: ["pet_id"]
          },
          {
            foreignKeyName: "prescriptions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      symptom_reports: {
        Row: {
          created_at: string | null
          diagnosis: string | null
          id: number
          notes: string | null
          pet_id: string | null
          photo_url: string | null
          reported_on: string
          symptoms: string[]
        }
        Insert: {
          created_at?: string | null
          diagnosis?: string | null
          id?: number
          notes?: string | null
          pet_id?: string | null
          photo_url?: string | null
          reported_on?: string
          symptoms: string[]
        }
        Update: {
          created_at?: string | null
          diagnosis?: string | null
          id?: number
          notes?: string | null
          pet_id?: string | null
          photo_url?: string | null
          reported_on?: string
          symptoms?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "symptom_reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_condition_summary"
            referencedColumns: ["pet_id"]
          },
          {
            foreignKeyName: "symptom_reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      walks: {
        Row: {
          created_at: string | null
          distance_meters: number | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          notes: string | null
          pet_id: string
          route_data: Json | null
          start_time: string
          user_id: string
          weather: string | null
        }
        Insert: {
          created_at?: string | null
          distance_meters?: number | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          pet_id: string
          route_data?: Json | null
          start_time: string
          user_id: string
          weather?: string | null
        }
        Update: {
          created_at?: string | null
          distance_meters?: number | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          pet_id?: string
          route_data?: Json | null
          start_time?: string
          user_id?: string
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "walks_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_condition_summary"
            referencedColumns: ["pet_id"]
          },
          {
            foreignKeyName: "walks_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pet_condition_summary: {
        Row: {
          condition_name: string | null
          created_at: string | null
          pet_id: string | null
          pet_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pet_gender_new: "male" | "female"
      pet_type: "dog" | "cat"
      report_status: "processing" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      pet_gender_new: ["male", "female"],
      pet_type: ["dog", "cat"],
      report_status: ["processing", "completed", "failed"],
    },
  },
} as const
