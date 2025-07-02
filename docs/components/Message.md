# Component: Message

## Description

The `Message` component is responsible for rendering a single chat message item. It intelligently handles the layout based on whether the message is from the current user or another participant. It also groups consecutive messages from the same user by only showing the avatar and sender name on the first message of a sequence.

## Import

```jsx
import Message from '@/components/Message';
```

## Props

| Prop          | Type     | Default | Required | Description                                                                                             |
| :------------ | :------- | :------ | :------- | :------------------------------------------------------------------------------------------------------ |
| `message`     | `object` | -       | Yes      | The message object containing details like `id`, `text` (Tiptap JSON), `created_at`, and `user` info. |
| `prevMessage` | `object` | `{}`    | No       | The message object that appeared before this one. Used to determine if the avatar and name should be displayed. |

### `message` object shape

```ts
{
  id: string;
  created_at: string; // ISO timestamp
  text: object; // Tiptap JSON
  user: {
    id: string;
    name: string;
    avatar_url: string;
  }
}
```

## Usage

The `Message` component is rendered by `MessageVList` for each message in the chat history.

```jsx
<Message message={currentMessage} prevMessage={previousMessage} />
```