import AudioPlayer from "./AudioPlayer"
import UploadAudio from "./UploadAudio"

const AudioPreview = ({ mediaFile }) => {

    const isUploading = mediaFile?.isUploading

    if (isUploading) {
        return <UploadAudio mediaFile={mediaFile} />
    }

    const { url, duration, className } = mediaFile

    return <AudioPlayer audioUrl={url} audioDuration={duration} className={className} />
}

export default AudioPreview