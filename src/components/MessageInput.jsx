'use client'

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Pause, Plus, Send, SendHorizonal, Smile } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { cn, useOnClickOutside } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import TiptapEditorWrite from "./Editor/TipTapEditorWrite";



const MessageInput = () => {

  const [content, setContent] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);
  useOnClickOutside(containerRef, () => setIsExpanded(false));
  const setNewMessage = (messageContent) => {
    setContent(messageContent);
    // handleTyping();
  };

  const handleExpends = (e) => {
    e.stopPropagation()
    if(!isExpanded)
    {
      setIsExpanded(!isExpanded);
    }
  };


  return (
    <div className="w-full flex  min-h-16 items-center justify-center mx-auto border-t">
      <div className="w-auto flex items-center gap-2.5">

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="!w-8 !h-8 rounded-full bg-chat border-none text-meta-icon">
              <Plus />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto rounded-3xl" align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem className="rounded-xl">
                <Paperclip /> Add files
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl">
                <Smile /> Add emojis
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <motion.div
          ref={containerRef}
          className="flex-1 w-[220px] flex items-center text-xs justify-center min-h-8 rounded-full bg-chat text-meta-icon"
          animate={{ width: isExpanded ? '400px' : '254px' }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          onClick={handleExpends}
        >

          {isExpanded ? <TiptapEditorWrite onChange={(data) => setNewMessage(data)}  placeholder="Add a new message..." className="w-full px-2.5"/> :
            (<span>Add a comment</span>)}

        </motion.div>


        <div className="flex items-center relative">
            <div
                  key="pause"
                  className="absolute inset-0"
                 
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-full bg-chat border-none"
                    
                  >
                    <Pause className="text-meta-icon w-4" />
                  </Button>
                </div>
          <div className="relative w-8 h-8">


            <AnimatePresence initial={false} mode="wait">
              {!isExpanded ? (
                <>
                <motion.div
                  key="pause"
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-full bg-chat border-none"
                    
                  >
                    <Pause className="text-meta-icon w-4" />
                  </Button>
                </motion.div>
                <motion.div
                  key="mic"
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-full bg-chat border-none"
                    
                  >
                    <Mic className="text-meta-icon w-4" />
                  </Button>
                </motion.div>
                </>
              ) : (
                <motion.div
                  key="send"
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="default"
                    size="icon"
                    className="w-8 h-8 rounded-full"
                    
                  >
                    <SendHorizonal className="text-background w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput; 