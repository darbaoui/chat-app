'use client'

import { faker } from "@faker-js/faker";
import { Loader } from "lucide-react";
import { useRef, useEffect, useCallback, useState, useLayoutEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { VList } from "virtua";
import { generateTiptapJson } from "./helper";
import TiptapRenderer from "./TiptapRenderer";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const LIMIT = 50;

const fetcher = (url) => fetch(url).then((res) => res.json());

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
};

const Item = ({ value, me }) => {
  return <div className={cn('p-2.5 rounded-lg whitespace-pre-wrap  max-w-3/4 m-2.5', me ? 'border border-destructive bg-card' : 'border border-border bg-card')}><TiptapRenderer jsonContent={value} /></div>
}

const MessageVList = () => {

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
  });

  useEffect(() => {
    if (!ref.current) return;
    if (!shouldStickToBottom.current) return;
    ref.current.scrollToIndex(items.length - 1, {
      align: "end"
    });
  }, [items.length]);

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
      if (offset < 100) {
        isPrepend.current = true;
        setItems(p => [...Array.from({
          length: 100
        }, () => createItem()), ...p]);
      }
    }}>
      {items.map(d => <Item key={d.id} {...d} />)}
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