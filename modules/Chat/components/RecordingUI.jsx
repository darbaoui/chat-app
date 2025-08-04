import { motion } from 'framer-motion';
import RecordAudio from '@/modules/Chat/components/Media/RecordAudio';

const RecordingUI = ({
    audioRecorderRef,
    sendAudioMessage,
    setRecordingState,
    editorVariants,
}) => {

    return <motion.div
        key="recording-indicator"
        className="text-xs text-meta-icon w-full"
        variants={editorVariants}
        initial="initial"
        animate="animate"
        exit="exit"
    >
        <RecordAudio
            ref={audioRecorderRef}
            isRecording={true}
            sendFinalAudioBlob={sendAudioMessage}
            updateRecordingState={setRecordingState}
            autoStart={true}
        />
    </motion.div>
}

export default RecordingUI
