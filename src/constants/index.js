export const CURRENT_USER = 'current_user'

export const MESSAGE_VARIANTS = {
    initial: {
      opacity: 0,
      y: -10
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn"
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
  normalize: true,
  barGap: 2,
  barHeight: 21,
  dragToSeek: true,
  fillParent: true,
  normalize: true,
  // cursorWidth: 2,
  barMinHeight: 4,
};


export const IMAGE_URLS = [
  "https://placehold.co/600x400/FF5733/FFFFFF/png?text=Image+Demo+1",
  "https://placehold.co/800x600/33FF57/000000/png?text=Image+Demo+2",
  "https://placehold.co/400x300/3357FF/FFFFFF/png?text=Image+Demo+3",
  "https://placehold.co/700x500/FFC300/000000/png?text=Image+Demo+4",
];

export const PDF_URLS = [
  "https://www.africau.edu/images/default/sample.pdf", // Sample PDF from africau.edu
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // Dummy PDF from w3.org
];

export const AUDIO_DEFINITIONS = [
  {url: "https://cors-anywhere.herokuapp.com/https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: 372.715083}, // Sample MP3 from soundhelix.com
  {url: "https://cors-anywhere.herokuapp.com/https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: 425.952625}, // Another sample MP3
  
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/2s.m4a", duration: 2},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/3.m4a", duration: 3}, 
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/5.m4a", duration: 5},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/11s.m4a", duration: 11}, 
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/16s.m4a", duration: 16},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/21.m4a", duration: 21},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/30s.m4a", duration: 30},
  {url: "https://audio-samples-zamma.s3.eu-west-3.amazonaws.com/long.m4a", duration: 72.6},
];

const AUDIO_URLS = AUDIO_DEFINITIONS.map(audio => audio.url);
// Combine media types and their associated URLs and MIME type prefixes
// Separated non-audio media for easier selection
export const NON_AUDIO_MEDIA_DEFINITIONS = [
  { type: "image", urls: IMAGE_URLS, mime_prefix: "image/" },
  { type: "pdf", urls: PDF_URLS, mime_prefix: "application/pdf" },
];

export const AUDIO_MEDIA_DEFINITION = { type: "audio", urls: AUDIO_URLS, mime_prefix: "audio/" };