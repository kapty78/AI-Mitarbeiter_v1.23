"use client";

import { FC } from 'react';
import { MessageMarkdown } from './message-markdown';

const testMarkdown = `
# Heading 1

This is a paragraph with **bold** and *italic* text.

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

Here is a [link to Google](https://www.google.com).

### Code Examples

Inline code: \`const x = 1;\`

\`\`\`javascript
// This is a JavaScript code block
function helloWorld() {
  console.log("Hello World!");
  return true;
}
\`\`\`

\`\`\`python
# This is a Python code block
def hello_world():
    print("Hello World!")
    return True
\`\`\`

\`\`\`typescript
// TypeScript example
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): User {
  return {
    id,
    name: 'John Doe',
    email: 'john@example.com'
  };
}
\`\`\`

### Lists

#### Unordered List:
* Item 1
* Item 2
  * Nested item
* Item 3

#### Ordered List:
1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

### Table

| Name | Type | Description |
|------|------|-------------|
| id | string | Unique identifier |
| name | string | User's name |
| email | string | User's email address |
| active | boolean | Whether user is active |

### Blockquote

> This is a blockquote.
> It can span multiple lines.

### Horizontal Rule

---

That's all for the demo!
`;

export const MarkdownTest: FC = () => {
  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-zinc-900 p-8 text-white shadow-lg">
      <h1 className="mb-6 border-b pb-2 text-2xl font-bold">Markdown Rendering Test</h1>
      <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-6">
        <MessageMarkdown content={testMarkdown} />
      </div>
    </div>
  );
}; 