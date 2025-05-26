import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userAPI from '../../services/api/user.api';

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (role, { rejectWithValue }) => {
    try {
      const response = await userAPI.getUsers(role);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch users'
      );
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userAPI.createUser(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create user'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'users/updateProfile',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update user'
      );
    }
  }
);
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateUser(id, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update user'
      );
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await userAPI.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete user'
      );
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateUserStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateUserStatus(id, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update user status'
      );
    }
  }
);

const initialState = {
  users: [],
  loading: false,
  error: null,
  currentRole: 'admin', // Default role
  stats: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentRole: (state, action) => {
      state.currentRole = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create User
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Update User
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user._id !== action.payload);
      })
      // Update User Status
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      });
  },
});

export const { setCurrentRole, clearError } = userSlice.actions;
export default userSlice.reducer; 