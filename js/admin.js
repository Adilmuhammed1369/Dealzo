// Admin chat functionality
function displayUsersList() {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;

    const messages = getMessages();
    const usersWithMessages = {};

    messages.forEach(msg => {
        if (!usersWithMessages[msg.userId]) {
            const user = getUsers().find(u => u.id === msg.userId);
            if (user) {
                usersWithMessages[msg.userId] = {
                    user,
                    lastMessage: msg,
                    bike: getBikeById(msg.bikeId)
                };
            }
        } else {
            // Update last message if newer
            if (new Date(msg.timestamp) > new Date(usersWithMessages[msg.userId].lastMessage.timestamp)) {
                usersWithMessages[msg.userId].lastMessage = msg;
                usersWithMessages[msg.userId].bike = getBikeById(msg.bikeId);
            }
        }
    });

    usersList.innerHTML = '';
    Object.values(usersWithMessages).forEach(({ user, lastMessage, bike }) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'users-list-item';
        userDiv.dataset.userId = user.id;

        userDiv.innerHTML = `
            <div class="user-name">${user.username}</div>
            <div class="last-message">${bike ? bike.name : 'Unknown bike'}: ${lastMessage.text.substring(0, 30)}${lastMessage.text.length > 30 ? '...' : ''}</div>
        `;

        userDiv.addEventListener('click', () => selectUser(user.id));
        usersList.appendChild(userDiv);
    });
}

function selectUser(userId) {
    // Update active state
    document.querySelectorAll('.users-list-item').forEach(item => {
        item.classList.remove('active');
    });
    const selectedItem = document.querySelector(`[data-user-id="${userId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }

    // Store selected user ID for later use
    window.selectedChatUserId = userId;
    window.selectedBikeId = null;

    // Display user info
    const user = getUsers().find(u => u.id === userId);
    if (!user) return;
    
    const userInfo = document.getElementById('chat-user-info');
    userInfo.innerHTML = `
        <h4>${user.username}</h4>
        <p><strong>Phone:</strong> ${user.phone}</p>
        <p><strong>Pincode:</strong> ${user.pincode}</p>
        <p><strong>Address:</strong> ${user.address}</p>
    `;

    // Display messages
    const messages = getMessagesByUser(userId);
    displayAdminMessages(messages);
}

function displayAdminMessages(messages) {
    const container = document.getElementById('admin-chat-messages');
    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No messages yet</p>';
        return;
    }

    // Group messages by bike
    const messagesByBike = {};
    messages.forEach(msg => {
        if (!messagesByBike[msg.bikeId]) {
            messagesByBike[msg.bikeId] = [];
        }
        messagesByBike[msg.bikeId].push(msg);
    });

    Object.keys(messagesByBike).forEach((bikeId, index) => {
        const bike = getBikeById(bikeId);
        if (bike) {
            const bikeHeader = document.createElement('div');
            bikeHeader.className = 'bike-header chat-bike-header';
            bikeHeader.innerHTML = `<strong>${bike.name} <span style="font-size: 12px; color: #F59E0B;">(Click to reply)</span></strong>`;
            bikeHeader.addEventListener('click', function() {
                window.selectedBikeId = bikeId;
                document.querySelectorAll('.chat-bike-header').forEach(h => h.classList.remove('selected'));
                this.classList.add('selected');
            });
            bikeHeader.style.cursor = 'pointer';
            container.appendChild(bikeHeader);

            if (index === 0) {
                window.selectedBikeId = bikeId;
                bikeHeader.classList.add('selected');
            }
        }

        messagesByBike[bikeId].forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.sender}`;
            messageDiv.dataset.bikeId = bikeId;

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
    });

    // Auto scroll to bottom
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

let bikeImagesInput = null;
let currentBikeImages = [];
let adminBikeFormMode = 'add';
let adminEditBikeId = null;

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function renderBikeImagePreview(images) {
    const preview = document.getElementById('bike-images-preview');
    if (!preview) return;
    preview.innerHTML = '';
    images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Image preview';
        preview.appendChild(img);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        // Display admin username
        const adminUsernameDisplay = document.getElementById('admin-username-display');
        if (adminUsernameDisplay) {
            adminUsernameDisplay.textContent = `Admin: ${currentUser.username}`;
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.admin-menu-item');
        const tabs = document.querySelectorAll('.admin-tab');

        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabs.forEach(tab => tab.classList.remove('active'));

                this.classList.add('active');
                const tabId = this.dataset.tab;
                document.getElementById(tabId + '-tab').classList.add('active');

                if (tabId === 'chats') {
                    displayUsersList();
                } else if (tabId === 'bikes') {
                    displayAdminBikes();
                }
            });
        });

        // Admin chat
        const adminChatInput = document.getElementById('admin-chat-input');
        const adminSendBtn = document.getElementById('admin-send-message');

        if (adminSendBtn) {
            adminSendBtn.addEventListener('click', function() {
                const text = adminChatInput.value.trim();
                const selectedUserId = window.selectedChatUserId;
                const selectedBikeId = window.selectedBikeId;

                if (!text) {
                    alert('Please type a message');
                    return;
                }

                if (!selectedUserId) {
                    alert('Please select a user first');
                    return;
                }

                if (!selectedBikeId) {
                    alert('Please click on a vehicle name to select which vehicle you are replying to');
                    return;
                }

                sendMessage(selectedUserId, selectedBikeId, text, 'admin');
                adminChatInput.value = '';
                displayAdminMessages(getMessagesByUser(selectedUserId));
                displayUsersList();
            });
        }

        if (adminChatInput) {
            adminChatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    adminSendBtn.click();
                }
            });
        }

        // Bike management
        const addBikeBtn = document.getElementById('add-bike-btn');
        const bikeModal = document.getElementById('bike-modal');
        const closeBikeModal = document.getElementById('close-bike-modal');
        const bikeForm = document.getElementById('bike-form');

        if (closeBikeModal) {
            closeBikeModal.addEventListener('click', function() {
                bikeModal.style.display = 'none';
            });
        }

        bikeImagesInput = document.getElementById('bike-images');
        if (bikeImagesInput) {
            bikeImagesInput.addEventListener('change', function() {
                if (this.files && this.files.length > 0) {
                    const files = Array.from(this.files);
                    Promise.all(files.map(readFileAsDataURL)).then(images => {
                        renderBikeImagePreview(images);
                        currentBikeImages = images;
                    });
                } else {
                    renderBikeImagePreview(currentBikeImages);
                }
            });
        }

        if (bikeForm) {
            bikeForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const bikeData = {
                    name: document.getElementById('bike-name').value,
                    price: parseInt(document.getElementById('bike-price').value),
                    brand: document.getElementById('bike-brand').value,
                    year: parseInt(document.getElementById('bike-year').value),
                    fuel: document.getElementById('bike-fuel').value,
                    km: parseInt(document.getElementById('bike-km').value),
                    owner: parseInt(document.getElementById('bike-owner').value),
                    mileage: parseInt(document.getElementById('bike-mileage').value),
                    insurance: document.getElementById('bike-insurance').value,
                    location: document.getElementById('bike-location').value,
                    images: []
                };

                const selectedFiles = bikeImagesInput ? Array.from(bikeImagesInput.files) : [];
                const imagePromise = selectedFiles.length > 0
                    ? Promise.all(selectedFiles.map(readFileAsDataURL))
                    : Promise.resolve(currentBikeImages);

                imagePromise.then(images => {
                    if (!images || images.length === 0) {
                        alert('Please select at least one image.');
                        return;
                    }

                    bikeData.images = images;

                    if (adminBikeFormMode === 'edit' && adminEditBikeId) {
                        updateBike(adminEditBikeId, bikeData);
                    } else {
                        addBike(bikeData);
                    }

                    bikeModal.style.display = 'none';
                    bikeForm.reset();
                    currentBikeImages = [];
                    adminBikeFormMode = 'add';
                    adminEditBikeId = null;
                    renderBikeImagePreview([]);
                    displayAdminBikes();
                });
            });
        }

        if (addBikeBtn) {
            addBikeBtn.addEventListener('click', function() {
                adminBikeFormMode = 'add';
                adminEditBikeId = null;
                document.getElementById('modal-title').textContent = 'Add New Bike';
                bikeForm.reset();
                currentBikeImages = [];
                renderBikeImagePreview([]);
                bikeModal.style.display = 'flex';
            });
        }

        // Initialize
        displayUsersList();
        displayAdminBikes();
    }
});

function displayAdminBikes() {
    const container = document.getElementById('admin-bike-grid');
    if (!container) return;

    const bikes = getBikes();
    container.innerHTML = '';

    bikes.forEach(bike => {
        const bikeCard = document.createElement('div');
        bikeCard.className = 'bike-card';
        bikeCard.innerHTML = `
            <div class="bike-image" style="background-image: url('${bike.images[0]}')"></div>
            <div class="bike-info">
                <div class="bike-name">${bike.name}</div>
                <div class="bike-price">${formatPrice(bike.price)}</div>
                <div class="bike-details">
                    <span>${bike.year}</span>
                    <span>${bike.location}</span>
                </div>
                <button class="btn-secondary edit-bike" data-id="${bike.id}">Edit</button>
                <button class="btn-secondary delete-bike" data-id="${bike.id}">Delete</button>
            </div>
        `;

        // Edit button
        bikeCard.querySelector('.edit-bike').addEventListener('click', function() {
            editBike(bike.id);
        });

        // Delete button
        bikeCard.querySelector('.delete-bike').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this bike? This will also delete all related messages and data.')) {
                const bikeId = bike.id;
                deleteBike(bikeId);
                displayAdminBikes();
                displayUsersList(); // Refresh users list in case messages were deleted
            }
        });

        container.appendChild(bikeCard);
    });
}

function editBike(bikeId) {
    const bike = getBikeById(bikeId);
    if (!bike) return;

    adminBikeFormMode = 'edit';
    adminEditBikeId = bikeId;

    document.getElementById('modal-title').textContent = 'Edit Bike';
    document.getElementById('bike-name').value = bike.name;
    document.getElementById('bike-price').value = bike.price;
    document.getElementById('bike-brand').value = bike.brand;
    document.getElementById('bike-year').value = bike.year;
    document.getElementById('bike-fuel').value = bike.fuel;
    document.getElementById('bike-km').value = bike.km;
    document.getElementById('bike-owner').value = bike.owner;
    document.getElementById('bike-mileage').value = bike.mileage;
    document.getElementById('bike-insurance').value = bike.insurance;
    document.getElementById('bike-location').value = bike.location;

    currentBikeImages = bike.images;
    renderBikeImagePreview(bike.images);

    document.getElementById('bike-modal').style.display = 'flex';
}

function deleteUser(userId) {
    const users = getUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    setData('users', filteredUsers);
}
