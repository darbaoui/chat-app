import { createContext, useContext } from 'react';
import invariant from 'tiny-invariant';

export const ChatContext = createContext(-1);

export function useChatContext() {
  const value = useContext(ChatContext);
  invariant(value, 'cannot find ChatContext provider');
  return value;
}
