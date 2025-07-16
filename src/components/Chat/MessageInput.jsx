'use client'

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { File, GalleryThumbnails, Mic, Pause, Plus, SendHorizonal, Trash, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

import TiptapEditorWrite from "@/components/Editor/TipTapEditorWrite";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";
import RecordAudio from "@/components/Chat/Media/RecordAudio";
import { CURRENT_USER } from "@/constants";
import useMessageStore from "@/stores/MessageStore";
import { getBarCount, scaleDataToFit } from "./helper";
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  dropTargetForExternal,
  monitorForExternal,
} from '@atlaskit/pragmatic-drag-and-drop/external/adapter';
import {
  containsFiles,
  getFiles,
} from '@atlaskit/pragmatic-drag-and-drop/external/file';
import invariant from 'tiny-invariant';
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import FilesPreview from "./Media/FilesPreview";
import CircularProgress from "@/icons/CircularProgress";



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

  const {
    createDraft,
    currentDraft,
    uploadingMessages,
    createUploadingMessage,
    updateUploadingMessage,
    removeUploadingMessage,
    uploadFile,
    deleteFile,
    sendMessage,
    finalizeMessage,
    //DO NOT TOUCH THESE TWO FUNCTIONS
    addMessage, setShouldScrollToBottom
  } = useMessageStore();


  console.log('uploadingMessages --->', uploadingMessages)

  const [recordingState, setRecordingState] = useState('inactive');
  const audioRecorderRef = useRef(null);

  const [content, setContent] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNoText, setHasNoText] = useState(true);

  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [dragState, setDragState] = useState('idle');
  const [dragAndDropfiles, setDragAndDropFiles] = useState(null);
  const [tempIdMsgText, setTempIdMsgText] = useState(crypto.randomUUID())

  const wrapperRef = useRef(null);

  useOnClickOutside(wrapperRef, () => {
    if (!hasNoText) return;
    if (files.length) return;
    if (isRecording) return;
    setIsExpanded(false);
  });


  const ensureDraftExists = async () => {
    if (!currentDraft) {
      return await createDraft();
    }

    return currentDraft;
  };

  useEffect(() => {
    if (dragAndDropfiles) {
      readAndPreviewFile(dragAndDropfiles);
      handleExpand()
    }
  }, [dragAndDropfiles]);

  useEffect(() => {
    if (wrapperRef.current) {
      const el = wrapperRef.current;
      invariant(el);

      return combine(
        dropTargetForExternal({
          element: el,
          canDrop: containsFiles,
          onDragEnter: () => setDragState('over'),
          onDragLeave: () => setDragState('potential'),
          onDrop: async ({ source }) => {
            const files = await getFiles({ source });
            setDragAndDropFiles(files);
          },
        }),
        monitorForExternal({
          canMonitor: containsFiles,
          onDragStart: () => {
            setDragState('potential');
            preventUnhandled.start();
          },
          onDrop: () => {
            setDragState('idle');
            preventUnhandled.stop();
          },
        }),
      );
    }
  }, [wrapperRef.current]);


  const onDrop = useCallback(async (files) => {


    const draft = await ensureDraftExists();

    if (!draft) return;

    // Upload each file
    files.forEach((file) => {
      const filePreview = filePreviews.find(preview => preview.name === file.name);
      if (filePreview) {
        uploadFile(file, filePreview.content, draft.id);
      } else {
        console.error(`No preview found for file: ${file.name}`);
      }
    });

  }, [files, filePreviews, content]);




  const readAndPreviewFile = (selectedFiles) => {

    const previewPromises = selectedFiles.map((file) => {
      const reader = new FileReader();

      return new Promise((resolve) => {
        reader.onload = () => {
          resolve({
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            content: reader.result, // File content or preview
          });
        };

        // Read file content as text or data URL (for images)
        if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('text/')) {
          reader.readAsText(file);
        } else {
          resolve({
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            content: null, // Unsupported file type
          });
        }
      });
    });

    Promise.all(previewPromises).then((previews) => {
      setFilePreviews((prev) => [...prev, ...previews]);
      setFiles((prev) => [...prev, ...selectedFiles]);
      setDragAndDropFiles(null);
    });
  };

  useEffect(() => {
    if (files.length) {
      onDrop(files)
    }
  }, [files])


  const handleFileChange = (e) => {
    handleExpand(e)
    const selectedFiles = Array.from(e.target.files);
    readAndPreviewFile(selectedFiles)
  };


  const handleRemoveFile = (file, index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    deleteFile(file?.id || file?.tempId, currentDraft?.id)
    // TODO: remove file if uploaded from server
  };


  const setNewMessage = (messageContent) => {
    setContent(messageContent);
  };

  const handleExpand = () => {
    // e.stopPropagation();
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

  console.log('currentDraft?.id --->', currentDraft?.id)
  console.log('uploadingMessages --->', uploadingMessages)
  const currentUploadingMessage = uploadingMessages.get(currentDraft?.id);

  console.log('currentUploadingMessage -->', currentUploadingMessage)

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="!w-8 !h-8 rounded-full bg-chat border-none text-meta-icon">
                    <Plus />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-3xl p-4" align="start">
                  <div className="w-full flex flex-col gap-2.5">
                    <div className="grid grid-cols-4">
                      <div className="w-10 h-7.5 bg-red-100"></div>
                      <div className="w-10 h-7.5 bg-red-200"></div>
                      <div className="w-10 h-7.5 bg-red-300"></div>
                      <div className="w-10 h-7.5 bg-red-400"></div>
                      <div className="w-10 h-7.5 bg-red-500"></div>
                      <div className="w-10 h-7.5 bg-red-600"></div>
                      <div className="w-10 h-7.5 bg-red-700"></div>
                      <div className="w-10 h-7.5 flex items-center justify-center">

                        <Button variant="secondary" className="rounded-full !h-[22px] !w-[22px] !p-0">
                          <Plus />
                        </Button>
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
                  {currentUploadingMessage?.media.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {currentUploadingMessage.media.map((file, index) => (
                        <div
                          className={cn("w-12 h-12 rounded-md relative bg-accent border")}
                          key={index}
                        >

                          {(file?.upload_status === 'uploading' && (file.upload_progress < 100 || file.upload_progress > 0)) && (
                            <div className="absolute inset-0 w-full h-full bg-black/60 flex items-center justify-center rounded-md">
                              <CircularProgress progress={file.upload_progress} />
                            </div>
                          )}
                          {
                            file.mime_type.startsWith('image/') && (
                              <img
                                src={file.content}
                                alt={file.name}
                                className="max-w-full h-12 object-cover rounded"
                              />
                            )
                          }
                          {
                            file.mime_type.startsWith('text/') && (
                              <div
                                src={file.content}
                                alt={file.name}
                                className="max-w-full h-12 object-cover rounded"
                              >
                                {file.content}
                              </div>
                            )
                          }
                          < div
                            className="cursor-pointer border absolute -top-1.5 -right-1.5 shadow-sm w-4 h-4 rounded-full bg-background flex items-center justify-center z-10"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRemoveFile(file, index)
                            }}
                          >
                            <X />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <TiptapEditorWrite
                    setNoText={setHasNoText}
                    onChange={(data) => setNewMessage(data)}
                    placeholder="Type your message..."
                    className={cn("w-full", filePreviews.length ? 'min-h-8' : '')}
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
      </div >
    </div >
  );
};

export default MessageInput;