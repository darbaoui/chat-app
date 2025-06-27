import { faker } from "@faker-js/faker";
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
        (<div className={cn("w-full py-1.5 ps-[7px] pe-[14px] overflow-hidden z-[2] relative rounded-3xl", className)}>
            <AudioPreview audioDuration={singleMediaFile.duration} audioUrl={singleMediaFile.url} />
        </div>)
        : (
            <div className={cn("w-full px-5 flex flex-col py-2.5 overflow-hidden z-[2] relative rounded-3xl", className)}>
                <TiptapRenderer jsonContent={text} />
                {
                     media.length > 0 && (
                        <FilesPreview attachments={media} />
                     )
                }
            </div>
        )

}

export default MessageContent