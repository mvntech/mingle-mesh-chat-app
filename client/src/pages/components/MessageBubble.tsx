import { Check, CheckCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ChatMessage } from "../../types/message";

export function MessageBubble({ message }: { message: ChatMessage }) {
    const { isOwn, messageStatus } = message;
    const tick = () => {
      if (!isOwn) return null;
      if (messageStatus === "seen") {
        return <CheckCheck className="w-4 h-4 text-[#3b82f6]" />;
      }
      if (messageStatus === "delivered") {
        return <CheckCheck className="w-4 h-4 text-[#9ca3af]" />;
      }
      return <Check className="w-4 h-4 text-[#9ca3af]" />;
    };

    return (
        <div className={cn("flex flex-col", message.isOwn ? "ml-auto items-end" : "mr-auto items-start")}>
            <div className={cn("px-4 py-3 rounded-2xl", message.isOwn ? "bg-[#3b82f6] text-white rounded-br-md" : "bg-[#1f1f2e] text-white rounded-bl-md")}>
                <p className="text-sm leading-relaxed">{message.text}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[#6b7280] text-xs">
                <span>{message.time}</span>
                 <span>{tick()}</span>
            </div>
        </div>
    );
}