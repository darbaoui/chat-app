'use client'

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Plus, Send, SendHorizonal, Smile } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { cn, useOnClickOutside } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



const MessageInput = () => {

  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);
  useOnClickOutside(containerRef, () => setIsExpanded(false));


  return (
    <form className="w-full flex  min-h-16 items-center justify-center mx-auto border-t">
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
          className="flex-1 w-[220px] flex items-center text-xs justify-center h-8 rounded-full bg-chat text-meta-icon"
          animate={{ width: isExpanded ? '400px' : '200px' }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          onClick={() => setIsExpanded(true)}
        >

          <span>Add a comment</span>

        </motion.div>


        <div className="flex items-center">
          <div className="relative w-8 h-8">
            <AnimatePresence initial={false} mode="wait">
              {!isExpanded ? (
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
                    onClick={() => { }}
                  >
                    <Mic className="text-meta-icon w-4" />
                  </Button>
                </motion.div>
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
                    onClick={() => { }}
                  >
                    <SendHorizonal className="text-background w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        {/* <Button variant="outline" className="!w-8 !h-8 rounded-full bg-chat border-none">
          <Mic />
        </Button>
        <Button variant="outline" className="!w-8 !h-8 rounded-full bg-chat border-none">
          <Send />
        </Button> */}
      </div>
    </form>
  );
};

export default MessageInput; 