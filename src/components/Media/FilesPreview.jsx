'use client'

import { IMAGE_MIME_TYPES } from "@/constants";
import ImagesPreview from "./ImagesPreview";
import { useEffect, useState } from "react";

const FilesPreview = ({attachments, ...props}) => {
    
    const [images, setImages] = useState([]);
    const [files, setFiles] = useState([]);

      useEffect(() => {
    
        setImages(
            attachments.filter((item) => IMAGE_MIME_TYPES.includes(item.mime_type)),
        );
        
        setFiles(
            attachments.filter(
                (item) =>
                !IMAGE_MIME_TYPES.includes(item.mime_type) &&
                !item.mime_type.startsWith('audio'),
            ),
        );
    }, [attachments]);

    return (
            <ImagesPreview images={images} {...props} />
  );
}

FilesPreview.displayName = 'FilesPreview';

export default FilesPreview;