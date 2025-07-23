'use client'
import MessageVList from "@/components/Chat/MessageVList";

export default function HomePage() {

  return (
    <main className="flex flex-col h-[calc(100vh_-_3rem)] py-4 mt-12 items-center justify-center overflow-hidden">
      <section className="flex-1 max-w-3xl w-full border  rounded-lg overflow-hidden">
        <MessageVList />
      </section>
    </main>
  );
}
