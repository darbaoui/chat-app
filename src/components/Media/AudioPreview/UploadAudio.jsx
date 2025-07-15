import { AUDIO_WAVEFORM_OPRIONS } from "@/constants";
import { axios } from "@/lib/axios";
import useMessageStore from "@/stores/MessageStore";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react"
const GAP_BETWEEN_WAVE_SPEED_AND_DURATION = 10;
const WIDTH_SPEED_AND_DURATION = 74;
const WIDTH_PROGRESS = 32;
const PROGRESS_PADDING_LEFT = 4;
const PADDING_BTW_WAVE_PLAY_BTN = 10;

const UploadAudio = ({ mediaFile }) => {
    const { barWidth, barGap, smScreenWidth } = AUDIO_WAVEFORM_OPRIONS;
    const [mediaFileId, setMediaFileId] = useState(null)
    const { updateMessage } = useMessageStore()
    const [loading, setLoading] = useState(false)
    const [progress, setProgressUpload] = useState(0);
    const uploadInProgress = useRef(false);

    // We decide to use small width for now, because we don't have how we can works with big width
    const wave_form_width = (mediaFile.attributes.wave_samples.length * (barWidth + barGap)) > smScreenWidth ? smScreenWidth : (mediaFile.attributes.wave_samples.length * (barWidth + barGap))

    const width = wave_form_width + WIDTH_SPEED_AND_DURATION - WIDTH_PROGRESS + PADDING_BTW_WAVE_PLAY_BTN

    const uploadAudioFile = useCallback(() => {

        if (uploadInProgress.current) return

        uploadInProgress.current = true;
        setLoading(true);
        let data = new FormData();
        data.append('audio', mediaFile.file);
        const { duration, wave_samples } = mediaFile?.attributes
        data.append('duration', duration);
        data.append('wave_samples', JSON.stringify(wave_samples));
        data.append('content', null);
        setProgressUpload(0)
        axios.post('/api/messages/audio', data, {
            onUploadProgress: function (progressEvent) {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                );
                setProgressUpload(percentCompleted);
            },
        })
            .then(({ data }) => {
                updateMessage(mediaFile.message_id, data)

            })
            .catch((error) => {
                console.error("Audio upload failed:", error);
            })
            .finally(() => {
                uploadInProgress.current = false
                setLoading(false);
            });
    }, [mediaFile, updateMessage]);


    useEffect(() => {
        if (mediaFile?.id && mediaFile.id !== mediaFileId) {
            setMediaFileId(mediaFile.id);
            uploadAudioFile();
        }
    }, [mediaFile?.id, mediaFileId, uploadAudioFile]);

    return (
        <div className="max-w-[254px] flex items-center overflow-hidden" >
            <div className="flex items-center justify-center text-background rounded-full !w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
            >
                <Play className="w-[14px]" size={14} />
            </div>
            <div className="flex-grow flex items-center ps-2.5" >
                <div className="h-1 w-full relative bg-background rounded-full overflow-hidden" style={{ width }} >
                    <div className="h-1 absolute left-0 bg-primary" style={{ width: `${progress}%` }} />
                </div>
            </div>
            <span className="text-center text-[11px] ps-1" style={{ width: WIDTH_PROGRESS }}>
                {`${progress}%`}
            </span>
        </div>
    )
}

UploadAudio.displayName = "UploadAudio"

export default UploadAudio