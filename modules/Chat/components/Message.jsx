import { BoxCorner } from "@/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, fromNow } from "@/lib/utils";
import MessageContent from "./MessageContent";
import { memo, useContext } from "react";
import { useChatContext } from "@/modules/Chat/contexts/chat-context";


const Message = memo(({ message, prevMessage = {} }) => {
  const { user, created_at } = message;
  const { authUser } = useChatContext();
  const isMe = user.id === authUser?.id;


  const showAvatarAndName = prevMessage?.user?.id !== message.user?.id;
  const time = fromNow(created_at)

  // TODO: add animation like SlideIn/SlideOut
  return (
    <div
      key={message.id}
      className={cn(
        "flex items-start mb-1 w-full",
        isMe ? "flex-row-reverse pe-4 ps-4 md:ps-5 md:pe-5" : " ps-4 pe-4 md:ps-5 md:pe-5",
        showAvatarAndName ? "mt-4" : ""
      )}
    >
      <div className={cn("w-6.5 h-full sticky top-[30px]", isMe ? "ms-3" : "me-3")}>

        <div className={cn("min-w-6.5 !w-6.5 !h-6.5 ")}>
          {showAvatarAndName && (
            <Avatar>
              <AvatarImage src={user.avatar} alt={`${user.name}'s avatar`} />
              <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      <div className={`flex flex-col w-full ${isMe ? "items-end content-end justify-self-end" : "items-start"}`}>
        {/* Sender Name and Time */}
        {showAvatarAndName && (
          <div className={cn("flex items-baseline text-meta-icon gap-2.5 mb-1", isMe ? "flex-row-reverse pe-4" : "ps-4")}>
            <p className="text-[11px] break-words flex">{user.name}</p>
            <p className="text-[11px] ">{time}</p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn('relative flex w-full', isMe ? 'justify-end' : '')}
        >
          {showAvatarAndName && (
            <BoxCorner
              className={cn(
                ' absolute -right-1 top-0.5 z-0',
                isMe
                  ? 'text-chatBoxMe -right-1 top-0.5'
                  : 'text-accent -left-1 top-0.5 rotate-45',
              )}
            />
          )}
          <MessageContent message={message} className={cn(
            "rounded-3xl",
            isMe
              ? "bg-chatBoxMe text-chatBoxMe-foreground"
              : "bg-accent text-title "
          )} />
        </div>
      </div>
    </div>
  );
});

export default Message;