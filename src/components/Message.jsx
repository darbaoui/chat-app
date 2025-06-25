import { BoxCorner } from "@/icons";
import TiptapRenderer from "./TiptapRenderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
export const messageVariants = {
    initial: {
      opacity: 0,
      y: -10
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

const Message = ({ message, prevMessage = {} }) => {
  const { text, user } = message;
  const isMe = user.id === 'current_user';
  const showAvatarAndName = prevMessage?.user?.id !== message.user?.id;
  const time = new Date(message.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });


  return (
    <motion.div
              key={message.id}
              variants={messageVariants}
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
          className={`max-w-md rounded-3xl px-5 py-2.5 relative ${isMe
              ? "bg-[#BFDBFE] text-[#0C4A6E]"
              : "bg-accent text-title "
            }`}
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
          <TiptapRenderer jsonContent={text} />
        </div>
      </div>
    </motion.div>
  );
};

export default Message;