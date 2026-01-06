import { Search } from "lucide-react"
import { ConversationItem } from "./ConversationItem.tsx"
import type { ConversationListProps } from "../../types/chat.ts";

export function ConversationList({ contacts, selectedId, onSelect, searchQuery, onSearchChange }: ConversationListProps) {
    return (
        <div className="w-[340px] bg-[#12121a] flex flex-col my-3 rounded-2xl overflow-hidden">
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-[#1f1f2e] text-white placeholder-[#6b7280] pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
                {contacts.length > 0 && (
                    <div>
                        <div className="bg-[#1a1a24] rounded-xl p-3">
                            <h3 className="text-white font-semibold mb-3 px-2">Contacts</h3>
                            <div className="space-y-1">
                                {contacts.map((contact) => (
                                    <ConversationItem
                                        key={contact.id}
                                        conversation={contact}
                                        isSelected={selectedId === contact.id}
                                        onClick={() => onSelect(contact)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}