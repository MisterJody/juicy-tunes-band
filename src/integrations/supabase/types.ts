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
<<<<<<< HEAD
      Juicybandapp: {
        Row: {
          created_at: string
          id: number
          Nummers: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          Nummers?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          Nummers?: number | null
=======
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
>>>>>>> 69b730849c5f7566b18c637629089ebfdefbcce6
        }
        Relationships: []
      }
      setlist_songs: {
        Row: {
<<<<<<< HEAD
          created_at: string
          id: string
          notes: string | null
          position: number
          set_number: number
          setlist_id: string
          song_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          position: number
          set_number?: number
          setlist_id: string
          song_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          position?: number
          set_number?: number
          setlist_id?: string
          song_id?: string
=======
          created_at: string | null
          id: string
          notes: string | null
          position: number
          set_number: number | null
          setlist_id: string | null
          song_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          position: number
          set_number?: number | null
          setlist_id?: string | null
          song_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          position?: number
          set_number?: number | null
          setlist_id?: string | null
          song_id?: string | null
>>>>>>> 69b730849c5f7566b18c637629089ebfdefbcce6
        }
        Relationships: [
          {
            foreignKeyName: "setlist_songs_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      setlists: {
        Row: {
<<<<<<< HEAD
          created_at: string
=======
          created_at: string | null
>>>>>>> 69b730849c5f7566b18c637629089ebfdefbcce6
          description: string | null
          gig_date: string | null
          gig_name: string | null
          id: string
          name: string
<<<<<<< HEAD
          updated_at: string
        }
        Insert: {
          created_at?: string
=======
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
>>>>>>> 69b730849c5f7566b18c637629089ebfdefbcce6
          description?: string | null
          gig_date?: string | null
          gig_name?: string | null
          id?: string
          name: string
<<<<<<< HEAD
          updated_at?: string
        }
        Update: {
          created_at?: string
=======
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
>>>>>>> 69b730849c5f7566b18c637629089ebfdefbcce6
          description?: string | null
          gig_date?: string | null
          gig_name?: string | null
          id?: string
          name?: string
<<<<<<< HEAD
          updated_at?: string
=======
          updated_at?: string | null
          user_id?: string | null
>>>>>>> 69b730849c5f7566b18c637629089ebfdefbcce6
        }
        Relationships: []
      }
      songs: {
        Row: {
          album: string
          album_art_url: string | null
          artist: string
          audio_file_url: string | null
          duration: string
          has_lyrics: boolean | null
          id: string
          lyrics_file_url: string | null
          lyrics_text: string | null
          song_key: string | null
          tempo: number | null
          title: string
<<<<<<< HEAD
          upload_date: string
=======
          upload_date: string | null
          user_id: string | null
>>>>>>> 69b730849c5f7566b18c637629089ebfdefbcce6
        }
        Insert: {
          album: string
          album_art_url?: string | null
          artist: string
          audio_file_url?: string | null
          duration: string
          has_lyrics?: boolean | null
          id?: string
          lyrics_file_url?: string | null
          lyrics_text?: string | null
          song_key?: string | null
          tempo?: number | null
          title: string
<<<<<<< HEAD
          upload_date?: string
=======
          upload_date?: string | null
          user_id?: string | null
>>>>>>> 69b730849c5f7566b18c637629089ebfdefbcce6
        }
        Update: {
          album?: string
          album_art_url?: string | null
          artist?: string
          audio_file_url?: string | null
          duration?: string
          has_lyrics?: boolean | null
          id?: string
          lyrics_file_url?: string | null
          lyrics_text?: string | null
          song_key?: string | null
          tempo?: number | null
          title?: string
<<<<<<< HEAD
          upload_date?: string
=======
          upload_date?: string | null
          user_id?: string | null
>>>>>>> 69b730849c5f7566b18c637629089ebfdefbcce6
        }
        Relationships: []
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
    Enums: {},
  },
} as const
