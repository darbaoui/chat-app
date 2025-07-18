import { cn } from "@/lib/utils";
import useMessageStore from "@/stores/MessageStore";
import { useCallback, useEffect, useRef, useState } from "react";
import TiptapEditorRead from "../Editor/TiptapEditorRead";
import { axios } from "@/lib/axios";
import { Loader, LoaderIcon } from "lucide-react";

const TiptapEditorReadWrapper = ({message}) => {

    const {updateMessageContent} = useMessageStore()
    const isUploading = message?.isUploading
    const text = message?.content;
    const uploadInProgress = useRef(false);


    const [loading, setLoading] = useState(false)


    const uploadMessage = useCallback(() => {
    
            if (uploadInProgress.current) return
    
            uploadInProgress.current = true;
            setLoading(true);
   
            axios.put(`/api/messages/text/${message.id}`, {
                content: JSON.stringify(text)
            })
                .then(({ data }) => {
                    updateMessageContent(message.id, {content: text, isUploading: false})
                })
                .catch((error) => {
                    console.error("Audio upload failed:", error);
                })
                .finally(() => {
                    uploadInProgress.current = false
                    setLoading(false);
                });
        }, [message, updateMessageContent]);
    
    
        useEffect(() => {
            if (message?.id && isUploading) {
                uploadMessage();
            }
        }, [message, isUploading, uploadMessage]);

        return <div className="relative">
            <TiptapEditorRead jsonContent={text} className={cn(isUploading && 'text-description')} />
        </div>

}

TiptapEditorReadWrapper.displayName = "TiptapEditorReadWrapper"

export default TiptapEditorReadWrapper