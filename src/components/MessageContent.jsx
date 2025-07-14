import AudioPreview from "./Media/AudioPreview/index";
import FilesPreview from "./Media/FilesPreview";
import TiptapEditorRead from "@/components/Editor/TiptapEditorRead";
import { cn } from "@/lib/utils";

const MessageContent = ({ message, className }) => {
    const { media } = message;
    const singleMediaFile = message?.media.length === 1 ? message?.media[0] : null;
    const text = message?.content;
    const isAudioMedia = singleMediaFile
        ? ['audio', 'video'].some(type => singleMediaFile.mime_type.startsWith(type)) && !text
        : null;

    return isAudioMedia ?
        (<div className={cn("max-w-[254px] py-1.5 ps-[7px] pe-[14px] overflow-hidden z-[2] relative", className)}>
            <AudioPreview mediaFile={singleMediaFile} />
        </div>)
        : (
            <div className={cn("flex flex-col w-full md:w-[70%]  gap-2.5 py-2.5 z-[2] relative", className)}>
                <div className="px-5">
                    <TiptapEditorRead jsonContent={text} />
                </div>
                {
                    media.length > 0 ? (
                        <div className={cn("w-full md:w-[70%] px-5")}>
                            <FilesPreview attachments={media} />
                        </div>
                    ) : null
                }
            </div>
        )

}

export default MessageContent