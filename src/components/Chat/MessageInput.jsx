'use client'

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { File, GalleryThumbnails, Mic, Pause, Plus, SendHorizonal, Trash, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from "use-debounce";
import TiptapEditorWrite from "@/components/Editor/TipTapEditorWrite";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";
import RecordAudio from "@/components/Chat/Media/RecordAudio";
import useMessageStore from "@/stores/MessageStore";
import { getBarCount, scaleDataToFit } from "./helper";
import { cn } from "@/lib/utils";
import { useFileDrop } from "@/hooks/useFileDrop";
import InputMediaPreview from "./Media/InputMediaPreview";
import userStore from "@/stores/useStore";
import axios from "@/lib/axios";
import { MessageStatus } from "@/constants";
import AttachmentMenu from "./AttachmentMenu";
import RecordingUI from "./RecordingUI";
import InputActions from "./InputActions";
import MediaPreviewBar from "./MediaPreviewBar";
import useDraftStore from "@/stores/DraftStore";
import useUploadStore from "@/stores/UploadStore";
import messageService from "@/services/messageService";



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
  const { currentDraft, createDraft, setCurrentDraft, updateDraftContent } = useDraftStore();
  const { deleteFile, uploadingMessages, createUploadingMessage, handleFileDisplayAndUpload } = useUploadStore();
  const {
    error,
    // updateDraftContent,
    // createUploadingMessage,
    // setCurrentDraft,
    // currentDraft,
    // createDraft,
    // handleFileDisplayAndUpload,
    // deleteFile,
    // uploadingMessages,
    submitMessage,

    //DO NOT TOUCH THESE TWO FUNCTIONS
    addMessage,
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
  const canFetchUserDraft = useRef(true)
  // console.log('messages --->', messages);

  const wrapperRef = useRef(null);
  const editorRef = useRef(null);
  const lastSavedContent = useRef(null)

  const { dragState, droppedFiles, clearDroppedFiles } = useFileDrop(wrapperRef);


  const ensureDraftExists = useCallback(async () => {
    if (!currentDraft?.id) {
      return createDraft(authUser);
    }

    return currentDraft;
  }, [createDraft, currentDraft, authUser]);

  useEffect(() => {
    const fetchDraft = () => {
      axios.get(`/api/messages/draft`).then(({ data }) => {
        if (data) {
          setCurrentDraft({ ...data, upload_status: MessageStatus.UPLOADING })
          createUploadingMessage(data.id, { ...data, upload_status: MessageStatus.UPLOADING })
          handleExpand()
          // console.log('draft --->', data)
          setContent(data.content)
          // editorRef.current?.setContent(data.content)
        }

      })
    }

    if (canFetchUserDraft.current) {
      canFetchUserDraft.current = false
      fetchDraft()
    }
  }, [])



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
        handleFileDisplayAndUpload(filePreview.file, filePreview, draft);
      });
      clearDroppedFiles();
    });
  }, [ensureDraftExists, clearDroppedFiles, handleFileDisplayAndUpload]);


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

  // create editor instance and other stuff
  const [debouncedEditor] = useDebounce(content, 2000);

  const saveContent = useCallback((content) => {

    if (isSubmitting || !content) return;

    if (JSON.stringify(content) === JSON.stringify(lastSavedContent.current)) return
    lastSavedContent.current = content
    if (currentDraft?.id) {
      updateDraftContent(content)
    } else {
      createDraft(authUser, content)
    }
  }, [updateDraftContent, createDraft, currentDraft, authUser, isSubmitting, content])

  useEffect(() => {
    saveContent(debouncedEditor)
  }, [debouncedEditor]);



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
  const hasMedia = currentUploadingMessage?.media?.length > 0;
  // console.log('uploadingMessages --->', uploadingMessages, currentDraft?.id, currentUploadingMessage, hasMedia);

  useOnClickOutside(wrapperRef, () => {
    if (isOpenDropDown) return
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
            <AttachmentMenu
              isOpenDropDown={isOpenDropDown}
              setIsDropDownOpen={setIsDropDownOpen}
              handleEmojiSelect={handleEmojiSelect}
              handleFileChange={handleFileChange}
              itemVariants={itemVariants} />
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
              <RecordingUI
                audioRecorderRef={audioRecorderRef}
                sendAudioMessage={sendAudioMessage}
                setRecordingState={setRecordingState}
                editorVariants={editorVariants} />
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
                className="w-full px-2.5 max-h-[calc(60vh_-_80px)] overflow-y-auto"
                variants={editorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="w-full flex flex-col gap-2.5 ">
                  <MediaPreviewBar
                    hasMedia={hasMedia}
                    currentUploadingMessage={currentUploadingMessage}
                    handleRemoveFile={handleRemoveFile}
                  />
                  <TiptapEditorWrite
                    ref={editorRef}
                    jsonContent={content}
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
        <InputActions
          isRecording={isRecording}
          isAudioPaused={isAudioPaused}
          hasNoText={hasNoText}
          hasMedia={hasMedia}
          handlePauseRecord={handlePauseRecord}
          handleResumeRecord={handleResumeRecord}
          handleStartRecording={handleStartRecording}
          sendMessage={sendMessage}
          sendAudioContent={sendAudioContent}
          itemVariants={itemVariants} />
      </div >
    </div >
  );
};

export default MessageInput;