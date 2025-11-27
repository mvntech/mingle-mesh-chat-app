export interface Message {
  id: string
  text: string
  time: string
  isOwn: boolean
}

export interface Conversation {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  isOnline?: boolean
  unreadCount?: number
  messageStatus?: "sent" | "delivered" | "read"
  isGroup?: boolean
}

export const groupChats: Conversation[] = [
  {
    id: "friends-reunion",
    name: "Friends Reunion",
    avatar: "/dummy-user.jpeg",
    lastMessage: "Hi Guys, Wassup!",
    time: "Today, 5:25pm",
    isGroup: true,
  },
  {
    id: "cool-friends",
    name: "Cool Friends",
    avatar: "/dummy-user.jpeg",
    lastMessage: "Good to see you.",
    time: "Yesterday, 2:55pm",
    isGroup: true,
  },
  {
    id: "crazy-cousins",
    name: "Crazy Cousins",
    avatar: "/dummy-user.jpeg",
    lastMessage: "What plans today?",
    time: "Today, 9:22am",
    isGroup: true,
  },
]

export const contacts: Conversation[] = [
  {
    id: "raghav",
    name: "Raghav",
    avatar: "/dummy-user.jpeg",
    lastMessage: "Dinner?",
    time: "Today, 8:56pm",
    messageStatus: "read",
  },
  {
    id: "swathi",
    name: "Swathi",
    avatar: "/dummy-user.jpeg",
    lastMessage: "Sure!",
    time: "Today, 2:31pm",
    isOnline: true,
    messageStatus: "delivered",
  },
  {
    id: "kiran",
    name: "Kiran",
    avatar: "/dummy-user.jpeg",
    lastMessage: "Hi.....",
    time: "Yesterday, 6:22pm",
    unreadCount: 2,
  },
  {
    id: "tejeshwini",
    name: "Tejeshwini C",
    avatar: "/dummy-user.jpeg",
    lastMessage: "I will call him today.",
    time: "Today, 12:22pm",
    messageStatus: "sent",
  },
]

export const conversations: Conversation[] = [...groupChats, ...contacts]

export const messagesData: Record<string, Message[]> = {
  swathi: [
    { id: "1", text: "Hey There !", time: "2:01pm", isOwn: false },
    { id: "2", text: "How are you doing?", time: "2:02pm", isOwn: false },
    { id: "3", text: "Hello...", time: "2:12pm", isOwn: true },
    { id: "4", text: "I am good  and hoew about you?", time: "2:12pm", isOwn: true },
    { id: "5", text: "I am doing well. Can we meet up tomorrow?", time: "2:13pm", isOwn: false },
    { id: "6", text: "Sure!", time: "2:14pm", isOwn: true },
  ],
  raghav: [
    { id: "1", text: "Hey, are you free tonight?", time: "8:30pm", isOwn: false },
    { id: "2", text: "Was thinking of grabbing dinner", time: "8:45pm", isOwn: false },
    { id: "3", text: "Dinner?", time: "8:56pm", isOwn: false },
  ],
  kiran: [
    { id: "1", text: "Hi", time: "6:20pm", isOwn: false },
    { id: "2", text: "Hi.....", time: "6:22pm", isOwn: false },
  ],
  tejeshwini: [
    { id: "1", text: "Did you talk to him?", time: "12:00pm", isOwn: false },
    { id: "2", text: "Not yet", time: "12:15pm", isOwn: true },
    { id: "3", text: "I will call him today.", time: "12:22pm", isOwn: true },
  ],
  "friends-reunion": [
    { id: "1", text: "Hey everyone!", time: "5:00pm", isOwn: false },
    { id: "2", text: "Long time no see!", time: "5:10pm", isOwn: true },
    { id: "3", text: "Hi Guys, Wassup!", time: "5:25pm", isOwn: false },
  ],
  "friends-forever": [
    { id: "1", text: "Miss you all!", time: "2:30pm", isOwn: false },
    { id: "2", text: "Good to see you.", time: "2:55pm", isOwn: false },
  ],
  "crazy-cousins": [
    { id: "1", text: "Weekend plans?", time: "9:00am", isOwn: true },
    { id: "2", text: "What plans today?", time: "9:22am", isOwn: false },
  ],
}
