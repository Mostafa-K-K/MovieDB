const { ObjectID } = require('mongodb');
const auth = require('../middleware/auth');

const movies = [
    { title: 'Jaws', year: 1975, rating: 8 },
    { title: 'Avatar', year: 2009, rating: 7.8 },
    { title: 'Brazil', year: 1985, rating: 8 },
    { title: 'الإرهاب والكباب‎', year: 1992, rating: 6.2 }
]

const mapping = {
    'by-date': 'year',
    'by-rating': 'rating',
    'by-title': 'title'
}

function insertDocsIfEmpty(collection) {
    collection.find({}).toArray((e, res) => {
        if (res.length === 0) collection.insertMany(movies);
    });
}

function routes(app, db) {
    const collection = db.collection('movies');
    insertDocsIfEmpty(collection);

    app.get('/movies/read', auth, async function (req, res) {
        let movies = await collection.find({}).toArray();
        res.send({ status: 200, data: movies });
    });

    app.get('/movies/read/:sort', async function (req, res) {
        let { sort } = req.params;
        let sortingKey = mapping[sort];
        let options = { sort: { [sortingKey]: -1 } };
        let movies = await collection.find({}, options).toArray();

        res.send({ status: 200, data: movies });
    });

    app.get('/movies/read/id/:id', async function (req, res) {
        let { id } = req.params;
        let movie = await collection.findOne({ _id: ObjectID(id) });
        if (!movie) return res.status(404).json({
            status: 404, error: true, message: 'the movie <ID> does not exist'
        });
        res.send({ status: 200, data: movie });
    });

    app.post('/movies/create', async function (req, res) {
        let { title, year, rating = 4 } = req.body;
        if (year) year = parseInt(year);

        let bodyOkay = title && year && year.toString().length === 4 && typeof year === "number";
        if (!bodyOkay) return res.status(403).json({
            status: 403,
            error: true,
            message: 'you cannot create a movie without providing a title and a year'
        });

        await collection.insert({ title, year, rating });
        let movies = await collection.find({}).toArray();

        res.send({ status: 200, data: movies });
    });

    app.delete('/movies/delete/:id', async function (req, res) {
        let { id } = req.params;
        let movie = await collection.findOne({ _id: ObjectID(id) });
        if (!movie) return res.status(404).json({
            status: 404, error: true, message: 'the movie <ID> does not exist'
        });

        await collection.deleteOne({ _id: ObjectID(id) });
        let movies = await collection.find({}).toArray();

        res.send({ status: 200, data: movies });
    });

    app.put('/movies/update/:id', async function (req, res) {
        let { id } = req.params;
        let { title, year, rating } = req.body;
        if (year) year = parseInt(year);

        let bodyOkay = title || (year && year.toString().length === 4 && typeof year === "number") || rating;
        if (!bodyOkay) return res.status(403).json({
            status: 403,
            error: true,
            message: 'you cannot update the movie'
        });

        let movie = await collection.findOne({ _id: ObjectID(id) });
        if (!movie) return res.status(404).json({
            status: 404, error: true, message: 'the movie <ID> does not exist'
        });

        let modifications = {}
        if (title) modifications.title = title;
        if (year) modifications.year = year;
        if (rating) modifications.rating = rating;

        await collection.update({ _id: ObjectID(id) }, {
            $set: modifications
        });

        let movies = await collection.find({}).toArray();

        res.send({ status: 200, data: movies });
    });
}

module.exports = routes;