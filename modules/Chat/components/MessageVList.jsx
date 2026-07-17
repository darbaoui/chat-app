"use client";

import { Loader } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { useVirtualizer, defaultRangeExtractor } from "@tanstack/react-virtual";
import Message from "./Message";
import { formatDateSeparator, } from "./helper";
import DateSeparator from "./DateSeparator";
import { cn } from "@/lib/utils";
import MessageInput from "./MessageInput";
import axios from "@/lib/axios";
import useMessageStore from "@/modules/Chat/stores/MessageStore";
import userStore from "@/stores/userStore";
import { ChatContext } from "@/modules/Chat/contexts/chat-context";
import { useContentableEcho } from "@/modules/Chat/hooks/useContentableEcho";
const LIMIT = 50;
const ESTIMATED_ITEM_SIZE = 80;


const fetcher = (url) => axios.get(url).then(({ data }) => data);
// const fetcher = (url) => fetch(url).then((res) => res.json());

// const getKey = (pageIndex, previousPageData) => {
//   if (previousPageData && !previousPageData.hasMore) return null;
//   return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
// };


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


  const scrollElementRef = useRef(null);
  const isPrependRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const shouldStickToBottom = useRef(true);
  const activeStickyIndexRef = useRef(-1);

  // Group messages by date and create list items
  const { items, dateIndexes } = useMemo(() => {
    const items = [];
    const dateIndexesSet = new Set();
    let currentDate = null;
    if (!messages) return { items, dateIndexes: [] };
    messages.forEach((message) => {
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
        });
      }

      items.push({
        type: 'message',
        ...message,
      });
    });

    return { items, dateIndexes: Array.from(dateIndexesSet) };

  }, [messages]);


  const setShouldStickToBottom = () => {
    shouldStickToBottom.current = true
  }

  const rangeExtractor = useCallback((range) => {
    activeStickyIndexRef.current = dateIndexes.findLast((index) => range.startIndex >= index) ?? -1;

    const next = new Set([
      ...(activeStickyIndexRef.current >= 0 ? [activeStickyIndexRef.current] : []),
      ...defaultRangeExtractor(range),
    ]);
    return [...next].sort((a, b) => a - b);
  }, [dateIndexes]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: useCallback(() => ESTIMATED_ITEM_SIZE, []),
    overscan: items.length >= 20 ? 20 : 0,
    getItemKey: useCallback((index) => items[index]?.id ?? index, [items]),
    rangeExtractor,
  });

  useEffect(() => {
    if (!shouldStickToBottom.current) return;
    virtualizer.scrollToIndex(items.length - 1, {
      align: "end",
    });
  }, [items.length]);

  // Compensate scroll position so prepending older messages doesn't jump the viewport
  useLayoutEffect(() => {
    const el = scrollElementRef.current;
    if (!el || !isPrependRef.current) {
      isPrependRef.current = false;
      return;
    }
    const delta = el.scrollHeight - prevScrollHeightRef.current;
    if (delta !== 0) {
      el.scrollTop += delta;
    }
    isPrependRef.current = false;
  }, [items]);


  const handleScroll = () => {
    const el = scrollElementRef.current;
    if (!el) return;

    shouldStickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <
      // FIXME: The sum may not be 0 because of sub-pixel value when browser's window.devicePixelRatio has decimal value
      1.5;

    if (el.scrollTop < 100 && !isPrependRef.current && !isValidating) {
      isPrependRef.current = true;
      prevScrollHeightRef.current = el.scrollHeight;
      setSize((p) => p + 1);
    }
  }

  const contextValue = useMemo(() => {
    return {
      authUser,
      contentableType,
      contentableId,
      setShouldStickToBottom,
    };
  }, [
    authUser,
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
                <div
                  ref={scrollElementRef}
                  onScroll={handleScroll}
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    contain: "strict",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      minHeight: "100%",
                      userSelect: "text",
                      overflowAnchor: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: virtualizer.getTotalSize(),
                      }}
                    >
                      {virtualizer.getVirtualItems().map((virtualRow) => {
                        const item = items[virtualRow.index];
                        const isDateItem = item.type === 'date';
                        const isActive = virtualRow.index === activeStickyIndexRef.current;

                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                            className="item-list"
                            style={{
                              position: isActive ? "sticky" : "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              ...(isActive ? {} : { transform: `translateY(${virtualRow.start}px)` }),
                              ...(isDateItem && !isActive && { zIndex: 1 }),
                              ...(isActive && { zIndex: 3 }),
                            }}
                          >
                            {isDateItem ? (
                              <DateSeparator dateString={item.date} />
                            ) : (
                              <Message
                                message={item}
                                prevMessage={virtualRow.index > 0 ? items[virtualRow.index - 1] : {}}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

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
