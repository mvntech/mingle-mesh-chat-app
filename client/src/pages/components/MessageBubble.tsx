import { Check, CheckCheck, FileIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ChatMessage } from "../../types/message";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const { isOwn, messageStatus, fileUrl, fileType, fileName } = message;

  const tick = () => {
    if (!isOwn) return null;
    if (messageStatus === "seen") {
      return <CheckCheck className="w-4 h-4 text-[#3b82f6]" />;
    }
    if (messageStatus === "sent") {
      return <CheckCheck className="w-4 h-4 text-[#9ca3af]" />;
    }
    return <Check className="w-4 h-4 text-[#9ca3af]" />;
  };

  const renderMedia = () => {
    if (!fileUrl) return null;

    if (fileType === "image") {
      return (
        <div className="block mb-2">
          <img
            src={fileUrl}
            alt={fileName || "Image"}
            className="max-w-full rounded-lg h-auto max-h-64 object-cover"
          />
        </div>
      );
    }

    if (fileType === "video") {
      return (
        <video controls className="max-w-full rounded-lg h-auto max-h-64 mb-2">
          <source src={fileUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 mb-2 bg-[#3b82f6] rounded-lg hover:bg-[#2563EB] transition-colors"
      >
        <FileIcon className="w-5 h-5 text-white" />
        <span className="text-sm truncate text-white max-w-37.5">{fileName || "Download File"}</span>
      </a>
    );
  };

  return (
    <div className={cn("flex flex-col", message.isOwn ? "ml-auto items-end" : "mr-auto items-start")}>
      {renderMedia()}
      {message.text && (
          <div className={cn("px-4 py-3 rounded-2xl", message.isOwn ? "bg-[#3b82f6] text-white rounded-br-md" : "bg-[#1f1f2e] text-white rounded-bl-md")}>
        <p className="text-sm leading-relaxed">{message.text}</p>
      </div>
      )}
      <div className="flex items-center gap-2 mt-1 text-[#6b7280] text-xs">
        <span>{message.time}</span>
        <span>{tick()}</span>
      </div>
    </div>
  );
}