'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger();
var cheerio = require('cheerio');
var async = require('async');
var moment = require('moment');
var parseString = require('xml2js');
var myhttp = require('../lib/myhttp');
var common = require('../lib/common');
var URL = require("url");
var http = require("http");
var https = require("https");

//仓库入库单 data
var getRepOrder = function(url, params,searchParam, cookie, callback) {
    myhttp._post(url, params, cookie, function(data) {
        var dataArr = [];  //需要插入的数据
        // logger.info('data result in service..........', data);
        // return false;
        dataParse(data.body, dataArr, function(er, response, dataArr) {
            //获取总记录条数
            var $ =   cheerio.load(response['partial-response'].changes.update[0]);
            var records = $('.totalPages').find('.ui-widget').text();
            //获取新的viewstate
            var newViewState = cheerio.load(response['partial-response'].changes.update[1]).text(); 
            // logger.info('newViewState detail ', newViewState);
            records = records.replace(/\s+/g, "");
            records = records.match(/共(\S*)条/)[1];
            logger.info('records length ', records);
            var pageSize = Number(searchParam.pageSize);
            logger.info("init dataArr0...........", dataArr[0]);
            //需要分页
            if(records > pageSize) {
                var loopArr = [];
                for(var i = 0; i < (Math.floor(records/pageSize)); i++) {
                    loopArr.push(i + 1);
                }
                // loopArr = [1,2];
                logger.info('loopArr', loopArr,records/pageSize);
                // if(searchParam.type === 'ckrkd') {
                    params['javax.faces.source'] = searchParam.Source;
                    delete params[searchParam.deleteParam];
                    params[searchParam.mainFormNext] = searchParam.mainFormNext;
                    params['javax.faces.partial.render'] = searchParam.renderParam;
                    params['javax.faces.ViewState'] = newViewState;
                    async.eachSeries(loopArr, function(it, cb) {
                        logger.info('it', it);
                        params[searchParam.pageParam] = ''+it;   //分页后从1 开始
                        myhttp._post(url, params, cookie, function(dataPage) {
                            dataParse(dataPage.body, dataArr, function(er1, rs, dataArr) {
                                // var $ =   cheerio.load(rs['partial-response'].changes.update[0]);
                                // var indexDataNew = $('table').eq(0).find('td.ui-datatable-frozenlayout-left').find('div.ui-datatable-scrollable-body').find('tbody').find('tr');
                                // //content
                                // var contentDataNew = $('table').eq(0).find('td.ui-datatable-frozenlayout-right').find('div.ui-datatable-scrollable-body').find('tr');
                                // for(var i = 0; i < indexDataNew.length; i++) {
                                //     var dataTemp = [];
                                //     dataTemp.push(indexDataNew.eq(i).text());
                                //     dataTemp.push(contentDataNew.eq(i).find('td').eq(0).text());
                                //     dataTemp.push(contentDataNew.eq(i).find('td').eq(1).text());
                                //     dataTemp.push(contentDataNew.eq(i).find('td').eq(2).text());
                                //     dataTemp.push(contentDataNew.eq(i).find('td').eq(3).text() + '');
                                //     dataTemp.push(Number(contentDataNew.eq(i).find('td').eq(4).text()));
                                //     dataTemp.push(contentDataNew.eq(i).find('td').eq(5).text());
                                //     dataTemp.push(contentDataNew.eq(i).find('td').eq(6).text());
                                //     dataArr.push(dataTemp);
                                // }
                                cb();
                            });
                            
                        });
                    }, function(err) {
                        logger.info('dataArr final in service.getRepOrder', dataArr.length);
                        callback(null,dataArr,records);
                    });   
                // } else if()
            } else {
                callback(null,dataArr,records);
            }     
        }); 
    });
}

//资料商品数据
var getZlProduct = function(url, params,searchParam, cookie, callback) {
}

//直接从数据页获取cookie
var getCookieNew = function(url, cb) {
    var _url = URL.parse(url);
    var httpType = _url.protocol ===  "https:" ? https : http;
    httpType.get(url, function(res) {
        res.setEncoding('binary');
        var resData = '', cookie = '';
        res.on('data', function(chunk) {
            resData += chunk;
        });

        cookie = res.headers['set-cookie'];
        cookie = cookie[0].split(";")[0];
        logger.info('cookie by page .>>>>>>', cookie);

        res.on('end', function() {
            var cookie_ = cookie;
            cb(null, cookie_);
        });

        res.on('error', function(err) {
            logger.error('_get_cookie err-->', err);
            cb(err, null);
            return false;
        })
    });
}

//获取隐藏域
var getViewState = function(url, callback) { //适用于资料商品
    myhttp._get(url, {}, function(data) {
        //返回数据为html
        var $ = cheerio.load(data.body);
        // var viewState = $('form').eq(0).find('input').eq(8).attr('value');
        var viewState = $('input[name="javax.faces.ViewState"]').attr('value');
        callback(viewState);
    });
}

var dataParse = function(data, dataArr, cb) {
    parseString.parseString(data,{ 
        explicitArray : false,
        ignoreAttrs : true },      // { owner: [ "Nic Raboy" ] }改为 { owner: "Nic Raboy" }
    function(err, response){
        if(err) {
            logger.error('err in parseString', err);
            cb(err, null);
            return false;
        }
        logger.info('dataParse response data', response);
        return false;
        // logger.info('dataParse response data', response['partial-response'].changes.update[0]);
        var $ =   cheerio.load(response['partial-response'].changes.update[0]);
        var indexDataNew = $('table').eq(0).find('td.ui-datatable-frozenlayout-left').find('div.ui-datatable-scrollable-body').find('tbody').find('tr');
        //content
        var contentDataNew = $('table').eq(0).find('td.ui-datatable-frozenlayout-right').find('div.ui-datatable-scrollable-body').find('tr');

        // logger.info('indexDataNew.length in parse', indexDataNew.length);
        for(var i = 0; i < indexDataNew.length; i++) {
            var dataTemp = [];
            dataTemp.push(indexDataNew.eq(i).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(0).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(1).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(2).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(3).text() + '');
            dataTemp.push(contentDataNew.eq(i).find('td').eq(4).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(5).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(6).text());
            dataArr.push(dataTemp);
        }
        // logger.info('dataArr......', dataArr);
        cb(null, response, dataArr);
    });
}

module.exports = {
    'getRepOrder': getRepOrder,
    'getViewState': getViewState,
    'getCookieNew': getCookieNew,
}