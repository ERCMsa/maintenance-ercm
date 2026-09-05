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
      categories: {
        Row: {
          created_at: string
          icone: string
          id: string
          nom: string
          ordre: number
        }
        Insert: {
          created_at?: string
          icone?: string
          id?: string
          nom: string
          ordre?: number
        }
        Update: {
          created_at?: string
          icone?: string
          id?: string
          nom?: string
          ordre?: number
        }
        Relationships: []
      }
      materiel: {
        Row: {
          annee: number | null
          capacite: string | null
          categorie_id: string
          created_at: string
          date_controle_technique: string | null
          date_debut_assurance: string | null
          date_dernier_entretien: string | null
          date_derniere_maj: string
          date_fin_assurance: string | null
          date_prochain_controle_technique: string | null
          date_prochain_entretien: string | null
          emplacement: string
          etat: Database["public"]["Enums"]["etat_materiel"]
          id: string
          identifiant_complementaire: string | null
          nom: string
          notes: string | null
        }
        Insert: {
          annee?: number | null
          capacite?: string | null
          categorie_id: string
          created_at?: string
          date_controle_technique?: string | null
          date_debut_assurance?: string | null
          date_dernier_entretien?: string | null
          date_derniere_maj?: string
          date_fin_assurance?: string | null
          date_prochain_controle_technique?: string | null
          date_prochain_entretien?: string | null
          emplacement?: string
          etat?: Database["public"]["Enums"]["etat_materiel"]
          id?: string
          identifiant_complementaire?: string | null
          nom: string
          notes?: string | null
        }
        Update: {
          annee?: number | null
          capacite?: string | null
          categorie_id?: string
          created_at?: string
          date_controle_technique?: string | null
          date_debut_assurance?: string | null
          date_dernier_entretien?: string | null
          date_derniere_maj?: string
          date_fin_assurance?: string | null
          date_prochain_controle_technique?: string | null
          date_prochain_entretien?: string | null
          emplacement?: string
          etat?: Database["public"]["Enums"]["etat_materiel"]
          id?: string
          identifiant_complementaire?: string | null
          nom?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiel_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      materiel_historique: {
        Row: {
          ancienne_valeur: string | null
          champ: string
          created_at: string
          id: string
          materiel_id: string
          nouvelle_valeur: string | null
        }
        Insert: {
          ancienne_valeur?: string | null
          champ: string
          created_at?: string
          id?: string
          materiel_id: string
          nouvelle_valeur?: string | null
        }
        Update: {
          ancienne_valeur?: string | null
          champ?: string
          created_at?: string
          id?: string
          materiel_id?: string
          nouvelle_valeur?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiel_historique_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel"
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
      etat_materiel: "Bon état" | "État moyen" | "Mauvais état"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      etat_materiel: ["Bon état", "État moyen", "Mauvais état"],
    },
  },
} as const
