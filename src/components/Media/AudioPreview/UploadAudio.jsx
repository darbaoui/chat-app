import { AUDIO_WAVEFORM_OPRIONS } from "@/constants";
import { axios, initializeCsrf } from "@/lib/axios";
import useMessageStore from "@/stores/MessageStore";
import Axios from "axios";
import { progressPercentage } from "framer-motion";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react"
const GAP_BETWEEN_WAVE_SPEED_AND_DURATION = 10
const WIDTH_SPEED_AND_DURATION = 74;
const WIDTH_PROGRESS = 32
const PROGRESS_PADDING_LEFT = 4
const PADDING_BTW_WAVE_PLAY_BTN = 10
const UploadAudio = ({ mediaFile }) => {
    const { barWidth, barGap, height } = AUDIO_WAVEFORM_OPRIONS;
    const [mediaFileId, setMediaFileId] = useState(null)
    const { updateMessage } = useMessageStore()
    const [loading, setLoading] = useState(false)
    const [progress, setProgressUpload] = useState(0);
    const uploadInProgress = useRef(false);
    const width = mediaFile.wave_samples.length * (barWidth + barGap) + WIDTH_SPEED_AND_DURATION + GAP_BETWEEN_WAVE_SPEED_AND_DURATION - WIDTH_PROGRESS - PROGRESS_PADDING_LEFT + PADDING_BTW_WAVE_PLAY_BTN
    const uploadAudioFile = () => {

        if (uploadInProgress.current) return

        uploadInProgress.current = true;
        // initializeCsrf()
        setLoading(true);
        let data = new FormData();
        data.append('audio', mediaFile.file);
        data.append('duration', mediaFile.duration);
        // data.append('wave_samples', mediaFile.wave_samples);

        mediaFile.wave_samples.forEach(sample => {
            data.append('wave_samples[]', sample);
        });
        data.append('content', null);
        // axios
        axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/audio`, data, {
            onUploadProgress: function (progressEvent) {
                var percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                );

                console.log('percentCompleted --->', percentCompleted)

                setProgressUpload(percentCompleted);
            },
        })
            .then(({ data }) => {
                console.log('data-->', data)
                updateMessage(mediaFile.message_id, data)

            })
            .catch((error) => {
            })
            .finally(() => {
                setLoading(false);
            });
    }
    useEffect(() => {
        if (mediaFile?.id && mediaFile.id !== mediaFileId) {
            setMediaFileId(mediaFile.id);
            uploadAudioFile();
        }
    }, [mediaFile?.id]);

    console.log('width ---->', width)

    return (
        <div className="flex items-center bg-red overflow-hidden">
            <div className="flex items-center justify-center text-background rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
            >
                <Play className="w-[14px]" size={14} />
            </div>
            <div className="flex-grow flex iems-center ps-2.5" style={{ width }}>
                <div className="h-1 w-full relative bg-background rounded-full overflow-hidden">
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