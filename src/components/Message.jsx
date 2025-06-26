import { BoxCorner } from "@/icons";
import TiptapRenderer from "./TiptapRenderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { CURRENT_USER, MESSAGE_VARIANTS } from "@/constants";
import MessageContent from "./MessageContent";
import { useRef } from "react";


const Message = ({ message, prevMessage = {} }) => {
  const { text, user } = message;
  const isMe = user.id === CURRENT_USER;
  const showAvatarAndName = prevMessage?.user?.id !== message.user?.id;
  const time = new Date(message.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });


  return (
    <motion.div
              key={message.id}
              variants={MESSAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
      className={cn(
        "flex items-start mb-1 px-2.5",
        isMe ? "flex-row-reverse" : "",
        showAvatarAndName ? "mt-4" : ""
      )}
    >
      <div className={cn("w-6.5 h-6.5", isMe ? "ms-3" : "me-3")}>
        {showAvatarAndName && (
          <Avatar>
            <AvatarImage src={user.avatar_url} alt={`${user.name}'s avatar`} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {/* Sender Name and Time */}
        {showAvatarAndName && (
          <div className={cn("flex items-baseline text-meta-icon gap-2.5 mb-1", isMe ? "flex-row-reverse pe-4" : "ps-4")}>
            <p className="text-[11px] break-words flex">{user.name}</p>
            <p className="text-[11px] ">{time}</p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn('max-w-[min(400px,_calc(30vw_-_1rem))] rounded-3xl relative',  isMe
              ? "bg-[#BFDBFE] text-[#0C4A6E]"
              : "bg-accent text-title "
              )}
        >
          {showAvatarAndName && (
            <BoxCorner
              className={cn(
                ' absolute -right-1 top-0.5 z-0',
                isMe
                  ? 'text-[#BFDBFE] -right-1 top-0.5'
                  : 'text-accent -left-1 top-0.5 rotate-45',
              )}
            />
          )}
          {/* <TiptapRenderer jsonContent={text} /> */}
          <MessageContent message={message} className={cn(isMe
              ? "bg-[#BFDBFE] text-[#0C4A6E]"
              : "bg-accent text-title "
              )} />
        </div>
      </div>
    </motion.div>
  );
};

export default Message;