-- Add sentfrom column to chat_messages to store user name

ALTER TABLE chat_messages ADD COLUMN sentfrom TEXT; 