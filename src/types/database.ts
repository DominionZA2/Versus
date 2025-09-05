export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      comparisons: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      contenders: {
        Row: {
          id: string
          comparison_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          comparison_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          comparison_id?: string
          name?: string
          created_at?: string
        }
      }
    }
  }
}