'use client'
import ProgressCircle from "@/components/ui/ProgressCircle";
import { MessageStatus } from "@/constants";
import { cn } from "@/lib/utils";
import useMessageStore from "@/stores/MessageStore";
import { FileText, LoaderCircle, X } from "lucide-react";
import mime from 'mime-types';
import { useEffect, useState } from 'react';

const InputMediaPreview = ({ file, onRemove, currentUploadingMessage }) => {
    const { currentDraft } = useMessageStore();

    const [pdfUrl, setPdfUrl] = useState('');

    useEffect(() => {
        // Check if the file is a PDF and has a file object
        if (file.file && file.mime_type === 'application/pdf') {
            const url = URL.createObjectURL(file.file);
            setPdfUrl(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setPdfUrl('');
        }
    }, [file.file, file.mime_type]);

    return (
        <div
            className={cn("w-12 h-auto rounded-md relative bg-accent border")}
            key={file.temp_id || file.id}
        >

            {(file?.upload_status === MessageStatus.UPLOADING && file?.upload_progress < 100) && (

                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-background z-[2] rounded-md">
                    <div className="w-6 h-6 rounded-full bg-background/70  flex items-center justify-center">
                        <ProgressCircle progressValue={file?.upload_progress >= 95 ? 95 : file?.upload_progress} progressColor="text-black/70" size={20} />
                    </div>
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
                file.mime_type.startsWith('application/') && (
                    file.mime_type === 'application/pdf' && pdfUrl ? (
                        <object
                            data={pdfUrl}
                            type="application/pdf"
                            className="w-full h-12 object-cover rounded-md overflow-hidden"
                        >
                            {/* Fallback for browsers that don't support <object> or PDF viewing */}
                            <div className="w-full h-12 bg-background flex items-center justify-center rounded-lg">
                                <div className="flex items-center flex-col mt-1">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span className="text-10 font-bold uppercase text-chatBoxMe-foreground">
                                        {mime.extension(file.mime_type)}
                                    </span>
                                </div>
                            </div>
                        </object>
                    ) : (
                        <div className="w-full h-12 bg-background flex items-center justify-center rounded-lg">
                            <div className="flex items-center flex-col mt-1">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-10 font-bold uppercase text-chatBoxMe-foreground">
                                    {mime.extension(file.mime_type)}
                                </span>
                            </div>
                        </div>
                    )
                )
            }

            {
                file.mime_type.startsWith('text/') && (
                    <div
                        src={file.content}
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