import Image from "next/image";
import MessageList from "@/components/MessageList.jsx";
import MessageInput from "@/components/MessageInput";

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-gray-50">
      <section className="flex-1 overflow-y-auto p-4">
        {/* Message list with virtualization and grouping will go here */}
        <MessageList />
      </section>
      <footer className="p-4 border-t bg-white">
        {/* Message input with Tiptap will go here */}
        <MessageInput />
      </footer>
    </main>
  );
}
