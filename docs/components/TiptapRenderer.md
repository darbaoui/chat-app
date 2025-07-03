# Component: TiptapRenderer

## Description

A component dedicated to rendering rich text content that is stored in Tiptap's JSON format. It takes a Tiptap document object and safely renders it as corresponding React elements. This is used within the `Message` component to display the body of the message.

## Import

```jsx
import TiptapRenderer from '@/components/TiptapRenderer';
```

## Props

| Prop          | Type     | Default | Required | Description                               |
| :------------ | :------- | :------ | :------- | :---------------------------------------- |
| `jsonContent` | `object` | -       | Yes      | The Tiptap-compatible JSON object to render. |

## Usage

```jsx
const messageContent = {
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: [{ type: 'text', text: 'Hello, world!' }]
  }]
};

<TiptapRenderer jsonContent={messageContent} />
```