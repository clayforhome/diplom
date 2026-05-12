export type UserRole = 'User' | 'Organizer' | 'Admin';

export type MeetingFormat = 'Offline' | 'Online' | 'Hybrid' | 'Phone';

export type MeetingStatus =
  | 'Draft'
  | 'Scheduled'
  | 'AwaitingConfirmation'
  | 'Confirmed'
  | 'Rescheduled'
  | 'Cancelled'
  | 'Completed';

export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface UiSelectOptions {
  meetingFormats: SelectOption<MeetingFormat>[];
  meetingStatuses: SelectOption<MeetingStatus>[];
  adminUserSortKeys: SelectOption[];
  sortDirections: SelectOption[];
  pageSizes: SelectOption[];
}

export interface ApiEnvelope<T> {
  data: T;
  status: string;
}

export interface ApiValidationErrors {
  [key: string]: string[];
}

export interface ApiErrorPayload {
  message?: string;
  errors?: ApiValidationErrors;
  title?: string;
  detail?: string;
  code?: string;
  Errors?: string[];
}

export interface CurrentUser {
  id: string;
  userName: string | null;
  email: string | null;
  name: string | null;
  age: number | null;
  emailConfirmed: boolean;
  registrationDate: string | null;
  roles: UserRole[];
}

export interface AuthSession {
  token: string;
  userId: string | null;
  roles: UserRole[];
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponseData {
  userName: string;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  name: string;
  age: number;
}

export interface RegisterResponseData {
  message: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}

export interface PasswordResponseData {
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MeetingSummary {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  format: MeetingFormat;
  status: MeetingStatus;
  organizerId: string;
}

export interface MeetingDetail extends MeetingSummary {
  location: string | null;
  meetingLink: string | null;
  contactInfo: string | null;
  participantCount: number;
  fileCount: number;
}

export interface MeetingFileItem {
  id: string;
  meetingId?: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  uploadedById?: string;
  uploaderName?: string | null;
}

export interface Participant {
  userId: string;
  userName: string | null;
  email: string | null;
  invitationStatus: InvitationStatus;
  isRequired: boolean;
  invitedAt: string;
  responseAt: string | null;
  comment: string | null;
}

export interface OrganizerUser {
  id: string;
  email: string;
  name: string;
}

export interface ConflictInfo {
  userId: string;
  userName: string | null;
  conflictingMeetingId: string;
  conflictingMeetingTitle: string;
  conflictStartTime: string;
  conflictEndTime: string;
}

export interface AvailabilityResult {
  allAvailable: boolean;
  conflicts: ConflictInfo[];
}

export interface MeetingFormValues {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  format: MeetingFormat;
  status?: MeetingStatus;
  location: string;
  meetingLink: string;
  contactInfo: string;
  participantIds: string[];
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  format: MeetingFormat;
  location?: string;
  meetingLink?: string;
  contactInfo?: string;
  participantIds?: string[];
}

export interface UpdateMeetingRequest extends Partial<Omit<CreateMeetingRequest, 'participantIds'>> {
  status?: MeetingStatus;
}

export interface InviteParticipantsRequest {
  participantIds: string[];
}

export interface RespondInvitationRequest {
  status: InvitationStatus;
  comment?: string;
}

export interface AdminUser {
  id: string;
  userName: string | null;
  email: string | null;
  name: string | null;
  age: number | null;
  emailConfirmed: boolean;
  registrationDate: string | null;
}

export interface ToastItem {
  id: string;
  title: string;
  tone: 'info' | 'success' | 'error';
}
