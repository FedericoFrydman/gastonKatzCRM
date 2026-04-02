// Auto-generated from Supabase schema — re-run `supabase gen types typescript` after migrations

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      places: {
        Row: {
          id: string
          owner_id: string
          name: string
          address: string
          clarification: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          address: string
          clarification?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          address?: string
          clarification?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          owner_id: string
          name: string
          date: string
          start_time: string
          end_time: string | null
          place_id: string | null
          description: string | null
          status: EventStatus
          includes_lighting_budget: boolean
          image_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          date: string
          start_time: string
          end_time?: string | null
          place_id?: string | null
          description?: string | null
          status?: EventStatus
          includes_lighting_budget?: boolean
          image_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          date?: string
          start_time?: string
          end_time?: string | null
          place_id?: string | null
          description?: string | null
          status?: EventStatus
          includes_lighting_budget?: boolean
          image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_place_id_fkey'
            columns: ['place_id']
            isOneToOne: false
            referencedRelation: 'places'
            referencedColumns: ['id']
          },
        ]
      }
      event_payments: {
        Row: {
          id: string
          event_id: string
          amount: number
          type: PaymentType
          notes: string | null
          payment_date: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          amount: number
          type: PaymentType
          notes?: string | null
          payment_date: string
          created_at?: string
        }
        Update: {
          id?: string
          amount?: number
          type?: PaymentType
          notes?: string | null
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_payments_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      event_financials: {
        Row: {
          id: string
          event_id: string
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          total_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_financials_event_id_fkey'
            columns: ['event_id']
            isOneToOne: true
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      event_payment_summary: {
        Row: {
          event_id: string
          total_amount: number | null
          total_paid: number | null
          balance: number | null
          payment_status: PaymentStatus | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_status: EventStatus
      payment_type: PaymentType
      payment_status: PaymentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type EventStatus = 'confirmed' | 'query' | 'budget_pending' | 'reserved'
export type PaymentType = 'total' | 'partial'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
