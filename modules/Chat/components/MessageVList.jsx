"use client";

import { Loader } from "lucide-react";
import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import Message from "./Message";
import { formatDateSeparator, } from "./helper";
import DateSeparator from "./DateSeparator";
// import { VList } from "virtua";
import { VList } from "@/modules/Chat/virtua/VList";
// import  VList from "./VList";
import { cn } from "@/lib/utils";
import MessageInput from "./MessageInput";
import axios from "@/lib/axios";
import useMessageStore from "@/modules/Chat/stores/MessageStore";
import userStore from "@/stores/userStore";
import { useChatContext, ChatContext } from "@/modules/Chat/contexts/chat-context";
import { useContentableEcho } from "@/modules/Chat/hooks/useContentableEcho";
const LIMIT = 50;


const fetcher = (url) => axios.get(url).then(({ data }) => data);
// const fetcher = (url) => fetch(url).then((res) => res.json());

// const getKey = (pageIndex, previousPageData) => {
//   if (previousPageData && !previousPageData.hasMore) return null;
//   return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
// };


const StickyItem = forwardRef(
  ({ children, style, index }, ref) => {
    const { activeIndex, stickyIndexes } = useChatContext();
    return (
      <div
        ref={ref}
        data-index={index}
        className="item-list"
        style={{
          ...style,
          ...(stickyIndexes.has(index) && {
            zIndex: 1,
          }),
          ...(activeIndex === index && {
            position: "sticky",
            top: 0,
            zIndex: 3,
          }),
        }}
      >
        {children}
      </div>
    );
  }
);

StickyItem.displayName = 'StickyItem';

const MessageVList = ({ contentableType, contentableId, className }) => {


  const { messages, setMessages, shouldScrollToBottom, updateMessage, addMessage, removeMessage, initialize } = useMessageStore();


  const getKey = useCallback((pageIndex, previousPageData) => {
    // If there's no more data, don't fetch
    if (previousPageData && !previousPageData.next_page_url) return null;

    if (!contentableType || !contentableId) return null;

    // Construct the paginated URL
    const baseUrl = `/api/contents/${contentableType}/${contentableId}`;
    const params = new URLSearchParams({
      page: pageIndex + 1,
      limit: LIMIT,
    });

    // Add cursor-based pagination if using cursor
    if (previousPageData?.nextCursor) {
      params.set('cursor', previousPageData.nextCursor);
    }

    return `${baseUrl}?${params.toString()}`;
  }, [contentableType, contentableId]);


  const { data, error, size, setSize, isLoading, isValidating } =
    useSWRInfinite(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0,
      shouldRetryOnError: true,
    });


  const { user: authUser } = userStore();

  useEffect(() => {
    // Initialize all stores with the same contentable context
    initialize(contentableType, contentableId);

  }, [contentableType, contentableId, initialize]);



  useContentableEcho(contentableType, contentableId, authUser, { addMessage, updateMessage, removeMessage })


  useEffect(() => {
    if (data) {
      const messages = data ? data.flatMap((page) => page.data).reverse() : [];
      setMessages(messages);

    }
  }, [data])


  // useEffect(() => {
  //   if (shouldScrollToBottom) {
  //     shouldStickToBottom.current = shouldScrollToBottom
  //   }
  // }, [shouldScrollToBottom])

  const isLoadingMore =
    isLoading || (size > 0 && data && data?.data?.[data.length - 1]?.next_page_url);// We use laravel pagination response

  const isEmpty = messages && messages.length === 0;
  const isReachingEnd = isEmpty || (data && !data?.data?.[data.length - 1]?.next_page_url); // We use laravel pagination response


  const ref = useRef(null);
  const isPrepend = useRef(false);
  const shouldStickToBottom = useRef(true);
  const [activeIndex, setActiveIndex] = useState(0)

  // Group messages by date and create list items
  const { items, dateIndexes, dateIndexesSet } = useMemo(() => {
    const items = [];
    const dateIndexesSet = new Set();
    let currentDate = null;
    if (!messages) return { items, dateIndexes: [], dateIndexesSet };
    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at);

      const messageDateString = formatDateSeparator(messageDate);

      // Add date separator if it's a new day
      if (messageDateString !== currentDate) {
        currentDate = messageDateString;
        dateIndexesSet.add(items.length);
        items.push({
          type: 'date',
          date: messageDateString,
          id: `date-${messageDateString}`,
          // formattedDate: formatDateSeparator(messageDate),
        });
      }

      items.push({
        type: 'message',
        ...message,
      });
    });

    return { items, dateIndexes: Array.from(dateIndexesSet), dateIndexesSet };

  }, [messages]);


  const setShouldStickToBottom = () => {
    shouldStickToBottom.current = true
  }


  const generateVlistKey = useMemo(() => {
    if (ref.current) {
      const { totalSize, viewportSize } = ref.current;
      if (totalSize !== undefined && viewportSize !== undefined) {
        if (totalSize <= viewportSize * 2)// We estime by test while the total size is > viewport size * 2 the items will rendering again
        {
          const key = crypto.randomUUID();
          return key; // to Force re-rendering
        }
      }
    }
    // if (shouldScrollToBottom) {
    // }
    return "message-list";
  }, [items]);

  useEffect(() => {
    if (!ref.current) return;
    if (!shouldStickToBottom.current) return;
    ref.current.scrollToIndex(items.length - 1, {
      align: "end",
    });
  }, [items.length]);



  useEffect(() => {
    if (generateVlistKey !== 'message-list') {
      ref.current.scrollToIndex(items.length - 1, {
        align: "end",
      });
    }
  }, [ref, generateVlistKey])


  useLayoutEffect(() => {
    isPrepend.current = false;
  }, [items.length]);


  const handleScroll = (offset) => {
    if (!ref.current) return;

    const start = ref.current.findStartIndex();

    const activeStickyIndex = dateIndexes.findLast((index) => start >= index);

    setActiveIndex(activeStickyIndex);

    shouldStickToBottom.current =
      offset - ref.current.scrollSize + ref.current.viewportSize >=
      // FIXME: The sum may not be 0 because of sub-pixel value when browser's window.devicePixelRatio has decimal value
      -1.5;
    if (offset < 100 && !isPrepend.current && !isValidating) {
      isPrepend.current = true;
      setSize((p) => p + 1);
    }
  }

  const contextValue = useMemo(() => {
    return {
      authUser,
      activeIndex,
      stickyIndexes: dateIndexesSet,
      contentableType,
      contentableId,
      setShouldStickToBottom,
    };
  }, [
    authUser,
    activeIndex,
    dateIndexesSet,
    contentableType,
    contentableId,
    setShouldStickToBottom,
  ]);


  if (isLoading || !messages)
    return (
      <div className="absolute inset-0 w-full  flex items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );

  return (
    <>
      <ChatContext.Provider value={contextValue}>


        <div className={cn("flex flex-col w-full relative", className)}>
          {
            isEmpty ? <div className="flex-1" /> : (

              <div className="flex flex-1 w-full relative">
                {isLoadingMore && (
                  <div className={cn("absolute top-3 z-10 w-full bg-transparent flex items-center justify-center")}>
                    <div className="w-16 rounded-3xl flex items-center justify-center bg-title px-3 h-7">
                      <Loader className="animate-spin w-3 text-white" />
                    </div>
                  </div>
                )}
                <VList
                  ref={ref}
                  style={{
                    flex: 1,
                  }}
                  overscan={items.length >= 20 ? 20 : 0}
                  item={StickyItem}
                  keepMounted={[activeIndex]}
                  reverse
                  shift={isPrepend.current}
                  onScroll={handleScroll}
                  key={generateVlistKey}
                >


                  {items.map((item, index) => {
                    if (item.type === 'date') {
                      return <DateSeparator dateString={item.date} index={index} key={item.id} />
                    }
                    return (

                      <Message
                        key={item.id}
                        message={item}
                        prevMessage={index > 0 ? items[index - 1] : {}}
                      />
                    )

                  })}
                </VList>

              </div>
            )
          }

          <MessageInput />
        </div>
      </ChatContext.Provider>
    </>
  );
};

export default MessageVList;
