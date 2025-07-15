'use client'

import React, { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Plus, SendHorizonal, Trash } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

import TiptapEditorWrite from "./Editor/TipTapEditorWrite";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";
import RecordAudio from "./Media/RecordAudio";
import { CURRENT_USER } from "@/constants";
import useMessageStore from "@/stores/MessageStore";
import { getBarCount, scaleDataToFit } from "./helper";

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

  const { addMessage, setShouldScrollToBottom } = useMessageStore();


  const [recordingState, setRecordingState] = useState('inactive');
  const audioRecorderRef = useRef(null);

  const [content, setContent] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNoText, setHasNoText] = useState(true);

  const wrapperRef = useRef(null);

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

  const handlePauseRecord = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.pauseRecord();
    }
  }, []);

  const handleResumeRecord = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.resumeRecord();
    }
  }, []);

  const handleStartRecording = (e) => {
    setIsRecording(true);
  };


  const handleStopRecording = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.removeRecord();
    }
    setIsRecording(false);
    // Decide whether to stay expanded based on text content
    if (hasNoText) {
      setIsExpanded(false);
    }
  }, [hasNoText]);

  const sendTextContent = () => {
    // TODO: add logic how send json content from tiptap editor to server
    console.log('Sending text content:', content);
    // Reset states after sending
    setContent(null);
    setHasNoText(true);
    setIsExpanded(false);
  };

  const sendAudioContent = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stopRecord?.();
    }
  }, []);


  const sendAudioMessage = ({ audioBlob, duration, waveData }) => {

    const wave_samples = scaleDataToFit(waveData, getBarCount())

    const mime_type = audioBlob.type;
    // 2. Generate a file_name
    const extension = mime_type.split('/')[1] || 'wav';
    const file_name = `recording-${Date.now()}.${extension}`;
    const message_id = crypto.randomUUID();
    const message = {
      id: message_id,
      tempId: message_id,
      isUploading: true,
      created_at: new Date(Date.now()).toISOString(),
      media: [
        {
          message_id,
          id: crypto.randomUUID(),
          tempId: crypto.randomUUID(),
          isUploading: true,
          file_name,
          file: audioBlob,
          mime_type,
          name: file_name,
          attributes: {
            duration,
            wave_samples
          }
        }
      ],
      content: null,
      user: {
        id: CURRENT_USER,
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        email: "faye59@example.net",
        name: "Alexzander Wiza"
      }
    }


    setShouldScrollToBottom(true)
    addMessage(message);

    // Reset states after sending
    setIsRecording(false);
    setIsExpanded(false);
  }


  // Calculate container width based on state
  const getContainerWidth = () => {
    if (isExpanded && !isRecording) return '400px';
    if (isRecording) return '300px';
    return '254px';
  };

  const isAudioPaused = recordingState === 'paused';

  return (
    <div className="w-full flex min-h-16 items-center justify-center mx-auto border-t p-4">
      <div ref={wrapperRef} className="flex items-center justify-center gap-2.5">

        {/* Left Button Group (Plus / Trash swap) */}
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

        {/* Main Input Container */}
        <motion.div
          className="flex-1 flex items-center justify-center min-h-8 rounded-full bg-chat text-meta-icon cursor-text"
          animate={{
            width: getContainerWidth(),
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={handleExpand}
        >
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="recording-indicator"
                className="text-xs text-meta-icon w-full"
                variants={editorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <RecordAudio
                  ref={audioRecorderRef}
                  isRecording={isRecording}
                  sendFinalAudioBlob={sendAudioMessage}
                  updateRecordingState={setRecordingState}
                  autoStart={true}
                />
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
          </AnimatePresence>
        </motion.div>

        {/* Right-side Buttons */}
        <div className="flex items-center gap-2.5">
          <AnimatePresence mode="wait">
            {isRecording ? (
              // Recording state buttons
              <>
                {!isAudioPaused ? (
                  <motion.div key="pause" variants={itemVariants} initial="initial" animate="animate" exit="exit">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-full bg-chat border-none"
                      onClick={handlePauseRecord}
                    >
                      <Pause className="text-meta-icon w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="resume" variants={itemVariants} initial="initial" animate="animate" exit="exit">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-full bg-chat border-none"
                      onClick={handleResumeRecord}
                    >
                      <Mic className="text-meta-icon w-4" />
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              // Non-recording state buttons
              <>
                {hasNoText ? (
                  <motion.div key="mic" variants={itemVariants} initial="initial" animate="animate" exit="exit">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-full bg-chat border-none"
                      onClick={handleStartRecording}
                    >
                      <Mic className="text-meta-icon w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="send" variants={itemVariants} initial="initial" animate="animate" exit="exit">
                    <Button
                      variant="default"
                      size="icon"
                      className="w-8 h-8 rounded-full"
                      onClick={sendTextContent}
                    >
                      <SendHorizonal className="text-background w-4" />
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>

          {/* Send button during recording */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                key="send-record"
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ position: 'relative' }}
              >
                <Button
                  variant="default"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={sendAudioContent}
                >
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