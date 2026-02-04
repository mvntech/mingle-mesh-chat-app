export const up = async (db, client) => {
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ githubId: 1 }, { unique: true, sparse: true });
    await db.collection('chats').createIndex({ participants: 1 });
    await db.collection('chats').createIndex({ updatedAt: -1 });
};

export const down = async (db, client) => {
    await db.collection('users').dropIndex('username_1');
    await db.collection('users').dropIndex('email_1');
    try { await db.collection('users').dropIndex('googleId_1'); } catch (e) { }
    try { await db.collection('users').dropIndex('githubId_1'); } catch (e) { }
    await db.collection('chats').dropIndex('participants_1');
    await db.collection('chats').dropIndex('updatedAt_-1');
};
