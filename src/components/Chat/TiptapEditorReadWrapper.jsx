import { cn } from "@/lib/utils";
import useMessageStore from "@/stores/MessageStore";
import { useEffect, useRef } from "react";
import TiptapEditorRead from "../Editor/TiptapEditorRead";
import { MessageStatus } from "@/constants";

const TiptapEditorReadWrapper = ({ message }) => {

    const { uploadTextMessage } = useMessageStore()
    const needToUpload = message?.upload_status === MessageStatus.UPLOADING
    const isPending = message?.upload_status === MessageStatus.PENDING
    const text = message?.content;
    const uploadInProgress = useRef(false);

    useEffect(() => {
        if (message?.id && needToUpload && !uploadInProgress.current) {
            uploadInProgress.current = true;
            uploadTextMessage(message.id, message.content)
                .finally(() => {
                    uploadInProgress.current = false;
                });
        }
    }, [message, needToUpload, uploadTextMessage]);

    return (

        <TiptapEditorRead jsonContent={text} className={cn((needToUpload || isPending) && 'text-description')} />
    )

}

TiptapEditorReadWrapper.displayName = "TiptapEditorReadWrapper"

export default TiptapEditorReadWrapper