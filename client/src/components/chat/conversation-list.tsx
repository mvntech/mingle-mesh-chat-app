import { useState, useEffect } from "react";
import { Search, Loader2, UserPlus } from "lucide-react";
import { ConversationItem } from "./conversation-item";
import type { Conversation } from "../../types/chat";
import { useLazyQuery } from "@apollo/client/react";
import { SEARCH_USERS } from "../../queries/searchUsers";
import { CREATE_CHAT } from "../../mutations/createChat";
import { useMutation } from "@apollo/client/react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface ConversationListProps {
  groups: Conversation[];
  contacts: Conversation[];
  selectedId: string;
  onSelect: (conversation: Conversation) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading?: boolean;
}

export function ConversationList({
  groups,
  contacts,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const [searchUsers, { data, loading }] = useLazyQuery(SEARCH_USERS);
  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= 2) {
      searchUsers({ variables: { search: debouncedSearchTerm } });
    }
  }, [debouncedSearchTerm, searchUsers]);

  const [createChat] = useMutation(CREATE_CHAT);

  const searchResults: Conversation[] =
    data?.getUsers.map((user: any) => ({
      id: user.id,
      name: user.username,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastMessage: "Tap to start chatting",
      time: "",
      isGroupChat: false,
      messageStatus: "sent",
      unreadCount: 0,
    })) || [];

  const isSearching = searchQuery.trim().length > 0;

  if (loading && !isSearching) {
    const skeletonItems = Array.from({ length: 6 });
    return (
      <div className="w-[340px] bg-[#12121a] flex flex-col my-3 rounded-2xl overflow-hidden border border-[#1f1f2e]">
        <div className="p-4 border-b border-[#1f1f2e]">
          <div className="h-8 bg-[#15151e] rounded-full w-40 animate-pulse" />
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-3">
            {skeletonItems.map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 px-3 py-2">
                <div className="w-11 h-11 rounded-full bg-[#111116] animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-[#111116] rounded w-1/2 mb-2 animate-pulse" />
                  <div className="h-3 bg-[#111116] rounded w-3/4 animate-pulse" />
                </div>
                <div className="h-3 w-10 bg-[#111116] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[340px] bg-[#12121a] flex flex-col my-3 rounded-2xl overflow-hidden border border-[#1f1f2e]">
      {/* search bar */}
      <div className="p-4 border-b border-[#1f1f2e]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#1f1f2e] text-white placeholder-[#6b7280] pl-12 pr-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-all"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3b82f6] animate-spin" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isSearching ? (
          <div className="space-y-1">
            <h3 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider px-4 py-2">
              Search Results for "{searchQuery}"
            </h3>

            {searchResults.length === 0 && !loading && (
              <div className="text-center py-8 text-[#6b7280]">
                <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            )}

            {searchResults.map((user) => (
              <ConversationItem
                key={user.id}
                conversation={user}
                isSelected={selectedId === user.id}
                onClick={async () => {
                  try {
                    const { data: chatData } = await createChat({
                      variables: { participantIds: [user.id], isGroupChat: false },
                    });

                    if (chatData?.createChat) {
                      const chat = chatData.createChat;
                      const conv: Conversation = {
                        id: chat.id,
                        name: chat.name ||
                          (chat.participants && chat.participants[0]
                            ? chat.participants[0].username
                            : user.name),
                        avatar: chat.participants && chat.participants[0]
                          ? chat.participants[0].avatar
                          : user.avatar,
                        isOnline:
                          chat.participants && chat.participants[0]
                            ? chat.participants[0].isOnline
                            : user.isOnline,
                        lastMessage: chat.lastMessage?.content || "",
                        time: chat.lastMessage
                          ? new Date(chat.lastMessage.createdAt).toLocaleTimeString(
                              "en-US",
                              { hour: "numeric", minute: "2-digit" }
                            )
                          : "",
                        isGroupChat: chat.isGroupChat,
                      };
                      onSelect(conv);
                      return;
                    }
                    onSelect(user);
                  } catch (err) {
                    console.error("Error creating chat:", err);
                    onSelect(user);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* groups section */}
            {groups.length > 0 && (
              <div className="mb-4">
                <div className="px-2 mb-2">
                  <h3 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider px-2">
                    Groups
                  </h3>
                </div>
                <div className="space-y-1">
                  {groups.map((group) => (
                    <ConversationItem
                      key={group.id}
                      conversation={group}
                      isSelected={selectedId === group.id}
                      onClick={() => onSelect(group)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* contacts section */}
            {contacts.length > 0 && (
              <div>
                <div>
                  <h3 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider px-4 py-2">
                    Contacts
                  </h3>
                </div>
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
