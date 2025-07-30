import { useEffect } from 'react';
import useEcho from './useEcho';
export const useContentableEcho = (
  contentableType,
  contentableId,
  authUser,
  { addMessage, updateMessage, removeMessage }
) => {
  const echoInstance = useEcho();

  useEffect(() => {
    if (!echoInstance || !authUser?.id || !contentableType || !contentableId) {
      return;
    }

    // Dynamic channel name based on contentable context
    const channelName = `${contentableType}.${contentableId}`;

    console.log('Subscribing to channel:', channelName);

    const channel = echoInstance
      .private(channelName)
      .listen('.content.created', (e) => {
        console.log('e ----->', e);
        const { content, user } = e;
        if (user?.id !== authUser?.id && addMessage) {
          addMessage(content);
        }
      })
      .listen('.content.updated', (e) => {
        const { content, user } = e;
        if (user?.id !== authUser?.id && updateMessage) {
          updateMessage(content?.id, content);
        }
      })
      .listen('.content.deleted', (e) => {
        const { content, user } = e;
        if (user?.id !== authUser?.id && removeMessage) {
          removeMessage(content?.id);
        }
      });

    // Cleanup function
    return () => {
      console.log('Unsubscribing from channel:', channelName);
      echoInstance.leaveChannel(channelName);
    };
  }, [
    echoInstance,
    authUser?.id,
    contentableType,
    contentableId,
    addMessage,
    updateMessage,
    removeMessage,
  ]);
};
