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
            text: value ? value: faker.lorem.paragraphs(1),
          },
        ],
      },
    ],
  };
};