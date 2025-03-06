import React from "react";
import Chatbot from './Chatbot';
import './index.css';
import './Chatbot.css';

function App() {
  return (
    <div className='chatbot-parent'>
      <Chatbot 
        title="NAB AI Assistant" 
        titleCss="chatbot-icon-name"
        buttonLabel="Send" 
        inputTextCss="chatbot-input-field"
        outputTextCss="chatbot-text-small"
        imageSrc="https://i.pinimg.com/736x/9c/76/0b/9c760b151faf6e0a69bf6ddf13006f00.jpg"
        imageCss="chatbot-icon-size"
        placeholder="Type a message..."
        headerImage="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGljy8ouUODVtOniU5jzF6r-4xJ-dOjEiU3g&s"
        headerText="Chat with us 24/7"
        headerCss="chatbot-header-content"
        endpoint="https://nab-main-faq-openai.azurewebsites.net/conversation"/>
    </div>
  );
}

export default App;
