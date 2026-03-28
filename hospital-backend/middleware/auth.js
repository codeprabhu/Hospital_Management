/*
Middleware for role-based access
*/

function checkRole(allowedRoles) {
    return (req, res, next) => {
        const role = req.headers.role;

        if (!role || !allowedRoles.includes(role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        next();
    };
}

/*
Middleware for ownership checks
*/

function checkOwnership(paramField) {
    return (req, res, next) => {
        const userId = req.headers.user_id;

        if (!userId) {
            return res.status(401).json({ message: "No user_id provided" });
        }

        if (parseInt(userId) !== parseInt(req.params[paramField])) {
            return res.status(403).json({ message: "Not authorized" });
        }

        next();
    };
}

module.exports = { checkRole, checkOwnership };