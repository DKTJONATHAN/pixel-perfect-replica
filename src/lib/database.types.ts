/** Minimal typed shape for Supabase tables used by the app. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "admin" | "staff" | "student";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: AppRole;
          student_id: string | null;
          staff_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: AppRole;
          student_id?: string | null;
          staff_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      school_settings: {
        Row: {
          id: number;
          school_name: string;
          motto: string;
          address: string;
          phone: string;
          email: string;
          academic_year: string;
          current_term: string;
          currency: string;
          annual_leave_days: number;
          about: string;
          vision: string;
          mission: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["school_settings"]["Row"]> & { id?: number };
        Update: Partial<Database["public"]["Tables"]["school_settings"]["Row"]>;
      };
      classes: {
        Row: {
          id: string;
          name: string;
          stream: string;
          teacher_id: string | null;
          fee_per_term: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          stream?: string;
          teacher_id?: string | null;
          fee_per_term?: number;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
      };
      staff: {
        Row: {
          id: string;
          staff_no: string;
          full_name: string;
          gender: "Male" | "Female";
          dob: string | null;
          national_id: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          photo_url: string | null;
          role: string;
          department: string;
          qualifications: string | null;
          subjects: string[];
          employment_type: string;
          date_joined: string;
          salary: number;
          status: string;
          archived: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["staff"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
      };
      students: {
        Row: {
          id: string;
          admission_no: string;
          first_name: string;
          last_name: string;
          dob: string | null;
          gender: "Male" | "Female";
          class_id: string | null;
          photo_url: string | null;
          guardian_name: string | null;
          guardian_phone: string | null;
          guardian_email: string | null;
          address: string | null;
          medical_notes: string | null;
          emergency_contact: string | null;
          admission_date: string;
          status: string;
          archived: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["students"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      attendance: {
        Row: {
          id: string;
          date: string;
          student_id: string;
          class_id: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          date: string;
          student_id: string;
          class_id?: string | null;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
      };
      grades: {
        Row: {
          id: string;
          student_id: string;
          term: string;
          subject: string;
          score: number;
        };
        Insert: {
          id?: string;
          student_id: string;
          term: string;
          subject: string;
          score: number;
        };
        Update: Partial<Database["public"]["Tables"]["grades"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          receipt_no: string;
          student_id: string;
          term: string;
          amount: number;
          date: string;
          method: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_no: string;
          student_id: string;
          term: string;
          amount: number;
          date?: string;
          method?: string;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      leave_requests: {
        Row: {
          id: string;
          staff_id: string;
          type: string;
          date_from: string;
          date_to: string;
          days: number;
          reason: string;
          status: string;
          requested_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          type: string;
          date_from: string;
          date_to: string;
          days: number;
          reason: string;
          status?: string;
          requested_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leave_requests"]["Insert"]>;
      };
      activity_log: {
        Row: {
          id: string;
          at: string;
          actor: string;
          message: string;
        };
        Insert: {
          id?: string;
          at?: string;
          actor: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SchoolSettings = Database["public"]["Tables"]["school_settings"]["Row"];
export type StudentRow = Database["public"]["Tables"]["students"]["Row"];
export type StaffRow = Database["public"]["Tables"]["staff"]["Row"];
export type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
