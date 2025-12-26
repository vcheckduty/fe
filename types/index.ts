// TypeScript interfaces for V-Check system

export enum UserRole {
  ADMIN = 'admin',
  OFFICER = 'officer',
  SUPERVISOR = 'supervisor',
}

export type UserRoleType = 'admin' | 'officer' | 'supervisor';

export interface User {
  _id?: string;
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRoleType;
  badgeNumber?: string;
  department?: string;
  officeId?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

export interface Office {
  _id?: string;
  id?: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  members?: string[] | User[];
  supervisorId?: string;
  isActive: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Attendance {
  _id?: string;
  user: string | User;
  office: string | Office;
  officerName: string;
  officeName: string;
  location: {
    lat: number;
    lng: number;
  };
  distance: number;
  status: 'Valid' | 'Invalid';
  
  // Check-in approval workflow
  checkinStatus: 'pending' | 'approved' | 'rejected';
  checkinApprovedBy?: string;
  checkinApprovedAt?: Date;
  checkinRejectionReason?: string; // Reason for rejection from supervisor
  checkinTime: Date;
  checkinPhoto?: string;
  checkinReason?: string;
  checkinReasonPhoto?: string;
  
  // Check-out approval workflow
  checkoutStatus?: 'pending' | 'approved' | 'rejected';
  checkoutApprovedBy?: string;
  checkoutApprovedAt?: Date;
  checkoutRejectionReason?: string; // Reason for rejection from supervisor
  checkoutTime?: Date;
  checkoutLocation?: {
    lat: number;
    lng: number;
  };
  checkoutDistance?: number;
  checkoutPhoto?: string;
  checkoutReason?: string;
  checkoutReasonPhoto?: string;
  
  totalHours?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  name: string;
}

export interface DashboardStats {
  totalOfficers: number;
  present: number;
  absent: number;
  onFieldMission: number;
  lastUpdated: Date;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  distance?: number;
  status?: 'valid' | 'invalid' | 'out-of-range';
  attendance?: Attendance;
}
