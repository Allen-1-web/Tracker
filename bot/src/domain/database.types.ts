/**
 * Минимальный snapshot Database-типа для bot-сервиса.
 * Источник истины: frontend/lib/supabase/database.types.ts.
 *
 * Этап 1 включает только таблицы, к которым обращается бот в фоне.
 * Остальные будут добавлены по мере появления repositories на следующих этапах.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ReminderKind =
  | 'habit'
  | 'goal'
  | 'nutrition'
  | 'water'
  | 'sleep'
  | 'workout'
  | 'custom'

export type NotificationStatus =
  | 'queued'
  | 'sent'
  | 'failed'
  | 'skipped_quiet_hours'
  | 'skipped_disabled'
  | 'skipped_blocked'

export type Database = {
  public: {
    Tables: {
      telegram_users: {
        Row: {
          user_id: string
          telegram_chat_id: number
          telegram_user_id: number
          username: string | null
          first_name: string | null
          last_name: string | null
          language_code: string | null
          timezone: string
          quiet_hours_start: string | null
          quiet_hours_end: string | null
          is_blocked: boolean
          linked_at: string
          last_seen_at: string | null
        }
        Insert: {
          user_id: string
          telegram_chat_id: number
          telegram_user_id: number
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          language_code?: string | null
          timezone?: string
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          is_blocked?: boolean
          linked_at?: string
          last_seen_at?: string | null
        }
        Update: {
          telegram_chat_id?: number
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          language_code?: string | null
          timezone?: string
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          is_blocked?: boolean
          last_seen_at?: string | null
        }
        Relationships: []
      }
      telegram_link_tokens: {
        Row: {
          token: string
          user_id: string
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          token: string
          user_id: string
          expires_at: string
          used_at?: string | null
          created_at?: string
        }
        Update: { used_at?: string | null }
        Relationships: []
      }
      telegram_sessions: {
        Row: { chat_id: number; state: Json; updated_at: string }
        Insert: { chat_id: number; state?: Json; updated_at?: string }
        Update: { state?: Json; updated_at?: string }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          user_id: string
          daily_summary: boolean
          daily_summary_time: string
          weekly_report: boolean
          weekly_report_dow: number
          weekly_report_time: string
          hydration: boolean
          hydration_interval_minutes: number
          hydration_start_time: string
          hydration_end_time: string
          nutrition_reminders: boolean
          habit_reminders: boolean
          goal_deadline_reminders: boolean
          missed_habit_alerts: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          daily_summary?: boolean
          daily_summary_time?: string
          weekly_report?: boolean
          weekly_report_dow?: number
          weekly_report_time?: string
          hydration?: boolean
          hydration_interval_minutes?: number
          hydration_start_time?: string
          hydration_end_time?: string
          nutrition_reminders?: boolean
          habit_reminders?: boolean
          goal_deadline_reminders?: boolean
          missed_habit_alerts?: boolean
          updated_at?: string
        }
        Update: Partial<
          Omit<
            Database['public']['Tables']['notification_preferences']['Row'],
            'user_id' | 'updated_at'
          >
        > & { updated_at?: string }
        Relationships: []
      }
      reminder_schedules: {
        Row: {
          id: string
          user_id: string
          kind: ReminderKind
          ref_id: string | null
          title: string
          message: string | null
          cron: string
          timezone: string
          enabled: boolean
          next_run_at: string | null
          last_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: ReminderKind
          ref_id?: string | null
          title: string
          message?: string | null
          cron: string
          timezone: string
          enabled?: boolean
          next_run_at?: string | null
          last_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          kind?: ReminderKind
          ref_id?: string | null
          title?: string
          message?: string | null
          cron?: string
          timezone?: string
          enabled?: boolean
          next_run_at?: string | null
          last_run_at?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string
          reminder_id: string | null
          kind: string
          channel: string
          status: NotificationStatus
          payload: Json | null
          error: string | null
          attempt: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reminder_id?: string | null
          kind: string
          channel?: string
          status: NotificationStatus
          payload?: Json | null
          error?: string | null
          attempt?: number
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          role: 'user' | 'admin'
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
        Insert: { id: string }
        Update: { telegram_connected?: boolean; telegram_username?: string | null }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          icon: string
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
        Update: { completed?: boolean }
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
          description?: string | null
          type?: string
          target_value?: number
          current_value?: number
          unit?: string | null
          deadline?: string
          category_id?: string | null
          linked_habit_ids?: string[]
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
    }
    Views: Record<string, never>
    Functions: {
      ensure_notification_prefs: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
