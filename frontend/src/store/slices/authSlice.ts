import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from '../../http/authService';
import type { CurrentUser, LoginRequest, RegisterRequest } from '../../types';
import { jwtService } from '../../utils/jwt';

interface AuthState {
  token: string | null;
  user: CurrentUser | null;
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

function getStoredSession() {
  const token = jwtService.getToken();

  if (!token || jwtService.isExpired(token)) {
    jwtService.clearToken();
    return null;
  }

  return jwtService.getSession(token);
}

const initialSession = getStoredSession();

const initialState: AuthState = {
  token: initialSession?.token ?? null,
  user: null,
  roles: initialSession?.roles ?? [],
  isAuthenticated: Boolean(initialSession?.token),
  isLoading: false,
  error: null
};

export const loginThunk = createAsyncThunk('auth/login', async (payload: LoginRequest) => {
  const result = await authService.login(payload);
  jwtService.setToken(result.token);
  return result.token;
});

export const registerThunk = createAsyncThunk('auth/register', async (payload: RegisterRequest) => {
  return authService.register(payload);
});

export const fetchCurrentUserThunk = createAsyncThunk('auth/fetchCurrentUser', async () => {
  return authService.getCurrentUser();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateSessionFromStorage(state) {
      const session = getStoredSession();

      state.token = session?.token ?? null;
      state.roles = session?.roles ?? [];
      state.isAuthenticated = Boolean(session?.token);

      if (!session) {
        state.user = null;
      }
    },
    logout(state) {
      jwtService.clearToken();
      state.token = null;
      state.user = null;
      state.roles = [];
      state.isAuthenticated = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        const session = jwtService.getSession(action.payload);
        state.isLoading = false;
        state.token = action.payload;
        state.roles = session?.roles ?? [];
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Не удалось войти';
      })
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Не удалось зарегистрироваться';
      })
      .addCase(fetchCurrentUserThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.roles = action.payload.roles;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUserThunk.rejected, (state) => {
        jwtService.clearToken();
        state.token = null;
        state.user = null;
        state.roles = [];
        state.isAuthenticated = false;
      });
  }
});

export const { hydrateSessionFromStorage, logout } = authSlice.actions;
export default authSlice.reducer;
