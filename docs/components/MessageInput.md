# Component: MessageInput

## Description

A controlled input component for typing and sending new chat messages. It consists of a text input field and a send button.

## Import

```jsx
import MessageInput from '@/components/MessageInput';
```

## Props

| Prop          | Type     | Default     | Required | Description                                                              |
| :------------ | :------- | :---------- | :------- | :----------------------------------------------------------------------- |
| `value`       | `string` | -           | Yes      | The current value of the input field.                                    |
| `onChange`    | `func`   | -           | Yes      | Callback function that fires when the input value changes. `(event) => void` |
| `onSend`      | `func`   | -           | Yes      | Callback function that fires when the send button is clicked. `() => void` |
| `placeholder` | `string` | "Type a message..." | No       | Placeholder text for the input field.                                    |
| `isLoading`   | `bool`   | `false`     | No       | If `true`, disables the input and button and shows a loading state.      |

## Usage

```jsx
import { useState } from 'react';
import MessageInput from '@/components/MessageInput';

function Chat() {
  const [text, setText] = useState('');

  const handleSend = () => {
    console.log('Sending:', text);
    // api.sendMessage(text);
    setText('');
  };

  return (
    <MessageInput value={text} onChange={(e) => setText(e.target.value)} onSend={handleSend} />
  );
}
```