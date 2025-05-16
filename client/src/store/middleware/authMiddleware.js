import { refreshToken } from '../slices/authSlice';

export const authMiddleware = (store) => (next) => (action) => {
  // Check if the action is rejected and has a 401 status
  if (action.type.endsWith('/rejected') && action.payload?.status === 401) {
    // Try to refresh the token
    store.dispatch(refreshToken())
      .then((result) => {
        if (result.type.endsWith('/fulfilled')) {
          // If token refresh was successful, retry the original action
          const originalAction = action.meta.arg;
          store.dispatch(originalAction);
        }
      });
  }
  return next(action);
}; 