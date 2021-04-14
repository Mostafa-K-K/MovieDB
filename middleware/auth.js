const jwt = require("jsonwebtoken");

function auth(req, res, next) {

    const id = req.header("id");
    const token = req.header("token");

    if (!token) return res.status(401).json({ message: "Auth Error" });

    try {

        const decoded = jwt.verify(token, "randomString");
        req.user = decoded.user;

        const userIdFromToken = decoded.user && decoded.user.id;
        if (id != userIdFromToken) return res.status(401).json({ message: "Auth Error" });

        next();

    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Invalid Token" });
    }
    
}

module.exports = auth;