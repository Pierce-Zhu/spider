'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger();
var cheerio = require('cheerio');
var async = require('async');
var moment = require('moment');
var parseString = require('xml2js');
var myhttp = require('../lib/myhttp');
var common = require('../lib/common');
var Mysql = require('../lib/mysqlService');
var URL = require("url");
var http = require("http");
var https = require("https");

//门店进发业务明细 data
var getRepOrder = function(url, params,searchParam, cookie, callback) {
    myhttp._post(url, params, cookie, function(data) {
        var dataArr = [];  //需要插入的数据
        // return false;
        var type = searchParam.type;   //抓取数据类型
        logger.info('type in service..........', type);
        dataParse(data.body, dataArr, type, function(er, response, dataArr) {
            //获取总记录条数
            var $ =   cheerio.load(response['partial-response'].changes.update[0]);
            var records = $('.totalPages').find('.ui-widget').text();
            //获取新的viewstate
            var newViewState = cheerio.load(response['partial-response'].changes.update[1]).text(); 
            // logger.info("new viewState>>>>>>>>>>>>>", newViewState);
            records = records.replace(/\s+/g, "");
            records = records.match(/共(\S*)条/)[1];
            logger.info('records length ', records);
            var pageSize = Number(searchParam.pageSize);
            // logger.info("init dataArr length ..........", dataArr.length);
            logger.info("init dataArr0...........", dataArr[0]);
            //需要分页
            if(records > pageSize) {
                insertData(dataArr, type, function(er) {
                    if(er) {
                        logger.info("er in dataService insert sqol>>>>>>>>>>>>>", er);
                        callback(er, records);
                        return false;
                    }
                    var loopArr = [];
                    for(var i = 0; i < (Math.floor(records/pageSize)); i++) {
                        loopArr.push(i + 1);
                    }
                    logger.info('loopArr', loopArr,records/pageSize);
                    params['javax.faces.source'] = searchParam.Source;
                    delete params[searchParam.deleteParam];
                    params[searchParam.mainFormNext] = searchParam.mainFormNext;
                    params['javax.faces.ViewState'] = newViewState;
                    if(type === 'zlsp') {
                        params['javax.faces.partial.render'] = searchParam.renderParam;
                        // params['javax.faces.ViewState'] = newViewState;
                    }
                    async.eachSeries(loopArr, function(it, cb) {
                        logger.info('it', it);
                        params[searchParam.pageParam] = ''+it;   //分页后从1 开始
                        var arrPage = [];    //每次分页数据
                        myhttp._post(url, params, cookie, function(dataPage) {
                            dataParse(dataPage.body, arrPage, type, function(er1, rs, rsData) {
                                insertData(rsData, type, function(er3) {
                                    if(er3) {
                                        logger.info("er in dataService insert sql>>>>>>>>>>>>>", er3);
                                        cb(er3)
                                        return false;
                                    }
                                    cb(null);
                                })
                                // cb();
                            });
                        });
                    }, function(err) {
                        logger.info('插入页数 in service.getRepOrder', loopArr.length);
                        callback(err, records);
                    });    
                })
                   
            } else {
                insertData(dataArr, type, function(er) {
                    if(er) {
                        logger.info("er in dataService insert sqol>>>>>>>>>>>>>", er);
                        return false;
                    }
                    callback(er, records);
                })
            }     
        }); 
    });
}


//资料商品数据
// data
var getZlsp = function(url, params,searchParam, cookie, callback) {
    myhttp._post(url, params, cookie, function(data) {
        var dataArr = [];  //需要插入的数据
        // logger.info('data result in service..........', data);
        // return false;
        var type = searchParam.type;   //抓取数据类型
        logger.info('type in service..........', type);
        dataParse(data.body, dataArr, type, function(er, response, dataArr) {
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
            logger.info("init dataArr length ..........", dataArr.length);
            logger.info("init dataArr0...........", dataArr[0]);
            //需要分页
            if(records > pageSize) {
                var loopArr = [];
                for(var i = 0; i < (Math.floor(records/pageSize)); i++) {
                    loopArr.push(i + 1);
                }
                // logger.info('loopArr', loopArr,records/pageSize);
                params['javax.faces.source'] = searchParam.Source;
                delete params[searchParam.deleteParam];
                params[searchParam.mainFormNext] = searchParam.mainFormNext;
                if(type === 'zlsp') {
                    params['javax.faces.partial.render'] = searchParam.renderParam;
                    params['javax.faces.ViewState'] = newViewState;
                }
                async.eachSeries(loopArr, function(it, cb) {
                    logger.info('it', it);
                    params[searchParam.pageParam] = ''+it;   //分页后从1 开始
                    myhttp._post(url, params, cookie, function(dataPage) {
                        dataParse(dataPage.body, dataArr, type, function(er1, rs, dataArr) {
                            cb();
                        });
                        
                    });
                }, function(err) {
                    logger.info('dataArr final in service.getRepOrder', dataArr.length);
                    callback(null,dataArr,records);
                });   
            } else {
                callback(null,dataArr,records);
            }     
        }); 
    });
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

var dataParse = function(data, dataArr, type, cb) {
    parseString.parseString(data,{ 
        explicitArray : false,
        ignoreAttrs : true },      // { owner: [ "Nic Raboy" ] }改为 { owner: "Nic Raboy" }
    function(err, response){
        if(err) {
            logger.error('err in parseString', err);
            cb(err, null);
            return false;
        }
        // logger.info('dataParse response data', response['partial-response'].changes.update[0]);
        var $ =   cheerio.load(response['partial-response'].changes.update[0]);
        var indexDataNew = $('table').eq(0).find('td.ui-datatable-frozenlayout-left').find('div.ui-datatable-scrollable-body').find('tbody').find('tr');
        //content
        var contentDataNew = $('table').eq(0).find('td.ui-datatable-frozenlayout-right').find('div.ui-datatable-scrollable-body').find('tr');
        // logger.info('contentDataNew.length in dataParse', contentDataNew.eq(0).find('td').eq(9));
        for(var i = 0; i < indexDataNew.length; i++) {
            var dataTemp = [];
            if(type === 'zlsp') {
                dataTemp.push(contentDataNew.eq(i).find('td').eq(1).text());   //商票编码
                dataTemp.push(contentDataNew.eq(i).find('td').eq(4).text());
                dataTemp.push(contentDataNew.eq(i).find('td').eq(5).text());
                dataTemp.push(contentDataNew.eq(i).find('td').eq(6).text());
            } else if(type === 'mdjfyw') {     //门店，进发业务明细表
                dataTemp.push(contentDataNew.eq(i).find('td').eq(0).text());
                dataTemp.push(contentDataNew.eq(i).find('td').eq(1).text());
                dataTemp.push(contentDataNew.eq(i).find('td').eq(3).text() + ''); //门店
                dataTemp.push(contentDataNew.eq(i).find('td').eq(5).text());   //单号
                dataTemp.push(contentDataNew.eq(i).find('td').eq(8).text());    //商品信息
                dataTemp.push(contentDataNew.eq(i).find('td').eq(10).text());  //数量
                dataTemp.push(contentDataNew.eq(i).find('td').eq(13).text());  //生产日期
                dataTemp.push(contentDataNew.eq(i).find('td').eq(14).text());  //过期日
                dataTemp.push(contentDataNew.eq(i).find('td').eq(18).text());  //单价
                dataTemp.push(contentDataNew.eq(i).find('td').eq(19).text());  //金额
                dataTemp.push(contentDataNew.eq(i).find('td').eq(20).text());  //含税成本价
                dataTemp.push(contentDataNew.eq(i).find('td').eq(23).text());   //不含税成本价
                dataTemp.push(contentDataNew.eq(i).find('td').eq(24).text());   //税率
                dataTemp.push(contentDataNew.eq(i).find('td').eq(25).text());   //税额
            } else if(type === 'stock') {
                dataTemp.push(contentDataNew.eq(i).find('td').eq(0).text());
                dataTemp.push(contentDataNew.eq(i).find('td').eq(1).text());
                dataTemp.push(contentDataNew.eq(i).find('td').eq(3).text() + ''); //门店
                dataTemp.push(contentDataNew.eq(i).find('td').eq(4).text());   //单号
                dataTemp.push(contentDataNew.eq(i).find('td').eq(6).text());    //商品信息
                dataTemp.push(contentDataNew.eq(i).find('td').eq(8).text());  //数量
                dataTemp.push(contentDataNew.eq(i).find('td').eq(13).text());  //生产日期
                dataTemp.push(contentDataNew.eq(i).find('td').eq(14).text());  //过期日
                dataTemp.push(contentDataNew.eq(i).find('td').eq(17).text());  //单价
                dataTemp.push(contentDataNew.eq(i).find('td').eq(18).text());  //金额
                dataTemp.push(contentDataNew.eq(i).find('td').eq(21).text());  //含税成本价
                dataTemp.push(contentDataNew.eq(i).find('td').eq(22).text());   //不含税成本价
                dataTemp.push(contentDataNew.eq(i).find('td').eq(23).text());   //税率
                dataTemp.push(contentDataNew.eq(i).find('td').eq(24).text());   //税额 
            } else if (type === 'return') {
                dataTemp.push(contentDataNew.eq(i).find('td').eq(0).text());
                dataTemp.push(contentDataNew.eq(i).find('td').eq(1).text());   //单号
                dataTemp.push(contentDataNew.eq(i).find('td').eq(3).text() + ''); //门店
                dataTemp.push(contentDataNew.eq(i).find('td').eq(7).text());  //含税金额
                dataTemp.push(contentDataNew.eq(i).find('td').eq(8).text());   //不含税金额
                dataTemp.push(contentDataNew.eq(i).find('td').eq(9).text());   //税额
                dataTemp.push(contentDataNew.eq(i).find('td').eq(10).text());   //审核日期 
                dataTemp.push(contentDataNew.eq(i).find('td').eq(14).text());   //结算状态 
                dataTemp[7] == '已完成' ? dataTemp[7] = '0' : dataTemp[7] = '1';
            }
            dataArr.push(dataTemp);
        }
        logger.info('dataArr. length in dataParse.....', dataArr.length);
        cb(null, response, dataArr);
    });
}

//数据插入
var insertData = function(data, type, callback) {
    async.eachSeries(data,function(it, callback){
        var sql = '';
        if(type === 'zlsp') {
            sql += 'insert into product(productCode, productDm, productinfo, enterprise) values(?,?,?,?)';
        } else if(type === 'mdjfyw') {
            sql += 'insert into reporder(date, productCode, store, receiptno,productinfo,number,begindate,enddate,prize,amount,cost,cose_notax,taxrate,taxamount) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
        } else if(type === 'stock') {
            sql += 'insert into stock(date, productCode, stockno,store,productinfo,number,begindate,enddate,prize,amount,cost,cose_notax,taxrate,taxamount) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
        } else if(type === 'return') {    //仓库退货
            sql += 'insert into returnin(date,receiptno,store,amountTax,amountNotax,taxamount,confirmdate,status) values(?,?,?,?,?,?,?,?)'; 
        }
        Mysql.queryInsert(sql, it, function(errInsert, row, field) {
            callback(errInsert);
        })
    }, function(errSql) {
        if(errSql) {
            logger.info("repOder insert err", errSql);
            // res.send('门店进发业务明细数据插入失败');
            callback(errSql);
            return false;
        }
        callback(null);
    });
}

module.exports = {
    'getRepOrder': getRepOrder,
    'getViewState': getViewState,
    'getCookieNew': getCookieNew,
    'insertData': insertData,
}