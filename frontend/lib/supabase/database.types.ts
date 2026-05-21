export type UserRole = 'user' | 'admin'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          name: string | null
          email: string | null
          avatar_url: string | null
          telegram_connected: boolean
          telegram_username: string | null
          theme: string
          reminder_time: string | null
          reminders_enabled: boolean
          updated_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          telegram_connected?: boolean
          telegram_username?: string | null
          theme?: string
          reminder_time?: string | null
          reminders_enabled?: boolean
          updated_at?: string
        }
        Update: {
          role?: UserRole
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          telegram_connected?: boolean
          telegram_username?: string | null
          theme?: string
          reminder_time?: string | null
          reminders_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          icon: string
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
          icon?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          category_id: string | null
          frequency: Json
          created_at: string
          is_archived: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon: string
          color: string
          category_id?: string | null
          frequency: Json
          created_at?: string
          is_archived?: boolean
        }
        Update: {
          name?: string
          icon?: string
          color?: string
          category_id?: string | null
          /** Legacy text column when category_id migration not applied */
          category?: string
          frequency?: Json
          is_archived?: boolean
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          habit_id: string
          user_id: string
          log_date: string
          completed: boolean
        }
        Insert: {
          habit_id: string
          user_id: string
          log_date: string
          completed?: boolean
        }
        Update: {
          completed?: boolean
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          type: string
          target_value: number
          current_value: number
          unit: string | null
          deadline: string
          category_id: string | null
          linked_habit_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          title?: string
          description?: string | null
          type: string
          target_value: number
          current_value?: number
          unit?: string | null
          deadline: string
          category_id?: string | null
          linked_habit_ids?: string[]
          created_at?: string
        }
        Update: {
          name?: string
          title?: string
          description?: string | null
          type?: string
          target_value?: number
          current_value?: number
          unit?: string | null
          deadline?: string
          category_id?: string | null
          /** Legacy text column when category_id migration not applied */
          category?: string
          linked_habit_ids?: string[]
        }
        Relationships: []
      }
      goal_progress: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          progress_date: string
          value: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          progress_date: string
          value: number
          note?: string | null
          created_at?: string
        }
        Update: {
          value?: number
          note?: string | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          id: string
          name: string
          calories: number
          protein: number
          fat: number
          carbs: number
          category: string
        }
        Insert: {
          id?: string
          name: string
          calories: number
          protein: number
          fat: number
          carbs: number
          category: string
        }
        Update: {
          name?: string
          calories?: number
          protein?: number
          fat?: number
          carbs?: number
          category?: string
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          id: string
          user_id: string
          food_id: string
          entry_date: string
          meal_type: string
          amount: number
          calories: number
          protein: number
          fat: number
          carbs: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          food_id: string
          entry_date: string
          meal_type: string
          amount: number
          calories: number
          protein: number
          fat: number
          carbs: number
          created_at?: string
        }
        Update: {
          food_id?: string
          entry_date?: string
          meal_type?: string
          amount?: number
          calories?: number
          protein?: number
          fat?: number
          carbs?: number
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          user_id: string
          calories: number
          protein: number
          fat: number
          carbs: number
        }
        Insert: {
          user_id: string
          calories: number
          protein: number
          fat: number
          carbs: number
        }
        Update: {
          calories?: number
          protein?: number
          fat?: number
          carbs?: number
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource?: string | null
          details?: Json
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      admin_set_user_role: {
        Args: { target_user_id: string; new_role: UserRole }
        Returns: undefined
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
