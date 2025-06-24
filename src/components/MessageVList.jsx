"use client";

import { Loader } from "lucide-react";
import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { VList } from "virtua";
import Message from "./Message";

const LIMIT = 50;



const fetcher = (url) => fetch(url).then((res) => res.json());

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
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

  const ref = useRef(null);
  const isPrepend = useRef(false);
  const shouldStickToBottom = useRef(true);

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



  const handleScroll = (offset) => {
    if (!ref.current) return;

    const start = ref.current.findStartIndex();
    console.log("start -->", start);
    // const activeStickyIndex = [...stickyIndexes]
    //   .reverse()
    //   .find((index) => start >= index);



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
    <div className="flex flex-col h-full w-full relative">

      <VList
        ref={ref}
        style={{
          flex: 1,
        }}
        // keepMounted={[activeIndex.current]}
        reverse
        shift={isPrepend.current}
        onScroll={handleScroll}
      >
        {isLoadingMore && (
          <div className="h-12 w-full  flex items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        )}

        {messages.map((message, index) => {

          return <Fragment key={message.id}>

            <Message
              // key={message.id}
              message={message}
              prevMessage={index > 0 ? messages[index - 1] : {}}
            />
          </Fragment>
        })}


      </VList>
    </div>
  );
};

export default MessageVList;
