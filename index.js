const express = require('express');
const bodyParser = require("body-parser");
const { url } = require('./config/db');
const MongoClient = require('mongodb').MongoClient;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send("Ok");
});

MongoClient.connect(url, { useUnifiedTopology: true }, (e, client) => {
    if (e) return console.error(e);
    const db = client.db("movieDB");
    require('./routes/users')(app, db);
    require('./routes/movies')(app, db);
});

app.listen(3000);