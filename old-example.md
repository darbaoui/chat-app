# Old MessageVList code

```jsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { faker } from '@faker-js/faker';
import { Loader } from 'lucide-react';
import {
  createContext,
  forwardRef,
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import useSWRInfinite from 'swr/infinite';
import { VList } from 'virtua';
import { formatDateSeparator, generateTiptapJson } from './helper';
import TiptapRenderer from './TiptapRenderer';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import BoxCorner from '@/icons/BoxCorner';
import Message from './Message';

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

  /**
   * Used to track the last shown date for messages.
   * This is used to determine if a date separator should be shown.
   */
  // const [lastShownDate, setLastShownDate] = useState(null);

  const messages = data ? data.flatMap((page) => page.messages).reverse() : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.length < LIMIT);

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
  const [value, setValue] = useState('');

  useLayoutEffect(() => {
    isPrepend.current = false;
  }, [messages.length]);

  useEffect(() => {
    if (!ref.current) return;
    if (!shouldStickToBottom.current) return;
    ref.current.scrollToIndex(messages.length - 1, {
      align: 'end',
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
    setValue('');
  };

  if (isLoading)
    return (
      <div className='absolute inset-0 w-full  flex items-center justify-center'>
        <Loader className='animate-spin' />
      </div>
    );

  return (
    <div className='flex flex-col h-full w-full relative'>
      <VList
        ref={ref}
        style={{
          flex: 1,
        }}
        // keepMounted={[activeIndex.current]}
        reverse
        shift={isPrepend.current}
        onScroll={(offset) => {
          if (!ref.current) return;

          const start = ref.current.findStartIndex();
          console.log('start -->', start);
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
        }}
      >
        {isLoadingMore && (
          <div className='h-12 w-full  flex items-center justify-center'>
            <Loader className='animate-spin' />
          </div>
        )}

        {messages.map((message, index) => {
          return (
            <Fragment key={message.id}>
              <Message
                // key={message.id}
                message={message}
                prevMessage={index > 0 ? messages[index - 1] : {}}
              />
            </Fragment>
          );
        })}
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
        <div className='w-full flex flex-col gap-2 border-t  pt-2 p-2 '>
          <Textarea
            placeholder='Type your message here.'
            rows={6}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.code === 'Enter' && (e.ctrlKey || e.metaKey)) {
                submit();
                e.preventDefault();
              }
            }}
          />
          <div className='flex items-center gap-2'>
            <Button variant='default' type='submit' disabled={disabled}>
              submit
            </Button>

            <Button
              variant='outline'
              type='button'
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
```

# Old DateSeparator

```jsx
import { MESSAGE_VARIANTS } from '@/modules/Chat/constants';
import { motion } from 'framer-motion';
import { StickyIndexContext } from './MessageVList';
import { useContext } from 'react';
/**
 * Renders the date separator UI.
 */
const DateSeparator = ({ dateString, index }) => {
  const { activeIndex } = useContext(StickyIndexContext);

  const isSticky = activeIndex === index;

  const hrVariants = {
    visible: { opacity: 1, transition: { duration: 0.2 } },
    hidden: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      variants={MESSAGE_VARIANTS}
      initial='initial'
      animate='animate'
      exit='exit'
      layout
      className='item-date flex justify-center items-baseline py-3 z-10'
      style={
        {
          // backdropFilter: 'blur(10px)'
        }
      }
    >
      <hr className='flex-1 border-t border' />
      {/* <div className="text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                      </div> */}
      <span
        className='px-3 text-sidebar text-[12px] font-medium'
        style={{ width: 'fit-content' }}
      >
        {dateString}
      </span>
      <hr className='flex-1 border-t border' />
    </motion.div>
  );
};

export default DateSeparator;
```
