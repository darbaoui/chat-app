import { axios, initializeCsrf } from "@/lib/axios";
import { progressPercentage } from "framer-motion";
import { Play } from "lucide-react";
import { useEffect, useState } from "react"

const UploadAudio = ({ mediaFile }) => {
    const [loading, setLoading] = useState(false)
    const [progress, setProgressUpload] = useState(0);


    const uploadAudioFile = () => {
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
        axios
            .post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/audio`, data, {
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
            })
            .catch((error) => {
            })
            .finally(() => {
                setLoading(false);
            });
    }
    useEffect(() => {
        uploadAudioFile()
    }, [])

    return (
        <div className="w-48 flex items-center bg-red overflow-hidden">
            <div className="flex items-center justify-center text-background rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
            >
                <Play className="w-[14px]" size={14} />
            </div>
            <div className="flex-grow flex iems-center ps-2">
                <div className="h-1 w-full relative bg-background rounded-full overflow-hidden">
                    <div className="h-1 absolute left-0 bg-primary" style={{ width: `${progress}%` }} />
                </div>
            </div>
            <span className="w-8 text-center text-[11px] ps-1">
                {`${progress}%`}
            </span>
        </div>
    )
}

UploadAudio.displayName = "UploadAudio"

export default UploadAudio