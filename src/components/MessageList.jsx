'use client'

import React, { useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import useSWRInfinite from "swr/infinite";

const LIMIT = 50;

const fetcher = (url) => fetch(url).then((res) => res.json());

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
};

const MessageList = () => {
  const parentRef = useRef(null);
  const loadingMore = useRef(false);

  const {
    data,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
  });

  // Flatten messages from all loaded pages
  const messages = data ? data.flatMap((page) => page.messages).reverse() : [];
    
  const hasMore = data ? data[data.length - 1]?.hasMore : true;

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  // Scroll to bottom on first load
  useEffect(() => {
    if (data && data.length === 1 && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [data]);

  // Infinite scroll: load more when near top
  const handleScroll = useCallback(() => {
    if (!parentRef.current || isLoading || !hasMore || loadingMore.current) return;
    if (parentRef.current.scrollTop < 200) {
      // Prevent multiple loads
      loadingMore.current = true;
      // Find the first visible message's index and ID
      const virtualItems = rowVirtualizer.getVirtualItems();
      const firstVisible = virtualItems.length > 0 ? virtualItems[0] : null;
      const firstVisibleId = firstVisible ? messages[firstVisible.index]?.id : null;
      // Capture offset from top
      let offsetFromTop = 0;
      if (firstVisibleId && parentRef.current) {
        const el = document.getElementById(`msg-${firstVisibleId}`);
        if (el) {
          offsetFromTop = el.getBoundingClientRect().top - parentRef.current.getBoundingClientRect().top;
        }
      }
      setSize((prev) => prev + 1).then(() => {
        setTimeout(() => {
          if (firstVisibleId && parentRef.current) {
            const el = document.getElementById(`msg-${firstVisibleId}`);
            if (el) {
              parentRef.current.scrollTop = el.offsetTop - offsetFromTop;
            }
          }
          loadingMore.current = false;
        }, 0);
      });
    }
  }, [isLoading, hasMore, setSize, messages, rowVirtualizer]);

  useEffect(() => {
    const ref = parentRef.current;
    if (!ref) return;
    ref.addEventListener("scroll", handleScroll);
    return () => ref.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Show loading indicator at the top when fetching more (not initial load)
  const showTopLoading = (isValidating || isLoading) && size > 1;

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto" style={{ height: "100%" }}>
      {showTopLoading && (
        <div className="sticky top-0 z-10 flex justify-center py-2">
          <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
          <span className="ml-2 text-blue-400 text-xs">Loading more messages...</span>
        </div>
      )}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index];
          return (
            <div
              key={message.id}
              id={`msg-${message.id}`}
              className="absolute left-0 right-0 px-2"
              style={{
                top: 0,
                transform: `translateY(${virtualRow.start}px)`,
                height: `${virtualRow.size}px`,
              }}
            >
              <div className="bg-white rounded shadow p-3 mb-2 flex gap-2 items-start">
                <img
                  src={message.user.avatar_url}
                  alt={message.user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-sm">{message.user.name}</div>
                  <div className="text-xs text-gray-400 mb-1">
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                  <div className="text-gray-800 text-sm">
                    {/* Render plain text for now; Tiptap rendering can be added later */}
                    {message.text.content?.[0]?.content?.[0]?.text}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {(isLoading && size === 1) && (
        <div className="text-center text-gray-400 py-2">Loading...</div>
      )}
    </div>
  );
};

export default MessageList; 