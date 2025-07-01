'use client'

import { Virtuoso } from 'react-virtuoso'
import { rand, randFullName, randSentence, randPhrase, randNumber } from "@ngneat/falso";
const LIMIT = 50;
import { Loader } from "lucide-react";
import { createContext, forwardRef, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import useSWRInfinite from "swr/infinite";
import Message from "./Message";
import { formatDateSeparator } from './helper';
import DateSeparator from './DateSeparator';


const fetcher = (url) => fetch(url).then((res) => res.json());

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
};


export default function MessageVirtuoso() {
    

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
    const { items, dateIndexes, dateIndexesSet } = useMemo(() => {
      const items = [];
      const dateIndexesSet = new Set();
      let currentDate = null;
  
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

      const itemContent = useCallback(
        (index, rowData) => {
           if (rowData.type === 'date') {
                return <DateSeparator dateString={rowData.date} index={index}  key={rowData.id} />
              }
              return (

                <Message
                  key={rowData.id}
                  message={rowData}
                  prevMessage={index > 0 ? items[index - 1] : {}}
                />
              )
        }
        ,
        []
      );

   const followOutput = useCallback((isAtBottom) => {
    console.log('MessagesList: followOutput isAtBottom', isAtBottom);
    return isAtBottom ? 'smooth' : false;
  }, []);

  const atTopStateChange = () => {
    console.log('MessagesList: atTopStateChange');
  }
  const atBottomStateChange = () => {
    console.log('MessagesList: atBottomStateChange');
  }

   useEffect(() => {
    if (!ref.current) return;
    // if (!shouldStickToBottom.current) return;
    ref.current.scrollTo(items.length - 1, {
      align: "end",
    });

    console.log(ref.current)
  }, [items.length]);


    useLayoutEffect(() => {
      isPrepend.current = false;
    }, [items.length]);

  const onScroll = useCallback(
    (location) => {
      // offset is 0 at the top, -totalScrollSize + viewportHeight at the bottom
      // if (location.listOffset > -100 && !loadingNewer && firstMessageId.current) {
        if (location.listOffset < 100 && !isPrepend.current && !isValidating) {
          isPrepend.current = true;
          setSize((p) => p + 1);
      
     }
      // }
    },
    [isValidating, isPrepend]
  )

  console.log('channel -->', messages)
  return (
  
    <div
      style={{
        backgroundColor: "#F0F0F0",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "flex-end",
        overflow: "hidden",
        padding: "0px 10px",
        width: "100%"
      }}
    >

        <Virtuoso
          style={{ flex: 1 }}
          data={items}
          followOutput={followOutput}
          atTopStateChange= {atTopStateChange}
          atBottomStateChange= {atBottomStateChange}
          initialTopMostItemIndex={items.length - 1}
          firstItemIndex={Math.max(0, items.length-1)}
          // onScroll={onScroll}
          itemContent={itemContent}
          scrollerRef={(scroll) => ref.current = scroll}
        />
        </div>
       
  )
}

