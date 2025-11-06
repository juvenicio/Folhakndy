export interface Employee {
  id: string;
  name: string;
  employee_type: string;
  function: string;
  registration_number: string | null;
  school_name: string | null;
  work_days: string[];
  shift: string[] | null;
  vinculo: string;
  discipline: string | null;
  weekly_hours: number | null;
}

export interface DailyRecord {
  id: string;
  record_date: string; // ISO date string
  entry_time_1: string | null;
  exit_time_1: string | null;
  entry_time_2: string | null;
  exit_time_2: string | null;
  total_hours_worked: number | null;
  notes: string | null;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  // managed_school_name: string | null; // Removido
}