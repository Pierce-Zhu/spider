'use strict';

var mongoose = require('mongoose');

var cookiesModel = function() {

	var cookiesSchema = mongoose.Schema({
		host: String, //标志该cookie属于哪个host
		CNZZDATA1000462982: String, 	
		JSESSIONIDNB:String,    
		JSESSIONID: String,  
		time: String,	//连接时间
		_q: String, 
		_t: String,
		_v: String
	});

	return mongoose.model('Cookies', cookiesSchema, 'cookies');
};

module.exports = new cookiesModel();