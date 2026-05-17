// ==========================================
// Member
// ==========================================
export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
  id: string; // UUID
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
  status: MemberStatus;
  created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
}

export interface UpdateMemberRequest {
  dni?: string;
  name?: string;
  email?: string;
  birthdate?: string; // ISO Date String (YYYY-MM-DD)
  category?: MemberCategory;
  status?: MemberStatus;
}

// ==========================================
// Sport
// ==========================================

export interface SportDTO {
  id: string; // UUID
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
  created_at: string; // ISO Date String
}

export interface CreateSportRequest {
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
}

// ==========================================
// Equipment Loan
// ==========================================
export type EquipmentLoanStatus = 'Loaned' | 'Returned' | 'Damaged';

export interface EquipmentLoanDTO {
  id: string; // UUID
  item_name: string;
  status: EquipmentLoanStatus;
  loan_date: string; // ISO Date String
  due_date: string; // ISO Date String
  member_id: string; // UUID
}

export interface CreateEquipmentLoanRequest {
  item_name: string;
  due_date: string; // ISO Date String
  member_id: string;
}
