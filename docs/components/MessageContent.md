# Component: MessageContent (Conceptual)

## Description

`MessageContent` is not a standalone component but a conceptual part of the `Message` component. It represents the styled "bubble" that contains the actual message text or media.

Its primary responsibilities are:
- Displaying a colored background bubble, which is different for the current user's messages versus others' messages.
- Rendering the message text using the `TiptapRenderer` component.
- Displaying a "tail" or "corner" on the bubble to point towards the sender's avatar, but only for the first message in a group.

## Implementation

This logic is located within the `Message.jsx` file.

```jsx
// Simplified structure within Message.jsx
<div className={`max-w-md rounded-3xl ... ${isMe ? 'bg-blue-200' : 'bg-gray-200'}`}>
  {showAvatarAndName && <BoxCorner className={...} />}
  <TiptapRenderer jsonContent={message.text} />
</div>
```