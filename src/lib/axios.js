import Axios from 'axios';
import Cookies from 'js-cookie';
const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});

axios.interceptors.request.use(
  function (config) {
    const token = Cookies.get('XSRF-TOKEN');
    const auth_token = Cookies.get('auth_token');
    if (token) {
      config.headers['X-XSRF-TOKEN'] = token;
    }
    if (auth_token) {
      config.headers['Authorization'] = `Bearer ${auth_token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export default axios;
