import React, { useEffect, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface User {
  id: string;
  name: string;
  avatar_url: string;
}

interface Message {
  id: string;
  text: any; // Tiptap JSON
  created_at: string;
  user: User;
}

interface ApiResponse {
  messages: Message[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

const LIMIT = 50;

const fetchMessages = async (page: number): Promise<ApiResponse> => {
  const res = await fetch(`/api/messages?page=${page}&limit=${LIMIT}`);
  return res.json();
};

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  useEffect(() => {
    setLoading(true);
    fetchMessages(1).then((data) => {
      setMessages(data.messages);
      setHasMore(data.hasMore);
      setLoading(false);
      // Scroll to bottom on first load
      setTimeout(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight;
        }
      }, 0);
    });
  }, []);

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  // Infinite scroll: load more when near top
  const handleScroll = useCallback(() => {
    if (!parentRef.current || loading || !hasMore) return;
    if (parentRef.current.scrollTop < 200) {
      setLoading(true);
      fetchMessages(page + 1).then((data) => {
        setMessages((prev) => [...data.messages, ...prev]);
        setPage((p) => p + 1);
        setHasMore(data.hasMore);
        setLoading(false);
        // Maintain scroll position after prepending
        setTimeout(() => {
          if (parentRef.current) {
            parentRef.current.scrollTop = parentRef.current.scrollHeight / ((page + 1) / page);
          }
        }, 0);
      });
    }
  }, [loading, hasMore, page]);

  useEffect(() => {
    const ref = parentRef.current;
    if (!ref) return;
    ref.addEventListener("scroll", handleScroll);
    return () => ref.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto" style={{ height: "100%" }}>
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
      {loading && (
        <div className="text-center text-gray-400 py-2">Loading...</div>
      )}
    </div>
  );
};

export default MessageList; 