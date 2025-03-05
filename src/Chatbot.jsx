import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import PropTypes from "prop-types";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { PlusCircleIcon } from "@heroicons/react/16/solid";
import './Chatbot.css';

const Chatbot = (props) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isChatBoxVisible, setIsChatBoxVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [processMessages, setProcessMessages] = useState("done");
    const [textProcessing, setTextProcessing] = useState("");
    const boxRef = useRef(null);

    useEffect(() => {
        if (boxRef.current) {
            boxRef.current.scrollTo({
                top: boxRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, textProcessing]);

    const handleSend = async () => {
        if (input.trim() === "") return;
        const userMessage = {
            sender: "user",
            text: input,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput("");
        setLoading(true);
        setProcessMessages("processing");

        let resultText = "";
        let urls = [];
        let accumulatedChunk = "";

        try {
            const response = await fetch(
                props.endpoint,
                {
                    method: "POST",
                    body: JSON.stringify({
                        messages: [
                            {
                                content: input,
                                role: "user",
                            },
                        ],
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    }
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedChunk += chunk;

                const objects = accumulatedChunk.split("\n");
                accumulatedChunk = objects.pop();

                // eslint-disable-next-line no-loop-func
                objects.forEach((obj) => {
                    if (obj.trim()) {
                        try {
                            const result = JSON.parse(obj);

                            if (result?.choices?.[0]?.messages?.[0]) {
                                const msg = result.choices[0].messages[0];

                                if (msg.role === "tool") {
                                    try {
                                        const toolContent = JSON.parse(msg.content);
                                        if (toolContent.citations) {
                                            toolContent.citations.forEach((citation) => {
                                                if (citation.url) {
                                                    urls.push(citation.url);
                                                }
                                            });
                                        }
                                    } catch (e) {
                                        if (!(e instanceof SyntaxError)) {
                                            throw e;
                                        }
                                    }
                                } else if (msg.role === "assistant") {
                                    let content = msg.content;
                                    content = content.replace(/\[doc(\d+)\]/g, (match, p1) => {
                                        const index = parseInt(p1, 10) - 1;
                                        return urls[index]
                                            ? `<a style="color:#1F4F82" href="${urls[index]}" target="_blank">[Ref${p1}]</a>`
                                            : match;
                                    });
                                    resultText += content;
                                }
                                if (obj.length > 0) {
                                    setTextProcessing(resultText);
                                }
                            }
                        } catch (e) {
                            console.error("Parsing error: ", e);
                            if (!(e instanceof SyntaxError)) {
                                throw e;
                            }
                        }
                    }
                });
            }
        } catch (e) {
            console.error("Request error: ", e);
            let errorMessage =
                props.errorMessage  ? props.errorMessage :
                "Sorry an error occurred. Please try again. If the problem persists, please contact the site administrator.";
            let errorChatMsg = {
                sender: "bot",
                text: errorMessage,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            setMessages([...messages, userMessage, errorChatMsg]);
        } finally {
            setLoading(false);
            if (resultText !== "") {
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: "bot",
                        text: resultText,
                        time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                    },
                ]);
            }
            setProcessMessages("done");
            setTextProcessing("");
        }
        urls = [];
    };

    const handleNewChat = () => {
        setMessages([]);
    };

    const toggleChatBox = () => {
        setIsChatBoxVisible(!isChatBoxVisible);
    };

    return (
        <div>
            {!isChatBoxVisible && (
                <div className="chatbot-icon">
                    <img
                        src={`${props.imageSrc ? props.imageSrc : "https://i.pinimg.com/736x/9c/76/0b/9c760b151faf6e0a69bf6ddf13006f00.jpg"}`}
                        alt="Message Icon"
                        className={props.imageCss ? props.imageCss : "chatbot-icon-size"}
                        onClick={toggleChatBox}
                    />
                </div>
            )}
            {isChatBoxVisible && (
                <div className="chatbot-container">
                    <div className="chatbot-close-button">
                        <p className={props.titleCss ? props.titleCss : "chatbot-icon-name"}>{props.title ? props.title : 'NAB AI Assistant'}</p>
                        <button onClick={toggleChatBox} className="text-white">Close</button>
                    </div>
                    <div className={props.headerCss ? props.headerCss : "chatbot-header-content"}>
                        <img src={`${props.headerImage ? props.headerImage : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGljy8ouUODVtOniU5jzF6r-4xJ-dOjEiU3g&s"}`} 
                            alt="logo" className="chatbot-icon-size" />
                        <div className="flex-col">
                            <p>{props.headerText ? props.headerText : 'Chat with us 24/7'}</p>
                        </div>
                    </div>
                    <div ref={boxRef} className="chatbot-scrollable-box">
                        {messages.map((message, index) => (
                            <div key={index} className={`${message.sender === 'user' ? 'chatbot-msg-container-reverse' : 'chatbot-msg-container'}`}>
                                {message.sender === 'bot' && (
                                    <img
                                        src={`${props.headerImage ? props.headerImage : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGljy8ouUODVtOniU5jzF6r-4xJ-dOjEiU3g&s"}`}
                                        alt="bot-avatar"
                                        className="chatbot-small-circle"
                                    />
                                )}
                                <div className={`${message.sender === 'user' ? 'chatbot-column-container' : 'chatbot-column-container-start'}`}>
                                    <ReactMarkdown
                                        className={props.outputTextCss ? props.outputTextCss : "chatbot-text-small"}
                                        children={message.text}
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                    />
                                    <div className={props.outputTextCss ? props.outputTextCss : "chatbot-text-small"}>{message.time}</div>
                                </div>
                            </div>
                        ))}
                        {/* Display processing message */}
                        {loading && processMessages === 'processing' && (
                            <div className={`${messages.length % 2 === 0 ? 'chatbot-reverse-flex-container' : 'chatbot-flex-container'}`}>
                                <img
                                    src={props.headerImage ? props.headerImage : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGljy8ouUODVtOniU5jzF6r-4xJ-dOjEiU3g&s"}
                                    alt="bot-avatar"
                                    className="chatbot-icon-answer"
                                />
                                <div className="chatbot-column-container-start-ans">
                                    <ReactMarkdown
                                        className={props.outputTextCss ? props.outputTextCss : "chatbot-text-small"}
                                        children={textProcessing}
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                    />
                                    <div className={props.outputTextCss ? props.outputTextCss : "chatbot-text-small"}>Generating answers...</div>
                                </div>
                            </div>
                        )}
                        {loading && processMessages === 'processing' && (
                            <div className="chatbot-centered-container">
                                <button disabled type="button" class="chatbot-button">
                                    <svg aria-hidden="true" role="status" class="chatbot-spinner" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2" />
                                    </svg>
                                    Loading...
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="chatbot-assist-container">
                        <div className="hover:opacity-80">
                            <PlusCircleIcon width={25} color="black" onClick={handleNewChat} title="Create new chat" className="chatbot-new-chat" />
                        </div>
                        <input
                            type="text"
                            value={input}
                            onKeyDown={(e) => processMessages !== 'processing' && e.key === 'Enter' && handleSend()}
                            onChange={(e) => setInput(e.target.value)}
                            className={props.inputTextCss ? props.inputTextCss : "chatbot-input-field"}
                            placeholder={props.placeholder ? props.placeholder : 'Type a message...'}
                        />
                        <button
                            onClick={handleSend}
                            disabled={processMessages === 'processing'}
                            className={`${processMessages === 'processing' ? 'chatbot-send-button-processing' : 'chatbot-send-button'}`}>
                            {props.buttonLabel ? props.buttonLabel : 'Send'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

Chatbot.propTypes = {
    title: PropTypes.string.isRequired,
    endpoint: PropTypes.string.isRequired
}

export default Chatbot;
