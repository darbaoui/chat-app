import { File } from "lucide-react";
import mime from 'mime-types';
import NextImage from 'next/image';
import { autoFormatSize } from "../helper";

const DocsPreview = ({files}) => {
  return (
    files.length > 0 && (
      <div className="flex flex-wrap">
        {files.map((file) => {
          return (
            <div
              className="w-[205px] h-[84px] flex items-center py-2.5 px-3 gap-4 rounded-lg hover:bg-box-bg cursor-pointer"
              key={file.id}
            >
              {file.preview_url ? (
                <div className="w-[45px] h-[64px] overflow-hidden relative">
                  <div className="w-auto pb-[100%]">
                    <NextImage
                      src={file.preview_url}
                      fill
                      sizes="45px"
                      className="rounded-lg overflow-hidden"
                      alt={file.name}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative text-primary">
                  <File size={48} />
                  <span className="absolute text-exs font-bold inset-0 uppercase top-0 text-white flex items-end mb-2 justify-center">
                    {mime.extension(file.mime_type)}
                  </span>
                </div>
              )}
              <div className="flex w-[120px] flex-col items-start gap-0.5">
                <span className="text-exs text-left line-clamp-3 max-h-[45px] break-all leading-[15px]">
                  {file.name}
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
          );
        })}
      </div>
    )
  );
}

DocsPreview.displayName = 'DocsPreview';

export default DocsPreview;