var express = require('express');
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send("Ok");
});

app.get('/test', function (req, res) {
    res.send({ status: 200, message: "ok" });
});

app.get('/time', function (req, res) {
    let time = new Date();
    let str = time.getHours() + ":" + time.getMinutes();
    res.send({ status: 200, message: str });
});

app.get('/hello/:id', function (req, res) {
    let str = `Hello, ${req.params.id}`
    res.send({ status: 200, message: str });
});

app.get('/hello', function (req, res) {
    let str = "Hello"
    res.send({ status: 200, message: str });
});

app.get('/search', function (req, res) {
    let { s } = req.query;
    if (s) return res.send({ status: 200, message: "ok", data: s });
    res.status(500).json({ status: 500, error: true, message: "you have to provide a search" });
});

/**
 * Movies: CRUD
 */

let movies = [
    { id: 1, title: 'Jaws', year: 1975, rating: 8 },
    { id: 2, title: 'Avatar', year: 2009, rating: 7.8 },
    { id: 3, title: 'Brazil', year: 1985, rating: 8 },
    { id: 4, title: 'الإرهاب والكباب‎', year: 1992, rating: 6.2 }
]

let mapping = {
    'by-date': 'year',
    'by-rating': 'rating',
    'by-title': 'title'
}

let orderArrayBy = (arr, sortBy) => {
    let m = [...arr];
    let key = mapping[sortBy];
    m.sort((a, b) => {
        let isString = typeof a[key] === "string";
        if (isString) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
            return 0;
        }
        return b[key] - a[key];
    })
    return m;
}

app.get('/movies/read', function (req, res) {
    res.send({ status: 200, data: movies });
});

app.get('/movies/read/:sort', function (req, res) {
    let { sort } = req.params;
    let sortedMovies = orderArrayBy(movies, sort);
    res.send({ status: 200, data: sortedMovies });
});

app.get('/movies/read/id/:id', function (req, res) {
    let { id } = req.params;
    let movie = movies.find(item => item.id == id);
    if (!movie) return res.status(404).json({
        status: 404, error: true, message: 'the movie <ID> does not exist'
    });
    res.send({ status: 200, data: movie });
});

app.post('/movies/add', function (req, res) {
    let { title, year, rating = 4 } = req.body;
    if (year) year = parseInt(year);

    let bodyOkay = title && year && year.toString().length === 4 && typeof year === "number";
    if (!bodyOkay) return res.status(403).json({
        status: 403,
        error: true,
        message: 'you cannot create a movie without providing a title and a year'
    });

    let id = [...movies].reverse()[0].id + 1;
    let newMovie = { id, title, year, rating };
    movies.push(newMovie);

    res.send({ status: 200, data: movies });
});

app.delete('/movies/delete/:id', function (req, res) {
    let { id } = req.params;
    let movie = movies.find(item => item.id == id);
    if (!movie) return res.status(404).json({
        status: 404, error: true, message: 'the movie <ID> does not exist'
    });

    movies = movies.filter(item => item.id != id);
    res.send({ status: 200, data: movies });
});

app.put('/movies/update/:id', function (req, res) {
    let { id } = req.params;
    let { title, year, rating } = req.body;
    if (year) year = parseInt(year);

    let bodyOkay = title || (year && year.toString().length === 4 && typeof year === "number") || rating;
    if (!bodyOkay) return res.status(403).json({
        status: 403,
        error: true,
        message: 'you cannot update the movie'
    });

    let movie = movies.find(item => item.id == id);
    if (!movie) return res.status(404).json({
        status: 404, error: true, message: 'the movie <ID> does not exist'
    });

    if (title) movie.title = title;
    if (year) movie.year = year;
    if (rating) movie.rating = rating;

    res.send({ status: 200, data: movies });
});

// listen on port 3000

app.listen(3000);