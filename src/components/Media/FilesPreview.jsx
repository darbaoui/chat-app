'use client'

import { useEffect, useMemo, useState } from "react";
import { IMAGE_MIME_TYPES } from "@/constants";
import ImagesPreview from "./ImagesPreview";
import DocsPreview from "./DocsPreview";

const FilesPreview = ({attachments, ...props}) => {
 


    const { images, files } = useMemo(() => ({
        images: (attachments || []).filter((item) => IMAGE_MIME_TYPES.includes(item.mime_type)),
        files: (attachments || []).filter(
            (item) =>
            !IMAGE_MIME_TYPES.includes(item.mime_type) &&
            !item.mime_type.startsWith('audio'),
        ),
    }), [attachments]);

    return (
        <div className="w-full flex-col flex gap-2.5">
            <ImagesPreview images={images} {...props} />
            <DocsPreview files={files} {...props} />
        </div>
  );
}

FilesPreview.displayName = 'FilesPreview';

export default FilesPreview;