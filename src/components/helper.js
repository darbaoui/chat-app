import { faker } from "@faker-js/faker";

export const generateTiptapJson = (messageNumber=0, value=null) => {
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
            text: `formatted as ${selectedFormat}`,
          },
          {
            type: 'text',
            text: value ?? faker.lorem.paragraphs(1),
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