import { AUDIO_DEFINITIONS, AUDIO_MEDIA_DEFINITION, IMAGE_URLS, NON_AUDIO_MEDIA_DEFINITIONS, PDF_URLS } from "@/constants";
import { faker } from "@faker-js/faker";

export const generateTiptapJson = (messageNumber=0) => {
  const formats = ['bold', 'italic', 'code'];
  const selectedFormat = formats[Math.floor(Math.random() * formats.length)];

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `This is message #${messageNumber}. Some content is `,
          },
          {
            type: 'text',
            marks: [{ type: selectedFormat }],
            text: `formatted as ${selectedFormat} `,
          },
          {
            type: 'text',
            text: faker.lorem.paragraph({ min: 1, max: 5 }) ,
          },
        ],
      },
    ],
  };
};


/**
 * Formats a date string into a human-readable separator like "Today", "Yesterday", or "Month Day, Year".
 * @param {Date} date - The date object to format.
 * @returns {string} - The formatted date string.
 */
export const formatDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};


export const  createMediaItem = (mediaDef, url) => {
  const fileName = url.substring(url.lastIndexOf('/') + 1);
  const mimeType = mediaDef.mime_prefix + (fileName.includes('.') ? fileName.split('.').pop() : 'octet-stream');
  const mediaItem = {
    id: faker.string.uuid(),
    file_name: fileName,
    name: fileName,
    mime_type: mimeType,
    url: url,
  };

    // Add the exact duration for audio files based on the URL
  if (mediaDef.type === 'audio') {
    const exactAudioDef = AUDIO_DEFINITIONS.find(audio => audio.url === url);
    if (exactAudioDef) {
      mediaItem.duration = exactAudioDef.duration;
    }
  }
  if (mediaDef.type === 'image') {
    const exactImageDef = IMAGE_URLS.find(image => image.url === url);
    if (exactImageDef) {
      mediaItem.dimensions = exactImageDef.dimensions;
    }
  }

  if (mediaDef.type === 'pdf') {
    const exactPDFDef = PDF_URLS.find(pdf => pdf.url === url);
    if (exactPDFDef) {
      mediaItem.size = exactPDFDef.size;
      // mediaItem.mime_type = mediaDef.type;
      mediaItem.preview_url = exactPDFDef.preview_url;
    }
  }

  return mediaItem;
}

/**
 * Generates a random array of media items (images, PDFs, audio).
 * Messages have a 60% chance of containing media.
 * If media is present, there will be 1 to 3 items.
 * Each item has a random type and URL from the predefined lists.
 */
export const getRandomMediaItems = () => {
  const mediaItems = [];
  let hasAudio = false;

  // Decide if this will be an audio-only message (20% chance)
  if (faker.number.float() < 0.2) { // 20% chance for audio-only message
    // Select one random audio file
    const randomAudioUrl = AUDIO_MEDIA_DEFINITION.urls[faker.number.int({ min: 0, max: AUDIO_MEDIA_DEFINITION.urls.length - 1 })];
    mediaItems.push(createMediaItem(AUDIO_MEDIA_DEFINITION, randomAudioUrl));
    hasAudio = true;
  } else {
    // If not audio-only, proceed with generating non-audio media
    const hasOtherMedia = faker.number.float() < 0.6; // 60% chance a non-audio message has other media
    if (hasOtherMedia) {
      const numMedia = faker.number.int({ min: 1, max: 3 }); // 1 to 3 non-audio media items
      for (let i = 0; i < numMedia; i++) {
        // Randomly select a non-audio media type (image or pdf)
        const randomMediaDef = NON_AUDIO_MEDIA_DEFINITIONS[faker.number.int({ min: 0, max: NON_AUDIO_MEDIA_DEFINITIONS.length - 1 })];
        // Randomly pick a URL for the selected media type
        const randomUrl = randomMediaDef.urls[faker.number.int({ min: 0, max: randomMediaDef.urls.length - 1 })];
        mediaItems.push(createMediaItem(randomMediaDef, randomUrl));
      }
    }
  }

  return { media: mediaItems, hasAudio: hasAudio };
}


export function autoFormatSize(bytes) {
  const MB = bytes / (1024 * 1024); // Convert bytes to MB

  if (MB < 0.5) {
    // If size is less than 0.5 MB, display in KB
    const KB = bytes / 1024;
    return KB.toFixed(2) + ' KB';
  } else {
    // Otherwise, display in MB
    return MB.toFixed(2) + ' MB';
  }
}

