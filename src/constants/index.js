export const BUFFER_MULTIPLIER = 1.5;
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
];

export const MAX_IMAGE_SIZE = 450;

export const CURRENT_USER = 'current_user'

export const MESSAGE_VARIANTS = {
    viewport:{ once: true },
    initial: {
      opacity: 0,
      y: 0
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    },
    exit: {
      opacity: 0,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
};

export const AUDIO_WAVEFORM_OPRIONS = {
  waveColor: '#0c4a6e',
  progressColor: '#88aec4',
  barWidth: 1,
  barRadius: 2,
  cursorWidth: 0,
  cursorColor: 'transparent',
  // cursorColor: '#0c4a6e',
  height: 21,
  barGap: 2,
  barHeight: 21,
  dragToSeek: true,
  fillParent: true,
  normalize: true,
  // cursorWidth: 2,
  barMinHeight: 4,
};


export const IMAGE_URLS = [
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/chris-weiher-SL5dYCFCgeE-unsplash.jpg", dimensions: { width: 1920, height: 1308}},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/duc-nguyen-Y4B8MNuLYfs-unsplash.jpg", dimensions: { width: 1920, height: 2880}},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/henrique-ferreira-8xXeYkZMm-c-unsplash.jpg", dimensions: { width: 1920, height: 1281}},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/jonas-degener-Lg4D-QBuP5Q-unsplash.jpg", dimensions: { width: 1920, height: 2880}},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/jonas-degener-N2ucuKloA34-unsplash.jpg", dimensions: { width: 1920, height: 2880}},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/jonas-degener-VvIug1kr8yU-unsplash.jpg", dimensions: { width: 1920, height: 1382}},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/kevin-schmid-9WicLhY0tI8-unsplash.jpg", dimensions: { width: 1920, height: 1280}},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/leandra-rieger-6NmxNVlLcnU-unsplash.jpg", dimensions: { width: 1920, height: 2880 }},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/leandra-rieger-gR5B7ocb-Ww-unsplash.jpg", dimensions: { width: 1920, height: 989}},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/images/sasha-matic-99cZwcq7QyA-unsplash.jpg", dimensions: { width: 1920, height: 2400}},
];

export const PDF_URLS = [
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/4793d546a45c6039f4b1122005a542af-invoice-template-PDF-2.pdf", size: 722636.8, preview_url: 'https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/prev_2.png'},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/6668865.pdf", size: 1782579.2 , preview_url: 'https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/prev_1.png'},
];

export const AUDIO_DEFINITIONS = [
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/SoundHelix-Song-1.mp3", duration: 372.715083}, // Sample MP3 from soundhelix.com
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/SoundHelix-Song-2.mp3", duration: 425.952625}, // Another sample MP3
  
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/2s.m4a", duration: 2},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/3.m4a", duration: 3}, 
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/5.m4a", duration: 5},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/11s.m4a", duration: 11}, 
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/16s.m4a", duration: 16},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/21.m4a", duration: 21},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/30s.m4a", duration: 30},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/long.m4a", duration: 81},
];

const AUDIO_URLS = AUDIO_DEFINITIONS.map(audio => audio.url);
// Combine media types and their associated URLs and MIME type prefixes
// Separated non-audio media for easier selection
export const NON_AUDIO_MEDIA_DEFINITIONS = [
  { type: "image", urls: IMAGE_URLS.map((image) => image.url), mime_prefix: "image/" },
  { type: "pdf", urls: PDF_URLS.map((pdf) => pdf.url), mime_prefix: "application/" },
];

export const AUDIO_MEDIA_DEFINITION = { type: "audio", urls: AUDIO_URLS, mime_prefix: "audio/" };