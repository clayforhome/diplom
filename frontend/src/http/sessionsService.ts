import { httpClient } from './httpClient';
import type {
  AvailabilityResult,
  CreateMeetingRequest,
  InviteParticipantsRequest,
  MeetingDetail,
  MeetingFileItem,
  MeetingFormat,
  MeetingStatus,
  MeetingSummary,
  OrganizerUser,
  PaginatedResponse,
  Participant,
  RespondInvitationRequest,
  UpdateMeetingRequest
} from '../types';

export const sessionsService = {
  getMeetingFormats(): Promise<MeetingFormat[]> {
    return httpClient
      .get<{ meetingFormats: MeetingFormat[] }>('/meeting-formats')
      .then((response) => response.meetingFormats);
  },
  getMeetingStatuses(): Promise<MeetingStatus[]> {
    return httpClient
      .get<{ meetingStatus: MeetingStatus[] }>('/meeting-statuses')
      .then((response) => response.meetingStatus);
  },
  getOrganizerUsers(): Promise<OrganizerUser[]> {
    return httpClient
      .get<{ users: OrganizerUser[] }>('/organizer/users')
      .then((response) => response.users);
  },
  listMeetings(params: { page: number; limit: number; status?: MeetingStatus }): Promise<PaginatedResponse<MeetingSummary>> {
    const search = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit)
    });

    if (params.status) {
      search.set('status', params.status);
    }

    return httpClient.get<PaginatedResponse<MeetingSummary>>(`/meetings?${search.toString()}`);
  },
  getMeeting(id: string): Promise<MeetingDetail> {
    return httpClient.get<MeetingDetail>(`/meetings/${id}`);
  },
  createMeeting(payload: CreateMeetingRequest): Promise<MeetingDetail> {
    return httpClient.post<MeetingDetail>('/meetings', payload);
  },
  updateMeeting(id: string, payload: UpdateMeetingRequest): Promise<MeetingDetail> {
    return httpClient.patch<MeetingDetail>(`/meetings/${id}`, payload);
  },
  deleteMeeting(id: string): Promise<unknown> {
    return httpClient.delete(`/meetings/${id}`);
  },
  getParticipants(id: string): Promise<Participant[]> {
    return httpClient.get<Participant[]>(`/meetings/${id}/participants`);
  },
  listMeetingFiles(id: string): Promise<MeetingFileItem[]> {
    return httpClient.get<MeetingFileItem[]>(`/meetings/${id}/files`);
  },
  uploadMeetingFile(id: string, file: File): Promise<MeetingFileItem> {
    const formData = new FormData();
    formData.append('file', file);

    return httpClient.postForm<MeetingFileItem>(`/meetings/${id}/files`, formData);
  },
  deleteMeetingFile(id: string, fileId: string): Promise<unknown> {
    return httpClient.delete(`/meetings/${id}/files/${fileId}`);
  },
  inviteParticipants(id: string, payload: InviteParticipantsRequest): Promise<unknown> {
    return httpClient.post(`/meetings/${id}/participants`, payload);
  },
  removeParticipant(id: string, userId: string): Promise<unknown> {
    return httpClient.delete(`/meetings/${id}/participants/${userId}`);
  },
  respondToInvitation(id: string, userId: string, payload: RespondInvitationRequest): Promise<unknown> {
    return httpClient.patch(`/meetings/${id}/participants/${userId}/respond`, payload);
  },
  checkAvailability(payload: {
    participantIds: string[];
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<AvailabilityResult> {
    return httpClient.post<AvailabilityResult>('/meetings/availability', payload);
  }
};
