import { FC } from 'react';

interface TestCodeBlockProps {
  code: string;
}

export const TestCodeBlock: FC<TestCodeBlockProps> = ({ code }) => {
  return (
    <div className="my-4 rounded-lg border-4 border-yellow-500 bg-black p-4 text-white">
      <div className="mb-2 rounded bg-gray-800 p-2 text-gray-300">
        <span>Test Code Block</span>
        <button className="float-right rounded bg-blue-500 px-2 py-1 text-white">Copy</button>
      </div>
      <pre className="overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}; 