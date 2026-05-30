const jwt = require('jsonwebtoken');

const fetchuser = (req, res, next) => {
    // 1. Frontend se aane wali request ke header se 'auth-token' (VIP Pass) nikalna
    const token = req.header('auth-token');
    
    // 2. Agar token hai hi nahi, toh bhaga do
    if (!token) {
        return res.status(401).send({ error: "Access Denied! Bhai token kahan hai?" });
    }

    try {
        // 3. Token ko apni secret key se verify karo
        // (Dhyan rahe, aapke server.js ya .env mein JWT_SECRET hona zaroori hai)
        const data = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Token asali hai! Ab uske andar chhupi hui user ki details aage bhej do
        req.user = data; 
        
        // 5. Agle function (route) pe jane do
        next(); 
    } catch (error) {
        res.status(401).send({ error: "Nakli token hai bhai! Entry nahi milegi." });
    }
}

module.exports = fetchuser;