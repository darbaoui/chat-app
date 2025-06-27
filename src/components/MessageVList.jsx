"use client";

import { Loader } from "lucide-react";
import { createContext, forwardRef, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import VList from "@/components/VList";
import Message from "./Message";
import { formatDateSeparator} from "./helper";
import DateSeparator from "./DateSeparator";
const LIMIT = 50;



const fetcher = (url) => fetch(url).then((res) => res.json());

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

  const ref = useRef(null);
  const isPrepend = useRef(false);
  const shouldStickToBottom = useRef(true);
  const [activeIndex, setActiveIndex] = useState(0)

  // Group messages by date and create list items
  const listItems = useMemo(() => {
    const items = [];
    const dateIndexs = new Set();
    let currentDate = null;

    messages.forEach((message, index) => {

      const messageDate = new Date(message.created_at);

      const messageDateString = formatDateSeparator(messageDate);

      // Add date separator if it's a new day
      if (messageDateString !== currentDate) {
        currentDate = messageDateString;
        // activeIndex.current = items.length;
        dateIndexs.add(items.length);

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

    return { items, dateIndexs };

  }, [messages]);

  useEffect(() => {
    if (!ref.current) return;
    if (!shouldStickToBottom.current) return;
    ref.current.scrollToIndex(listItems.items.length - 1, {
      align: "end",
    });
  }, [listItems.items.length]);


  useLayoutEffect(() => {
    isPrepend.current = false;
  }, [listItems.items.length]);


  const handleScroll = (offset) => {
    if (!ref.current) return;

    const start = ref.current.findStartIndex();
    const activeStickyIndex = [...listItems.dateIndexs]
      .reverse()
      .find((index) => start >= index);

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


  if (isLoading)
    return (
      <div className="absolute inset-0 w-full  flex items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );

  return (
    <>
      <StickyIndexContext.Provider value={{ activeIndex: activeIndex, stickyIndexes: listItems.dateIndexs }}>


        <div className="flex flex-col h-full w-full relative">
          <VList
            ref={ref}
            style={{
              flex: 1,
            }}

            id="list-view"

            item={StickyItem}
            keepMounted={[activeIndex]}
            reverse
            shift={isPrepend.current}
            onScroll={handleScroll}
          >
            {isLoadingMore && (
              <div className="h-8 w-full bg-transparent flex items-center justify-center">
                <div className="w-8 rounded-3xl flex h-full items-center justify-center bg-title">
                  <Loader className="animate-spin w-3 text-white" />
                </div>
              </div>
            )}


            {listItems.items.map((item, index) => {
              if (item.type === 'date') {
                return <DateSeparator dateString={item.date} index={index}  key={item.id} />
              }
              return (

                <Message
                  key={item.id}
                  message={item}
                  prevMessage={index > 0 ? listItems.items[index - 1] : {}}
                />
              )

            })}
          </VList>
        </div>
      </StickyIndexContext.Provider>
    </>
  );
};

export default MessageVList;
