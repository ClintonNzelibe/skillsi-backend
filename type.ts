export interface User {
  userId: string;
  fullName: string;
  email: string;
}

export interface TokenUser {
  userId: string;
  fullName: string;
  email: string;
}

export interface JwtPayload {
  userId: string;
  fullName: string;
  email: string;
}

export interface TokenPayload {
  userId: string;
  fullName: string;
  email: string;
}

// admin types
export interface Admin {
  adminId: string;
  email: string;
  companyName: string;
  fName?: string;
  lName?: string;
  type: string;
  role: string;
}

export interface TokenAdmin {
  adminId: string;
  email: string;
  companyName: string;
  fName?: string;
  lName?: string;
  type: string;
  role: string;
}

export interface TokenAdminPayload {
  adminId: string;
  email: string;
  companyName: string;
  fName?: string;
  lName?: string;
  type: string;
  role: string;
  // Add any other properties that you expect in the payload
}

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  companyName: string;
  fName?: string;
  lName?: string;
  type: string;
  role: string;
  // Add any other properties that you expect in the payload
}

// Tutor types
export interface Tutor {
  tutorId: string;
  email: string;
  fName?: string;
  lName?: string;
}

export interface TokenTutor {
  tutorId: string;
  email: string;
  fName?: string;
  lName?: string;
}

export interface TokenTutorPayload {
  tutorId: string;
  email: string;
  fName?: string;
  lName?: string;
}

export interface TutorJwtPayload {
  tutorId: string;
  email: string;
  fName?: string;
  lName?: string;
}
