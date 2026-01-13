import { Loader2 } from "lucide-react";

export default function Loader({ message }: { message?: string | undefined }) {
    return (
        <div className="min-h-screen bg-[#12121A] flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-[#3b82f6] animate-spin" />
                <p className="text-gray-400 font-medium">{message || "Loading..."}</p>
            </div>
        </div>
    );
}