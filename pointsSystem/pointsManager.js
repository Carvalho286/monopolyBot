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

function addPoints(userId, amount) {
    if (!points[userId]) {
        points[userId] = 0;
    }
    points[userId] += amount;

    fs.writeFileSync(path, JSON.stringify(points, null, 2));

    return points[userId];
}

function getPoints(userId) {
    const points = loadPoints();
    return points[userId] || 0;
}

module.exports = {
    addPoints,
    getPoints
};
