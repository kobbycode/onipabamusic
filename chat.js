// Real-Time Chat Logic for Onipaba Music

let currentChannel = 'general';
let unsubscribeMessages = null;
let unsubscribeTyping = null;
let isAdmin = false;
let allChannels = {};
let allDMs = {}; // New: Correctly declaring DMs globally
let typingTimeout = null;
let replyToId = null;
let editingMessageId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimerInterval = null;
let latestOtherReadTimestamp = 0;
let unsubscribeReadStatus = null;
let unsubscribeDMs = null; // New: For Direct Messages
let isDM = false; // New
let currentOtherUser = null; // New: { uid, name }

// Expose these to global scope because they are called via onclick in generated HTML
window.deleteMessage = (id) => deleteMessage(id);
window.editMessage = (id) => editMessage(id);
window.initReply = (id) => initReply(id);
window.cancelReply = () => cancelReply();
window.cancelRecording = () => cancelRecording();
window.toggleReaction = (id, emoji) => toggleReaction(id, emoji);
window.showEmojiPicker = (event, id) => showEmojiPicker(event, id);
window.switchChannel = (id, el) => switchChannel(id, el);
window.startDM = (otherUserId, otherUserName) => startDM(otherUserId, otherUserName);
window.openLightbox = (url) => openLightbox(url);
window.closeLightbox = () => closeLightbox();
window.openNewChat = () => openNewChat();

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
                        avatarEl.title = userName; // Add title for hover
                    }
                }
            } catch (err) {
                console.error('[Chat] Auth update error:', err);
            }

            // Listen for Recent DMs - Now inside auth changed
            listenForDMs();
        } else {
            // User logged out
            if (unsubscribeDMs) {
                unsubscribeDMs();
                unsubscribeDMs = null;
            }
            const dmList = document.getElementById('dmList');
            if (dmList) {
                dmList.innerHTML = '<div style="padding: 20px; color: #999;">Login to see your DMs.</div>';
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
    document.getElementById('dmList').addEventListener('click', (e) => { // New: For DMs
        if (window.innerWidth <= 768 && (e.target.closest('.wa-chat-item') || e.target.closest('.wa-avatar'))) {
            const sidebar = document.querySelector('.wa-sidebar');
            if (sidebar) sidebar.classList.remove('active-mobile');
        }
    });

    // Listen for Channels
    listenForChannels();

    // listenForDMs() is now handled within onAuthStateChanged

    // New Chat Button (Open User List Modal)
    const newChatBtn = document.getElementById('sidebarNewChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', openNewChat);
    }

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
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        messageInput.addEventListener('input', handleMentionInput);
    }

    // Expose pinning and mention functions globally
    window.pinMessage = pinMessage;
    window.unpinMessage = unpinMessage;
    window.handleMentionInput = handleMentionInput;
    window.selectMention = selectMention;
    window.openGifPicker = openGifPicker;
    window.sendGif = sendGif;
    window.openPollModal = openPollModal;
    window.addPollOption = addPollOption;
    window.createPoll = createPoll;
    window.voteInPoll = voteInPoll;
    // Mic Button Logic
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                stopRecording();
            } else {
                startRecording();
            }
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

// Helper to get DM thread ID
function getThreadId(user1Id, user2Id) {
    return user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
}

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
            div.dataset.type = 'channel'; // New: Indicate type
            if (id === currentChannel && !isDM) { // Check isDM
                div.classList.add('active');
                foundCurrent = true;
                updateHeader();
                // Ensure we are listening to messages if not already
                if (!unsubscribeMessages) {
                    listenForMessages(currentChannel);
                    listenForTyping(currentChannel);
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
        } else if (!foundCurrent && !isDM) { // Only default if no DM is active
            // Default to first available if current gone
            const first = list.querySelector('.wa-chat-item');
            if (first) switchChannel(first.dataset.id, first);
        }
    });
}

// New: Listen for DMs
function listenForDMs() {
    const list = document.getElementById('dmList');
    const user = firebase.auth().currentUser;
    if (!user) {
        list.innerHTML = '<div style="padding: 20px; color: #999;">Login to see your DMs.</div>';
        return;
    }

    if (unsubscribeDMs) {
        unsubscribeDMs();
    }

    unsubscribeDMs = firebase.firestore().collection('dm_threads')
        .where('participants', 'array-contains', user.uid)
        .onSnapshot((snapshot) => {
            list.innerHTML = '';
            allDMs = {};

            // Convert to array and sort in memory to avoid index requirements and handle null timestamps
            const threads = [];
            snapshot.forEach(doc => {
                threads.push({ id: doc.id, ...doc.data() });
            });

            threads.sort((a, b) => {
                const timeA = a.lastMessageTimestamp ? a.lastMessageTimestamp.toMillis() : 0;
                const timeB = b.lastMessageTimestamp ? b.lastMessageTimestamp.toMillis() : 0;
                return timeB - timeA;
            });

            let foundCurrent = false;

            threads.forEach(data => {
                const id = data.id;
                allDMs[id] = data;

                const otherUserId = data.participants.find(uid => uid !== user.uid);
                const otherUserName = data.participantNames[otherUserId] || 'Unknown User';

                const div = document.createElement('div');
                div.className = 'wa-chat-item';
                div.dataset.id = id;
                div.dataset.type = 'dm'; // New: Indicate type
                div.dataset.otherUserId = otherUserId;
                div.dataset.otherUserName = otherUserName;

                if (id === currentChannel && isDM) {
                    div.classList.add('active');
                    foundCurrent = true;
                    updateHeader();
                    if (!unsubscribeMessages) {
                        listenForMessages(currentChannel);
                    }
                }
                div.onclick = () => switchChannel(id, div);

                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserName)}&background=D4AF37&color=fff`;

                const lastMessageTime = data.lastMessageTimestamp ? data.lastMessageTimestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                div.innerHTML = `
                    <div class="wa-avatar">
                        <img src="${avatarUrl}" alt="${otherUserName}">
                    </div>
                    <div class="wa-chat-info">
                        <div class="wa-chat-row-top">
                            <span class="wa-chat-name">${otherUserName}</span>
                            <span class="wa-chat-time">${lastMessageTime}</span>
                        </div>
                        <div class="wa-chat-row-bottom">
                            <span class="wa-chat-preview">${data.lastMessageText || ''}</span>
                        </div>
                    </div>
                `;
                list.appendChild(div);
            });

            if (snapshot.empty) {
                list.innerHTML = '<div style="padding: 20px; color: #999;">No direct messages yet.</div>';
            }
        }, (error) => {
            console.error("DM Listener error:", error);
            list.innerHTML = `<div style="padding: 20px; color: #ff4444;">Error loading DMs. ${error.message}</div>`;
        });
}

// Update Header
function updateHeader() {
    const avatarImg = document.getElementById('activeChannelAvatar');

    if (isDM) {
        const dmThread = allDMs[currentChannel];
        if (dmThread && currentOtherUser) {
            document.getElementById('activeChannelName').textContent = currentOtherUser.name;
            document.getElementById('activeChannelStatus').textContent = 'Direct Message';

            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentOtherUser.name)}&background=D4AF37&color=fff`;
            avatarImg.src = avatarUrl;
            avatarImg.style.opacity = '1';
        } else {
            document.getElementById('activeChannelName').textContent = 'Direct Message';
            document.getElementById('activeChannelStatus').textContent = '';
            avatarImg.style.opacity = '0';
        }
    } else {
        const channel = allChannels[currentChannel];
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
}

// Switch Channel
function switchChannel(id, element) {
    const user = firebase.auth().currentUser;
    if (!user) {
        uiManager.showAlert("Please login to view chats!", 'error');
        return;
    }

    const type = element ? element.dataset.type : (allChannels[id] ? 'channel' : (allDMs[id] ? 'dm' : null));

    if (!type) {
        console.error("Unknown chat type for ID:", id);
        return;
    }

    // Determine if it's a DM
    isDM = (type === 'dm');

    // Set currentOtherUser for DMs
    if (isDM) {
        const otherUserId = element ? element.dataset.otherUserId : allDMs[id]?.participants.find(uid => uid !== user.uid);
        const otherUserName = element ? element.dataset.otherUserName : allDMs[id]?.participantNames[otherUserId];
        currentOtherUser = { uid: otherUserId, name: otherUserName };
    } else {
        currentOtherUser = null;
    }

    if (currentChannel === id && ((isDM && type === 'dm') || (!isDM && type === 'channel')) && unsubscribeMessages && unsubscribeTyping) return;

    // UI Updates
    document.querySelectorAll('.wa-chat-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');

    currentChannel = id;
    updateHeader();

    // Listen for Messages
    listenForMessages(currentChannel);

    // Listen for Typing
    listenForTyping(currentChannel);

    // Listen for Read Status (Blue Ticks)
    listenForReadStatus(currentChannel);

    // Mark as read immediately
    markChannelAsRead(currentChannel);
}

// New: Start a Direct Message
async function startDM(otherUserId, otherUserName) {
    const user = firebase.auth().currentUser;
    if (!user) {
        uiManager.showAlert("Please login to start a DM!", 'error');
        return;
    }
    if (user.uid === otherUserId) {
        uiManager.showAlert("You cannot start a DM with yourself.", 'info');
        return;
    }

    const threadId = getThreadId(user.uid, otherUserId);
    const dmRef = firebase.firestore().collection('dm_threads').doc(threadId);

    try {
        const dmDoc = await dmRef.get();
        if (!dmDoc.exists) {
            // Create new DM thread
            await dmRef.set({
                participants: [user.uid, otherUserId],
                participantNames: {
                    [user.uid]: document.getElementById('currentUserAvatar').title || user.displayName || 'You',
                    [otherUserId]: otherUserName
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp(), // Set initially so it shows in sidebar
                lastMessageText: 'New message thread'
            });
        }

        // Find the element in the DM list and switch to it
        const dmElement = document.querySelector(`.wa-chat-item[data-id="${threadId}"][data-type="dm"]`);
        if (dmElement) {
            switchChannel(threadId, dmElement);
        } else {
            // If not yet rendered by listener, force switch
            isDM = true;
            currentOtherUser = { uid: otherUserId, name: otherUserName };
            currentChannel = threadId;
            updateHeader();
            listenForMessages(threadId);
            listenForTyping(threadId);
            listenForReadStatus(threadId);
            markChannelAsRead(threadId);
        }

        // Close the new chat modal
        const newChatModal = document.getElementById('newChatModal');
        if (newChatModal) newChatModal.classList.remove('active');

        // Close sidebar on mobile
        const sidebar = document.querySelector('.wa-sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.remove('active-mobile');
        }

    } catch (error) {
        console.error("Error starting DM:", error);
        uiManager.showAlert("Failed to start direct message. Please try again.", 'error');
    }
}

// New: Update DM thread metadata
async function updateDMMetadata(threadId, lastMessageText) {
    const dmRef = firebase.firestore().collection('dm_threads').doc(threadId);
    try {
        await dmRef.update({
            lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageText: lastMessageText
        });
    } catch (error) {
        console.error("Error updating DM metadata:", error);
    }
}

// Mark current channel as read for current user
async function markChannelAsRead(channelId) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        const collection = isDM ? firebase.firestore().collection('dm_threads') : firebase.firestore().collection('channels');
        await collection.doc(channelId)
            .collection('readStatus').doc(user.uid).set({
                lastRead: firebase.firestore.FieldValue.serverTimestamp()
            });
    } catch (err) {
        console.error("Read status update error:", err);
    }
}

// Listen for other users' read status to update blue ticks
function listenForReadStatus(channelId) {
    if (unsubscribeReadStatus) unsubscribeReadStatus();

    const user = firebase.auth().currentUser;
    const collection = isDM ? firebase.firestore().collection('dm_threads') : firebase.firestore().collection('channels');

    unsubscribeReadStatus = collection.doc(channelId)
        .collection('readStatus')
        .onSnapshot((snapshot) => {
            let maxRead = 0;
            snapshot.forEach(doc => {
                if (doc.id !== (user ? user.uid : '')) {
                    const data = doc.data();
                    if (data.lastRead) {
                        const ts = data.lastRead.toMillis ? data.lastRead.toMillis() : (data.lastRead.seconds * 1000);
                        if (ts > maxRead) maxRead = ts;
                    }
                }
            });

            if (maxRead > latestOtherReadTimestamp) {
                latestOtherReadTimestamp = maxRead;
                updateBlueTicks();
            }
        });
}

function updateBlueTicks() {
    const sentMessages = document.querySelectorAll('.wa-message.sent');
    sentMessages.forEach(msgEl => {
        const messageTimestamp = parseInt(msgEl.dataset.timestamp, 10);
        const checkIcon = msgEl.querySelector('.wa-msg-check');
        if (checkIcon) {
            if (messageTimestamp <= latestOtherReadTimestamp) {
                checkIcon.classList.add('read');
            } else {
                checkIcon.classList.remove('read');
            }
        }
    });
}

// Typing Indicator Handler
function handleTyping() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    if (typingTimeout) clearTimeout(typingTimeout);

    // Update typing status in Firestore
    const typingRef = isDM ? firebase.firestore().collection('dm_threads').doc(currentChannel) : firebase.firestore().collection('channels').doc(currentChannel);
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

    const collection = isDM ? firebase.firestore().collection('dm_threads') : firebase.firestore().collection('channels');

    unsubscribeTyping = collection.doc(channelId)
        .onSnapshot((doc) => {
            const data = doc.data();

            // Handle Pinned Message UI
            updatePinnedBanner(data);

            const indicatorEl = document.getElementById('typingIndicator');
            if (!indicatorEl) return;

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

    const collection = isDM ? firebase.firestore().collection('dm_threads') : firebase.firestore().collection('chats');

    unsubscribeMessages = collection
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
// Helper to escape HTML and prevent XSS
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

// Simple Markdown Parser
function parseMarkdown(text) {
    if (!text) return '';

    let html = escapeHTML(text);

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Strikethrough: ~~text~~
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Inline Code: `text`
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Blockquote: > text (at start of line or string)
    html = html.replace(/^&gt;\s+(.*)$/gm, '<blockquote>$1</blockquote>');

    // User Mentions
    const mentionRegex = /@\[([^\]]+)\]/g;
    html = html.replace(mentionRegex, '<span class="user-mention">@$1</span>');

    return html;
}

function renderMessage(msg) {
    const container = document.getElementById('chatMessages');
    const currentUser = firebase.auth().currentUser;
    const isSent = currentUser && currentUser.uid === msg.userId;

    const messageDiv = document.createElement('div');
    messageDiv.className = `wa-message ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.id = msg.id;
    if (msg.timestamp) {
        messageDiv.dataset.timestamp = msg.timestamp.toMillis();
    }

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
    if (msg.voicePart && msg.voicePart !== 'member' && !isDM) { // Don't show voice part in DMs
        const partLabel = msg.voicePart.charAt(0).toUpperCase() + msg.voicePart.slice(1);
        badgeHtml = `<span class="voice-badge badge-${msg.voicePart}">${partLabel}</span>`;
    }

    // Reactions rendering
    let reactionsHtml = '';
    if (msg.reactions && Object.keys(msg.reactions).length > 0) {
        reactionsHtml = '<div class="message-reactions">';
        for (const [emoji, uids] of Object.entries(msg.reactions)) {
            if (uids.length > 0) {
                const active = currentUser && uids.includes(currentUser.uid) ? 'active' : '';
                reactionsHtml += `
                    <div class="reaction-badge ${active}" onclick="toggleReaction('${msg.id}', '${emoji}')">
                        <span class="reaction-emoji">${emoji}</span>
                        <span class="reaction-count">${uids.length}</span>
                    </div>
                `;
            }
        }
        reactionsHtml += '</div>';
    }

    // Actions
    const pinAction = isAdmin && !isDM ? `
        <span class="material-icons action-icon pin-icon" onclick="pinMessage('${msg.id}')" title="Pin Message">push_pin</span>
    ` : '';

    const adminActions = isAdmin ? `
        <span class="material-icons action-icon" onclick="deleteMessage('${msg.id}')" title="Delete">delete</span>
    ` : '';


    const userActions = isSent ? `
        <span class="material-icons action-icon" onclick="editMessage('${msg.id}')" title="Edit">edit</span>
    ` : '';

    const commonActions = `
        <span class="material-icons action-icon" onclick="initReply('${msg.id}')" title="Reply">reply</span>
    `;

    // Media rendering
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
                mediaHtml = `
                    <div class="msg-media-audio">
                        <span class="material-icons">play_circle</span>
                        <audio controls><source src="${msg.mediaUrl}"></audio>
                    </div>
                `;
                break;
            case 'file':
            default:
                mediaHtml = `
                    <div class="msg-media-file">
                        <span class="material-icons">description</span>
                        <a href="${msg.mediaUrl}" target="_blank">${msg.fileName || 'Attached File'}</a>
                    </div>
                `;
        }
    }

    const formattedText = parseMarkdown(msg.text);

    // Link Preview HTML
    let linkPreviewHtml = '';
    if (msg.linkPreview) {
        linkPreviewHtml = `
            <a href="${msg.linkPreview.url}" target="_blank" class="wa-link-preview">
                ${msg.linkPreview.image ? `<img src="${msg.linkPreview.image}" alt="Preview">` : ''}
                <div class="wa-preview-info">
                    <span class="wa-preview-title">${msg.linkPreview.title || 'Link'}</span>
                    <p class="wa-preview-desc">${msg.linkPreview.description || ''}</p>
                    <span class="wa-preview-url">${new URL(msg.linkPreview.url).hostname}</span>
                </div>
            </a>
        `;
    }

    messageDiv.innerHTML = `
        <span class="${isSent ? 'wa-msg-tail-out' : 'wa-msg-tail-in'}"></span>
        <div class="wa-msg-content">
            ${!isSent ? `<span class="wa-msg-author">${msg.userName || 'Member'} ${badgeHtml}</span>` : (badgeHtml ? `<div style="margin-bottom: 2px; text-align: right; opacity: 0.9;">${badgeHtml}</div>` : '')}
            ${replyHtml}
            ${mediaHtml}
            ${msg.text ? `<div class="wa-msg-text-formatted">${formattedText}</div>` : ''}
            ${msg.type === 'poll' ? renderPollHtml(msg) : ''}
            ${linkPreviewHtml}
            <span class="wa-msg-meta">
                <div class="message-actions">
                    ${pinAction}
                    ${commonActions}
                    ${userActions}
                    ${adminActions}
                </div>

                <span class="wa-msg-time">${time} ${editedHtml}</span>
                ${isSent ? `<span class="material-icons wa-msg-check ${msg.timestamp && msg.timestamp.toMillis() <= latestOtherReadTimestamp ? 'read' : ''}">done_all</span>` : ''}
            </span>

            ${reactionsHtml}
            <div class="reaction-trigger" onclick="showEmojiPicker(event, '${msg.id}')">
                <span class="material-icons">add_reaction</span>
            </div>
        </div>
    `;

    // Mobile Action Toggle
    messageDiv.onclick = (e) => {
        // Don't toggle if clicking on an interactive element
        if (e.target.closest('.action-icon, .reaction-badge, .reaction-trigger, .wa-poll-option, a, button')) {
            return;
        }

        // Remove show-actions from all other messages
        document.querySelectorAll('.wa-message.show-actions').forEach(el => {
            if (el !== messageDiv) el.classList.remove('show-actions');
        });

        messageDiv.classList.toggle('show-actions');
    };

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

    if (!text && !replyToId && !editingMessageId) return; // Allow empty text for media messages

    if (!user) {
        uiManager.showAlert("Please login to join the chat!", 'error');
        window.location.href = 'login.html';
        return;
    }

    try {
        const messageCollectionRef = isDM ?
            firebase.firestore().collection('dm_threads').doc(currentChannel).collection('messages') :
            firebase.firestore().collection('chats').doc(currentChannel).collection('messages');

        if (editingMessageId) {
            await messageCollectionRef
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

        const voicePart = userData ? userData.voicePart || 'member' : 'member';
        const userName = userData ? userData.name : user.email;

        const messageData = {
            text: text,
            userId: user.uid,
            userName: userName,
            voicePart: voicePart,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Handle URL Link Preview
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = text.match(urlRegex);
        if (match) {
            const firstUrl = match[0];
            try {
                const previewData = await fetchLinkPreview(firstUrl);
                if (previewData) {
                    messageData.linkPreview = previewData;
                }
            } catch (err) {
                console.warn("Link preview failed:", err);
            }
        }

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

        // Add message to Firestore
        const collectionPath = isDM ?
            firebase.firestore().collection('dm_threads').doc(currentChannel).collection('messages') :
            firebase.firestore().collection('chats').doc(currentChannel).collection('messages');

        await collectionPath.add(messageData);

        // Update thread metadata for sidebar if DM
        if (isDM) {
            await updateDMMetadata(currentChannel, text || 'Sent a media message');
        }

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
                        const mediaCollectionPath = isDM ?
                            firebase.firestore().collection('dm_threads').doc(currentChannel).collection('messages') :
                            firebase.firestore().collection('chats').doc(currentChannel).collection('messages');

                        await mediaCollectionPath.add({
                            text: ``,
                            mediaUrl: downloadURL,
                            mediaType: fileType,
                            fileName: file.name,
                            userId: user.uid,
                            userName: (userDoc.exists && userDoc.data().name) ? userDoc.data().name : user.email,
                            voicePart: (userDoc.exists && userDoc.data().voicePart) ? userDoc.data().voicePart : 'member',
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        if (isDM) {
                            await updateDMMetadata(currentChannel, `Sent a ${fileType}`);
                        }



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

// Voice Recording Logic
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstart = () => {
            recordingStartTime = Date.now();
            updateRecordingUI(true);
            startRecordingTimer();
        };

        mediaRecorder.onstop = async () => {
            updateRecordingUI(false);
            stopRecordingTimer();

            if (audioChunks.length > 0 && !window.recordingCancelled) {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await uploadAudio(audioBlob);
            }
            window.recordingCancelled = false;
        };

        mediaRecorder.start();
    } catch (err) {
        console.error('Mic error:', err);
        uiManager.showAlert('Could not access microphone.', 'error');
    }
}

function stopRecording() {
    if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

function cancelRecording() {
    window.recordingCancelled = true;
    stopRecording();
}

async function uploadAudio(blob) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const filePath = 'chat_media/' + currentChannel + '/voice_' + user.uid + '_' + Date.now() + '.webm';
    const storageRef = firebase.storage().ref(filePath);

    uiManager.showAlert('Sending voice note...', 'info');

    try {
        const snapshot = await storageRef.put(blob);
        const url = await snapshot.ref.getDownloadURL();

        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const userName = userData ? userData.name : user.email;
        const voicePart = userData ? userData.voicePart || 'member' : 'member';

        await firebase.firestore().collection('chats')
            .doc(currentChannel)
            .collection('messages')
            .add({
                userId: user.uid,
                userName: userName,
                voicePart: voicePart,
                mediaUrl: url,
                mediaType: 'audio',
                fileName: 'Voice Note',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
    } catch (err) {
        console.error('Audio upload error:', err);
        uiManager.showAlert('Failed to send voice note.', 'error');
    }
}

function updateRecordingUI(isRecording) {
    const overlay = document.getElementById('recordingOverlay');
    const micIcon = document.getElementById('micBtn');

    if (isRecording) {
        overlay.classList.add('active');
        micIcon.style.color = '#ff4444';
        micIcon.textContent = 'stop';
    } else {
        overlay.classList.remove('active');
        micIcon.style.color = '';
        micIcon.textContent = 'mic';
    }
}

function startRecordingTimer() {
    const timerEl = document.getElementById('recordingTimer');
    recordingTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        timerEl.textContent = mins + ':' + secs;
    }, 1000);
}

function stopRecordingTimer() {
    clearInterval(recordingTimerInterval);
    document.getElementById('recordingTimer').textContent = '00:00';
}

// New Chat Modal & User Listing
async function openNewChat() {
    const modal = document.getElementById('newChatModal');
    if (!modal) {
        createNewChatModal();
        return;
    }
    modal.classList.add('active');
    loadUsersForDM();
}

function createNewChatModal() {
    const modal = document.createElement('div');
    modal.id = 'newChatModal';
    modal.className = 'wa-modal';
    modal.innerHTML = `
        <div class="wa-modal-content">
            <div class="wa-modal-header">
                <h3>Start New Chat</h3>
                <span class="material-icons" onclick="document.getElementById('newChatModal').classList.remove('active')">close</span>
            </div>
            <div class="wa-modal-search">
                <input type="text" id="userSearchInput" placeholder="Search users..." oninput="filterUsers()">
            </div>
            <div class="wa-user-list" id="modalUserList">
                <div class="wa-loading-spinner">Loading users...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');
    loadUsersForDM();
}

async function loadUsersForDM() {
    const userListContainer = document.getElementById('modalUserList');
    const currentUser = firebase.auth().currentUser;

    try {
        const snapshot = await firebase.firestore().collection('users').limit(50).get();
        userListContainer.innerHTML = '';

        snapshot.forEach(doc => {
            const userData = doc.data();
            if (doc.id === currentUser.uid) return; // Skip self

            const name = userData.name || userData.email || 'Unknown User';
            const userItem = document.createElement('div');
            userItem.className = 'wa-user-item';
            userItem.onclick = () => startDM(doc.id, name);

            const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=D4AF37&color=fff';

            userItem.innerHTML = `
                <img src="${avatarUrl}" alt="avatar">
                <div class="wa-user-info">
                    <span class="wa-user-name">${name}</span>
                    <span class="wa-user-role">${userData.role || 'Member'}</span>
                </div>
            `;
            userListContainer.appendChild(userItem);
        });

        if (userListContainer.innerHTML === '') {
            userListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No users found.</div>';
        }
    } catch (err) {
        console.error('Error loading users:', err);
        userListContainer.innerHTML = '<div style="padding: 20px; color: #ff4444;">Error loading users.</div>';
    }
}

window.filterUsers = function () {
    const query = document.getElementById('userSearchInput').value.toLowerCase();
    const items = document.querySelectorAll('.wa-user-item');
    items.forEach(item => {
        const name = item.querySelector('.wa-user-name').textContent.toLowerCase();
        item.style.display = name.includes(query) ? 'flex' : 'none';
    });
};

// Giphy Integration
const GIPHY_API_KEY = 'dc6zaTOxFJmzC';

async function openGifPicker() {
    const modal = document.getElementById('gifPickerModal');
    if (!modal) {
        createNewGifModal();
        return;
    }
    modal.classList.add('active');
    loadTrendingGifs();
}

function createNewGifModal() {
    const modal = document.createElement('div');
    modal.id = 'gifPickerModal';
    modal.className = 'wa-modal';
    modal.innerHTML = `
        <div class="wa-modal-content">
            <div class="wa-modal-header">
                <h3>Select GIF</h3>
                <span class="material-icons" onclick="document.getElementById('gifPickerModal').classList.remove('active')">close</span>
            </div>
            <div class="wa-modal-search">
                <input type="text" id="gifSearchInput" placeholder="Search GIPHY..." oninput="debounceGifSearch()">
            </div>
            <div class="wa-gif-grid" id="gifGrid">
                <div class="wa-loading-spinner">Loading GIFs...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');
    loadTrendingGifs();
}

let gifSearchTimeout;
function debounceGifSearch() {
    clearTimeout(gifSearchTimeout);
    gifSearchTimeout = setTimeout(() => {
        const query = document.getElementById('gifSearchInput').value.trim();
        if (query) searchGiphy(query);
        else loadTrendingGifs();
    }, 500);
}

async function loadTrendingGifs() {
    const grid = document.getElementById('gifGrid');
    try {
        const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`);
        const data = await response.json();
        renderGifs(data.data);
    } catch (err) {
        console.error('Giphy trending error:', err);
        grid.innerHTML = '<div style="padding: 20px; color: #ff4444;">Error loading trending GIFs.</div>';
    }
}

async function searchGiphy(query) {
    const grid = document.getElementById('gifGrid');
    try {
        const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`);
        const data = await response.json();
        renderGifs(data.data);
    } catch (err) {
        console.error('Giphy search error:', err);
        grid.innerHTML = '<div style="padding: 20px; color: #ff4444;">Error searching GIFs.</div>';
    }
}

function renderGifs(gifs) {
    const grid = document.getElementById('gifGrid');
    grid.innerHTML = '';
    gifs.forEach(gif => {
        const img = document.createElement('img');
        img.src = gif.images.fixed_height_small.url;
        img.alt = gif.title;
        img.onclick = () => sendGif(gif.images.fixed_height.url);
        grid.appendChild(img);
    });

    if (gifs.length === 0) {
        grid.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No GIFs found.</div>';
    }
}

async function sendGif(url) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    document.getElementById('gifPickerModal').classList.remove('active');

    try {
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        const collectionPath = isDM ?
            firebase.firestore().collection('dm_threads').doc(currentChannel).collection('messages') :
            firebase.firestore().collection('chats').doc(currentChannel).collection('messages');

        await collectionPath.add({
            text: '',
            mediaUrl: url,
            mediaType: 'image', // Treat GIF as image for now
            fileName: 'GIF',
            userId: user.uid,
            userName: userData ? userData.name : user.email,
            voicePart: userData ? userData.voicePart || 'member' : 'member',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (isDM) {
            await updateDMMetadata(currentChannel, 'Sent a GIF');
        }
    } catch (err) {
        console.error('Error sending GIF:', err);
        uiManager.showAlert('Failed to send GIF.', 'error');
    }
}


// Link Preview Service
async function fetchLinkPreview(url) {
    try {
        // Using microlink.io public API (free tier)
        const response = await fetch('https://api.microlink.io/?url=' + encodeURIComponent(url));
        if (!response.ok) return null;

        const data = await response.json();
        if (data.status === 'success') {
            return {
                url: url,
                title: data.data.title,
                description: data.data.description,
                image: data.data.image ? data.data.image.url : null
            };
        }
        return null;
    } catch (err) {
        console.error('Link preview error:', err);
        return null;
    }
}


// Message Pinning Logic
async function pinMessage(messageId) {
    if (!isAdmin || isDM) return;

    try {
        const msgDoc = await firebase.firestore().collection('chats').doc(currentChannel).collection('messages').doc(messageId).get();
        if (!msgDoc.exists) return;

        const msgData = msgDoc.data();
        await firebase.firestore().collection('channels').doc(currentChannel).update({
            pinnedMessageId: messageId,
            pinnedMessageText: msgData.text || (msgData.mediaType ? 'Media Message' : 'Pinned Message'),
            pinnedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        uiManager.showAlert('Message pinned!', 'success');
    } catch (err) {
        console.error('Pin error:', err);
        uiManager.showAlert('Failed to pin message.', 'error');
    }
}

async function unpinMessage(e) {
    if (e) e.stopPropagation();
    if (!isAdmin || isDM) return;

    try {
        await firebase.firestore().collection('channels').doc(currentChannel).update({
            pinnedMessageId: firebase.firestore.FieldValue.delete(),
            pinnedMessageText: firebase.firestore.FieldValue.delete(),
            pinnedAt: firebase.firestore.FieldValue.delete()
        });
        uiManager.showAlert('Message unpinned!', 'success');
    } catch (err) {
        console.error('Unpin error:', err);
    }
}

window.scrollToPinned = function () {
    const banner = document.getElementById('pinnedBanner');
    const msgId = banner.dataset.pinnedId;
    if (msgId) scrollToMessage(msgId);
};

function updatePinnedBanner(data) {
    const banner = document.getElementById('pinnedBanner');
    const textEl = document.getElementById('pinnedBannerText');
    const unpinBtn = document.getElementById('unpinBtn');

    if (data && data.pinnedMessageId) {
        banner.style.display = 'flex';
        banner.dataset.pinnedId = data.pinnedMessageId;
        textEl.textContent = data.pinnedMessageText || 'Pinned Message';

        if (isAdmin && !isDM) {
            unpinBtn.style.display = 'block';
        } else {
            unpinBtn.style.display = 'none';
        }
    } else {
        banner.style.display = 'none';
        banner.dataset.pinnedId = '';
    }
}

function renderPollHtml(msg) {
    const totalVotes = msg.options.reduce((acc, opt) => acc + opt.votes.length, 0);
    const user = firebase.auth().currentUser;
    const userId = user ? user.uid : '';

    let optionsHtml = '';
    msg.options.forEach((opt, index) => {
        const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
        const hasVoted = opt.votes.includes(userId);

        optionsHtml += `
            <div class="wa-poll-option ${hasVoted ? 'voted' : ''}" onclick="voteInPoll('${msg.id}', ${index})">
                <div class="wa-poll-bg" style="width: ${percent}%"></div>
                <span class="wa-poll-opt-text">${opt.text}</span>
                <span class="wa-poll-opt-count">${opt.votes.length} (${percent}%)</span>
            </div>
        `;
    });

    return `
        <div class="wa-poll-card">
            <h4 class="wa-poll-question">${msg.question}</h4>
            <div class="wa-poll-options">
                ${optionsHtml}
            </div>
            <div class="wa-poll-footer">
                <span>${totalVotes} votes</span>
            </div>
        </div>
    `;
}

// User Mentions Logic
let mentionRange = null;

async function handleMentionInput(e) {
    const input = e.target;
    const value = input.value;
    const cursor = input.selectionStart;

    // Find the last '@' before cursor
    const lastAt = value.lastIndexOf('@', cursor - 1);

    if (lastAt !== -1) {
        const query = value.substring(lastAt + 1, cursor);
        if (!query.includes(' ')) {
            showMentionSuggestions(query, lastAt, cursor);
            return;
        }
    }

    hideMentions();
}

async function showMentionSuggestions(query, start, end) {
    const list = document.getElementById('mentionsList');
    try {
        // Simple search for now, limit to 5
        const snapshot = await firebase.firestore().collection('users')
            .where('name', '>=', query)
            .where('name', '<=', query + '\uf8ff')
            .limit(5)
            .get();

        if (snapshot.empty) {
            hideMentions();
            return;
        }

        list.innerHTML = '';
        snapshot.forEach(doc => {
            const userData = doc.data();
            const name = userData.name || 'User';
            const item = document.createElement('div');
            item.className = 'wa-mention-item';

            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D4AF37&color=fff`;

            item.innerHTML = `
                <img src="${avatarUrl}" alt="avatar">
                <span>${name}</span>
            `;
            item.onclick = () => selectMention(name, start, end);
            list.appendChild(item);
        });

        list.style.display = 'block';
        mentionRange = { start, end };
    } catch (err) {
        console.error('Mention error:', err);
    }
}

function selectMention(name, start, end) {
    const input = document.getElementById('messageInput');
    const value = input.value;
    // We use a special format @[Name] for detection in parseMarkdown
    const newValue = value.substring(0, start) + '@[' + name + '] ' + value.substring(end);
    input.value = newValue;
    input.focus();
    hideMentions();
}

function hideMentions() {
    const list = document.getElementById('mentionsList');
    if (list) list.style.display = 'none';
    mentionRange = null;
}

// Community Polls Logic
function openPollModal() {
    const modal = document.getElementById('pollModal');
    modal.classList.add('active');
    document.getElementById('pollQuestion').value = '';
    const container = document.getElementById('pollOptionsContainer');
    container.innerHTML = `
        <input type="text" class="wa-poll-option-input" placeholder="Option 1">
        <input type="text" class="wa-poll-option-input" placeholder="Option 2">
    `;
}

function addPollOption() {
    const container = document.getElementById('pollOptionsContainer');
    if (container.children.length >= 10) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'wa-poll-option-input';
    input.placeholder = 'Option ' + (container.children.length + 1);
    container.appendChild(input);
}

async function createPoll() {
    const question = document.getElementById('pollQuestion').value.trim();
    const optionInputs = document.querySelectorAll('.wa-poll-option-input');
    const options = [];

    optionInputs.forEach(input => {
        const val = input.value.trim();
        if (val) options.push({ text: val, votes: [] });
    });

    if (!question || options.length < 2) {
        uiManager.showAlert('Please provide a question and at least 2 options.', 'error');
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        const collectionPath = isDM ?
            firebase.firestore().collection('dm_threads').doc(currentChannel).collection('messages') :
            firebase.firestore().collection('chats').doc(currentChannel).collection('messages');

        await collectionPath.add({
            type: 'poll',
            question: question,
            options: options,
            userId: user.uid,
            userName: userData ? userData.name : user.email,
            voicePart: userData ? userData.voicePart || 'member' : 'member',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (isDM) {
            await updateDMMetadata(currentChannel, `📊 Poll: ${question}`);
        }

        document.getElementById('pollModal').classList.remove('active');
    } catch (err) {
        console.error('Create poll error:', err);
        uiManager.showAlert('Failed to create poll.', 'error');
    }
}

async function voteInPoll(messageId, optionIndex) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const collectionPath = isDM ?
        firebase.firestore().collection('dm_threads').doc(currentChannel).collection('messages') :
        firebase.firestore().collection('chats').doc(currentChannel).collection('messages');

    try {
        const docRef = collectionPath.doc(messageId);
        await firebase.firestore().runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            if (!doc.exists) return;

            const data = doc.data();
            const options = data.options;

            // Remove user from any existing option
            options.forEach(opt => {
                const idx = opt.votes.indexOf(user.uid);
                if (idx > -1) opt.votes.splice(idx, 1);
            });

            // Add user to new option
            options[optionIndex].votes.push(user.uid);

            transaction.update(docRef, { options: options });
        });
    } catch (err) {
        console.error('Vote error:', err);
    }
}

