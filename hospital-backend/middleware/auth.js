const jwt = require("jsonwebtoken");

/*
AUTHENTICATE USER (JWT)
*/
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // 🔥 { id, role, linked_id }
        next();
    } catch {
        return res.status(403).json({ message: "Invalid token" });
    }
}

/*
ROLE CHECK
*/
function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
}

/*
OWNERSHIP CHECK
*/
function checkOwnership(paramField) {
    return (req, res, next) => {
        const userId = req.user.linked_id;

        if (!userId) {
            return res.status(401).json({ message: "User not linked" });
        }

        if (parseInt(userId) !== parseInt(req.params[paramField])) {
            return res.status(403).json({ message: "Not authorized" });
        }

        next();
    };
}

module.exports = { authenticate, checkRole, checkOwnership };