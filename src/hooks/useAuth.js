import useSWR from 'swr';
import axios from '@/lib/axios';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import userStore from '@/stores/useStore';
// Token management utilities
const getToken = () => {
  if (typeof window !== 'undefined') {
    return Cookies.get('auth_token');
  }
  return null;
};

const setToken = (token) => {
  if (typeof window !== 'undefined') {
    Cookies.set('auth_token', token);
    // Set default authorization header for all future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

const removeToken = () => {
  if (typeof window !== 'undefined') {
    Cookies.remove('auth_token');
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Initialize axios with token on page load
if (typeof window !== 'undefined') {
  const token = getToken();
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

export const useAuth = ({ middleware, redirectIfAuthenticated = '/' } = {}) => {
  const router = useRouter();
  const { setUser } = userStore();
  // Fetcher function that handles token authentication
  const fetcher = async (url) => {
    // const token = getToken();
    // if (!token) {
    //   throw new Error('No token available');
    // }

    return axios
      .get(url)
      .then((res) => res.data)
      .catch((error) => {
        // If token is invalid, remove it
        if (error.response?.status === 401) {
          removeToken();
          throw new Error('Unauthorized');
        }
        // if (error.response?.status === 409) {
        //   router.push('/verify-email');
        //   return;
        // }
        throw error;
      });
  };

  const {
    data: user,
    error,
    mutate: revalidate,
  } = useSWR(getToken() ? '/api/me' : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    onError: (error) => {
      if (
        error.message === 'Unauthorized' ||
        error.message === 'No token available'
      ) {
        removeToken();
      }
    },
  });

  const csrf = () => axios.get('/sanctum/csrf-cookie');

  const login = async ({ setErrors, setStatus, ...props }) => {
    await csrf();
    setStatus?.(null);
    setErrors([]);

    try {
      const response = await axios.post('/api/login', props);

      // Store the token from response
      if (response.data.token) {
        setToken(response.data.token);
        setUser(response.data.user);
        revalidate();
        router.push('/');
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(Object.values(error.response.data.errors).flat());
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    const token = getToken();

    // Call logout endpoint if token exists and no error
    if (token && !error) {
      try {
        await axios.post(
          '/api/logout',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API call failed:', error);
      }
    }
    // Always remove token and redirect
    setUser(null);
    removeToken();
    revalidate();
    router.push('/login');
  };

  useEffect(() => {
    if (middleware === 'guest' && redirectIfAuthenticated && user) {
      router.push(redirectIfAuthenticated);
    }
    if (middleware === 'auth' && (error || !getToken())) {
      logout();
    }

    if (user) {
      setUser(user);
    }
  }, [user, error]);

  return {
    user,
    login,
    logout,
  };
};
