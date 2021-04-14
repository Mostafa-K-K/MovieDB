const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectID } = require('mongodb');

const users = [
    { username: 'admin', password: 'password' },
    { username: 'user', password: 'password' }
]

const mapping = {
    'by-username': 'username'
}

function insertDocsIfEmpty(collection) {
    collection.find({}).toArray((e, res) => {
        if (res.length === 0) collection.insertMany(users);
    });
}

function routes(app, db) {
    const collection = db.collection('users');
    insertDocsIfEmpty(collection);

    app.get('/users/read', async function (req, res) {
        let users = await collection.find({}).toArray();
        res.send({ status: 200, data: users });
    });

    app.get('/users/read/:sort', async function (req, res) {
        let { sort } = req.params;
        let sortingKey = mapping[sort];
        let options = { sort: { [sortingKey]: -1 } };
        let users = await collection.find({}, options).toArray();

        res.send({ status: 200, data: users });
    });

    app.get('/users/read/id/:id', async function (req, res) {
        let { id } = req.params;
        let user = await collection.findOne({ _id: ObjectID(id) });
        if (!user) return res.status(404).json({
            status: 404, error: true, message: 'the user <ID> does not exist'
        });
        res.send({ status: 200, data: user });
    });

    app.delete('/users/delete/:id', async function (req, res) {
        let { id } = req.params;
        let user = await collection.findOne({ _id: ObjectID(id) });
        if (!user) return res.status(404).json({
            status: 404, error: true, message: 'the user <ID> does not exist'
        });

        await collection.deleteOne({ _id: ObjectID(id) });
        let users = await collection.find({}).toArray();

        res.send({ status: 200, data: users });
    });

    app.put('/users/update/:id', async function (req, res) {
        let { id } = req.params;
        let { username } = req.body;

        let bodyOkay = username;
        if (!bodyOkay) return res.status(403).json({
            status: 403,
            error: true,
            message: 'you cannot update the user'
        });

        let user = await collection.findOne({ _id: ObjectID(id) });
        if (!user) return res.status(404).json({
            status: 404, error: true, message: 'the user <ID> does not exist'
        });

        let modifications = {}
        if (username) modifications.username = username;

        await collection.update({ _id: ObjectID(id) }, {
            $set: modifications
        });

        let users = await collection.find({}).toArray();

        res.send({ status: 200, data: users });
    });

    /** signup */

    app.post("/signup", async (req, res) => {

        const { username, email, password: p } = req.body;
        if (!email || !p) return res.status(400).json({ message: "Email and password are required" });

        try {
            const foundUser = await collection.findOne({ email });
            if (foundUser) return res.status(400).json({ message: "User Already Exists" });

            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(p, salt);

            const user = await collection.insertOne({ username, email, password });
            const id = user && user.insertedCount;

            const payload = {
                user: { id }
            };

            jwt.sign(payload, "randomString", { expiresIn: 10000 }, (err, token) => {
                if (err) throw err;
                res.send({ id, token });
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Error in Saving" });
        }
    });

    /** login */

    app.post("/login", async (req, res) => {

        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

        try {

            const user = await collection.findOne({ email });
            if (!user) return res.status(400).json({ message: "User Not Exist" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: "Incorrect Password !" });

            const id = user && user._id;
            const payload = {
                user: { id }
            };

            jwt.sign(payload, "randomString", { expiresIn: 10000 }, (err, token) => {
                if (err) throw err;
                res.send({ id, token });
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Server Error" });
        }
    });

}

module.exports = routes;