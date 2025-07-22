import { File, FileText, LoaderCircle } from "lucide-react";
import mime from 'mime-types';
import NextImage from 'next/image';
import { autoFormatSize } from "@/components/Chat/helper";
import { useCallback } from "react";
import useMessageStore from "@/stores/MessageStore";
import ProgressCircle from "@/components/ui/ProgressCircle";
import { MessageStatus } from "@/constants";



const DocPreview = ({ file }) => {
    const { uploadingMessages } = useMessageStore()
    const getUploadMediaData = useCallback((file) => {
        if (!file.isUploading) {
            return null;
        }
        const { temp_id, message_id, message_temp_id } = file;
        const message = uploadingMessages.get(message_id || message_temp_id);
        const fileUploading = message?.media?.find(file => file.temp_id === temp_id);
        return fileUploading;
    }, [uploadingMessages]);

    const fileUploading = getUploadMediaData(file);
    const uploadProgress = fileUploading?.upload_progress ?? 0;
    const uploadStatus = fileUploading?.upload_status;
    const isUploadingFromLocal = file?.isUploading;
    const fileToDisplay = isUploadingFromLocal ? fileUploading : file;
    const { content, preview_url, name } = fileToDisplay;

    const readingFromLocalContent = isUploadingFromLocal && uploadStatus !== MessageStatus.COMPLETED
    const src = readingFromLocalContent ? content : preview_url;

    const alt = name || 'Image';
    return (
        <div
            className="w-[205px] h-[84px] flex items-center py-2.5 px-3 gap-4 rounded-lg hover:bg-box-bg cursor-pointer relative"
        >
            {uploadStatus === MessageStatus.PENDING ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70  text-background z-[2]">
                    <LoaderCircle className="animate-spin" />
                </div>
            ) : uploadStatus === MessageStatus.UPLOADING ?
                (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg text-background z-[2]">
                        <div className="w-14 h-14 rounded-full bg-background/70 flex items-center justify-center">
                            <ProgressCircle progressValue={uploadProgress >= 95 ? 95 : uploadProgress} progressColor="text-black/70" size={44} />
                        </div>
                    </div>
                ) : null
            }




            <div className="w-[45px] h-[64px] overflow-hidden relative">
                {readingFromLocalContent ? (

                    <div className="w-full h-full bg-background flex items-center justify-center rounded-lg">
                        <div className="flex items-center flex-col mt-1">
                            <FileText className="w-4 h-4 text-description" />
                            <span className="text-10 font-bold uppercase text-chatBoxMe-foreground">
                                {mime.extension(file.mime_type)}
                            </span>
                        </div>
                    </div>

                ) :
                    <div className="w-auto pb-[100%]">
                        <NextImage
                            src={src}
                            fill
                            sizes="45px"
                            className="rounded-lg overflow-hidden"
                            alt={alt}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                }
            </div>

            <div className="flex w-[120px] flex-col items-start gap-0.5">
                <span className="text-exs text-left line-clamp-3 max-h-[45px] break-all leading-[15px]">
                    {name}
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="text-10 font-bold uppercase text-chatBoxMe-foreground">
                        {mime.extension(file.mime_type)}
                    </span>
                    <span className="text-10 text-chatBoxMe-foreground">
                        {autoFormatSize(file.size)}
                    </span>
                </div>
            </div>
        </div>
    )
}

DocPreview.displayName = 'DocPreview';
export default DocPreview;

