import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AUTHORIZED_ADMIN_EMAIL = 'mdhassan1738@gmail.com';

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Check if user is logged in, email matches hardcoded admin limit, and email is verified
      const isUserAdmin = !!(
        currentUser &&
        currentUser.email &&
        currentUser.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()
      );

      setState({
        user: currentUser,
        loading: false,
        isAdmin: isUserAdmin
      });
    }, (error) => {
      console.error('Auth state change error', error);
      setState({
        user: null,
        loading: false,
        isAdmin: false
      });
    });

    return () => unsubscribe();
  }, []);

  return state;
}
