import MessageVList from "@/components/MessageVList";
import MessageVListGroup from "@/components/MessageVListGroup";

export default function Home() {
  return (
    <main className="flex flex-col h-screen items-center justify-center  py-8 global-class">
      <section className="flex-1 max-w-3xl w-full border  rounded-lg overflow-hidden">
        {/* Message list with virtualization and grouping will go here */}
        <MessageVList />
        {/* <MessageVListGroup /> */}
      </section>
    
    </main>
  );
}
