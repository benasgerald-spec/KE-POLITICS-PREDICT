// ========== FRONTEND APPLICATION ==========
const API_BASE = window.location.origin;
let currentUser = null;
let currentToken = localStorage.getItem('token');

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    console.log('Initializing KenyaPolitics Predict...');
    
    try {
        // Load platform stats
        const statsResponse = await fetch(API_BASE + '/api/stats');
        const statsData = await statsResponse.json();
        
        if (!statsData.success) {
            throw new Error('Failed to load platform data');
        }
        
        // Check if user is logged in
        if (currentToken) {
            try {
                const profileResponse = await fetch(API_BASE + '/api/user/profile', {
                    headers: { 'Authorization': 'Bearer ' + currentToken }
                });
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    currentUser = profileData.data.user;
                }
            } catch (authError) {
                console.log('Not logged in or session expired');
                localStorage.removeItem('token');
                currentToken = null;
                currentUser = null;
            }
        }
        
        // Render the application
        renderApp(statsData.data);
        
        // Load initial markets
        loadMarkets();
        
    } catch (error) {
        console.error('Failed to load app:', error);
        showErrorScreen('Service Temporarily Unavailable', 'We\'re experiencing technical difficulties.');
    }
}

function renderApp(stats) {
    const app = document.getElementById('app');
    const isLoggedIn = currentUser !== null;
    
    app.innerHTML = `
        <!-- Navigation -->
        <nav class="bg-white shadow-lg">
            <div class="container mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2 cursor-pointer" onclick="location.reload()">
                        <div class="w-10 h-10 bg-gradient-to-r from-green-600 to-red-600 rounded-lg"></div>
                        <span class="text-2xl font-bold text-gray-800">KenyaPolitics Predict</span>
                    </div>
                    <div class="flex items-center space-x-6">
                        <a href="#markets" class="text-gray-700 hover:text-green-600 font-medium">Markets</a>
                        <a href="#how-it-works" class="text-gray-700 hover:text-green-600 font-medium">How It Works</a>
                        ${isLoggedIn ? `
                            <div class="flex items-center space-x-4">
                                <span class="text-gray-700">
                                    <i class="fas fa-coins text-yellow-500 mr-1"></i>
                                    KSh ${currentUser.balance.toLocaleString()}
                                </span>
                                <div class="relative group">
                                    <button class="flex items-center space-x-2 text-gray-700 hover:text-green-600">
                                        <i class="fas fa-user"></i>
                                        <span>${currentUser.phone}</span>
                                        <i class="fas fa-chevron-down text-xs"></i>
                                    </button>
                                    <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg hidden group-hover:block z-10">
                                        <a href="#profile" class="block px-4 py-2 hover:bg-gray-100" onclick="showProfile()">
                                            <i class="fas fa-user-circle mr-2"></i>My Profile
                                        </a>
                                        <a href="#deposit" class="block px-4 py-2 hover:bg-gray-100" onclick="showDepositModal()">
                                            <i class="fas fa-money-bill-wave mr-2"></i>Deposit
                                        </a>
                                        <a href="#withdraw" class="block px-4 py-2 hover:bg-gray-100" onclick="showWithdrawModal()">
                                            <i class="fas fa-wallet mr-2"></i>Withdraw
                                        </a>
                                        ${currentUser.role === 'admin' ? `
                                            <a href="#admin" class="block px-4 py-2 hover:bg-gray-100 text-purple-600" onclick="showAdminPanel()">
                                                <i class="fas fa-cog mr-2"></i>Admin Panel
                                            </a>
                                        ` : ''}
                                        <button onclick="logout()" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
                                            <i class="fas fa-sign-out-alt mr-2"></i>Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <button onclick="showLoginModal()" class="btn-primary">Login / Register</button>
                        `}
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="gradient-bg text-white py-20">
            <div class="container mx-auto px-4 text-center">
                <h1 class="text-5xl font-bold mb-6">Predict Kenyan Politics</h1>
                <p class="text-xl mb-8 max-w-2xl mx-auto">
                    Trade on election outcomes, cabinet decisions, and political events.
                    Turn your political insight into opportunity.
                </p>
                <div class="flex gap-4 justify-center">
                    ${isLoggedIn ? `
                        <button onclick="loadMarkets()" class="bg-white text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                            <i class="fas fa-chart-line mr-2"></i>Start Trading
                        </button>
                        <button onclick="showDepositModal()" class="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                            <i class="fas fa-plus-circle mr-2"></i>Add Funds
                        </button>
                    ` : `
                        <button onclick="showRegisterModal()" class="bg-white text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                            Get Started Free
                        </button>
                        <button onclick="showLoginModal()" class="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                            Login to Trade
                        </button>
                    `}
                </div>
            </div>
        </section>

        <!-- Platform Stats -->
        <section class="py-12 bg-white">
            <div class="container mx-auto px-4">
                <h2 class="text-3xl font-bold text-center mb-8">Platform Overview</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div class="text-center p-6 bg-gray-50 rounded-xl">
                        <div class="text-3xl font-bold text-green-600">${stats.platform.activeMarkets}</div>
                        <div class="text-gray-600 font-medium">Active Markets</div>
                    </div>
                    <div class="text-center p-6 bg-gray-50 rounded-xl">
                        <div class="text-3xl font-bold text-blue-600">${stats.platform.totalTrades}</div>
                        <div class="text-gray-600 font-medium">Total Trades</div>
                    </div>
                    <div class="text-center p-6 bg-gray-50 rounded-xl">
                        <div class="text-3xl font-bold text-purple-600">KSh ${Math.round(stats.platform.totalVolume).toLocaleString()}</div>
                        <div class="text-gray-600 font-medium">Trading Volume</div>
                    </div>
                    <div class="text-center p-6 bg-gray-50 rounded-xl">
                        <div class="text-3xl font-bold text-orange-600">${stats.platform.totalMarkets}</div>
                        <div class="text-gray-600 font-medium">All Markets</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Recent Markets -->
        <section id="markets" class="py-16 bg-gray-50">
            <div class="container mx-auto px-4">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-bold">Recent Political Markets</h2>
                    <div class="flex space-x-2">
                        <button onclick="loadMarkets('newest')" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                            Newest
                        </button>
                        <button onclick="loadMarkets('volume')" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                            Most Active
                        </button>
                        ${isLoggedIn && currentUser && currentUser.role === 'admin' ? `
                            <button onclick="showCreateMarketModal()" class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                                <i class="fas fa-plus mr-1"></i> New Market
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div id="markets-container" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Markets will be loaded dynamically -->
                    ${stats.recentMarkets.map(market => `
                        <div class="market-card bg-white rounded-xl shadow p-6">
                            <div class="flex justify-between items-start mb-4">
                                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">${market.category}</span>
                                <span class="text-sm text-gray-500">
                                    Ends: ${new Date(market.resolutionDate).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 class="font-bold mb-4 text-lg">${market.question}</h3>
                            
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div class="bg-green-50 rounded-lg p-4">
                                    <div class="text-sm text-green-600">YES</div>
                                    <div class="text-2xl font-bold text-green-700">
                                        ${(market.probability.yesProbability * 100).toFixed(1)}%
                                    </div>
                                    <div class="text-sm text-green-600">
                                        KSh ${market.volumeYes ? market.volumeYes.toLocaleString() : '0'}
                                    </div>
                                </div>
                                <div class="bg-red-50 rounded-lg p-4">
                                    <div class="text-sm text-red-600">NO</div>
                                    <div class="text-2xl font-bold text-red-700">
                                        ${(market.probability.noProbability * 100).toFixed(1)}%
                                    </div>
                                    <div class="text-sm text-red-600">
                                        KSh ${market.volumeNo ? market.volumeNo.toLocaleString() : '0'}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-center py-3 border-t">
                                <div class="text-lg font-bold text-gray-800">
                                    KSh ${market.totalVolume ? market.totalVolume.toLocaleString() : '0'}
                                </div>
                                <div class="text-sm text-gray-500">Total Volume</div>
                            </div>
                            
                            <div class="flex gap-2 mt-4">
                                <button onclick="showTradeModal('${market._id}', 'YES')" 
                                        class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
                                        ${!isLoggedIn ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                    Buy YES
                                </button>
                                <button onclick="showTradeModal('${market._id}', 'NO')" 
                                        class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
                                        ${!isLoggedIn ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                    Buy NO
                                </button>
                            </div>
                            
                            <div class="flex justify-between text-sm text-gray-500 mt-4 pt-3 border-t">
                                <div>
                                    <div>Trades</div>
                                    <div class="font-bold">${market.tradeCount || 0}</div>
                                </div>
                                <button onclick="viewMarketDetails('${market._id}')" 
                                        class="text-blue-600 hover:text-blue-800 font-medium">
                                    Details →
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- How It Works -->
        <section id="how-it-works" class="py-16">
            <div class="container mx-auto px-4">
                <h2 class="text-3xl font-bold text-center mb-12">How It Works</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center p-6">
                        <div class="text-4xl mb-4">📱</div>
                        <h3 class="text-xl font-bold mb-2">1. Register & Verify</h3>
                        <p class="text-gray-600">Sign up with your Kenyan phone number and verify your identity.</p>
                    </div>
                    <div class="text-center p-6">
                        <div class="text-4xl mb-4">💰</div>
                        <h3 class="text-xl font-bold mb-2">2. Deposit with M-Pesa</h3>
                        <p class="text-gray-600">Fund your account instantly using M-Pesa. Secure and trusted.</p>
                    </div>
                    <div class="text-center p-6">
                        <div class="text-4xl mb-4">📈</div>
                        <h3 class="text-xl font-bold mb-2">3. Trade Predictions</h3>
                        <p class="text-gray-600">Buy YES or NO shares on political events. Prices update in real-time.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- API Status Footer -->
        <section class="bg-gray-100 py-8">
            <div class="container mx-auto px-4 text-center">
                <div class="inline-flex items-center bg-white rounded-lg shadow px-6 py-3">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span class="font-medium">API Status: Operational</span>
                    <a href="${API_BASE}/health" class="ml-4 text-blue-500 hover:text-blue-700 text-sm">
                        <i class="fas fa-external-link-alt mr-1"></i>Health Check
                    </a>
                </div>
            </div>
        </section>

        <footer class="bg-gray-800 text-white py-8">
            <div class="container mx-auto px-4 text-center">
                <p>© ${new Date().getFullYear()} KenyaPolitics Predict. All rights reserved.</p>
                <p class="text-gray-400 text-sm mt-2">
                    This platform is for informational purposes only. Trading involves risk.
                    Users must be 18+ and comply with Kenyan regulations.
                </p>
            </div>
        </footer>
    `;
}

// ========== MODAL FUNCTIONS ==========
// These functions are now properly defined and accessible

function showLoginModal() {
    const modals = document.getElementById('modals-container');
    modals.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div class="p-8">
                    <h3 class="text-2xl font-bold mb-6">Login</h3>
                    <div class="space-y-4">
                        <input type="tel" id="login-phone" placeholder="Phone Number" 
                               class="w-full border rounded-lg px-4 py-3" value="0712345678">
                        <input type="password" id="login-password" placeholder="Password" 
                               class="w-full border rounded-lg px-4 py-3" value="password123">
                        <button onclick="performLogin()" class="w-full btn-primary py-3">
                            Login
                        </button>
                        <p class="text-center text-gray-600">
                            Don't have an account? 
                            <button onclick="showRegisterModal()" class="text-blue-600 font-medium ml-1">
                                Register
                            </button>
                        </p>
                    </div>
                    <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showRegisterModal() {
    const modals = document.getElementById('modals-container');
    modals.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div class="p-8">
                    <h3 class="text-2xl font-bold mb-6">Register</h3>
                    <div class="space-y-4">
                        <input type="tel" id="register-phone" placeholder="Phone Number (0712345678)" 
                               class="w-full border rounded-lg px-4 py-3">
                        <input type="text" id="register-mpesaName" placeholder="M-Pesa Name" 
                               class="w-full border rounded-lg px-4 py-3">
                        <input type="password" id="register-password" placeholder="Password (min 6 characters)" 
                               class="w-full border rounded-lg px-4 py-3">
                        <button onclick="performRegister()" class="w-full btn-primary py-3">
                            Create Account
                        </button>
                        <p class="text-center text-gray-600">
                            Already have an account? 
                            <button onclick="showLoginModal()" class="text-blue-600 font-medium ml-1">
                                Login
                            </button>
                        </p>
                    </div>
                    <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function performLogin() {
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(API_BASE + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('token', currentToken);
            closeModal();
            initApp(); // Reload the app
            alert('Login successful!');
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch (error) {
        alert('Login error: ' + error.message);
    }
}

async function performRegister() {
    const phone = document.getElementById('register-phone').value;
    const mpesaName = document.getElementById('register-mpesaName').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch(API_BASE + '/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, mpesaName, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Registration successful! Please login.');
            showLoginModal();
        } else {
            alert('Registration failed: ' + data.error);
        }
    } catch (error) {
        alert('Registration error: ' + error.message);
    }
}

function closeModal() {
    document.getElementById('modals-container').innerHTML = '';
}

function logout() {
    currentUser = null;
    currentToken = null;
    localStorage.removeItem('token');
    initApp();
}

// ========== MARKET FUNCTIONS ==========

async function loadMarkets(sort = 'newest') {
    try {
        const response = await fetch(`${API_BASE}/api/markets?sort=${sort}&limit=6`);
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('markets-container');
            if (container) {
                // Update markets display
            }
        }
    } catch (error) {
        console.error('Failed to load markets:', error);
    }
}

function showTradeModal(marketId, outcome) {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    alert('Trade functionality would open here for ' + outcome);
}

function showDepositModal() {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    alert('Deposit modal would open here');
}

function showWithdrawModal() {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    alert('Withdraw modal would open here');
}

function showProfile() {
    alert('Profile page would open here');
}

function showAdminPanel() {
    alert('Admin panel would open here');
}

function showCreateMarketModal() {
    alert('Create market modal would open here');
}

function viewMarketDetails(marketId) {
    alert('Market details for: ' + marketId);
}

function showErrorScreen(title, message) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container mx-auto px-4 py-16 text-center">
            <div class="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 class="text-2xl font-bold mb-4">${title}</h2>
            <p class="text-gray-600 mb-6">${message}</p>
            <button onclick="location.reload()" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                Retry
            </button>
        </div>
    `;
}

// Make functions globally available (for inline onclick handlers)
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.showTradeModal = showTradeModal;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.logout = logout;
window.closeModal = closeModal;
window.loadMarkets = loadMarkets;
window.viewMarketDetails = viewMarketDetails;
window.showProfile = showProfile;
window.showAdminPanel = showAdminPanel;
window.showCreateMarketModal = showCreateMarketModal;
