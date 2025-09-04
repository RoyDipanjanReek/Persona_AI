"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiUser, FiMoreVertical } from "react-icons/fi";
import { BsCircleFill } from "react-icons/bs";
import { persona } from "@/lib/persona";


const ChatUI = () => {
  const [contacts, setContacts] = useState(persona);

  const [currentChat, setCurrentChat] = useState(persona[0]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  // {Handle submit function start here--}
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMsg = {
      id: messages.length + 1,
      text: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/sendmessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona: {
            name: currentChat.name,
            systemPrompt: currentChat.systemPrompt,
          },
          messages: [...messages, userMsg],
        }),
      });

      console.log(res);

      if (!res.ok) throw new Error("res is not comming from api.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botMsg = {
        id: Date.now(),
        text: "",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMsg]);

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

              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...botMsg };
                return updated;
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/5 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black font-serif">
            Persona AI
          </h2>
        </div>
        <ul>
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                currentChat.id === contact.id ? "bg-blue-50" : ""
              }`}
              onClick={() => setCurrentChat(contact)}
            >
              <img
                src={contact.avater}
                alt={`${contact.name}'s avatar`}
                className="w-12 h-12 rounded-full mr-4"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-black">{contact.name}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {contact.lastMessage}
                </p>
              </div>
              {contact.online && (
                <BsCircleFill className="text-green-500 w-3 h-3" />
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Chat Section */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center text-black">
          <img
            src={currentChat.avater}
            alt={`${currentChat.name}'s avatar`}
            className="w-10 h-10 rounded-full mr-4"
          />
          <div className="flex-1">
            <h2 className="font-semibold">{currentChat.name}</h2>
            <p className="text-sm text-gray-500">
              {currentChat.online ? "Online" : "Offline"}
            </p>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            aria-label="More options"
          >
            <FiMoreVertical />
          </button>
        </div>

        {/* Chat History */}
        <div
          ref={chatHistoryRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                <p>{message.text}</p>
                <span className="text-xs text-white block mt-1">
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="text-gray-400 text-sm">User is typing...</div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white text-black border-t border-gray-200 p-4">
          <div className="flex items-center">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="1"
              style={{ resize: "none" }}
            />
            <button
              onClick={handleSendMessage}
              className="ml-2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Send message"
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
