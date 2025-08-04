import { cn } from "@/lib/utils";
import useMessageStore from "@/modules/Chat/stores/MessageStore";
import { useEffect, useRef } from "react";
import TiptapEditorRead from "@/components/Editor/TiptapEditorRead";
import { MessageStatus } from "@/modules/Chat/constants";

const TiptapEditorReadWrapper = ({ message }) => {

    const { uploadTextMessage } = useMessageStore()
    // const needToUpload = message?.upload_status === MessageStatus.UPLOADING
    const isPending = message?.upload_status === MessageStatus.PENDING
    // const text = message?.content;
    const { id, content, upload_status } = message || {};
    const uploadInProgress = useRef(false);

    // console.log('message --->', message)
    // console.log('uploadInProgress --->', uploadInProgress)
    useEffect(() => {
        const needToUpload = upload_status === MessageStatus.UPLOADING;
        if (id && needToUpload && !uploadInProgress.current) {
            uploadInProgress.current = true;
            uploadTextMessage(message.id, message.content)
                .finally(() => {
                    // This block will run after the promise is settled (resolved or rejected)
                    uploadInProgress.current = false;
                });
        }
    }, [id, content, upload_status, uploadTextMessage]);

    const isUploadingOrPending =
        upload_status === MessageStatus.UPLOADING ||
        upload_status === MessageStatus.PENDING;

    return (

        <TiptapEditorRead jsonContent={content} className={cn(isUploadingOrPending && 'text-description')} />
    )

}

TiptapEditorReadWrapper.displayName = "TiptapEditorReadWrapper"

export default TiptapEditorReadWrapper