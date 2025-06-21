import Image from "next/image";
import MessageInput from "@/components/MessageInput";
import MessageVList from "@/components/MessageVList";

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-gray-50">
      <section className="flex-1 p-4">
        {/* Message list with virtualization and grouping will go here */}
        <MessageVList />
      </section>
      <footer className="p-4 border-t bg-white">
        {/* Message input with Tiptap will go here */}
        <MessageInput />
      </footer>
    </main>
  );
}
