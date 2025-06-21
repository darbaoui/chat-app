'use client'

import { faker } from "@faker-js/faker";
import { Loader } from "lucide-react";
import { useRef, useEffect, useCallback, useState, useLayoutEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { VList } from "virtua";
import { generateTiptapJson } from "./helper";
import TiptapRenderer from "./TiptapRenderer";

const LIMIT = 50;

const fetcher = (url) => fetch(url).then((res) => res.json());

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  return `/api/messages?page=${pageIndex + 1}&limit=${LIMIT}`;
};

const Item = ({ value, me }) => {

  return <div style={{ border: me ? "1px solid red": "1px solid rgb(204, 204, 204)",
  background: "rgb(255, 255, 255)",
  margin: "10px 80px 10px 10px",
  padding: "10px",
  borderRadius: "8px",
  whiteSpace: "pre-wrap"}}><TiptapRenderer jsonContent={value} /></div>
}

const MessageVList = () => {
  const id = useRef(0);
    const createItem = ({
      value = generateTiptapJson(id.current++),
      me = false
    }= {}) => ({
      id: id.current++,
      value,
      me
    });
    const [items, setItems] = useState(() => Array.from({
      length: 100
    }, () => createItem()));
    const ref = useRef(null);
    const isPrepend = useRef(false);
    const shouldStickToBottom = useRef(true);
    const [value, setValue] = useState("Hello world!");
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
      const currentValue =generateTiptapJson(currentId,  value);
      setItems(p => [...p, createItem({
        value: currentValue,
        me: true
      })]);
      setValue("");
    };
    return <div style={{
      width: "90vw",
      height: "90vh",
      display: "flex",
      flexDirection: "column"
    }}>
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
        margin: 10
      }} onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();
        submit();
      }}>
          <textarea style={{
          width: 400
        }} rows={6} value={value} onChange={e => {
          setValue(e.target.value);
        }} onKeyDown={e => {
          if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
            submit();
            e.preventDefault();
          }
        }} />
          <button type="submit" disabled={disabled}>
            submit
          </button>
          <button type="button" onClick={() => {
          ref.current?.scrollTo(0);
        }}>
            jump to top
          </button>
        </form>
      </div>;
};

export default MessageVList; 