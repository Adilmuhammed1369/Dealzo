// Authentication functions
function login(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        setCurrentUser(user);
        return true;
    }
    return false;
}

function register(userData) {
    const users = getUsers();
    const existingUser = users.find(u => u.username === userData.username);
    if (existingUser) {
        return false; // User already exists
    }
    addUser(userData);
    return true;
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function showAuthError(message) {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        alert(message);
    }
}

function clearAuthError() {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
}

function showAuthSuccess(message) {
    const successDiv = document.getElementById('auth-success');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
}

function clearAuthSuccess() {
    const successDiv = document.getElementById('auth-success');
    if (successDiv) {
        successDiv.textContent = '';
        successDiv.style.display = 'none';
    }
}

// DOM manipulation for auth
document.addEventListener('DOMContentLoaded', function() {
    // Check for success message
    const successMessage = localStorage.getItem('registerSuccess');
    if (successMessage) {
        showAuthSuccess(successMessage);
        localStorage.removeItem('registerSuccess');
    }

    const currentUser = getCurrentUser();
    const loginLinks = document.querySelectorAll('#login-link');
    const registerLinks = document.querySelectorAll('#register-link');
    const guestLinks = document.querySelectorAll('#guest-link');
    const adminLinks = document.querySelectorAll('#admin-link');
    const notificationIcons = document.querySelectorAll('#notification-icon');
    const notificationCounts = document.querySelectorAll('#notification-count');
    const wishlistIcons = document.querySelectorAll('#wishlist-icon');
    const wishlistCounts = document.querySelectorAll('#wishlist-count');
    const userInfos = document.querySelectorAll('#user-info');
    const usernameDisplays = document.querySelectorAll('#username-display');
    const logoutLinks = document.querySelectorAll('#logout-link');

    if (currentUser) {
        loginLinks.forEach(link => link.style.display = 'none');
        registerLinks.forEach(link => link.style.display = 'none');
        guestLinks.forEach(link => link.style.display = 'none');
        
        // Show user info and logout button
        userInfos.forEach(info => {
            info.style.display = 'flex';
        });
        usernameDisplays.forEach(display => {
            display.textContent = `Welcome, ${currentUser.username}`;
        });
        
        // Add logout click listeners
        logoutLinks.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        });
        
        if (currentUser.role === 'admin') {
            adminLinks.forEach(link => link.style.display = 'inline-block');
            wishlistIcons.forEach(icon => icon.style.display = 'none');
        } else if (currentUser.role === 'user') {
            adminLinks.forEach(link => link.style.display = 'none');
            wishlistIcons.forEach(icon => {
                icon.style.display = 'flex';
                icon.onclick = () => window.location.href = 'wishlist.html';
            });
            const wishlistItems = getWishlist(currentUser.id);
            wishlistCounts.forEach(count => {
                count.textContent = wishlistItems.length;
                count.style.display = wishlistItems.length > 0 ? 'flex' : 'none';
            });
        } else {
            adminLinks.forEach(link => link.style.display = 'none');
            wishlistIcons.forEach(icon => icon.style.display = 'none');
        }
        
        // Show and update notification count (including chat messages)
        notificationIcons.forEach(icon => {
            icon.style.display = 'flex';
            icon.onclick = () => window.location.href = 'notifications.html';
        });
        if (typeof updateNotificationCount === 'function') {
            updateNotificationCount();
        }
        if (typeof updateWishlistCount === 'function') {
            updateWishlistCount();
        }
    } else {
        adminLinks.forEach(link => link.style.display = 'none');
        notificationIcons.forEach(icon => icon.style.display = 'none');
        wishlistIcons.forEach(icon => icon.style.display = 'none');
        userInfos.forEach(info => info.style.display = 'none');
        
        // Add handlers for login and register links
        loginLinks.forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                window.location.href = 'index.html';
            };
        });
        registerLinks.forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                window.location.href = 'register.html';
            };
        });
        
        guestLinks.forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                setCurrentUser({ id: 'guest', username: 'Guest', role: 'guest' });
                window.location.href = 'home.html';
            };
        });
    }

    // Login form
    const loginBtn = document.querySelector('#login-form button[type="submit"]');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearAuthError();
            clearAuthSuccess();

            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();

            if (!username || !password) {
                showAuthError('Please enter both username and password.');
                return;
            }

            if (login(username, password)) {
                clearAuthError();
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'home.html';
                }
            } else {
                showAuthError('Invalid username or password. Please check your credentials.');
            }
        });
    }

    // Register form
    const registerBtn = document.querySelector('#register-form button[type="submit"]');
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearAuthError();
            clearAuthSuccess();

            const userData = {
                username: document.getElementById('reg-username').value.trim(),
                password: document.getElementById('reg-password').value.trim(),
                phone: document.getElementById('reg-phone').value.trim(),
                pincode: document.getElementById('reg-pincode').value.trim(),
                address: document.getElementById('reg-address').value.trim(),
                role: 'user'
            };

            if (!userData.username || !userData.password || !userData.phone || !userData.pincode || !userData.address) {
                showAuthError('Please fill in all registration fields.');
                return;
            }

            if (register(userData)) {
                clearAuthError();
                localStorage.setItem('registerSuccess', 'User registered successfully!');
                window.location.href = 'index.html';
            } else {
                showAuthError('Username already exists. Please choose another username.');
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});
