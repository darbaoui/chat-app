
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, Pause, SendHorizonal } from 'lucide-react';

const InputActions = ({
    isRecording,
    isAudioPaused,
    hasNoText,
    hasMedia,
    handlePauseRecord,
    handleResumeRecord,
    handleStartRecording,
    sendMessage,
    sendAudioContent,
    itemVariants,
}) => {
    return (
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
    );
};

export default InputActions;