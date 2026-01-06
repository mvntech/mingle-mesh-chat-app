import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { MessageCircle } from "lucide-react";

function MingleMeshChat() {
    const [activeNav, setActiveNav] = useState<string>("home");

    return (
        <div className="flex h-screen bg-[#0a0a0f] overflow-hidden font-sans">
            <Sidebar
                activeNav={activeNav}
                onNavChange={setActiveNav}
            />

                <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0f] text-[#6b7280]">
                    <div className="w-20 h-20 bg-[#1f1f2e] rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-10 h-10" />
                    </div>
                    <p>Select a conversation to start messaging</p>
                </div>
        </div>
    );
}

export function MingleMeshAppWrapper() {
    return <MingleMeshChat />;
}