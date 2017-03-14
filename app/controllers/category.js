var Category = require('../models/category');

 // 后台分类录入页
module.exports.toCategoryAddPage = function (req, res) {
    res.render('categoryAdd', {
        title: '电影-后台分类录入页',
        category: {}
    });
};

// 逻辑控制:插入
module.exports.addCategory = function (req, res) {
    var _category = req.body.category;
    var category = new Category(_category);
    category.save(function (err, category) {
        if (err) {
            return console.error(err);
        }
        res.redirect('/admin/category/list');
    });
};

// 分类列表页
module.exports.toCategoryListPage = function (req, res) {
    Category.fetch(function (err, categories) {
        if (err) {
            return console.error(err);
        }
        res.render('categoryList', {
            title:'分类-列表', 
            categories: categories
        });
    });
};