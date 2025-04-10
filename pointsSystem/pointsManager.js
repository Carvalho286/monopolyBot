const fs = require('fs');
const path = './pointsData.json';

let points = {};

if (fs.existsSync(path)) {
    points = JSON.parse(fs.readFileSync(path, 'utf8'));
} else {
    fs.writeFileSync(path, JSON.stringify(points, null, 2));
}

function loadPoints() {
    try {
        const data = fs.readFileSync(path, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao carregar os pontos:', error.message);
        return {};
    }
}

function savePoints() {
    fs.writeFileSync(path, JSON.stringify(points, null, 2));
}

function addPoints(userId, amount) {
    if (!points[userId]) {
        points[userId] = 0;
    }
    points[userId] += amount;
    savePoints();
    return points[userId];
}

function removePoints(userId, amount) {
    if (!points[userId]) {
        points[userId] = 0;
    }
    points[userId] -= amount;
    if (points[userId] < 0) points[userId] = 0; 
    savePoints();
    return points[userId];
}

function getPoints(userId) {
    const points = loadPoints();
    return points[userId] || 0;
}

function getAllUsers() {
    const points = loadPoints(); // Carrega os pontos dos utilizadores
    const users = Object.keys(points).map(userId => ({
        userId,
        points: points[userId]
    }));

    return users.sort((a, b) => b.points - a.points); // Ordena em ordem decrescente de pontos
}

function getCurrentPositionInLeaderboard(userId) {
    const users = getAllUsers();

    users.sort((a, b) => b.points - a.points);

    const position = users.findIndex(user => user.userId === userId);

    if (position === -1) {
        return null;  
    }

    return {
        position: position + 1,
        totalUsers: users.length
    };
}

module.exports = {
    addPoints,
    removePoints,
    getPoints,
    getAllUsers,
    getCurrentPositionInLeaderboard
};
