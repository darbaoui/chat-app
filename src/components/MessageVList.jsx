'use client'

import { faker } from "@faker-js/faker";
import { Loader } from "lucide-react";
import { useRef, useEffect, useCallback, useState, useLayoutEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { VList } from "virtua";
import { formatDateSeparator, generateTiptapJson } from "./helper";
import TiptapRenderer from "./TiptapRenderer";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

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
  <div className="relative flex py-4 items-center">
    <div className="flex-grow border-t border-gray-300"></div>
    <span className="flex-shrink mx-4 text-xs font-semibold text-gray-500 bg-gray-50 px-2">{dateString}</span>
    <div className="flex-grow border-t border-gray-300"></div>
  </div>
);

const Message = ({ message, prevMessage = {} }) => {
  const { text, user } = message
  const isMe = false
  // Check if the sender is different from the previous message's sender
  // or if the previous message was on a different day.
  const messageDate = new Date(message.created_at).toDateString();
  const prevMessageDate = prevMessage ? new Date(prevMessage?.created_at).toDateString() : null;
  const showAvatarAndName = prevMessage?.user?.id !== message.user?.id;
  console.log('showAvatarAndName -->', showAvatarAndName)
  const time = new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return (
    <div className={cn('flex items-start my-1 px-2.5', isMe ? 'justify-end' : 'justify-start', showAvatarAndName ? 'mt-4' : '')}>
     
      <div className="w-8 h-8 mr-3">
        {showAvatarAndName && (

          <Avatar>
            <AvatarImage src={user.avatar_url}
              alt={`${user.name}'s avatar`} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>

        )}
      </div>

      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender Name and Time */}
        {showAvatarAndName && (
          <div className="flex items-baseline space-x-2 mb-1">
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{time}</p>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
          <TiptapRenderer jsonContent={text} />
          <p className="text-xs text-right mt-1 opacity-70">{time}</p>
        </div>
      </div>
    </div>
  )
  // return <div className={cn('p-2.5 rounded-lg whitespace-pre-wrap  max-w-3/4 m-2.5', me ? 'border border-destructive bg-card' : 'border border-border bg-card')}><TiptapRenderer jsonContent={text} /></div>
}
const Item = ({ value, me }) => {
  return <div className={cn('p-2.5 rounded-lg whitespace-pre-wrap  max-w-3/4 m-2.5', me ? 'border border-destructive bg-card' : 'border border-border bg-card')}><TiptapRenderer jsonContent={value} /></div>
}

const MessageVList = () => {

  const { data, error, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0,
    shouldRetryOnError: true,
  })

  const messages = data ? data.flatMap(page => page.messages).reverse() : [];

  const id = useRef(0);

  const createItem = ({
    value = generateTiptapJson(id.current++),
    me = false
  } = {}) => ({
    id: faker.string.uuid(),
    value,
    me
  });

  const [items, setItems] = useState(() => Array.from({
    length: 100
  }, () => createItem()));

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
      align: "end"
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
        setItems(p => [...p, createItem()]);
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
    setItems(p => [...p, createItem({
      value: currentValue,
      me: true
    })]);
    setValue("");
  };


  return <div className="flex flex-col h-full w-full relative">
    <VList ref={ref} style={{
      flex: 1
    }} reverse shift={isPrepend.current} onScroll={offset => {
      if (!ref.current) return;
      shouldStickToBottom.current = offset - ref.current.scrollSize + ref.current.viewportSize >=
        // FIXME: The sum may not be 0 because of sub-pixel value when browser's window.devicePixelRatio has decimal value
        -1.5;
      if (offset < 100 && !isPrepend.current && !isValidating) {
        isPrepend.current = true;
        setSize(p => p + 1);
        // setItems(p => [...Array.from({
        //   length: 100
        // }, () => createItem()), ...p]);
      }
    }}>
      {/* {renderMessagesWithSeparators()} */}
      {/* {items.map(d => <Item key={d.id} {...d} />)} */}
      {messages.map((d, index) => <Message key={d.id} message={d} prevMessage={index > 0 ? messages[index - 1] : {}} />)}
    </VList>
    <form style={{
      margin: 0
    }} onSubmit={e => {
      e.preventDefault();
      e.stopPropagation();
      submit();
    }}>
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
          }} />
        <div className="flex items-center gap-2">

          <Button variant="default" type="submit" disabled={disabled}>
            submit
          </Button>

          <Button variant="outline" type="button" onClick={() => {
            ref.current?.scrollTo(0);
          }}>
            jump to top
          </Button>
        </div>
      </div>
    </form>
  </div>;
};

export default MessageVList; 