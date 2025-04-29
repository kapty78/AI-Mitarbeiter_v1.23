import { FC } from "react"

interface ChatbotUISVGProps {
  theme: "dark" | "light"
  scale?: number
}

export const ChatbotUISVG: FC<ChatbotUISVGProps> = ({ theme, scale = 1 }) => {
  return (
    <svg
      width={189 * scale}
      height={194 * scale}
      viewBox="0 0 189 194"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="12.5"
        y="12.5"
        width="164"
        height="127"
        rx="37.5"
        fill={`${theme === "dark" ? "#000" : "#fff"}`}
        stroke={`${theme === "dark" ? "#fff" : "#000"}`}
        strokeWidth="25"
      />
      <path
        d="M72.7643 143.457C77.2953 143.443 79.508 148.98 76.2146 152.092L42.7738 183.69C39.5361 186.749 34.2157 184.366 34.3419 179.914L35.2341 148.422C35.3106 145.723 37.5158 143.572 40.2158 143.564L72.7643 143.457Z"
        fill={`${theme === "dark" ? "#fff" : "#000"}`}
      />
      <path
        d="M60 51.6H105V65H75V70H100V83H75V88H105V102H60V51.6Z"
        fill={`${theme === "dark" ? "#4CAF50" : "#2E7D32"}`}
      />
      <path
        d="M110 51.6H125V60H130L140 80H95L105 60H110V51.6Z"
        fill={`${theme === "dark" ? "#FF9800" : "#F57C00"}`}
      />
      <circle
        cx="105"
        cy="90"
        r="6"
        fill={`${theme === "dark" ? "#FF9800" : "#F57C00"}`}
      />
      <circle
        cx="130"
        cy="90"
        r="6"
        fill={`${theme === "dark" ? "#FF9800" : "#F57C00"}`}
      />
    </svg>
  )
}
