const Movie = require('../models/movie');
const Category = require('../models/category');
const koa_request = require("koa-request");
const Promise = require("bluebird");
const request = Promise.promisify(require("request"));
const _ = require("lodash");
const co = require("co");

function updateMovies(movie) {
    let options = {
        url: `https://api.douban.com/v2/movie/subject/${movie.doubanId}`,
        json: true
    };
    request(options).then((response) => {
        let data = response.body;
        _.extend(movie, {
            country: data.countries[0],
            language: data.language,
            summary: data.summary
        });
        let genres = movie.genres;
        if (genres && genres.length > 0) {
            let cateArray = [];
            genres.forEach((genre) => {
                cateArray.push(function* () {
                    let cat = yield Category.findOne({
                        name: genre
                    }).exec();
                    if (cat) {
                        cat.movies.push(movie._id);
                        yield cat.save();
                    } else {
                        cat = new Category({
                            name: genre,
                            movies: [movie._id]
                        });
                        cat = yield cat.save();
                        movie.category = cat._id;
                        yield movie.save();
                    }
                });
            });
            co(function* () {
                yield cateArray;
            });
        } else {
            movie.save();
        }
    });
}

module.exports.findAll = function* () {
    let categories = yield Category.find({}).populate({
        path: 'movies',
        select: 'title poster',
        options: {
            limit: 6
        }
    }).exec();
    return categories;
};

module.exports.searchByCategory = function* (catId) {
    let categories = yield Category.find({
        _id: catId
    }).populate({
        path: 'movies',
        select: 'title poster'
    }).exec();
    return categories;
};

module.exports.searchByName = function* (q) {
    let movies = yield Movie.find({
        title: new RegExp(q + '.*', 'i')
    }).exec();
    return movies;
};

module.exports.searchById = function* (id) {
    let movies = yield Movie.findOne({
        _id: id
    }).exec();
    return movies;
};

module.exports.searchByDouBan = function* (q) {
    let options = {
        url: `https://api.douban.com/v2/movie/search?q=${encodeURIComponent(q)}`
    };
    let response = yield koa_request(options);
    let data = JSON.parse(response.body);
    let subjects = [];
    let movies = [];
    if (data && data.subjects) {
        subjects = data.subjects;
    }
    if (subjects.length > 0) {
        let queryArray = [];
        subjects.forEach((item) => {
            queryArray.push(function* () {
                let movie = yield Movie.findOne({doubanId: item.id});
                if (movie) {
                    movies.push(movie);
                } else {
                    let directors = item.directors || [];
                    let director = directors[0] || {};
                    movie = new Movie({
                        doctor: director.name || "",
                        title: item.title,
                        doubanId: item.id,
                        year: item.year,
                        poster: item.images.large,
                        genres: item.genres || []
                    });
                    movie = yield movie.save();
                    movies.push(movie);
                }
            });
        });
        yield queryArray;
        movies.forEach((movie) => {
            updateMovies(movie);
        });
    }
    return movies;
};