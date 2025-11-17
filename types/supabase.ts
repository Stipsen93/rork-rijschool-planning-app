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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'instructor' | 'student'
          phone: string | null
          avatar_url: string | null
          drivingschool_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: 'instructor' | 'student'
          phone?: string | null
          avatar_url?: string | null
          drivingschool_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'instructor' | 'student'
          phone?: string | null
          avatar_url?: string | null
          drivingschool_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      drivingschools: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      instructor_profiles: {
        Row: {
          id: string
          user_id: string
          instructor_number: string | null
          company_name: string | null
          license_number: string | null
          bio: string | null
          rating: number
          total_lessons: number
          years_experience: number | null
          specializations: string[] | null
          working_hours: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          instructor_number?: string | null
          company_name?: string | null
          license_number?: string | null
          bio?: string | null
          rating?: number
          total_lessons?: number
          years_experience?: number | null
          specializations?: string[] | null
          working_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          instructor_number?: string | null
          company_name?: string | null
          license_number?: string | null
          bio?: string | null
          rating?: number
          total_lessons?: number
          years_experience?: number | null
          specializations?: string[] | null
          working_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      student_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          birth_date: string | null
          address: string | null
          parent_name: string | null
          parent_phone: string | null
          lesson_streak: number
          level: string | null
          total_lessons_completed: number
          hours_driven: number
          overall_progress: number
          instructor_id: string | null
          package_id: string | null
          learning_preferences: Json | null
          skills_progress: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          birth_date?: string | null
          address?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          lesson_streak?: number
          level?: string | null
          total_lessons_completed?: number
          hours_driven?: number
          overall_progress?: number
          instructor_id?: string | null
          package_id?: string | null
          learning_preferences?: Json | null
          skills_progress?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          birth_date?: string | null
          address?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          lesson_streak?: number
          level?: string | null
          total_lessons_completed?: number
          hours_driven?: number
          overall_progress?: number
          instructor_id?: string | null
          package_id?: string | null
          learning_preferences?: Json | null
          skills_progress?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          instructor_id: string
          student_id: string
          title: string
          lesson_type: string
          start_time: string
          end_time: string
          duration: number
          location: string | null
          pickup_location: string | null
          vehicle_id: string | null
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          instructor_notes: string | null
          student_notes: string | null
          rating: number | null
          skills_improved: string[] | null
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          student_id: string
          title: string
          lesson_type: string
          start_time: string
          end_time: string
          duration: number
          location?: string | null
          pickup_location?: string | null
          vehicle_id?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          instructor_notes?: string | null
          student_notes?: string | null
          rating?: number | null
          skills_improved?: string[] | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          student_id?: string
          title?: string
          lesson_type?: string
          start_time?: string
          end_time?: string
          duration?: number
          location?: string | null
          pickup_location?: string | null
          vehicle_id?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          instructor_notes?: string | null
          student_notes?: string | null
          rating?: number | null
          skills_improved?: string[] | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          instructor_id: string
          name: string
          description: string | null
          total_hours: number
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          name: string
          description?: string | null
          total_hours: number
          price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          name?: string
          description?: string | null
          total_hours?: number
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          instructor_id: string
          make: string
          model: string
          year: number
          license_plate: string
          transmission: 'manual' | 'automatic'
          fuel_type: string | null
          color: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          make: string
          model: string
          year: number
          license_plate: string
          transmission: 'manual' | 'automatic'
          fuel_type?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          make?: string
          model?: string
          year?: number
          license_plate?: string
          transmission?: 'manual' | 'automatic'
          fuel_type?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      student_packages: {
        Row: {
          id: string
          student_id: string
          package_id: string
          total_hours: number
          hours_used: number
          hours_remaining: number
          price_total: number
          price_paid: number
          price_remaining: number
          status: 'active' | 'completed' | 'expired' | 'cancelled'
          start_date: string
          expiry_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          package_id: string
          total_hours: number
          hours_used?: number
          price_total: number
          price_paid?: number
          status?: 'active' | 'completed' | 'expired' | 'cancelled'
          start_date?: string
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          package_id?: string
          total_hours?: number
          hours_used?: number
          price_total?: number
          price_paid?: number
          status?: 'active' | 'completed' | 'expired' | 'cancelled'
          start_date?: string
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          instructor_id: string
          name: string
          description: string | null
          category: 'exam' | 'theory' | 'material' | 'other'
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          name: string
          description?: string | null
          category: 'exam' | 'theory' | 'material' | 'other'
          price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          name?: string
          description?: string | null
          category?: 'exam' | 'theory' | 'material' | 'other'
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      student_products: {
        Row: {
          id: string
          student_id: string
          product_id: string
          quantity: number
          quantity_used: number
          quantity_remaining: number
          price_total: number
          price_paid: number
          price_remaining: number
          status: 'active' | 'used' | 'expired' | 'cancelled'
          purchase_date: string
          expiry_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          product_id: string
          quantity?: number
          quantity_used?: number
          price_total: number
          price_paid?: number
          status?: 'active' | 'used' | 'expired' | 'cancelled'
          purchase_date?: string
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          product_id?: string
          quantity?: number
          quantity_used?: number
          price_total?: number
          price_paid?: number
          status?: 'active' | 'used' | 'expired' | 'cancelled'
          purchase_date?: string
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'instructor' | 'student'
      lesson_status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
      transmission_type: 'manual' | 'automatic'
      package_status: 'active' | 'completed' | 'expired' | 'cancelled'
      product_status: 'active' | 'used' | 'expired' | 'cancelled'
      product_category: 'exam' | 'theory' | 'material' | 'other'
    }
  }
}
