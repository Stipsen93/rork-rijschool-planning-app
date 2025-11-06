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
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      instructor_profiles: {
        Row: {
          id: string
          user_id: string
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
    }
  }
}
