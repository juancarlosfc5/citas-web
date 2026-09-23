export type ScreenType = 'login' | 'register' | 'recovery' | 'reset' | 'dashboard';
export type UserRole = 'USER' | 'ADMIN' | 'PROFESSIONAL';

export interface User { id: string; name: string; email: string; phone?: string; roles?: string[]; }
export interface CatalogItem { id: string; name: string; code?: string; active?: boolean; }
export interface Specialty extends CatalogItem { durationMinutes: 30 | 60; appointmentType?: 'GENERAL' | 'SPECIALIZED'; }
export interface Professional extends CatalogItem { firstName?: string; lastName?: string; professionalCode?: string; licenseNumber?: string; specialties?: Specialty[]; locationIds?: string[]; }
export interface AvailabilitySlot { startAt: string; endAt?: string; }
export interface AvailableProfessional { id: string; name: string; slots: AvailabilitySlot[]; }
export type AppointmentStatus = 'APPROVED' | 'REQUESTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export interface Appointment { id: string; status: AppointmentStatus; professionalName: string; specialtyName: string; locationName: string; startAt: string; endAt?: string; durationMinutes: number; reason?: string; rejectionReason?: string; cancellationReason?: string; patientName?: string; }
export interface AvailabilityBlock { id: string; locationId: string; locationName?: string; startAt: string; endAt: string; }
export interface AppointmentHistory { id: string; previousStatus?: AppointmentStatus; status: AppointmentStatus; reason?: string; source?: string; actorName?: string; changedAt: string; }
export interface InsuranceProvider extends CatalogItem { code?: string; }
export interface InsurancePlan extends CatalogItem { epsId?: string; epsName?: string; }
export interface RescheduleRequest { id: string; appointmentId: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; newStartAt: string; newEndAt?: string; reason?: string; appointment?: Appointment; }
