// ===========================
// ADMIN - USERS & SEGMENTS MANAGEMENT
// This file extends the admin panel with user management features
// ===========================

import { auth } from '../firebase-config.js';
import { showNotification, navigateTo } from './admin.js';

const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://chordevacave-backend.onrender.com/api';

let currentUserData = null;

// ===========================
// LOAD USERS
// ===========================

async function loadUsers() {
    try {
        const roleFilter = document.getElementById('userRoleFilter').value;
        const optInFilter = document.getElementById('userOptInFilter').value;
        const searchTerm = document.getElementById('userSearch').value;

        // Build query params
        const params = new URLSearchParams();
        if (roleFilter !== 'all') params.append('role', roleFilter);
        if (optInFilter === 'email') params.append('emailOptIn', 'true');
        if (optInFilter === 'sms') params.append('smsOptIn', 'true');
        if (searchTerm) params.append('search', searchTerm);

        // Get auth token
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const response = await fetch(`${API_URL}/admin/users?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const data = await response.json();
        renderUsersTable(data.users);

    } catch (error) {
        console.error('Load users error:', error);
        showNotification('Failed to load users', 'error');
    }
}

function renderUsersTable(users) {
    const tableHTML = `
        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Tags</th>
                        <th>LTV</th>
                        <th>Last Login</th>
                        <th>Marketing</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.displayName || user.firstName || '-'}</td>
                            <td>${user.email}</td>
                            <td><span class="table-badge badge-${user.role}">${user.role}</span></td>
                            <td>
                                <div class="tags-list">
                                    ${(user.tags || []).slice(0, 3).map(tag => `
                                        <span class="tag-badge">${tag}</span>
                                    `).join('')}
                                    ${user.tags && user.tags.length > 3 ? `<span class="tag-badge">+${user.tags.length - 3}</span>` : ''}
                                </div>
                            </td>
                            <td>$${(user.lifetimeValue || 0).toFixed(2)}</td>
                            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</td>
                            <td>
                                ${user.emailOptIn ? '<span class="badge-mini badge-success">📧</span>' : ''}
                                ${user.smsOptIn ? '<span class="badge-mini badge-success">📱</span>' : ''}
                            </td>
                            <td>
                                <button class="btn-icon" onclick="viewUser('${user.id}')" title="View Details">
                                    👁️
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ${users.length === 0 ? '<p class="text-center text-muted">No users found</p>' : ''}
    `;

    document.getElementById('usersTable').innerHTML = tableHTML;
}

// ===========================
// VIEW USER DETAILS
// ===========================

async function viewUser(userId) {
    try {
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load user details');
        }

        const data = await response.json();
        currentUserData = data.user;

        renderUserModal(data.user);

        // Show the user modal
        const userModal = document.getElementById('userModal');
        userModal.classList.add('active');

    } catch (error) {
        console.error('View user error:', error);
        showNotification('Failed to load user details', 'error');
    }
}

function renderUserModal(user) {
    const modalHTML = `
        <div class="user-details-grid">
            <div class="user-detail-section">
                <h3>Basic Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${user.displayName || user.firstName + ' ' + user.lastName || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${user.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Auth Provider:</span>
                    <span class="detail-value">${user.authProvider || 'email'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Member Since:</span>
                    <span class="detail-value">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Last Login:</span>
                    <span class="detail-value">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</span>
                </div>
            </div>

            <div class="user-detail-section">
                <h3>Role & Permissions</h3>
                <div class="form-group">
                    <label for="userRole">Role</label>
                    <select id="userRole" class="form-select">
                        <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                        <option value="contributor" ${user.role === 'contributor' ? 'selected' : ''}>Contributor</option>
                        <option value="affiliate" ${user.role === 'affiliate' ? 'selected' : ''}>Affiliate</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
            </div>

            <div class="user-detail-section">
                <h3>Profile</h3>
                <div class="detail-row">
                    <span class="detail-label">Experience Level:</span>
                    <span class="detail-value">${user.experienceLevel || 'Not set'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${user.location?.city || ''} ${user.location?.country || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Birthday:</span>
                    <span class="detail-value">${user.birthday ? `${user.birthday.month}/${user.birthday.day}` : 'Not set'}</span>
                </div>
            </div>

            <div class="user-detail-section">
                <h3>Interests</h3>
                <div class="detail-row">
                    <span class="detail-label">Traditions:</span>
                    <div class="detail-value">
                        ${(user.traditions || []).map(t => `<span class="tag-badge">${t}</span>`).join(' ') || '-'}
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Product Types:</span>
                    <div class="detail-value">
                        ${(user.favoriteProductTypes || []).map(p => `<span class="tag-badge">${p}</span>`).join(' ') || '-'}
                    </div>
                </div>
            </div>

            <div class="user-detail-section">
                <h3>Marketing Preferences</h3>
                <div class="detail-row">
                    <span class="detail-label">Email Opt-in:</span>
                    <span class="detail-value">${user.emailOptIn ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">SMS Opt-in:</span>
                    <span class="detail-value">${user.smsOptIn ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tracking Opt-in:</span>
                    <span class="detail-value">${user.trackingOptIn ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email Frequency:</span>
                    <span class="detail-value">${user.emailFrequency || 'weekly'}</span>
                </div>
            </div>

            <div class="user-detail-section">
                <h3>Behavioral Data</h3>
                <div class="detail-row">
                    <span class="detail-label">Lifetime Value:</span>
                    <span class="detail-value">$${(user.lifetimeValue || 0).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Cart Abandoned:</span>
                    <span class="detail-value">${user.cartAbandonedCount || 0} times</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Last Purchase:</span>
                    <span class="detail-value">${user.lastPurchase ? new Date(user.lastPurchase).toLocaleDateString() : 'Never'}</span>
                </div>
            </div>

            <div class="user-detail-section full-width">
                <h3>Tags</h3>
                <div class="tags-display">
                    ${(user.tags || []).map(tag => `<span class="tag-badge">${tag}</span>`).join(' ') || 'No tags'}
                </div>
                <div class="tags-actions">
                    <input type="text" id="newTag" class="form-input" placeholder="Add tag (e.g., interest:tarot)">
                    <button onclick="addUserTag()" class="btn btn-sm btn-primary">Add Tag</button>
                </div>
            </div>
        </div>

        <style>
            .user-details-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 2rem;
            }

            .user-detail-section {
                background: rgba(255, 255, 255, 0.02);
                padding: 1.5rem;
                border-radius: 10px;
                border: 1px solid rgba(255, 105, 180, 0.2);
            }

            .user-detail-section.full-width {
                grid-column: span 2;
            }

            .user-detail-section h3 {
                margin-bottom: 1rem;
                color: #FF1493;
                font-size: 1.1rem;
            }

            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .detail-row:last-child {
                border-bottom: none;
            }

            .detail-label {
                font-weight: 600;
                color: #9ca3af;
            }

            .detail-value {
                color: #f3f4f6;
                text-align: right;
            }

            .tags-display {
                margin-bottom: 1rem;
            }

            .tags-actions {
                display: flex;
                gap: 0.5rem;
            }

            .tags-actions input {
                flex: 1;
            }

            .tag-badge {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                background: rgba(255, 105, 180, 0.2);
                color: #FF69B4;
                border-radius: 4px;
                font-size: 0.75rem;
                margin: 0.25rem;
            }

            .badge-mini {
                padding: 0.25rem 0.35rem;
                font-size: 0.7rem;
                border-radius: 3px;
            }

            .badge-success {
                background: rgba(34, 197, 94, 0.2);
                color: #86efac;
            }
        </style>
    `;

    document.getElementById('userDetails').innerHTML = modalHTML;
}

// ===========================
// UPDATE USER ROLE
// ===========================

async function saveUserChanges() {
    if (!currentUserData) return;

    try {
        const newRole = document.getElementById('userRole').value;
        const userId = currentUserData.id;

        const user = auth.currentUser;
        const token = await user.getIdToken();

        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) {
            throw new Error('Failed to update user role');
        }

        showNotification('User role updated successfully', 'success');

        // Close the user modal
        const userModal = document.getElementById('userModal');
        userModal.classList.remove('active');

        loadUsers();

    } catch (error) {
        console.error('Save user error:', error);
        showNotification(error.message, 'error');
    }
}

// ===========================
// ADD USER TAG
// ===========================

async function addUserTag() {
    if (!currentUserData) return;

    const newTag = document.getElementById('newTag').value.trim();
    if (!newTag) return;

    try {
        const userId = currentUserData.id;
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const response = await fetch(`${API_URL}/admin/users/${userId}/tags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                tags: [newTag],
                action: 'add'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to add tag');
        }

        showNotification('Tag added successfully', 'success');
        document.getElementById('newTag').value = '';

        // Reload user details
        viewUser(userId);

    } catch (error) {
        console.error('Add tag error:', error);
        showNotification(error.message, 'error');
    }
}

// ===========================
// LOAD SEGMENTS
// ===========================

async function loadSegments() {
    try {
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const response = await fetch(`${API_URL}/admin/segments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load segments');
        }

        const data = await response.json();
        renderSegmentsGrid(data.segments, data.totalUsers);

    } catch (error) {
        console.error('Load segments error:', error);
        showNotification('Failed to load segments', 'error');
    }
}

function renderSegmentsGrid(segments, totalUsers) {
    const segmentHTML = Object.keys(segments).map(key => {
        const segment = segments[key];
        const percentage = totalUsers > 0 ? ((segment.count / totalUsers) * 100).toFixed(1) : 0;

        return `
            <div class="segment-card">
                <div class="segment-header">
                    <h3>${segment.name}</h3>
                    <span class="segment-count">${segment.count} users</span>
                </div>
                <p class="segment-description">${segment.description}</p>
                <div class="segment-progress">
                    <div class="segment-progress-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="segment-stats">
                    <span>${percentage}% of total users</span>
                </div>
                <div class="segment-actions">
                    <button onclick="viewSegmentUsers('${key}')" class="btn btn-sm btn-secondary">
                        View Users
                    </button>
                    <button onclick="exportSegment('${key}')" class="btn btn-sm btn-primary">
                        📥 Export Emails
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const gridHTML = `
        <style>
            .segments-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1.5rem;
            }

            .segment-card {
                background: linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(255, 20, 147, 0.05));
                border: 2px solid rgba(255, 105, 180, 0.3);
                border-radius: 15px;
                padding: 1.5rem;
                transition: all 0.3s;
            }

            .segment-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(255, 105, 180, 0.3);
            }

            .segment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;
            }

            .segment-header h3 {
                font-size: 1.2rem;
                color: #f3f4f6;
                margin: 0;
            }

            .segment-count {
                background: rgba(255, 105, 180, 0.3);
                color: #FF69B4;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
            }

            .segment-description {
                color: #9ca3af;
                font-size: 0.9rem;
                margin-bottom: 1rem;
            }

            .segment-progress {
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }

            .segment-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #FF1493, #FF69B4);
                transition: width 0.3s;
            }

            .segment-stats {
                font-size: 0.85rem;
                color: #9ca3af;
                margin-bottom: 1rem;
            }

            .segment-actions {
                display: flex;
                gap: 0.5rem;
            }

            .segment-actions button {
                flex: 1;
            }
        </style>
        ${segmentHTML}
    `;

    document.getElementById('segmentsGrid').innerHTML = gridHTML;
}

// ===========================
// VIEW SEGMENT USERS
// ===========================

function viewSegmentUsers(segmentKey) {
    // Redirect to users page with filter
    navigateTo('users');
    // This would need more complex filtering logic
    showNotification(`Viewing ${segmentKey} users`, 'info');
}

// ===========================
// EXPORT SEGMENT
// ===========================

async function exportSegment(segmentKey) {
    try {
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const response = await fetch(`${API_URL}/admin/segments/${segmentKey}/export`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to export segment');
        }

        // Download CSV
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${segmentKey}_emails.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('Segment exported successfully', 'success');

    } catch (error) {
        console.error('Export segment error:', error);
        showNotification('Failed to export segment', 'error');
    }
}

// ===========================
// EVENT LISTENERS
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // User filters
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userOptInFilter = document.getElementById('userOptInFilter');
    const userSearch = document.getElementById('userSearch');

    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', loadUsers);
    }
    if (userOptInFilter) {
        userOptInFilter.addEventListener('change', loadUsers);
    }
    if (userSearch) {
        // Debounce search
        let searchTimeout;
        userSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(loadUsers, 500);
        });
    }

    // Save user changes button
    const saveUserBtn = document.getElementById('saveUserBtn');
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveUserChanges);
    }

    // User modal close buttons
    const userModal = document.getElementById('userModal');
    if (userModal) {
        const closeButtons = userModal.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                userModal.classList.remove('active');
            });
        });

        // Close modal when clicking outside
        userModal.addEventListener('click', (e) => {
            if (e.target === userModal) {
                userModal.classList.remove('active');
            }
        });
    }
});

// Make functions globally available
window.loadUsers = loadUsers;
window.loadSegments = loadSegments;
window.viewUser = viewUser;
window.saveUserChanges = saveUserChanges;
window.addUserTag = addUserTag;
window.viewSegmentUsers = viewSegmentUsers;
window.exportSegment = exportSegment;
