'use client'

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Plus, SendHorizonal, Trash } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

import TiptapEditorWrite from "./Editor/TipTapEditorWrite";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";
import PlayRecordAudio from "./Media/PlayRecordAudio";

const itemVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { type: "spring", stiffness: 500, damping: 30 }
};

const editorVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};


const MessageInput = () => {

  const audioRecorderRef = useRef(null)

  const [content, setContent] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNoText, setHasNoText] = useState(true)

  // --- CHANGE 1: Create a ref for the entire component wrapper ---
  const wrapperRef = useRef(null);

  // --- CHANGE 2: useOnClickOutside now watches the entire wrapper ---
  useOnClickOutside(wrapperRef, () => {
    if (isRecording) return;
    setIsExpanded(false);
  });

  const setNewMessage = (messageContent) => {
    setContent(messageContent);
  };

  const handleExpand = (e) => {
    e.stopPropagation();
    if (!isRecording) {
      setIsExpanded(true);
    }
  };

  const handleStartRecording = (e) => {
    console.log("1. handleStartRecording called. Setting isRecording to true."); //
    // e.stopPropagation();
    setIsExpanded(false);
    setIsRecording(true);
  };


  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const sendTextContent = () => {
    // TODO: add logic how send json content from tiptap editor to server
    // content state that store the text writing by the user
  }

  const sendAudioContent = () => {
    // TODO: add logic how send audio recording to server
  }

  useEffect(() => {
    if (isRecording && audioRecorderRef.current) {
      audioRecorderRef.current.startRecord();
    }
  }, [isRecording]);

  return (
    <div className="w-full flex min-h-16 items-center justify-center mx-auto border-t p-4">
      {/* --- CHANGE 3: Attach the ref to this parent div --- */}
      <div ref={wrapperRef} className="flex items-center gap-2.5">

        {/* --- Left Button Group (Plus / Trash swap) --- */}
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="trash-btn"
              variants={itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Button
                variant="outline"
                onClick={handleStopRecording}
                className="!w-8 !h-8 rounded-full bg-chat border-none text-meta-icon"
              >
                <Trash className="w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="plus-btn"
              variants={itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Button variant="outline" className="!w-8 !h-8 rounded-full bg-chat border-none text-meta-icon">
                <Plus />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Main Input Container --- */}
        <motion.div
          className="flex-1 flex items-center justify-center min-h-8 rounded-full bg-chat text-meta-icon cursor-text"
          animate={{
            width: isExpanded ? '400px' : (isRecording ? '300px' : '254px'),
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={handleExpand}
        >
          {/* <AnimatePresence mode="wait"> */}
          {isRecording ? (
            <motion.div
              key="recording-indicator"
              className="text-xs text-meta-icon w-full"
              variants={editorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <PlayRecordAudio ref={audioRecorderRef} isRecording={isRecording} />
            </motion.div>
          ) : !isExpanded ? (
            <motion.span
              key="placeholder"
              className="text-xs"
              variants={editorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              Add a comment
            </motion.span>
          ) : (
            <motion.div
              key="editor"
              className="w-full px-2.5"
              variants={editorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <TiptapEditorWrite
                setNoText={setHasNoText}
                onChange={(data) => setNewMessage(data)}
                placeholder="Type your message..."
                className="w-full"
              />
            </motion.div>
          )}
          {/* </AnimatePresence> */}
        </motion.div>

        {/* --- Right-side Buttons --- */}
        <div className="flex items-center gap-2.5">

          {/* This single AnimatePresence handles all button swaps to prevent jumps */}
          <AnimatePresence mode="wait">
            {isRecording ? (
              // If recording, show the Pause button
              <motion.div key="pause" variants={itemVariants} initial="initial" animate="animate" exit="exit">
                <Button variant="outline" size="icon" className="w-8 h-8 rounded-full bg-chat border-none" onClick={handleStopRecording}>
                  <Pause className="text-meta-icon w-4" />
                </Button>
              </motion.div>
            ) : hasNoText ? (
              // If not recording and no text, show the Mic button
              <motion.div key="mic" variants={itemVariants} initial="initial" animate="animate" exit="exit">
                <Button variant="outline" size="icon" className="w-8 h-8 rounded-full bg-chat border-none" onClick={handleStartRecording}>
                  <Mic className="text-meta-icon w-4" />
                </Button>
              </motion.div>
            ) : (
              // If not recording and HAS text, show the Send button
              <motion.div key="send" variants={itemVariants} initial="initial" animate="animate" exit="exit">
                <Button variant="default" size="icon" className="w-8 h-8 rounded-full" onClick={sendTextContent}>
                  <SendHorizonal className="text-background w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* This AnimatePresence block is ONLY for adding the Send button during recording */}
          <AnimatePresence>
            {isRecording && (
              <motion.div key="send-record" variants={itemVariants} initial="initial" animate="animate" exit="exit">
                <Button variant="default" size="icon" className="w-8 h-8 rounded-full" onClick={sendAudioContent}>
                  <SendHorizonal className="text-background w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default MessageInput;