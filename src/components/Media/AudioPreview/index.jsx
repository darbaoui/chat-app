import AudioPlayer from "./AudioPlayer"
import UploadAudio from "./UploadAudio"

const AudioPreview = ({ mediaFile, className }) => {

    const isUploading = mediaFile?.isUploading

    if (isUploading) {
        return <UploadAudio mediaFile={mediaFile} />
    }

    const { original_url } = mediaFile
    const { duration, wave_samples } = mediaFile.attributes

    return <AudioPlayer audioUrl={original_url} audioDuration={duration} waveformData={wave_samples} className={className} />
    // return <AudioPlayer audioUrl={url} audioDuration={duration} className={className} />
}

export default AudioPreview