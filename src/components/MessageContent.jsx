import { forwardRef } from "react";
import AudioPreview from "./Media/AudioPreview";
import TiptapRenderer from "./TiptapRenderer";
import { cn } from "@/lib/utils";

const MessageContent = ({ message, className }) => {
    const singleMediaFile = message?.media.length == 1 ? message?.media[0] : null;
    const text = message?.text;
    const isAudioMedia = singleMediaFile
        ? singleMediaFile.mime_type.startsWith('audio') && !text
        : null;
    return isAudioMedia ? <div className={cn("w-full py-1.5 ps-[7px] pe-[14px] overflow-hidden z-10 relative rounded-3xl", className)}>
        <AudioPreview audioDuration={singleMediaFile.duration} audioUrl={singleMediaFile.url} />
    </div>
        : <div className={cn("w-full px-5 py-2.5 overflow-hidden z-10 relative rounded-3xl", className)}>
            <TiptapRenderer jsonContent={text} />
        </div>

}

export default MessageContent