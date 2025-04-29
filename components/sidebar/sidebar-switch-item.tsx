import { ContentType } from "@/types"
import { FC } from "react"
// import { TabsTrigger } from "../ui/tabs" // Remove TabsTrigger import
import { Button } from "@nextui-org/react" // Use general import
import { WithTooltip } from "../ui/with-tooltip"

interface SidebarSwitchItemProps {
  contentType: ContentType
  icon: React.ReactNode
  onContentTypeChange: (contentType: ContentType) => void
}

export const SidebarSwitchItem: FC<SidebarSwitchItemProps> = ({
  contentType,
  icon,
  onContentTypeChange
}) => {
  return (
    <WithTooltip
      display={
        <div>{contentType[0].toUpperCase() + contentType.substring(1)}</div>
      }
      trigger={
        // Replace TabsTrigger with a Button
        <Button
          isIconOnly // Make it look like an icon button
          variant="ghost" // Use ghost variant for less emphasis, similar to tabs
          aria-label={contentType} // For accessibility
          className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:opacity-50" // Basic styling, adjust as needed
          onClick={() => onContentTypeChange(contentType)} // Call our handler directly
        >
          {icon}
        </Button>
      }
    />
  )
}
