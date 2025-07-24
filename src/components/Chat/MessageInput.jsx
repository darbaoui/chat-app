'use client'

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { File, GalleryThumbnails, Mic, Pause, Plus, SendHorizonal, Trash, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

import TiptapEditorWrite from "@/components/Editor/TipTapEditorWrite";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";
import RecordAudio from "@/components/Chat/Media/RecordAudio";
import useMessageStore from "@/stores/MessageStore";
import { getBarCount, scaleDataToFit } from "./helper";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useFileDrop } from "@/hooks/useFileDrop";
import InputMediaPreview from "./Media/InputMediaPreview";
import { DefaultEmojis, EmojiPicker } from "@/components/ui/EmojiPicker";
import userStore from "@/stores/useStore";



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

  const { user: authUser } = userStore();

  const {
    error,

    currentDraft,
    createDraft,
    displayFileInUI,
    deleteFile,
    uploadingMessages,
    submitMessage,
    // uploadFiles,
    // createTempDraft,
    // currentTempDraft,
    // uploadingMessages,
    // uploadFile,
    // submitMessage,
    //DO NOT TOUCH THESE TWO FUNCTIONS
    addMessage,
    messages,
    setShouldScrollToBottom
  } = useMessageStore();


  const [recordingState, setRecordingState] = useState('inactive');
  const audioRecorderRef = useRef(null);

  const [content, setContent] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNoText, setHasNoText] = useState(true);

  // const [files, setFiles] = useState([]);
  // const [filePreviews, setFilePreviews] = useState([]);
  const [isOpenDropDown, setIsDropDownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emojiToAdd, setEmojiToAdd] = useState(null);

  // console.log('messages --->', messages);

  const wrapperRef = useRef(null);
  const editorRef = useRef(null);


  const { dragState, droppedFiles, clearDroppedFiles } = useFileDrop(wrapperRef);


  const ensureDraftExists = useCallback(async () => {
    if (!currentDraft?.id) {
      return createDraft(authUser);
    }

    return currentDraft;
  }, [createDraft, currentDraft, authUser]);



  const readAndPreviewFile = useCallback(async (selectedFiles) => {
    const filesArray = Array.from(selectedFiles);
    const draft = await ensureDraftExists();

    if (!draft) {
      console.error("Could not create or retrieve a draft message.");
      return;
    }

    const fileProcessingPromises = filesArray.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const commonData = {
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            content: reader.result,
          };

          if (file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
              resolve({
                ...commonData,
                dimensions: {
                  width: img.width,
                  height: img.height,
                },
              });
            };
            img.onerror = () => {
              resolve({ ...commonData, dimensions: null });
            };
            img.src = reader.result;
          } else {
            resolve(commonData);
          }
        };

        reader.onerror = (error) => reject(error);

        // Handle different file types
        if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('text/')) {
          reader.readAsText(file);
        } else if (file.type === 'application/pdf') {
          // Don't read PDF content, just store the file reference
          resolve({
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            dimensions: null,
          });
        } else {
          // For other unsupported types
          resolve({
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            content: null,
            dimensions: null,
          });
        }
      });
    });

    Promise.all(fileProcessingPromises).then(async (processedFilePreviews) => {
      processedFilePreviews.forEach((filePreview) => {
        displayFileInUI(filePreview.file, filePreview, draft);
      });
      clearDroppedFiles();
    });
  }, [ensureDraftExists, clearDroppedFiles, displayFileInUI]);


  const handleFileChange = async (e) => {
    setIsDropDownOpen(false);
    handleExpand()
    const selectedFiles = Array.from(e.target.files);
    await readAndPreviewFile(selectedFiles)
  };


  const handleRemoveFile = useCallback((fileId, messageId) => {
    deleteFile(fileId, messageId);
  }, [deleteFile]);


  const setNewMessage = (messageContent) => {
    setContent(messageContent);
  };

  const sendMessage = async () => {
    // Prevent sending if already submitting or no draft exists

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Await the submission to ensure the draft is processed before we
      // clear the UI and change state. This prevents the race condition.
      await submitMessage(content);
    } catch (error) {
      console.error("Failed to submit message:", error);
      // Optionally handle submission errors here, e.g., show a toast
    } finally {
      // Clear local state after submission attempt
      editorRef.current?.setContent(null);
      setContent(null)
      // Finally, allow new submissions
      setIsSubmitting(false);
    }
  };


  const handleExpand = useCallback(() => {
    // e.stopPropagation(); // Keep this commented if it's not needed
    if (!isRecording) {
      setIsExpanded(true);
    }
  }, [isRecording]);


  useEffect(() => {
    if (droppedFiles) {
      readAndPreviewFile(droppedFiles);
      handleExpand()
      clearDroppedFiles()
    }
  }, [droppedFiles, readAndPreviewFile, handleExpand, clearDroppedFiles]);

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
      temp_id: message_id,
      isUploading: true,
      created_at: new Date(Date.now()).toISOString(),
      media: [
        {
          message_id,
          id: crypto.randomUUID(),
          temp_id: crypto.randomUUID(),
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
      user: authUser
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

  // Used to track media uploading
  const currentUploadingMessage = uploadingMessages.get(currentDraft?.id || currentDraft?.temp_id);
  // console.log('currentUploadingMessage --->', currentUploadingMessage);
  const hasMedia = currentUploadingMessage?.media?.length > 0;

  useOnClickOutside(wrapperRef, () => {
    if (!hasNoText) return;
    if (currentUploadingMessage?.media?.length) return;
    if (isRecording) return;
    setIsExpanded(false);
  });

  const handleEmojiSelect = (emoji) => {
    setIsDropDownOpen(false);
    handleExpand() // Ensure the input area is expanded to display the editor for the selected emoji.
    setEmojiToAdd(emoji)
  }

  return (
    <div className="w-full flex min-h-16 items-center justify-center mx-auto border-t p-4">
      <div ref={wrapperRef} className="flex items-end justify-center gap-2.5">

        <AnimatePresence>
          {dragState === 'over' && (
            <>
              {/* SVG Icon Animation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 bg-background  z-20"
              ></motion.div>

              {/* Text Animation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 bg-transparent flex-col gap-2 flex items-center justify-center z-30"
              >
                <div className="flex items-center">
                  <motion.div
                    initial={{ rotate: -3, y: 0 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: 'easeInOut',
                    }}
                  >
                    <GalleryThumbnails size={64} className="text-primary" />
                  </motion.div>

                  <motion.div
                    initial={{ rotate: 3, y: 0 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: 'easeInOut',
                      delay: 0.2,
                    }}
                  >
                    <File
                      size={64}
                      className="text-primary rotate-1"
                    />
                  </motion.div>
                </div>
                <span className="text-xl text-title">Add new files</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
              <DropdownMenu open={isOpenDropDown} onOpenChange={setIsDropDownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="!w-8 !h-8 rounded-full bg-chat border-none text-meta-icon">
                    <Plus />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-3xl p-4" align="center">
                  <div className="w-full flex flex-col gap-2.5">
                    <div className="grid grid-cols-4">
                      {DefaultEmojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="!w-10 !h-7.5 text-2xl hover:scale-110 transition-transform"
                          onClick={() => handleEmojiSelect({
                            emoji
                          })}
                        >
                          {emoji}
                        </Button>
                      ))}

                      <div className="w-10 h-7.5 flex items-center justify-center">
                        <EmojiPicker
                          onEmojiSelect={(emoji) => handleEmojiSelect(emoji)}
                          preload={true} // Preload for better UX
                        >

                          <Button variant="secondary" className="rounded-full !h-[22px] !w-[22px] !p-0">
                            <Plus />
                          </Button>
                        </EmojiPicker>
                      </div>
                    </div>
                    <Separator />

                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center justify-center rounded-md bg-chatBox hover:bg-accent h-9 hover:text-accent-foreground p-0 hover:opacity-100 cursor-pointer  text-title"
                    >

                      <span className="text-sm font-medium">
                        Attach a file
                      </span>
                      <input
                        id="file-upload"
                        multiple
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        // accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>

                  </div>
                </DropdownMenuContent>
              </DropdownMenu>


            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Container */}
        <motion.div
          className="flex-1 flex items-center justify-center min-h-8 rounded-2xl bg-chat text-meta-icon cursor-text"
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
                <div className="w-full flex flex-col gap-2.5">
                  {hasMedia && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {currentUploadingMessage.media.map((file) => (
                        <InputMediaPreview
                          key={file.temp_id || file.id}
                          // currentUploadingMessage={currentUploadingMessage}
                          file={file}
                          onRemove={handleRemoveFile}
                        />
                      ))}
                    </div>
                  )}
                  <TiptapEditorWrite
                    ref={editorRef}
                    emojiToAdd={emojiToAdd}
                    setEmojiToAdd={setEmojiToAdd}
                    editable={true}
                    setNoText={setHasNoText}
                    onChange={(data) => setNewMessage(data)}
                    placeholder="Type your message..."
                    className={cn("w-full", hasMedia ? 'min-h-8' : '')}
                  />
                </div>
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
                {hasNoText && !hasMedia ? (
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
                      onClick={() => sendMessage()}
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
      </div >
    </div >
  );
};

export default MessageInput;