document.addEventListener('DOMContentLoaded', () => {
    const themeCheckbox = document.getElementById('theme-checkbox');
    
    // Apply saved theme on initial load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeCheckbox.checked = true;
    }

    // Listener for theme toggle
    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    // The conversation history is stored in this array to be sent to the backend.
    // Based on the user's sample request, the backend expects the conversation history.
    let conversation = [];

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userMessageText = userInput.value.trim();
        if (!userMessageText) {
            return;
        }

        // Add user's message to the chat box and conversation history
        appendMessageToChatBox('user', userMessageText);
        conversation.push({ role: 'user', text: userMessageText });

        // Clear the input field and keep it focused for the next message
        userInput.value = '';
        userInput.focus();

        // Show a temporary "Thinking..." bot message while waiting for the response
        const botMessageElement = appendMessageToChatBox('bot', 'Thinking<<.');
        botMessageElement.classList.add('thinking');

        try {
            // Send the entire conversation history to the backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ conversation: conversation }),
            });

            // If the server response is not OK (e.g., 500), throw an error
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            // The thinking message is no longer needed
            botMessageElement.classList.remove('thinking');

            // Check if the response contains the expected 'result'
            if (data && data.result) {
                // Update the temporary message with the AI's actual response
                botMessageElement.textContent = data.result;
                // Add the AI's response to the conversation history
                conversation.push({ role: 'model', text: data.result });
            } else {
                // Handle cases where the response is successful but has no result
                botMessageElement.textContent = 'Sorry, no response received.';
                botMessageElement.classList.add('error');
            }

        } catch (error) {
            console.error('Failed to get response from server:', error);
            // If any error occurs during the fetch, update the message
            botMessageElement.textContent = 'Failed to get response from server.';
            botMessageElement.classList.remove('thinking');
            botMessageElement.classList.add('error');
        }
    });

    /**
     * Creates a new message element and appends it to the chat box.
     * @param {string} role - The role of the message sender ('user' or 'bot').
     * @param {string} text - The content of the message.
     * @returns {HTMLElement} The created message element.
     */
    function appendMessageToChatBox(role, text) {
        const messageElement = document.createElement('div');
        // Use textContent to prevent XSS by not rendering HTML from the response
        messageElement.textContent = text;
        messageElement.className = `message ${role}`;
        chatBox.appendChild(messageElement);
        // Automatically scroll to the bottom to see the latest message
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    }
});