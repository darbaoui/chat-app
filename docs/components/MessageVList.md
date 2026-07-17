# Component: MessageVList

## Description

A high-performance, virtualized list component specifically designed for displaying a potentially large number of chat messages. It handles fetching data, infinite scrolling (loading more messages as the user scrolls up), grouping messages by date, and rendering sticky date headers.

It uses `swr/infinite` for data fetching and `@tanstack/react-virtual` for virtualization.

## Import

```jsx
import MessageVList from '@/components/Chat/MessageVList';
```

## Props

This component is largely self-contained and does not accept external props for its data. It fetches and manages its own state internally.

## Usage

Simply place the `MessageVList` component within your chat window layout. It will fill the available space and handle all message rendering and fetching logic.

```jsx
function ChatWindow() {
  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <MessageVList />
      <MessageInput />
    </div>
  );
}
```