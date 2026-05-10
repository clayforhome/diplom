import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { sessionsService } from '../../http/sessionsService';
import type {
  AvailabilityResult,
  MeetingDetail,
  MeetingStatus,
  MeetingSummary,
  PaginatedResponse,
  Participant
} from '../../types';

interface SessionsState {
  meetings: MeetingSummary[];
  selectedMeeting: MeetingDetail | null;
  participants: Participant[];
  availability: AvailabilityResult | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  activeStatusFilter?: MeetingStatus;
  isLoading: boolean;
}

const initialState: SessionsState = {
  meetings: [],
  selectedMeeting: null,
  participants: [],
  availability: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  },
  isLoading: false
};

export const fetchMeetingsThunk = createAsyncThunk(
  'sessions/fetchMeetings',
  async (params: { page: number; limit: number; status?: MeetingStatus }) => {
    return sessionsService.listMeetings(params);
  }
);

export const fetchMeetingThunk = createAsyncThunk('sessions/fetchMeeting', async (id: string) => {
  return sessionsService.getMeeting(id);
});

export const fetchParticipantsThunk = createAsyncThunk('sessions/fetchParticipants', async (id: string) => {
  return sessionsService.getParticipants(id);
});

export const checkAvailabilityThunk = createAsyncThunk(
  'sessions/checkAvailability',
  async (payload: { participantIds: string[]; date: string; startTime: string; endTime: string }) => {
    return sessionsService.checkAvailability(payload);
  }
);

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    clearAvailability(state) {
      state.availability = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetingsThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMeetingsThunk.fulfilled, (state, action) => {
        const payload = action.payload as PaginatedResponse<MeetingSummary>;
        state.meetings = payload.items;
        state.pagination = {
          page: payload.page,
          limit: payload.pageSize,
          total: payload.total
        };
        state.isLoading = false;
      })
      .addCase(fetchMeetingsThunk.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchMeetingThunk.fulfilled, (state, action) => {
        state.selectedMeeting = action.payload;
      })
      .addCase(fetchParticipantsThunk.fulfilled, (state, action) => {
        state.participants = action.payload;
      })
      .addCase(checkAvailabilityThunk.fulfilled, (state, action) => {
        state.availability = action.payload;
      });
  }
});

export const { clearAvailability } = sessionsSlice.actions;
export default sessionsSlice.reducer;
