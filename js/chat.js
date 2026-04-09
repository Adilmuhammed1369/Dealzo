// Chat functionality
function sendMessage(userId, bikeId, text, sender) {
    const message = {
        userId,
        bikeId,
        text,
        sender
    };
    addMessage(message);

    // If admin reply, create notification
    if (sender === 'admin') {
        const bike = getBikeById(bikeId);
        addNotification({
            userId,
            bikeId,
            type: 'message',
            message: `Admin replied to ${bike.name}: ${text}`,
            bikeName: bike.name
        });
    }
}

function displayMessages(messages, container) {
    container.innerHTML = '';
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}`;

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = message.text;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = formatDate(message.timestamp);

        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(timeDiv);
        container.appendChild(messageDiv);
    });

    // Auto scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// DOM manipulation for chat
document.addEventListener('DOMContentLoaded', function() {
    const chatModal = document.getElementById('chat-modal');
    const closeChat = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input-field');
    const sendMessageBtn = document.getElementById('send-message');
    let currentBikeId = null;

    // Open chat modal
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('chat-btn')) {
            e.preventDefault();
            const currentUser = getCurrentUser();
            if (!currentUser || currentUser.role === 'guest') {
                alert('Please login to continue');
                window.location.href = 'index.html';
                return;
            }

            currentBikeId = e.target.dataset.bikeId;
            const messages = getMessagesByUserAndBike(currentUser.id, currentBikeId);
            displayMessages(messages, chatMessages);
            chatModal.style.display = 'flex';
        }
    });

    // Close chat modal
    if (closeChat) {
        closeChat.addEventListener('click', function() {
            chatModal.style.display = 'none';
        });
    }

    // Send message
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', function() {
            const text = chatInput.value.trim();
            if (text && currentBikeId) {
                const currentUser = getCurrentUser();
                sendMessage(currentUser.id, currentBikeId, text, 'user');
                chatInput.value = '';
                const messages = getMessagesByUserAndBike(currentUser.id, currentBikeId);
                displayMessages(messages, chatMessages);
            }
        });
    }

    // Send message on Enter
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessageBtn.click();
            }
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === chatModal) {
            chatModal.style.display = 'none';
        }
    });
});