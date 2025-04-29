import { ChatbotUIContext } from "@/context/context"
import { FC, useContext } from "react"
import { AssistantPicker } from "./assistant-picker"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"
import { FilePicker } from "./file-picker"
import { PromptPicker } from "./prompt-picker"
import { ToolPicker } from "./tool-picker"

interface ChatCommandInputProps {}

export const ChatCommandInput: FC<ChatCommandInputProps> = ({}) => {
  const {
    newMessageFiles,
    chatFiles,
    slashCommand,
    isFilePickerOpen,
    setIsFilePickerOpen,
    hashtagCommand,
    focusPrompt,
    focusFile,
    isPromptPickerOpen,
    isToolPickerOpen,
    isAssistantPickerOpen
  } = useContext(ChatbotUIContext)

  const { handleSelectUserFile, handleSelectUserCollection } =
    usePromptAndCommand()

  // Only render the active picker
  const renderActivePicker = () => {
    if (isPromptPickerOpen) {
      return <PromptPicker />
    }
    if (isFilePickerOpen) {
      return (
        <FilePicker
          isOpen={isFilePickerOpen}
          searchQuery={hashtagCommand}
          onOpenChange={setIsFilePickerOpen}
          selectedFileIds={[...newMessageFiles, ...chatFiles].map(
            file => file.id
          )}
          selectedCollectionIds={[]}
          onSelectFile={handleSelectUserFile}
          onSelectCollection={handleSelectUserCollection}
          isFocused={focusFile}
        />
      )
    }
    if (isToolPickerOpen) {
      return <ToolPicker />
    }
    if (isAssistantPickerOpen) {
      return <AssistantPicker />
    }
    return null
  }

  return (
    <div className="w-full rounded-lg border border-[#333333] bg-[#1e1e1e] shadow-lg">
      {renderActivePicker()}
    </div>
  )
}
