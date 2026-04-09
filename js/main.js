// Main page functionality
document.addEventListener('DOMContentLoaded', function() {
    displayBikes();
    populateFilters();
    updateNotificationCount();
    updateWishlistCount();
    displayIndexNotifications();
    displayWishlist();
});

// Display bikes
function displayBikes(bikes = null) {
    const bikeGrid = document.getElementById('bike-grid');
    if (!bikeGrid) return;

    const bikesToDisplay = bikes || getBikes();
    bikeGrid.innerHTML = '';

    if (bikesToDisplay.length === 0) {
        bikeGrid.innerHTML = '<p style="text-align: center; padding: 40px;">No bikes found matching your criteria.</p>';
        return;
    }

    bikesToDisplay.forEach(bike => {
        const bikeCard = document.createElement('div');
        bikeCard.className = 'bike-card';
        bikeCard.onclick = () => viewBikeDetails(bike.id);

        bikeCard.innerHTML = `
            <div class="bike-image" style="background-image: url('${bike.images[0] || 'images/placeholder.jpg'}')"></div>
            <div class="bike-info">
                <div class="bike-name">${bike.name}</div>
                <div class="bike-price">${formatPrice(bike.price)}</div>
                <div class="bike-details">
                    <span>${bike.year}</span>
                    <span>${bike.location}</span>
                </div>
                <button class="btn-secondary wishlist-btn" onclick="toggleWishlist(event, ${bike.id})">
                    ${isInWishlist(getCurrentUser()?.id, bike.id) ? '❤️' : '🤍'} Wishlist
                </button>
            </div>
        `;

        bikeGrid.appendChild(bikeCard);
    });
}

// Search bikes
function searchBikes() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const bikes = getBikes();
    const filteredBikes = bikes.filter(bike =>
        bike.name.toLowerCase().includes(searchTerm) ||
        bike.brand.toLowerCase().includes(searchTerm) ||
        bike.location.toLowerCase().includes(searchTerm)
    );
    displayBikes(filteredBikes);
}

// Populate filter options
function populateFilters() {
    const bikes = getBikes();
    const brands = [...new Set(bikes.map(bike => bike.brand))];
    const years = [...new Set(bikes.map(bike => bike.year))];
    const locations = [...new Set(bikes.map(bike => bike.location))];

    const brandFilter = document.getElementById('brand-filter');
    const yearFilter = document.getElementById('year-filter');
    const locationFilter = document.getElementById('location-filter');

    if (!brandFilter || !yearFilter || !locationFilter) {
        return;
    }

    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });

    years.sort((a, b) => b - a).forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

// Apply filters
function applyFilters() {
    const brand = document.getElementById('brand-filter').value;
    const minPrice = parseInt(document.getElementById('price-min').value) || 0;
    const maxPrice = parseInt(document.getElementById('price-max').value) || Infinity;
    const year = document.getElementById('year-filter').value;
    const fuel = document.getElementById('fuel-filter').value;
    const location = document.getElementById('location-filter').value;

    const bikes = getBikes();
    const filteredBikes = bikes.filter(bike => {
        return (!brand || bike.brand === brand) &&
               (bike.price >= minPrice && bike.price <= maxPrice) &&
               (!year || bike.year == year) &&
               (!fuel || bike.fuel === fuel) &&
               (!location || bike.location === location);
    });

    displayBikes(filteredBikes);
}

// View bike details
function viewBikeDetails(bikeId) {
    const currentUser = getCurrentUser();
    if (currentUser) {
        addToRecentlyViewed(currentUser.id, bikeId);
    }
    window.location.href = `bike-details.html?id=${bikeId}`;
}

// Toggle wishlist
function toggleWishlist(event, bikeId) {
    event.stopPropagation();
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please login to add to wishlist');
        return;
    }

    if (isInWishlist(currentUser.id, bikeId)) {
        removeFromWishlist(currentUser.id, bikeId);
    } else {
        addToWishlist(currentUser.id, bikeId);
    }
    displayBikes();
    updateWishlistCount();
}

function updateWishlistCount() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'user') return;

    const wishlistItems = getWishlist(currentUser.id);
    const countElements = document.querySelectorAll('#wishlist-count');
    countElements.forEach(element => {
        element.textContent = wishlistItems.length;
        element.style.display = wishlistItems.length > 0 ? 'flex' : 'none';
    });
}

// Update notification count
function updateNotificationCount() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const notifications = getUnreadNotifications(currentUser.id);
    const countElements = document.querySelectorAll('#notification-count');

    countElements.forEach(element => {
        if (notifications.length > 0) {
            element.textContent = notifications.length;
            element.style.display = 'flex';
        } else {
            element.style.display = 'none';
        }
    });
}

function displayWishlist() {
    const currentUser = getCurrentUser();
    const wishlistGrid = document.getElementById('wishlist-grid');
    if (!wishlistGrid) return;

    if (!currentUser || currentUser.role !== 'user') {
        wishlistGrid.innerHTML = '<p class="empty-state">Please login as a user to view your wishlist.</p>';
        return;
    }

    const wishlistItems = getWishlist(currentUser.id);
    if (wishlistItems.length === 0) {
        wishlistGrid.innerHTML = '<p class="empty-state">Your wishlist is empty. Add bikes to your wishlist from the home page.</p>';
        return;
    }

    const bikes = wishlistItems.map(item => getBikeById(item.bikeId)).filter(Boolean);
    wishlistGrid.innerHTML = '';

    bikes.forEach(bike => {
        const card = document.createElement('div');
        card.className = 'wishlist-card';
        card.innerHTML = `
            <div class="wishlist-card-image" style="background-image: url('${bike.images[0] || 'images/placeholder.jpg'}')"></div>
            <div class="wishlist-card-content">
                <div>
                    <h3>${bike.name}</h3>
                    <p class="bike-price">${formatPrice(bike.price)}</p>
                    <p class="wishlist-meta">${bike.brand} • ${bike.year} • ${bike.location}</p>
                </div>
                <div class="wishlist-actions">
                    <button class="btn-secondary" onclick="viewBikeDetails(${bike.id})">View Details</button>
                    <button class="btn-primary" onclick="removeWishlistAndRefresh(${bike.id})">Remove</button>
                </div>
            </div>
        `;
        wishlistGrid.appendChild(card);
    });
}

function removeWishlistAndRefresh(bikeId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    removeFromWishlist(currentUser.id, bikeId);
    displayWishlist();
    const wishlistCounts = document.querySelectorAll('#wishlist-count');
    wishlistCounts.forEach(count => {
        const wishlistItems = getWishlist(currentUser.id);
        count.textContent = wishlistItems.length;
        count.style.display = wishlistItems.length > 0 ? 'flex' : 'none';
    });
}

// Display notifications
function displayNotifications() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const notifications = getNotifications().filter(n => n.userId === currentUser.id);
    const container = document.getElementById('notifications-list');
    if (!container) return;

    container.innerHTML = '';

    if (notifications.length === 0) {
        container.innerHTML = '<p>No notifications yet.</p>';
        return;
    }

    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? '' : 'unread'}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'notification-content';
        contentDiv.innerHTML = `
            <h4>${notification.type === 'message' ? 'New Message' : 'Notification'}</h4>
            <p>${notification.message}</p>
            <small>${formatDate(notification.timestamp)}</small>
        `;

        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '10px';
        actionsDiv.style.alignItems = 'center';

        if (!notification.read) {
            const markReadBtn = document.createElement('button');
            markReadBtn.className = 'mark-read-btn';
            markReadBtn.textContent = 'Mark as Read';
            markReadBtn.addEventListener('click', function() {
                markAsRead(notification.id);
                displayNotifications();
            });
            actionsDiv.appendChild(markReadBtn);
        }

        if (notification.type === 'message') {
            const replyBtn = document.createElement('button');
            replyBtn.className = 'btn-secondary';
            replyBtn.textContent = 'View Chat';
            replyBtn.addEventListener('click', function() {
                showNotificationChat(notification.userId, notification.bikeId, notification.id);
            });
            actionsDiv.appendChild(replyBtn);
        }

        item.appendChild(contentDiv);
        item.appendChild(actionsDiv);
        container.appendChild(item);
    });
}

let currentNotificationChatUserId = null;
let currentNotificationChatBikeId = null;
let currentNotificationChatId = null;

function showNotificationChat(userId, bikeId, notificationId) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.id !== userId) {
        alert('Unable to open this chat. Please login with the correct account.');
        return;
    }

    currentNotificationChatUserId = userId;
    currentNotificationChatBikeId = bikeId;
    currentNotificationChatId = notificationId;

    const section = document.getElementById('notification-chat-section');
    const chatMessages = document.getElementById('notification-chat-messages');
    const chatInput = document.getElementById('notification-chat-input');

    if (!section || !chatMessages || !chatInput) return;

    section.style.display = 'block';
    chatInput.value = '';
    displayNotificationChatMessages();
}

function displayNotificationChatMessages() {
    if (!currentNotificationChatUserId || !currentNotificationChatBikeId) return;
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const messages = getMessagesByUserAndBike(currentUser.id, currentNotificationChatBikeId);
    const container = document.getElementById('notification-chat-messages');
    if (!container) return;

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

    container.scrollTop = container.scrollHeight;
}

function setupNotificationReply() {
    const sendBtn = document.getElementById('notification-chat-send');
    const chatInput = document.getElementById('notification-chat-input');

    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', function() {
            const text = chatInput.value.trim();
            if (!text) return;
            const currentUser = getCurrentUser();
            if (!currentUser || !currentNotificationChatBikeId) return;

            sendMessage(currentUser.id, currentNotificationChatBikeId, text, 'user');
            chatInput.value = '';
            displayNotificationChatMessages();
        });

        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendBtn.click();
            }
        });
    }
}

// Display recent notifications on index page
function displayIndexNotifications() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const notifications = getNotifications().filter(n => n.userId === currentUser.id && !n.read).slice(0, 3); // Show only 3 recent unread
    const container = document.getElementById('index-notifications-list');
    const section = document.getElementById('user-notifications');

    if (!container || !section) return;

    if (notifications.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = 'notification-item unread';

        item.innerHTML = `
            <div class="notification-content">
                <h4>Admin Message</h4>
                <p>${notification.message}</p>
                <small>${formatDate(notification.timestamp)}</small>
            </div>
            <button class="mark-read-btn" onclick="markAsRead('${notification.id}'); displayIndexNotifications(); updateNotificationCount();">Mark as Read</button>
        `;

        container.appendChild(item);
    });
}

// Mark notification as read
function markAsRead(notificationId) {
    markNotificationAsRead(notificationId);
    displayNotifications();
    updateNotificationCount();
}
