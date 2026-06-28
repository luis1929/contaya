import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Initial state for auth reducer
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  impersonating: false,
  impersonatedBy: null
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true
      };
    case 'LOGOUT':
      return {
        ...initialState
      };
    case 'IMPERSONATE':
      return {
        ...state,
        user: {
          ...action.payload.user,
          impersonating: true,
          impersonatedBy: action.payload.impersonatedBy
        },
        token: action.payload.token,
        isAuthenticated: true,
        impersonating: true,
        impersonatedBy: action.payload.impersonatedBy
      };
    case 'RESTORE_IMPERSONATION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        impersonating: true,
        impersonatedBy: action.payload.impersonatedBy
      };
    case 'LOAD_STATE':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.user && !!action.payload.token,
        impersonating: action.payload.impersonating || false,
        impersonatedBy: action.payload.impersonatedBy || null
      };
    default:
      return state;
  }
}

// Create Auth Context
const AuthContext = createContext();

function getInitialState() {
  try {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      const user = JSON.parse(storedUser);
      return {
        user,
        token: storedToken,
        isAuthenticated: true,
        impersonating: user.impersonating || false,
        impersonatedBy: user.impersonatedBy || user.impersonated_by || null
      };
    }
  } catch (e) { /* ignore */ }
  return initialState;
}

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, null, getInitialState);

  // Sync from localStorage on storage events (other tabs) and custom auth-change events
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser);
          dispatch({
            type: 'LOAD_STATE',
            payload: {
              user,
              token: storedToken,
              impersonating: user.impersonating || false,
              impersonatedBy: user.impersonatedBy || user.impersonated_by || null
            }
          });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (e) { /* ignore */ }
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('auth-change', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('auth-change', syncFromStorage);
    };
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state.user && state.token) {
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
      if (state.impersonating) {
        localStorage.setItem('impersonating', 'true');
      } else {
        localStorage.removeItem('impersonating');
      }
      if (state.impersonatedBy) {
        localStorage.setItem('impersonated_by', state.impersonatedBy);
      }
    }
  }, [state.user, state.token, state.impersonating, state.impersonatedBy]);

  const login = useCallback(async (userData, token) => {
    dispatch({
      type: 'LOGIN',
      payload: { user: userData, token }
    });
    return { user: userData, token };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('impersonating');
    localStorage.removeItem('impersonated_by');
    localStorage.removeItem('admin_token');
    
    dispatch({ type: 'LOGOUT' });
  }, []);

  const impersonate = useCallback((userData, token, impersonatedBy) => {
    dispatch({
      type: 'IMPERSONATE',
      payload: {
        user: userData,
        token,
        impersonatedBy
      }
    });
    return { user: userData, token, impersonatedBy };
  }, []);

  const restoreImpersonation = useCallback((userData, token) => {
    const impersonatedBy = userData.impersonatedBy || (userData.impersonating ? userData.impersonated_by : null);
    
    dispatch({
      type: 'RESTORE_IMPERSONATION',
      payload: {
        user: userData,
        token,
        impersonatedBy
      }
    });
    return { user: userData, token };
  }, []);

  const value = {
    ...state,
    login,
    logout,
    impersonate,
    restoreImpersonation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };