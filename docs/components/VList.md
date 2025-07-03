# Component: VList

## Description

`VList` is a low-level wrapper component around the `virtua` library, providing a flexible and high-performance virtualized list. It is integrated with `shadcn/ui`'s `ScrollArea` to provide consistent styling. It's used by `MessageVList` to render the list of messages and date separators efficiently.

## Import

```jsx
import VList from '@/components/VList';
```

## Props

This component forwards most of its props to the underlying `virtua` `Virtualizer`. Key props include:

| Prop       | Type      | Default | Required | Description                                                              |
| :--------- | :-------- | :------ | :------- | :----------------------------------------------------------------------- |
| `children` | `node`    | -       | Yes      | The list of items to render.                                             |
| `reverse`  | `boolean` | `false` | No       | Renders the list in reverse, with scrolling anchored to the bottom. Essential for chat interfaces. |
| `onScroll` | `func`    | -       | No       | A callback function that fires on scroll events.                         |
| `item`     | `React.Component` | -       | No       | A component to use for rendering each item, enabling features like sticky headers. |
| `shift`    | `boolean` | `false` | No       | If true, maintains scroll position when prepending items. Used for infinite loading. |

## Usage

This is an advanced component. It is used within `MessageVList` to manage the rendering of chat items.

```jsx
// Simplified usage within MessageVList.jsx
<VList ref={listRef} reverse shift={isPrepend.current} onScroll={handleScroll}>
  {/* ... list of Message and DateSeparator components ... */}
</VList>
```