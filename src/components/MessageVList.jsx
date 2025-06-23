"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { faker } from "@faker-js/faker";
import { Loader } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { VList } from "virtua";
import { generateTiptapJson } from "./helper";
import TiptapRenderer from "./TiptapRenderer";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import  BoxCorner  from "@/icons/BoxCorner";

const LIMIT = 50;

const fetcher = (url) => fetch(url).then((res) => res.json());

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
};

/**
 * Renders the date separator UI.
 */
const DateSeparator = ({ dateString }) => (
  <div style={{position:"sticky",top:".625rem",cursor:"pointer",pointerEvents:"none",zIndex:"10",marginTop:"1rem",marginBottom:"1rem",opacity:"1",transition:"opacity .3s ease"}}>

    {dateString}
  </div>
);

const Message = ({ message, prevMessage = {} }) => {
  const { text, user } = message;

  const isMe = user.id ==='current_user';
  // Check if the sender is different from the previous message's sender
  // or if the previous message was on a different day.
  const messageDate = new Date(message.created_at).toDateString();
  const prevMessageDate = prevMessage
    ? new Date(prevMessage?.created_at).toDateString()
    : null;
  const showAvatarAndName = prevMessage?.user?.id !== message.user?.id;
  // console.log("showAvatarAndName -->", showAvatarAndName);
  const time = new Date(message.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });


  const index = 0;
  return (
    <div
      className={cn(
        "flex items-start my-1 px-2.5",
        isMe ? "flex-row-reverse" : "",
        showAvatarAndName ? "mt-4" : ""
      )}
    >

      
      <div className={cn("w-6.5 h-6.5", isMe ? "ms-3" : "me-3")}>
        {showAvatarAndName && (
          <Avatar>
            <AvatarImage src={user.avatar_url} alt={`${user.name}'s avatar`} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {/* Sender Name and Time */}
        {showAvatarAndName && (
          <div className={cn("flex items-baseline text-meta-icon gap-2.5 mb-1",  isMe ? "flex-row-reverse pe-4" : "ps-4")}>
            <p className="text-[11px] break-words flex">{user.name}</p>
            <p className="text-[11px] ">{time}</p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`max-w-md rounded-3xl px-5 py-2.5 relative ${
            isMe
              ? "bg-[#BFDBFE] text-[#0C4A6E]"
              : "bg-accent text-title "
          }`}
        >
          {index === 0 && (
                    <BoxCorner
                      className={cn(
                        ' absolute -right-1 top-0.5 z-0',
                        isMe
                          ? 'text-[#BFDBFE] -right-1 top-0.5'
                          : 'text-accent -left-1 top-0.5 rotate-45',
                      )}
                    />
                  )}
          <TiptapRenderer jsonContent={text} />
        </div>
      </div>
    </div>
  );
};

const MessageVList = () => {
  const { data, error, size, setSize, isLoading, isValidating } =
    useSWRInfinite(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0,
      shouldRetryOnError: true,
    });

  const messages = data ? data.flatMap((page) => page.messages).reverse() : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < LIMIT);

  const id = useRef(0);

  const createItem = ({
    value = generateTiptapJson(id.current++),
    me = false,
  } = {}) => ({
    id: faker.string.uuid(),
    value,
    me,
  });

  const [items, setItems] = useState(() =>
    Array.from(
      {
        length: 100,
      },
      () => createItem()
    )
  );

  const ref = useRef(null);
  const isPrepend = useRef(false);
  const shouldStickToBottom = useRef(true);
  const [value, setValue] = useState("");

  useLayoutEffect(() => {
    isPrepend.current = false;
  }, [messages.length]);

  useEffect(() => {
    if (!ref.current) return;
    if (!shouldStickToBottom.current) return;
    ref.current.scrollToIndex(messages.length - 1, {
      align: "end",
    });
  }, [messages.length]);

  /**
   * Used to create a new message after 5 seconds.
   * This simulates a new message arriving in the chat.
   * It will create a new message with a random value and add it to the list.
   */
  useEffect(() => {
    let canceled = false;
    let timer = null;
    const setTimer = () => {
      timer = setTimeout(() => {
        if (canceled) return;
        setItems((p) => [...p, createItem()]);
        setTimer();
      }, 5000);
    };
    setTimer();
    return () => {
      canceled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const disabled = !value.length;

  const submit = () => {
    if (disabled) return;
    shouldStickToBottom.current = true;
    const currentId = id.current++;
    const currentValue = generateTiptapJson(currentId, value);
    setItems((p) => [
      ...p,
      createItem({
        value: currentValue,
        me: true,
      }),
    ]);
    setValue("");
  };

  if (isLoading)
    return (
      <div className="absolute inset-0 w-full  flex items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col h-full w-full relative">
      <VList
        ref={ref}
        style={{
          flex: 1,
        }}
        reverse
        shift={isPrepend.current}
        onScroll={(offset) => {
          if (!ref.current) return;
          shouldStickToBottom.current =
            offset - ref.current.scrollSize + ref.current.viewportSize >=
            // FIXME: The sum may not be 0 because of sub-pixel value when browser's window.devicePixelRatio has decimal value
            -1.5;
          if (offset < 100 && !isPrepend.current && !isValidating) {
            isPrepend.current = true;
            setSize((p) => p + 1);
            // setItems(p => [...Array.from({
            //   length: 100
            // }, () => createItem()), ...p]);
          }
        }}
      >
        {isLoadingMore && (
          <div className="h-12 w-full  flex items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        )}
        {/* {renderMessagesWithSeparators()} */}
        {/* {items.map(d => <Item key={d.id} {...d} />)} */}
        {messages.map((d, index) => (
          <Message
            key={d.id}
            message={d}
            prevMessage={index > 0 ? messages[index - 1] : {}}
          />
        ))}
      </VList>
      <form
        style={{
          margin: 0,
        }}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          submit();
        }}
      >
        <div className="w-full flex flex-col gap-2 border-t  pt-2 p-2 ">
          <Textarea
            placeholder="Type your message here."
            rows={6}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
                submit();
                e.preventDefault();
              }
            }}
          />
          <div className="flex items-center gap-2">
            <Button variant="default" type="submit" disabled={disabled}>
              submit
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={() => {
                ref.current?.scrollTo(0);
              }}
            >
              jump to top
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageVList;
