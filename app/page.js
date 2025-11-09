"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiUser, FiMoreVertical, FiArrowLeft } from "react-icons/fi";
import { BsCircleFill } from "react-icons/bs";
import { persona } from "@/lib/persona";
import { getPersonaId } from "@/lib/persona";

const ChatUI = () => {
  const [contacts, setContacts] = useState(persona);

  const [currentChat, setCurrentChat] = useState(persona[0]);
  const [chatHistory, setChatHistory] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatHistoryRef = useRef(null);
const [sidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory, currentChat]);

  const message = chatHistory[currentChat?.id] || [];

  // Handle submit function start here--
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMsg = {
      id: Date.now(),
      text: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatHistory((prev) => ({
      ...prev,
      [currentChat.id]: [...(prev[currentChat.id] || []), userMsg],
    }));

    setNewMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat-responce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona: {
            name: currentChat.name,
            systemPrompt: currentChat.systemPrompt,
          },
          messages: [...(chatHistory[currentChat.id] || []), userMsg],
        }),
      });

      console.log(res);

      if (!res.ok) throw new Error("res is not comming from api.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botMsg = {
        id: Date.now() + 1,
        text: "",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setChatHistory((prev) => ({
        ...prev,
        [currentChat.id]: [...(prev[currentChat.id] || []), botMsg],
      }));

      //Stream Response
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data?.content) {
              botMsg.text += data.content;

              setChatHistory((prev) => {
                const updated = [...(prev[currentChat.id] || [])];
                updated[updated.length - 1] = { ...botMsg };
                return { ...prev, [currentChat.id]: updated };
              });
            }
          }
        }
      }
      setIsTyping(false);
    } catch (error) {
      console.error("Send message error:", error);
      setIsTyping(false);
    }
  };
  // {Handle submit function ends here--}

  // {Handle Key Press function ends here--}
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.trim() !== "");
  };

  
   return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar (Contacts List) */}
      <div
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-1/4 lg:w-1/5 bg-white border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto transition-all duration-300`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-semibold text-black font-serif">
            Persona AI
          </h2>
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FiUser />
          </button>
        </div>

        <ul className="divide-y divide-gray-100">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className={`flex items-center p-3 md:p-4 hover:bg-gray-50 cursor-pointer ${
                currentChat?.id === contact.id ? "bg-blue-50" : ""
              }`}
              onClick={() => {
                setCurrentChat(contact);
                setSidebarOpen(false);
              }}
            >
              <img
                src={contact.avater}
                alt={`${contact.name}'s avatar`}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full mr-3 md:mr-4"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-black text-sm md:text-base truncate">
                  {contact.name}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 truncate">
                  {contact.lastMessage}
                </p>
              </div>
              {contact.online && (
                <BsCircleFill className="text-green-500 w-2.5 h-2.5 md:w-3 md:h-3" />
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Section */}
      <div
        className={`flex-1 flex flex-col bg-gray-100 transition-all duration-300 ${
          !sidebarOpen || currentChat ? "block" : "hidden md:flex"
        }`}
      >
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-3 md:p-4 flex items-center text-black">
          {/* Back button for mobile */}
          <button
            onClick={() => {
              setSidebarOpen(true);
              setCurrentChat(null);
            }}
            className="md:hidden mr-3 text-gray-500 hover:text-gray-700"
          >
            <FiArrowLeft size={20} />
          </button>

          {currentChat ? (
            <>
              <img
                src={currentChat.avater}
                alt={`${currentChat.name}'s avatar`}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-3 md:mr-4"
              />
              <div className="flex-1">
                <h2 className="font-semibold text-sm md:text-base">
                  {currentChat.name}
                </h2>
                <p className="text-xs md:text-sm text-gray-500">
                  {currentChat.online ? "Online" : "Offline"}
                </p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700"
                aria-label="More options"
              >
                <FiMoreVertical />
              </button>
            </>
          ) : (
            <h2 className="text-gray-500 text-center w-full">
              Select a chat to start messaging
            </h2>
          )}
        </div>

        {/* Chat History */}
        {currentChat && (
          <div
            ref={chatHistoryRef}
            className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50"
          >
            {message.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] md:max-w-md lg:max-w-lg px-3 py-2 md:px-4 md:py-2 rounded-lg shadow-sm ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  <p className="text-sm md:text-base break-words">
                    {message.text}
                  </p>
                  <span
                    className={`text-[10px] md:text-xs block mt-1 ${
                      message.sender === "user"
                        ? "text-white/70"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="text-gray-400 text-xs md:text-sm">
                User is typing...
              </div>
            )}
          </div>
        )}

        {/* Message Input */}
        {currentChat && (
          <div className="bg-white border-t border-gray-200 p-3 md:p-4">
            <div className="flex items-center">
              <textarea
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-black"
                rows="1"
              />
              <button
                onClick={handleSendMessage}
                className="ml-2 bg-blue-500 text-white rounded-full p-2 md:p-2.5 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Send message"
              >
                <FiSend size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  
};

export default ChatUI;
