import { createContext, useContext } from 'react';
import invariant from 'tiny-invariant';

export const AuthAppContext = createContext(null);

export function useAuthAppContext() {
  const value = useContext(AuthAppContext);
  invariant(value, 'cannot find AuthAppContext provider');
  return value;
}
