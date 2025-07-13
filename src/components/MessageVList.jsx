"use client";

import { Loader } from "lucide-react";
import { createContext, forwardRef, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import Message from "./Message";
import { formatDateSeparator, generateTiptapJson } from "./helper";
import DateSeparator from "./DateSeparator";
// import { VList } from "virtua";
import { VList } from "@/virtua/VList";
// import  VList from "./VList";
import { cn } from "@/lib/utils";
import MessageInput from "./MessageInput";
import { axios } from "@/lib/axios";
import useMessageStore from "@/stores/MessageStore";
import { faker } from "@faker-js/faker";
import { CURRENT_USER } from "@/constants";
const LIMIT = 50;



const fetcher = (url) => axios.get(url).then(({ data }) => data);
// const fetcher = (url) => fetch(url).then((res) => res.json());

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
};

export const StickyIndexContext = createContext(-1);

const StickyItem = forwardRef(
  ({ children, style, index }, ref) => {
    const { activeIndex, stickyIndexes } = useContext(StickyIndexContext);
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

const MessageVList = () => {
  const { data, error, size, setSize, isLoading, isValidating } =
    useSWRInfinite(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0,
      shouldRetryOnError: true,
    });


  const { addMessage, messages, setMessages, shouldScrollToBottom } = useMessageStore();

  useEffect(() => {
    if (data) {
      const messages = data ? data.flatMap((page) => page.data).reverse() : [];
      setMessages(messages);

    }
  }, [data])


  useEffect(() => {
    if (shouldScrollToBottom) {
      shouldStickToBottom.current = shouldStickToBottom
    }
  }, [shouldScrollToBottom])

  const isLoadingMore =
    isLoading || (size > 0 && data && data?.data?.[data.length - 1]?.length >= LIMIT);

  const isEmpty = messages && messages.length === 0;
  const isReachingEnd = isEmpty || (data && data?.data?.[data.length - 1]?.length < LIMIT);

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

  useEffect(() => {
    if (!ref.current) return;
    if (!shouldStickToBottom.current) return;
    ref.current.scrollToIndex(items.length - 1, {
      align: "end",
    });
  }, [items.length]);


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
      // setItems(p => [...Array.from({
      //   length: 100
      // }, () => createItem()), ...p]);
    }
  }


  // useEffect hook to run side effects, in this case, a timer
  // useEffect(() => {
  //   // Set up an interval to run a function every 1000ms (1 second)
  //   const intervalId = setInterval(() => {
  //     // The function to run every second
  //     const createNewItem = () => {

  //       const message_id = faker.string.uuid();
  //       const message = {
  //         id: message_id,
  //         tempId: message_id,
  //         isUploading: true,
  //         created_at: new Date(Date.now()).toISOString(),
  //         // media: [
  //         //   {
  //         //     message_id,
  //         //     id: faker.string.uuid(),
  //         //     tempId: faker.string.uuid(),
  //         //     isUploading: true,
  //         //     duration,
  //         //     file_name,
  //         //     file: audioBlob,
  //         //     mime_type,
  //         //     name: file_name,
  //         //     wave_samples,
  //         //   }
  //         // ],
  //         media: [],
  //         content: generateTiptapJson(1),
  //         user: {
  //           id: CURRENT_USER,
  //           avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  //           email: "faye59@example.net",
  //           name: "Alexzander Wiza"
  //         }
  //       }


  //       shouldStickToBottom.current = true
  //       addMessage(message);

  //     };

  //     createNewItem();
  //   }, 10000);

  //   // Cleanup function: This is crucial to prevent memory leaks.
  //   // React will run this function when the component unmounts.
  //   return () => {
  //     clearInterval(intervalId); // Stop the interval
  //   };
  // }, []);



  if (isLoading || !messages)
    return (
      <div className="absolute inset-0 w-full  flex items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );

  return (
    <>
      <StickyIndexContext.Provider value={{ activeIndex: activeIndex, stickyIndexes: dateIndexesSet }}>


        <div className="flex flex-col h-full w-full relative">
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
                  overscan={items.length >= 50 ? 50 : 0}
                  item={StickyItem}
                  keepMounted={[activeIndex]}
                  reverse
                  shift={isPrepend.current}
                  onScroll={handleScroll}
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
      </StickyIndexContext.Provider>
    </>
  );
};

export default MessageVList;
