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

// Admin types
export interface Admin {
  adminId: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  role: string;
}

export interface TokenAdmin {
  adminId: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  role: string;
}

export interface TokenAdminPayload {
  adminId: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  role: string;
}

export interface AdminJwtPayload {
  adminId: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  role: string;
}
