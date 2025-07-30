'use client'
import MessageVList from "@/modules/Chat/components/MessageVList";

export default function HomePage() {

  return (
    <main className="flex flex-col h-[calc(100vh_-_3rem)] py-4 mt-12 items-center justify-center overflow-hidden">
      <section className="flex-1 max-w-3xl w-full border  rounded-lg overflow-hidden">
        <MessageVList
          className="h-full"
          contentableType='message'
          contentableId="7f43c6a5-2e13-4fa8-b6cf-9a6acbf4bb71"
        />
      </section>
    </main>
  );
}
