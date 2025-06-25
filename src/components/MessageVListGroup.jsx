"use client";

import { Loader } from "lucide-react";
import { createContext, forwardRef, Fragment, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { VList } from "virtua";
import Message from "./Message";
import { formatDateSeparator } from "./helper";

const LIMIT = 50;



const fetcher = (url) => fetch(url).then((res) => res.json());

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
};

const StickyIndexContext = createContext(-1);

const StickyItem = forwardRef(
  ({ children, style, index }, ref) => {
    const {activeIndex, stickyIndexes} = useContext(StickyIndexContext);
    return (
      <div
        ref={ref}
        style={{
          ...style,
          ...(stickyIndexes.has(index) && {
            zIndex: 1,
          }),
          ...(activeIndex === index && {
            position: "sticky",
            top: 0,
          }),
        }}
      >
        {children}
      </div>
    );
  }
);
const Item = ({children}) => {
  return children
}
const MessageVListGroup = () => {
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
    
    return {items, dateIndexs};

  }, [messages]);



  const groupedMessages = useMemo(() => {
    // Use `reduce` to group messages into an object where keys are dates.
    const groups = messages.reduce((acc, message) => {
      // Get the date string (e.g., "2023-10-26") from the message's timestamp.
      const messageDate = formatDateSeparator(new Date(message.created_at));

      // If a group for this date doesn't exist yet, create it.
      if (!acc[messageDate]) {
        acc[messageDate] = [];
      }

      // Add the current message to the group for its date.
      acc[messageDate].push(message);
      
      return acc;
    }, {}); // The initial value for the accumulator is an empty object.

    // Convert the groups object into an array of {date, messages} objects.
    return Object.keys(groups).map(date => ({
      date: date,
      messages: groups[date],
    }));

  }, [messages]);


  console.log('groupedMessages --->', groupedMessages)

  useEffect(() => {
    if (!ref.current) return;
    if (!shouldStickToBottom.current) return;
    ref.current.scrollToIndex(groupedMessages.length - 1, {
      align: "end",
    });
  }, [groupedMessages.length]);
  

   useLayoutEffect(() => {
    isPrepend.current = false;
  }, [groupedMessages.length]);


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
    // <StickyIndexContext.Provider value={{activeIndex:  activeIndex ,stickyIndexes: listItems.dateIndexs}}>


    <div className="flex flex-col h-full w-full relative">

      <VList
        ref={ref}
        style={{
          flex: 1,
        }}
        // item={StickyItem}
        // keepMounted={[activeIndex]}
        reverse
        shift={isPrepend.current}
        onScroll={handleScroll}
      >
        {isLoadingMore && (
          <div className="h-12 w-full  flex items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        )}

     
        {groupedMessages.map((item, index) => {
          return <Fragment key={item.date}>
              {item.date && (
                <div className="sticky top-2.5 py-3 w-full flex items-center text-xs justify-center pointer-events-none my-2 opacity-100 transition-opacity duration-300 z-10">
                  <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                    {item.date}
                  </div>
                </div>
              )}
<Item>

              {item.messages.map((item) => (

                <Message
                  key={item.id}
                  
                  message={item}
                  prevMessage={index > 0 ? listItems.items[index - 1] : {}}
                />
              ))
              }
</Item>
          </Fragment>

        })}
      </VList>
    </div>
    // </StickyIndexContext.Provider>
  );
};

export default MessageVListGroup;
