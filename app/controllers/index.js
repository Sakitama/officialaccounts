const api = require("../api/movie");

module.exports.index = function* (next) {
	let categories = yield api.findAll();
    yield this.render('pages/index', {
        title:'电影-首页',
        categories: categories
    });
};

module.exports.search = function* (next) {
	let catId = this.query.category;
	let title = this.query.title;
	let page = parseInt(this.query.page, 10) || 0;
	let count = 2;
	let index = page * count; //每页第一条数据索引

	//来自分页请求
	if (catId) {
		let categories = yield api.searchByCategory(catId);
        let category = categories[0] || {};
        let movies = category.movies || [];
        let results = movies.slice(index, index + count);
        yield this.render('pages/categoryResult', {
            title:'分类详情页',
            keyword: category.name,
            currentPage: page + 1,
            totalPage: Math.ceil(movies.length / count),
            movies: results,
            query: 'category=' + catId
        });
	} else { //来自搜索框搜索
        let movies = yield api.searchByName(title);
        let results = movies.slice(index, index + count);
        yield this.render('pages/categoryResult', {
            title:'搜索结果详情',
            keyword: title,
            currentPage: page + 1,
            totalPage: Math.ceil(movies.length / count),
            movies: results,
            query: 'title=' + title
        });
	}
};