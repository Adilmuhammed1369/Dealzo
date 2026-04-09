// Data management functions
function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Initialize sample data
function initializeData() {
    // Initialize bikes if not exists
    if (!localStorage.getItem('bikes')) {
        const sampleBikes = [
            {
                id: 1,
                name: 'Royal Enfield Classic 350',
                price: 185000,
                brand: 'Royal Enfield',
                year: 2022,
                fuel: 'Petrol',
                km: 15000,
                owner: 1,
                mileage: 35,
                insurance: 'Valid till 2025',
                location: 'Mumbai',
                images: [
                    'images/royal-enfield-classic-350.jpg',
                    'images/royal-enfield-classic-350-2.jpg'
                ]
            },
            {
                id: 2,
                name: 'Honda CB Shine',
                price: 85000,
                brand: 'Honda',
                year: 2021,
                fuel: 'Petrol',
                km: 25000,
                owner: 2,
                mileage: 65,
                insurance: 'Valid till 2024',
                location: 'Delhi',
                images: [
                    'images/honda-cb-shine.jpg',
                    'images/honda-cb-shine-2.jpg'
                ]
            },
            {
                id: 3,
                name: 'Yamaha MT-15',
                price: 155000,
                brand: 'Yamaha',
                year: 2023,
                fuel: 'Petrol',
                km: 8000,
                owner: 1,
                mileage: 48,
                insurance: 'Valid till 2026',
                location: 'Bangalore',
                images: [
                    'images/yamaha-mt15.jpg',
                    'images/yamaha-mt15-2.jpg'
                ]
            }
        ];
        setData('bikes', sampleBikes);
    }

    // Initialize admin user if not exists
    if (!localStorage.getItem('users')) {
        const adminUser = {
            id: 'admin',
            username: 'admin',
            password: 'admin123',
            phone: '1234567890',
            pincode: '123456',
            address: 'Admin Office',
            role: 'admin'
        };
        setData('users', [adminUser]);
    }

    // Initialize messages if not exists
    if (!localStorage.getItem('messages')) {
        setData('messages', []);
    }

    // Initialize notifications if not exists
    if (!localStorage.getItem('notifications')) {
        setData('notifications', []);
    }

    // Initialize wishlist if not exists
    if (!localStorage.getItem('wishlist')) {
        setData('wishlist', []);
    }

    // Initialize recently viewed if not exists
    if (!localStorage.getItem('recentlyViewed')) {
        setData('recentlyViewed', []);
    }
}

// Bike management functions
function getBikes() {
    return getData('bikes');
}

function getBikeById(id) {
    const bikes = getBikes();
    return bikes.find(bike => bike.id == id);
}

function addBike(bike) {
    const bikes = getBikes();
    bike.id = Date.now(); // Simple ID generation
    bikes.push(bike);
    setData('bikes', bikes);
}

function updateBike(id, updatedBike) {
    const bikes = getBikes();
    const index = bikes.findIndex(bike => bike.id == id);
    if (index !== -1) {
        bikes[index] = { ...bikes[index], ...updatedBike };
        setData('bikes', bikes);
    }
}

function deleteBike(id) {
    const bikes = getBikes();
    const filteredBikes = bikes.filter(bike => bike.id != id);
    setData('bikes', filteredBikes);
}

// User management functions
function getUsers() {
    return getData('users');
}

function getUserByUsername(username) {
    const users = getUsers();
    return users.find(user => user.username === username);
}

function addUser(user) {
    const users = getUsers();
    user.id = Date.now().toString();
    users.push(user);
    setData('users', users);
}

// Message management functions
function getMessages() {
    return getData('messages');
}

function addMessage(message) {
    const messages = getMessages();
    message.id = Date.now().toString();
    message.timestamp = new Date().toISOString();
    messages.push(message);
    setData('messages', messages);
}

function getMessagesByUserAndBike(userId, bikeId) {
    const messages = getMessages();
    return messages.filter(msg => msg.userId === userId && msg.bikeId == bikeId);
}

function getMessagesByUser(userId) {
    const messages = getMessages();
    return messages.filter(msg => msg.userId === userId);
}

// Notification management functions
function getNotifications() {
    return getData('notifications');
}

function addNotification(notification) {
    const notifications = getNotifications();
    notification.id = Date.now().toString();
    notification.timestamp = new Date().toISOString();
    notification.read = false;
    notifications.push(notification);
    setData('notifications', notifications);
}

function markNotificationAsRead(id) {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        setData('notifications', notifications);
    }
}

function getUnreadNotifications(userId) {
    const notifications = getNotifications();
    return notifications.filter(n => n.userId === userId && !n.read);
}

// Wishlist management functions
function getWishlist(userId) {
    const wishlist = getData('wishlist');
    return wishlist.filter(item => item.userId === userId);
}

function addToWishlist(userId, bikeId) {
    const wishlist = getData('wishlist');
    const exists = wishlist.find(item => item.userId === userId && item.bikeId == bikeId);
    if (!exists) {
        wishlist.push({ userId, bikeId, timestamp: new Date().toISOString() });
        setData('wishlist', wishlist);
    }
}

function removeFromWishlist(userId, bikeId) {
    const wishlist = getData('wishlist');
    const filtered = wishlist.filter(item => !(item.userId === userId && item.bikeId == bikeId));
    setData('wishlist', filtered);
}

function isInWishlist(userId, bikeId) {
    const wishlist = getWishlist(userId);
    return wishlist.some(item => item.bikeId == bikeId);
}

// Recently viewed management functions
function addToRecentlyViewed(userId, bikeId) {
    const recentlyViewed = getData('recentlyViewed');
    const filtered = recentlyViewed.filter(item => !(item.userId === userId && item.bikeId == bikeId));
    filtered.unshift({ userId, bikeId, timestamp: new Date().toISOString() });
    // Keep only last 5
    const limited = filtered.slice(0, 5);
    setData('recentlyViewed', limited);
}

function getRecentlyViewed(userId) {
    const recentlyViewed = getData('recentlyViewed');
    return recentlyViewed.filter(item => item.userId === userId);
}

// Utility functions
function formatPrice(price) {
    return '₹' + price.toLocaleString('en-IN');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Initialize data on load
initializeData();