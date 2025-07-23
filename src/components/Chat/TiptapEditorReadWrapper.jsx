import { cn } from "@/lib/utils";
import useMessageStore from "@/stores/MessageStore";
import { useCallback, useEffect, useRef, useState } from "react";
import TiptapEditorRead from "../Editor/TiptapEditorRead";
import axios from "@/lib/axios";
import { MessageStatus } from "@/constants";

const TiptapEditorReadWrapper = ({ message }) => {

    const { updateMessageContent } = useMessageStore()
    const needToUpload = message?.upload_status === MessageStatus.UPLOADING
    const isPending = message?.upload_status === MessageStatus.PENDING
    const text = message?.content;
    const uploadInProgress = useRef(false);


    const uploadMessage = useCallback(() => {

        if (uploadInProgress.current || !message?.id) return

        uploadInProgress.current = true;

        axios.put(`/api/messages/text/${message.id}`, {
            content: JSON.stringify(message.content)
        })
            .then(({ data }) => {
                updateMessageContent(message.id, { upload_status: MessageStatus.COMPLETED })
            })
            .catch((error) => {
                console.error("Text message upload failed:", error);
            })
            .finally(() => {
                uploadInProgress.current = false
            });
    }, [message, updateMessageContent]);


    useEffect(() => {
        if (message?.id && needToUpload) {
            uploadMessage();
        }
    }, [message, needToUpload, uploadMessage]);

    return (

        <TiptapEditorRead jsonContent={text} className={cn((needToUpload || isPending) && 'text-description')} />
    )

}

TiptapEditorReadWrapper.displayName = "TiptapEditorReadWrapper"

export default TiptapEditorReadWrapper