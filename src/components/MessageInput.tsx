import React from "react";

const MessageInput: React.FC = () => {
  return (
    <form className="flex gap-2 items-end">
      {/* Tiptap editor will be integrated here */}
      <textarea
        className="flex-1 resize-none border rounded p-2 min-h-[40px] max-h-32 focus:outline-none focus:ring"
        placeholder="Type your message..."
        rows={1}
        disabled
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled
      >
        Send
      </button>
    </form>
  );
};

export default MessageInput; 