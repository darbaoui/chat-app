import { MessageStatus } from "@/constants";
import CircularProgress from "@/icons/CircularProgress";
import { cn } from "@/lib/utils";
import useMessageStore from "@/stores/MessageStore";
import { LoaderCircle, X } from "lucide-react";

const InputMediaPreview = ({ file, onRemove, currentUploadingMessage }) => {
    const { currentDraft } = useMessageStore();
    // const media = currentUploadingMessage?.media.find((m) => m.temp_id === file.temp_id || m.id === file.id);

    return (
        <div
            className={cn("w-12 h-auto rounded-md relative bg-accent border")}
            key={file.temp_id || file.id}
        >

            {(file?.upload_status === MessageStatus.UPLOADING && file?.upload_progress < 100) && (
                <div className="absolute inset-0 w-full h-full bg-black/60 flex items-center justify-center rounded-md">
                    <CircularProgress progress={file.upload_progress} />
                </div>
            )}
            {(file?.upload_status === MessageStatus.PENDING) && (
                <div className="absolute inset-0 w-full h-full bg-black/60 flex items-center justify-center rounded-md">
                    <LoaderCircle className="animate-spin" size={14} />
                </div>
            )}
            {
                file.mime_type.startsWith('image/') && (
                    <img
                        src={file.content}
                        alt={file.name}
                        className="max-w-full h-12 object-cover rounded"
                    />
                )
            }
            {
                file.mime_type.startsWith('text/') && (
                    <div
                        className="max-w-full h-12 object-cover rounded"
                    >
                        {file.content}
                    </div>
                )
            }
            <div
                className="cursor-pointer border absolute -top-1.5 -right-1.5 shadow-sm w-4 h-4 rounded-full bg-background flex items-center justify-center z-10"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRemove(file.id || file.temp_id, currentDraft?.id);
                }}
            >
                <X />
            </div>
        </div>
    );
}

InputMediaPreview.displayName = "InputMediaPreview";

export default InputMediaPreview;