import AudioPreview from "./Media/AudioPreview";
import FilesPreview from "./Media/FilesPreview";
import TiptapRenderer from "./TiptapRenderer";
import { cn } from "@/lib/utils";

const MessageContent = ({ message, className }) => {
    const {media} = message;
    const singleMediaFile = message?.media.length === 1 ? message?.media[0] : null;
    const text = message?.text;
    const isAudioMedia = singleMediaFile
        ? singleMediaFile.mime_type.startsWith('audio') && !text
        : null;

    return isAudioMedia ?
        (<div className={cn("max-w-[calc(100vw_-_1rem)] md:max-w-[min(400px,_calc(30vw_-_1rem))] py-1.5 ps-[7px] pe-[14px] overflow-hidden z-[2] relative", className)}>
            <AudioPreview audioDuration={singleMediaFile.duration} audioUrl={singleMediaFile.url} />
        </div>)
        : (
            <div className={cn("flex flex-col w-full max-w-[calc(100vw_-_1rem)] md:max-w-[min(400px,_calc(30vw_-_1rem))]  gap-2.5 py-2.5 z-[2] relative", className)}>
                <div className="px-5">
                    <TiptapRenderer jsonContent={text} />
                </div>
                {
                    media.length > 0 ? (
                    <div className={cn("w-[calc(100vw_-_1rem)] md:w-[min(400px,_calc(30vw_-_1rem))] px-5")}>
                        <FilesPreview attachments={media} />
                    </div>
                    ): null
                }
            </div>
        )

}

export default MessageContent