// Real-Time Chat Logic for Onipaba Music

let currentChannel = 'general';
let unsubscribeMessages = null;
let unsubscribeTyping = null;
let isAdmin = false;
let allChannels = {};
let typingTimeout = null;
let replyToId = null;
let editingMessageId = null;
let mediaRecorder = null;
let audioChunks = [];

// Expose these to global scope because they are called via onclick in generated HTML
window.deleteMessage = (id) => deleteMessage(id);
window.editMessage = (id) => editMessage(id);
window.initReply = (id) => initReply(id);
window.cancelReply = () => cancelReply();
window.toggleReaction = (id, emoji) => toggleReaction(id, emoji);
window.showEmojiPicker = (event, id) => showEmojiPicker(event, id);
window.switchChannel = (id, el) => switchChannel(id, el);
window.openLightbox = (url) => openLightbox(url);
window.closeLightbox = () => closeLightbox();

// Initialize Chat
document.addEventListener('DOMContentLoaded', () => {
    // Check Admin status & Update User UI
    // Note: This will be unified with AuthManager later, but for now we ensure it works
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    isAdmin = userData && (userData.role === 'admin' || userData.role === 'superadmin');

                    // Update personal avatar in sidebar
                    const userName = userData.name || user.email;
                    const avatarEl = document.getElementById('currentUserAvatar');
                    if (avatarEl) {
                        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=D4AF37&color=fff`;
                    }
                }
            } catch (err) {
                console.error('[Chat] Auth update error:', err);
            }
        }
    });

    // Mobile Sidebar Toggle Support
    window.toggleChatSidebar = function () {
        const sidebar = document.querySelector('.wa-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active-mobile');
        }
    };

    // Close sidebar on channel selection (mobile)
    document.getElementById('channelList').addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && (e.target.closest('.wa-chat-item') || e.target.closest('.wa-avatar'))) {
            const sidebar = document.querySelector('.wa-sidebar');
            if (sidebar) sidebar.classList.remove('active-mobile');
        }
    });

    // Listen for Channels
    listenForChannels();

    // Setup Message Submission
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }

    // Setup Attachment Button & Menu
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileAttachment');
    const attachmentMenu = document.getElementById('attachmentMenu');

    if (attachBtn && fileInput && attachmentMenu) {
        // Toggle Menu
        attachBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            attachmentMenu.classList.toggle('active');
        });

        // Close menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!attachmentMenu.contains(e.target) && e.target !== attachBtn) {
                attachmentMenu.classList.remove('active');
            }
        });

        // Handle Menu Options
        document.querySelectorAll('.attachment-option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;

                // Set accept attribute based on type
                if (type === 'media') {
                    fileInput.accept = "image/*,video/*";
                } else if (type === 'audio') {
                    fileInput.accept = "audio/*";
                } else if (type === 'document') {
                    fileInput.accept = ".pdf,.doc,.docx,.txt,.xls,.xlsx";
                }

                fileInput.click();
                attachmentMenu.classList.remove('active');
            });
        });

        fileInput.addEventListener('change', handleFileUpload);
    }

    // Setup Emoji Button & Picker
    const emojiBtn = document.getElementById('emojiBtn');
    const emojiMenu = document.getElementById('emojiPickerMenu');

    if (emojiBtn && emojiMenu) {
        // Toggle Picker
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiMenu.classList.toggle('active');

            // Populate if empty (first open)
            if (emojiMenu.innerHTML === '') {
                const emojis = [
                    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
                    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
                    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
                    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
                    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
                    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
                    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
                    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍',
                    '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌',
                    '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖',
                    '👋', '🤙', '💪', '🙏', '✍️', '💅', '🤳', '💃', '🕺', '👯',
                    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
                    '🎵', '🎶', '🔥', '✨', '⭐', '🌟', '🌈', '☀️', '🌙', '☁️'
                ];

                emojis.forEach(emoji => {
                    const span = document.createElement('span');
                    span.className = 'emoji-item';
                    span.textContent = emoji;
                    span.onclick = () => {
                        const input = document.getElementById('messageInput');
                        input.value += emoji;
                        input.focus();
                    };
                    emojiMenu.appendChild(span);
                });
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!emojiMenu.contains(e.target) && e.target !== emojiBtn) {
                emojiMenu.classList.remove('active');
            }
        });
    }

    // Typing Indicator Trigger
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', handleTyping);
    }
    // Mic Button placeholder
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            uiManager.showAlert("Voice notes are coming soon to Onipaba Music!", 'info');
        });
    }

    // Chat Search Functionality
    const searchBtn = document.getElementById('chatSearchBtn');
    const searchBar = document.getElementById('chatSearchBar');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchInput = document.getElementById('chatSearchInput');
    const searchUpBtn = document.getElementById('searchUpBtn');
    const searchDownBtn = document.getElementById('searchDownBtn');

    let searchMatches = [];
    let currentMatchIndex = -1;

    if (searchBtn && searchBar) {
        // Open Search
        searchBtn.addEventListener('click', () => {
            searchBar.classList.add('active');
            searchInput.focus();
        });

        // Close Search
        closeSearchBtn.addEventListener('click', () => {
            searchBar.classList.remove('active');
            searchInput.value = '';
            clearHighlights();
        });

        // Search Input Handler
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            clearHighlights();

            if (query.length < 2) return;

            const messages = document.querySelectorAll('.wa-message .wa-msg-content p');
            searchMatches = [];
            currentMatchIndex = -1;

            messages.forEach(msg => {
                const text = msg.textContent.toLowerCase();
                if (text.includes(query)) {
                    // Highlight logic
                    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
                    msg.innerHTML = msg.textContent.replace(regex, '<span class="search-highlight">$1</span>');

                    // Store reference to the message element (parent of p is .wa-msg-content, parent of that is .wa-message)
                    searchMatches.push(msg.closest('.wa-message'));
                }
            });

            if (searchMatches.length > 0) {
                currentMatchIndex = searchMatches.length - 1; // Start at most recent
                scrollToMatch(currentMatchIndex);
            }
        });

        // Navigation
        searchUpBtn.addEventListener('click', () => {
            if (searchMatches.length === 0) return;
            currentMatchIndex--;
            if (currentMatchIndex < 0) currentMatchIndex = searchMatches.length - 1;
            scrollToMatch(currentMatchIndex);
        });

        searchDownBtn.addEventListener('click', () => {
            if (searchMatches.length === 0) return;
            currentMatchIndex++;
            if (currentMatchIndex >= searchMatches.length) currentMatchIndex = 0;
            scrollToMatch(currentMatchIndex);
        });
    }

    function clearHighlights() {
        document.querySelectorAll('.search-highlight').forEach(span => {
            const parent = span.parentNode;
            parent.innerHTML = parent.textContent; // Remove span but keep text
        });
        searchMatches = [];
        currentMatchIndex = -1;
    }

    function scrollToMatch(index) {
        if (index >= 0 && index < searchMatches.length) {
            const el = searchMatches[index];
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Briefly flash the message to indicate selection
            el.style.transition = 'background 0.3s';
            el.style.background = 'rgba(212, 175, 55, 0.2)';
            setTimeout(() => {
                el.style.background = '';
            }, 1000);
        }
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Chat Options Menu Functionality
    const optionsBtn = document.getElementById('chatOptionsBtn');
    const optionsMenu = document.getElementById('chatOptionsMenu');
    const menuInfo = document.getElementById('menuInfo');
    const menuRefresh = document.getElementById('menuRefresh');
    const menuClear = document.getElementById('menuClear');

    if (optionsBtn && optionsMenu) {
        // Toggle Menu
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsMenu.classList.toggle('active');
        });

        // Close Menu on Click Outside
        document.addEventListener('click', (e) => {
            if (!optionsMenu.contains(e.target) && e.target !== optionsBtn) {
                optionsMenu.classList.remove('active');
            }
        });

        // Action: Channel Info
        if (menuInfo) {
            menuInfo.addEventListener('click', () => {
                const channelName = document.getElementById('activeChannelName').textContent;
                const channelStatus = document.getElementById('activeChannelStatus').textContent;
                // Simple alert for now, could be a modal later
                uiManager.showAlert(`Channel: ${channelName}\nTopic: ${channelStatus || 'General Discussion'}`, 'info');
                optionsMenu.classList.remove('active');
            });
        }

        // Action: Refresh Chat
        if (menuRefresh) {
            menuRefresh.addEventListener('click', () => {
                optionsMenu.classList.remove('active');
                if (currentChannel) {
                    // Show refreshing state
                    document.getElementById('chatMessages').innerHTML = '<div class="wa-system-message"><span>Refreshing...</span></div>';
                    setTimeout(() => {
                        listenForMessages(currentChannel);
                    }, 500);
                }
            });
        }

        // Action: Clear View (Local)
        if (menuClear) {
            menuClear.addEventListener('click', () => {
                uiManager.showConfirm('This will clear messages from your view only. They will reload next time you refresh. Continue?', () => {
                    document.getElementById('chatMessages').innerHTML = '<div class="wa-system-message"><span>Messages cleared from view.</span></div>';
                });
                optionsMenu.classList.remove('active');
            });
        }
    }

    // Sidebar Features
    const sidebarMenuBtn = document.getElementById('sidebarMenuBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarProfile = document.getElementById('sidebarProfile');
    const sidebarSettings = document.getElementById('sidebarSettings');
    const sidebarLogout = document.getElementById('sidebarLogout');
    const sidebarNewChatBtn = document.getElementById('sidebarNewChatBtn');
    const channelSearchInput = document.getElementById('channelSearchInput');

    if (sidebarMenuBtn && sidebarMenu) {
        // Toggle Sidebar Menu
        sidebarMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarMenu.classList.toggle('active');
        });

        // Close on Click Outside
        document.addEventListener('click', (e) => {
            if (!sidebarMenu.contains(e.target) && e.target !== sidebarMenuBtn) {
                sidebarMenu.classList.remove('active');
            }
        });

        // Action: Profile
        if (sidebarProfile) {
            sidebarProfile.addEventListener('click', () => {
                // Redirect to profile or show simple alert for now if profile.html doesn't exist/work yet
                window.location.href = 'index.html#profile'; // Assuming profile section exists or user wants to go home
                // Based on user request history, user has a profile page probably? or just an anchor.
                // Let's check navigation: <a href="index.html">Home</a>... <a href="login.html">Login</a>
                // There is no explicit profile page in the nav provided in chat.html view.
                // Using a safe fallback.
                uiManager.showAlert('Profile feature coming soon!', 'info');
            });
        }

        // Action: Settings
        if (sidebarSettings) {
            sidebarSettings.addEventListener('click', () => {
                uiManager.showAlert('Settings coming soon!', 'info');
            });
        }

        // Action: Logout
        if (sidebarLogout) {
            sidebarLogout.addEventListener('click', () => {
                uiManager.showConfirm('Are you sure you want to log out?', () => {
                    firebase.auth().signOut().then(() => {
                        window.location.href = 'login.html';
                    }).catch((error) => {
                        console.error('Logout error:', error);
                    });
                });
            });
        }
    }

    // Sidebar New Chat Button
    if (sidebarNewChatBtn && channelSearchInput) {
        sidebarNewChatBtn.addEventListener('click', () => {
            channelSearchInput.focus();
        });
    }

    // Sidebar Channel Search
    if (channelSearchInput) {
        channelSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const channels = document.querySelectorAll('.wa-chat-item');

            channels.forEach(channel => {
                // Determine channel name from active or dataset, but safer to check internal structure
                // Existing structure: .wa-chat-info -> .wa-chat-name
                const nameEl = channel.querySelector('.wa-chat-name');
                if (nameEl) {
                    const name = nameEl.textContent.toLowerCase();
                    if (name.includes(query)) {
                        channel.style.display = 'flex';
                    } else {
                        channel.style.display = 'none';
                    }
                }
            });
        });
    }
});

// Listen for Channels
function listenForChannels() {
    const list = document.getElementById('channelList');

    firebase.firestore().collection('channels').orderBy('name', 'asc').onSnapshot((snapshot) => {
        list.innerHTML = '';
        allChannels = {}; // Reset

        let foundCurrent = false;

        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            allChannels[id] = data;

            const div = document.createElement('div');
            div.className = 'wa-chat-item';
            div.dataset.id = id;
            if (id === currentChannel) {
                div.classList.add('active');
                foundCurrent = true;
                updateHeader();
                // Ensure we are listening to messages if not already
                if (!unsubscribeMessages) {
                    listenForMessages(currentChannel);
                }
            }
            div.onclick = () => switchChannel(id, div);

            const avatarUrl = data.iconUrl || `https://ui-avatars.com/api/?name=%23&background=128C7E&color=fff`;

            div.innerHTML = `
                <div class="wa-avatar">
                    <img src="${avatarUrl}" alt="${data.name}">
                </div>
                <div class="wa-chat-info">
                    <div class="wa-chat-row-top">
                        <span class="wa-chat-name"># ${data.name}</span>
                        <span class="wa-chat-time"></span>
                    </div>
                    <div class="wa-chat-row-bottom">
                        <span class="wa-chat-preview">${data.description || ''}</span>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });

        if (snapshot.empty) {
            list.innerHTML = '<div style="padding: 20px; color: #999;">No channels. Ask an admin to create one!</div>';
        } else if (!foundCurrent) {
            // Default to first available if current gone
            const first = list.querySelector('.wa-chat-item');
            if (first) switchChannel(first.dataset.id, first);
        }
    });
}

// Update Header
function updateHeader() {
    const channel = allChannels[currentChannel];
    const avatarImg = document.getElementById('activeChannelAvatar');

    if (channel) {
        document.getElementById('activeChannelName').textContent = `# ${channel.name}`;
        document.getElementById('activeChannelStatus').textContent = channel.description || '';

        const avatarUrl = channel.iconUrl || `https://ui-avatars.com/api/?name=%23&background=128C7E&color=fff`;
        avatarImg.src = avatarUrl;
        avatarImg.style.opacity = '1';
    } else {
        document.getElementById('activeChannelName').textContent = '';
        document.getElementById('activeChannelStatus').textContent = '';
        avatarImg.style.opacity = '0';
    }
}

// Switch Channel
function switchChannel(channelId, element) {
    if (currentChannel === channelId && unsubscribeMessages) return;

    // UI Updates
    document.querySelectorAll('.wa-chat-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');

    currentChannel = channelId;
    updateHeader();

    // Listen for Messages
    listenForMessages(channelId);

    // Listen for Typing
    listenForTyping(channelId);
}

// Typing Indicator Handler
function handleTyping() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    if (typingTimeout) clearTimeout(typingTimeout);

    // Update typing status in Firestore
    const typingRef = firebase.firestore().collection('channels').doc(currentChannel);
    typingRef.update({
        [`typing.${user.uid}`]: {
            name: document.getElementById('currentUserAvatar').title || user.displayName || 'Someone',
            timestamp: Date.now()
        }
    });

    typingTimeout = setTimeout(() => {
        typingRef.update({
            [`typing.${user.uid}`]: firebase.firestore.FieldValue.delete()
        });
    }, 3000);
}

// Listen for Typing Indicators
function listenForTyping(channelId) {
    if (unsubscribeTyping) unsubscribeTyping();

    const indicatorEl = document.getElementById('typingIndicator');
    if (!indicatorEl) return;

    unsubscribeTyping = firebase.firestore().collection('channels').doc(channelId)
        .onSnapshot((doc) => {
            const data = doc.data();
            const typing = data ? data.typing || {} : {};
            const user = firebase.auth().currentUser;

            const typingNames = Object.entries(typing)
                .filter(([uid, info]) => uid !== (user ? user.uid : '') && (Date.now() - info.timestamp < 5000))
                .map(([uid, info]) => info.name);

            if (typingNames.length > 0) {
                let text = '';
                if (typingNames.length === 1) text = `${typingNames[0]} is typing...`;
                else if (typingNames.length === 2) text = `${typingNames[0]} and ${typingNames[1]} are typing...`;
                else text = 'Several people are typing...';

                indicatorEl.textContent = text;
                indicatorEl.classList.add('active');
            } else {
                indicatorEl.classList.remove('active');
                indicatorEl.textContent = '';
            }
        });
}

// Listen for Messages (Real-time)
function listenForMessages(channelId) {
    if (unsubscribeMessages) unsubscribeMessages();

    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '<div class="wa-system-message"><span>Loading messages...</span></div>';

    unsubscribeMessages = firebase.firestore().collection('chats')
        .doc(channelId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .limitToLast(50)
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = ''; // Clear loading

            if (snapshot.empty) {
                messagesContainer.innerHTML = '<div class="wa-system-message"><span>No messages yet. Start the conversation!</span></div>';
            }

            snapshot.forEach((doc) => {
                const msg = doc.data();
                msg.id = doc.id;
                renderMessage(msg);
            });

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, (error) => {
            console.error("Chat error:", error);
            messagesContainer.innerHTML = '<div class="wa-system-message"><span>Error loading messages.</span></div>';
        });
}

// Render Single Message
function renderMessage(msg) {
    const container = document.getElementById('chatMessages');
    const currentUser = firebase.auth().currentUser;
    const isSent = currentUser && currentUser.uid === msg.userId;

    const messageDiv = document.createElement('div');
    messageDiv.className = `wa-message ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.id = msg.id;

    // Quoted Reply HTML
    let replyHtml = '';
    if (msg.replyTo) {
        replyHtml = `
            <div class="message-quote" onclick="scrollToMessage('${msg.replyTo.id}')">
                <span class="quote-user">${msg.replyTo.userName}</span>
                <p class="quote-text">${msg.replyTo.text}</p>
            </div>
        `;
    }

    // Format Time
    const time = msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...';
    const editedHtml = msg.isEdited ? '<span class="edited-tag">(edited)</span>' : '';

    // Badge styling
    let badgeHtml = '';
    if (msg.voicePart && msg.voicePart !== 'member') {
        const partLabel = msg.voicePart.charAt(0).toUpperCase() + msg.voicePart.slice(1);
        badgeHtml = `<span class="voice-badge badge-${msg.voicePart}">${partLabel}</span>`;
    }

    // Reactions HTML
    let reactionsHtml = '';
    if (msg.reactions) {
        reactionsHtml = '<div class="message-reactions">';
        Object.entries(msg.reactions).forEach(([emoji, uids]) => {
            if (uids && uids.length > 0) {
                const hasReacted = currentUser && uids.includes(currentUser.uid);
                reactionsHtml += `
                    <div class="reaction-bubble ${hasReacted ? 'active' : ''}" onclick="toggleReaction('${msg.id}', '${emoji}')">
                        <span class="emoji">${emoji}</span>
                        <span class="count">${uids.length}</span>
                    </div>
                `;
            }
        });
        reactionsHtml += '</div>';
    }

    const adminActions = isAdmin ? `
        <span class="material-icons action-icon" onclick="deleteMessage('${msg.id}')" title="Delete">delete</span>
    ` : '';

    const userActions = isSent ? `
        <span class="material-icons action-icon" onclick="editMessage('${msg.id}')" title="Edit">edit</span>
    ` : '';

    const commonActions = `
        <span class="material-icons action-icon" onclick="initReply('${msg.id}')" title="Reply">reply</span>
    `;

    // Media Content
    let mediaHtml = '';
    if (msg.mediaUrl) {
        switch (msg.mediaType) {
            case 'image':
                mediaHtml = `<div class="msg-media"><img src="${msg.mediaUrl}" alt="${msg.fileName || 'Image'}" style="max-width: 300px; max-height: 300px; border-radius: 8px; cursor: pointer;" onclick="openLightbox('${msg.mediaUrl}')"></div>`;
                break;
            case 'video':
                mediaHtml = `<div class="msg-media"><video controls class="msg-media-video"><source src="${msg.mediaUrl}">Your browser does not support video.</video></div>`;
                break;
            case 'audio':
                mediaHtml = `<div class="msg-media"><audio controls><source src="${msg.mediaUrl}">Your browser does not support audio.</audio></div>`;
                break;
            default:
                mediaHtml = `<div class="msg-media" style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 0.5rem;">
                    <span class="material-icons" style="vertical-align: middle; margin-right: 0.5rem;">attach_file</span>
                    <a href="${msg.mediaUrl}" target="_blank" style="color: var(--color-gold-primary); text-decoration: none;">${msg.fileName || 'Download File'}</a>
                </div>`;
        }
    }

    messageDiv.innerHTML = `
        <span class="${isSent ? 'wa-msg-tail-out' : 'wa-msg-tail-in'}"></span>
        <div class="wa-msg-content">
            ${!isSent ? `<span class="wa-msg-author">${msg.userName || 'Member'} ${badgeHtml}</span>` : (badgeHtml ? `<div style="margin-bottom: 2px; text-align: right; opacity: 0.9;">${badgeHtml}</div>` : '')}
            ${replyHtml}
            ${mediaHtml}
            ${msg.text ? `<p>${msg.text}</p>` : ''}
            <span class="wa-msg-meta">
                <div class="message-actions">
                    ${commonActions}
                    ${userActions}
                    ${adminActions}
                </div>
                <span class="wa-msg-time">${time} ${editedHtml}</span>
                ${isSent ? '<span class="material-icons wa-msg-check">done_all</span>' : ''}
            </span>
            ${reactionsHtml}
            <div class="reaction-trigger" onclick="showEmojiPicker(event, '${msg.id}')">
                <span class="material-icons">add_reaction</span>
            </div>
        </div>
    `;

    container.appendChild(messageDiv);
}

// Message Reply Functions
function initReply(messageId) {
    const msgEl = document.querySelector(`.wa-message[data-id="${messageId}"]`);
    if (!msgEl) return;

    const author = msgEl.querySelector('.wa-msg-author')?.textContent.split(' ')[0] ||
        (msgEl.classList.contains('sent') ? 'You' : 'Member');
    const text = msgEl.querySelector('p')?.textContent || 'Media';

    replyToId = messageId;

    document.getElementById('replyToUser').textContent = author;
    document.getElementById('replyToText').textContent = text;
    document.getElementById('replyPreview').classList.add('active');
    document.getElementById('messageInput').focus();
}

function cancelReply() {
    replyToId = null;
    document.getElementById('replyPreview').classList.remove('active');
}

window.scrollToMessage = function (id) {
    const el = document.querySelector(`.wa-message[data-id="${id}"]`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.background = 'rgba(212, 175, 55, 0.2)';
        setTimeout(() => el.style.background = '', 2000);
    }
};

// Send Message
async function handleSendMessage(e) {
    e.preventDefault();

    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    const user = firebase.auth().currentUser;

    if (!text && !replyToId) return;

    if (!user) {
        uiManager.showAlert("Please login to join the chat!", 'error');
        window.location.href = 'login.html';
        return;
    }

    try {
        if (editingMessageId) {
            await firebase.firestore().collection('chats')
                .doc(currentChannel)
                .collection('messages')
                .doc(editingMessageId)
                .update({
                    text: text,
                    isEdited: true,
                    editedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            editingMessageId = null;
            input.value = '';
            input.placeholder = 'Type a message';
            return;
        }

        // Get user data from Firestore for the name and voice part
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (userData && userData.isBlocked) {
            uiManager.showAlert("Your account has been blocked from the chat by an administrator.", 'error');
            return;
        }

        const userName = userData ? userData.name : user.email;
        const voicePart = userData ? userData.voicePart || 'member' : 'member';

        const messageData = {
            text: text,
            userId: user.uid,
            userName: userName,
            voicePart: voicePart,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Handle Reply
        if (replyToId) {
            const replyToText = document.getElementById('replyToText').textContent;
            const replyToUserName = document.getElementById('replyToUser').textContent;
            messageData.replyTo = {
                id: replyToId,
                text: replyToText,
                userName: replyToUserName
            };
            cancelReply();
        }

        // Add to Firestore
        await firebase.firestore().collection('chats')
            .doc(currentChannel)
            .collection('messages')
            .add(messageData);

        input.value = '';
    } catch (error) {
        console.error("Error sending message:", error);
        uiManager.showAlert("Failed to send message. Please try again.", 'error');
    }
}

// Toggle Reaction
async function toggleReaction(messageId, emoji) {
    const user = firebase.auth().currentUser;
    if (!user) {
        uiManager.showAlert("Please login to react!", 'error');
        return;
    }

    const msgRef = firebase.firestore().collection('chats')
        .doc(currentChannel)
        .collection('messages')
        .doc(messageId);

    try {
        const doc = await msgRef.get();
        const msg = doc.data();
        let reactions = msg.reactions || {};
        let uids = reactions[emoji] || [];

        if (uids.includes(user.uid)) {
            uids = uids.filter(id => id !== user.uid);
        } else {
            uids.push(user.uid);
        }

        await msgRef.update({
            [`reactions.${emoji}`]: uids
        });
    } catch (error) {
        console.error("Reaction error:", error);
    }
}

// Show Emoji Picker
function showEmojiPicker(event, messageId) {
    event.stopPropagation();
    const emojis = ['❤️', '👏', '🎶', '🙌', '🙏', '🔥'];

    // Remove if exists
    const existing = document.querySelector('.emoji-picker-popup');
    if (existing) existing.remove();

    const picker = document.createElement('div');
    picker.className = 'emoji-picker-popup';

    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.onclick = () => {
            toggleReaction(messageId, emoji);
            picker.remove();
        };
        picker.appendChild(span);
    });

    document.body.appendChild(picker);

    // Position
    picker.style.left = `${event.pageX}px`;
    picker.style.top = `${event.pageY - 40}px`;

    // Close on click outside
    document.addEventListener('click', () => picker.remove(), { once: true });
}

// Edit Message
function editMessage(messageId) {
    const msgEl = document.querySelector(`.wa-message[data-id="${messageId}"]`);
    if (!msgEl) return;

    const text = msgEl.querySelector('p')?.textContent;
    if (!text) return;

    editingMessageId = messageId;
    const input = document.getElementById('messageInput');
    input.value = text;
    input.placeholder = 'Editing message...';
    input.focus();
}

// Delete Message (Admin Only or Self)
async function deleteMessage(messageId) {
    const user = firebase.auth().currentUser;
    const msgRef = firebase.firestore().collection('chats')
        .doc(currentChannel)
        .collection('messages')
        .doc(messageId);

    const doc = await msgRef.get();
    const isOwner = doc.exists && user && doc.data().userId === user.uid;

    if (!isAdmin && !isOwner) return;

    uiManager.showConfirm("Are you sure you want to delete this message?", async () => {
        try {
            await msgRef.delete();
            console.log("Message deleted");
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    });
}

// Handle File Upload
async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const user = firebase.auth().currentUser;
    if (!user) {
        uiManager.showAlert("Please sign in to send files.", 'error');
        return;
    }

    // Check if user is blocked
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    if (userDoc.exists && userDoc.data().isBlocked) {
        uiManager.showAlert("You are blocked from sending messages.", 'error');
        event.target.value = '';
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const originalPlaceholder = messageInput.placeholder;

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const maxSize = 100 * 1024 * 1024; // 100MB limit

            if (file.size > maxSize) {
                uiManager.showAlert(`File "${file.name}" is too large. Maximum size is 100MB.`, 'error');
                continue;
            }

            messageInput.placeholder = `Uploading ${file.name}...`;
            messageInput.disabled = true;

            // Determine file type
            let fileType = 'file';

            // primary check: mime type
            if (file.type.startsWith('image/')) fileType = 'image';
            else if (file.type.startsWith('video/')) fileType = 'video';
            else if (file.type.startsWith('audio/')) fileType = 'audio';

            // fallback check: extension
            if (fileType === 'file') {
                const ext = file.name.split('.').pop().toLowerCase();
                const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
                const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

                if (imageExts.includes(ext)) fileType = 'image';
                else if (videoExts.includes(ext)) fileType = 'video';
                else if (audioExts.includes(ext)) fileType = 'audio';
            }

            // Upload to Firebase Storage
            const metadata = {
                contentType: fileType === 'image' ? 'image/jpeg' :
                    fileType === 'video' ? 'video/mp4' :
                        fileType === 'audio' ? 'audio/mpeg' : undefined
            };

            const storageRef = firebase.storage().ref(`chat-media/${currentChannel}/${Date.now()}_${file.name}`);
            const uploadTask = storageRef.put(file, metadata);

            // Monitor upload progress
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    messageInput.placeholder = `Uploading: ${Math.round(progress)}%`;
                },
                (error) => {
                    console.error("Upload error:", error);
                    uiManager.showAlert(`Failed to upload ${file.name}: ${error.message}`, 'error');
                    messageInput.placeholder = originalPlaceholder;
                    messageInput.disabled = false;
                },
                async () => {
                    try {
                        // Upload complete
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();


                        // Send message with media
                        await firebase.firestore().collection('chats')
                            .doc(currentChannel)
                            .collection('messages')
                            .add({
                                text: ``,
                                mediaUrl: downloadURL,
                                mediaType: fileType,
                                fileName: file.name,
                                userId: user.uid,
                                userName: (userDoc.exists && userDoc.data().name) ? userDoc.data().name : user.email,
                                voicePart: (userDoc.exists && userDoc.data().voicePart) ? userDoc.data().voicePart : 'member',
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });



                        messageInput.placeholder = originalPlaceholder;
                        messageInput.disabled = false;

                    } catch (err) {
                        console.error("Post-upload error:", err);
                        uiManager.showAlert(`Error after upload: ${err.message}`, 'error');
                        messageInput.placeholder = originalPlaceholder;
                        messageInput.disabled = false;
                    }
                }
            );
        }
    } catch (error) {
        console.error("File upload error:", error);
        uiManager.showAlert("Failed to upload file: " + error.message, 'error');
        messageInput.placeholder = originalPlaceholder;
        messageInput.disabled = false;
    }

    // Reset file input
    event.target.value = '';
}
