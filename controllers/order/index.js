var express = require('express'),
    app = express(),
    cheerio = require('cheerio'),
    request = require('request'),
    log4js = require('log4js'),
    logger = log4js.getLogger();
var URL = require("url");
var xmlreader = require("xmlreader");
var async = require('async');

var cookDb = require('../../models/cookies'); //cookie表
var Mysql = require('../../lib/mysqlService');
var dataService = require('../../service/getData');
var myHttp = require('../../lib/myhttp');


module.exports = function(router) {

    var host = 'saas.gooddrug.cn';
    var urlBuy = 'http://saas.gooddrug.cn/views/center/inv/purIn/list.views';//采购验收入库单查询url
    var urlProduct = 'http://saas.gooddrug.cn/views/center/doc/god/list.views'; //资料-》商品
    var urlJfywmx = 'http://saas.gooddrug.cn/views/center/inv/rep/inoutItemRep.views';  //仓库进发业务明细表

    //进入门店订单页
    router.get('/orderPage', function(req, res) {
        var cond = {
            host: 'http://saas.gooddrug.cn', //
            url: url_order,   //必须
            path:'/views/center/str/rep/purOrderListRep.views',
            method: "get",
            gzip: true,    //解决乱码问题
            headers: { 
                "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",    
                "Accept":"text/plain, */*; q=0.01",
                "X-Requested-With":'XMLHttpRequest',
                "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                "Accept-Encoding": "gzip, deflate, sdch",
                "Accept-Language":"zh-CN, zh;q=0.8",
                "Host":"saas.gooddrug.cn",
                "Referer": url_order,
                "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36",
                "Cookie": 'g=2017-08-06; bfAppId=2; bfId=10121;JSESSIONID=C2BCCEF432A87EECAE7A8B87505FB9AE.pro_rtl_1'
            }   
        };
        request(cond, function(err, rs, body) {
            if(err) {
                logger.error('er in .../account/orders', err);
                return false;
            }
            rs.setEncoding("utf8");
            if(!err && rs.statusCode == 200) {
                $ = cheerio.load(body);
                // logger.info("form detail", $('#mainForm'));
                res.json({
                    body: body
                })
                return false;
            }
        })
    });


    //资料商品页数据
    router.get('/productInfo', function(req, res) {
        dataService.getViewState(urlProduct, function(viewState) {
            // logger.info("productInfo  viewState", viewState);
            var searchParam = {
                // begDate: '2017-08-01',
                pageSize: '20',  //该值会对应viewstate
                type: 'zlsp',        //查询类型
                Source: 'mainForm:j_idt93:n_next',
                mainFormNext: 'mainForm:j_idt93:n_next',
                deleteParam: 'mainForm:j_idt44',
                renderParam: 'mainForm:mainContent',
                pageParam: 'mainForm:j_idt93:pageNumber'  //分页
            }

            cookDb.findOne({'host': host}, function(err, result) {
                if(err) {
                    logger.error('获取cookie失败，请登录', err);
                    res.send('获取cookie失败，请登录');
                    return false;
                }
                var tempCookie = result.JSESSIONID;
                tempCookie = 'JSESSIONID=0821985C7266B78502DC4D928CABAC2D';
                logger.info('tempCookie in productInfo', tempCookie);
                var params = {
                    'javax.faces.partial.ajax':'true',
                    'javax.faces.source':"mainForm:j_idt44",
                    'javax.faces.partial.execute': '@all',
                    'javax.faces.partial.render':'mainForm:listMain',
                    'mainForm:j_idt44': 'mainForm:j_idt44',
                    'mainForm':'mainForm',
                    'mainForm:j_idt18': '',
                    'mainForm:select': '-1',
                    'mainForm:j_idt25': '50',   //商品类型，50-食品，60化妆品70-其他用品，90消毒产品
                    'mainForm:j_idt30': '',
                    'mainForm:j_idt35': '',
                    'mainForm:j_idt40_input': '',
                    'mainForm:j_idt42_input': '',
                    'mainForm:selectedRow': '',
                    'mainForm:list_selection': '',
                    'mainForm:list_scrollState': '0,0',
                    'mainForm:j_idt93:n_pageSize': searchParam.pageSize,
                    'mainForm:j_idt93:pageNumber': '1',
                    'javax.faces.ViewState': viewState+''
                };
                dataService.getRepOrder(urlProduct, params, searchParam, tempCookie, function(er,dataArr, records) {
                    if(er) {
                        logger.info("数据获取失败", er);
                        res.send('数据获取失败');
                        return false;
                    }
                    logger.info('data...........', dataArr.length);
                    logger.info("records..........", records);
                    if(records == 0) {
                        logger.info('没有数据记录！');
                        res.send('采购验收入库单数据插入失败');
                        return false;
                    }
                    async.eachSeries(dataArr,function(it, callback){
                        var sql = 'insert into product values(?,?,?)';
                        // logger.info('dataarr element detail', it);
                        var arrTemp = [it[5], it[6], it[7]];
                        //不同商品可能对应同一个商品代码
                        // logger.info('arrTemp element detail', arrTemp);
                        Mysql.queryInsert(sql, arrTemp, function(errInsert, row, field) {
                            callback(errInsert);
                        })
                    }, function(errSql) {
                        if(errSql) {
                            logger.info("repOder insert err", errSql);
                            res.send('采购验收入库单数据插入失败');
                            return false;
                        }
                        res.send('采购验收入库单数据保存成功');
                    });
                });
            });    
        })
        
    });

    //  仓库 仓库进发业务明细表   
    // *****/views/center/inv/rep/inoutItemRep.views
    router.get('/repoData', function(req, res) {
        dataService.getViewState(urlJfywmx, function(viewState) {
            // logger.info("repoData  viewState", viewState);
            var searchParam = {
                begDate: '2017-09-03',
                endDate: '2017-09-03',
                pageSize: '30',
                // type: 'ckrkd'        //查询类型
            }
            dataService.getCookieNew(urlJfywmx, function(err, result) {
                if(err) {
                    logger.error('获取cookie失败', err);
                    res.send('获取cookie失败，请登录');
                    return false;
                }
                logger.info('result>>>>>>>>>>>>>>', result);
                var tempCookie = result;
                tempCookie = 'JSESSIONID=0821985C7266B78502DC4D928CABAC2D';
                logger.info('tempCookie', tempCookie);
                // return false;
                var params = {
                    'javax.faces.partial.ajax':'true',
                    'javax.faces.source':"mainForm:headerContent:j_idt35",
                    // 'javax.faces.source':"mainForm:j_idt80:n_next",
                    'javax.faces.partial.execute': '@all',
                    'javax.faces.partial.render':'mainForm:listMain',
                    'mainForm:headerContent:j_idt35': 'mainForm:headerContent:j_idt35',
                    // 'mainForm:j_idt80:n_next':'mainForm:j_idt80:n_next',
                    'mainForm':'mainForm',
                    'mainForm:headerContent:j_idt17': '', 
                    'mainForm:headerContent:j_idt34_input' : searchParam.begDate,    
                    'mainForm:headerContent:j_idt36_input': searchParam.endDate,     
                    'mainForm:j_idt49_selection': '',  
                    'mainForm:j_idt49_scrollState' :'0,0',
                    'mainForm:j_idt80:n_pageSize': searchParam.pageSize,        //每次上限为100条
                    'mainForm:j_idt80:pageNumber': '1',
                    //该参数会定时过期
                    'javax.faces.ViewState': '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'
                };

                dataService.getRepOrder(urlJfywmx, params, searchParam, tempCookie, function(er,dataArr, records) {
                    if(er) {
                        logger.info("数据获取失败", er);
                        res.send('数据获取失败');
                        return false;
                    }
                    logger.info('data...........', dataArr.length);
                    logger.info("records..........", records);
                    if(records == 0) {
                        logger.info('没有数据记录！');
                        res.send('没有数据记录,采购验收入库单数据插入失败');
                        return false;
                    }
                    async.eachSeries(dataArr,function(it, callback){
                        var sql = 'insert into reporder values(?,?,?,?)';
                        var arrTemp = [it[1],it[2], it[4], it[7]];
                        Mysql.queryInsert(sql, it, function(errInsert, row, field) {
                            callback(errInsert);
                        })
                    }, function(errSql) {
                        if(errSql) {
                            logger.info("repOder insert err", errSql);
                            res.send('采购验收入库单数据插入失败');
                            return false;
                        }
                        res.send('采购验收入库单数据保存成功');
                    });
                });
            }); 
        });
        
    });

    //



















    //提交表单，获取订单信息 使用request 
    //no use
    router.get('/orders/data', function(req, res) {
        cond['method'] = 'post';
        cond['formData'] = {
            'javax.faces.partial.ajax':'true',
            'javax.faces.source:mainForm':'j_idt21',
            'javax.faces.partial.execute': '@all',
            'javax.faces.partial.render:mainForm': 'listMain',
            'mainForm':'j_idt21:mainForm:j_idt21',
            'mainForm':'mainForm',
            'mainForm':'queryText:',
            'mainForm':'j_idt17_input:2017-05-01',
            'mainForm':'j_idt19_input:2017-08-06',
            'mainForm':'j_idt22_selection:',
            'mainForm:j_idt22_scrollState':'0,0',
            'mainForm:j_idt65:n_pageSize':20,
            'mainForm:j_idt65:pageNumber':1,
            'javax.faces.ViewState':'deYjOr7eVwyASFQsXoSucAvoFFgtJT3bP1ev1GUjbrNNQRiKz1IzqA5JXaAdzkEoPnr9rXH2WVRckOptu/OZroEmS0jMkZxSbNEXNDJ41cNYeySQtaOZ3VA31khWjTYUP5pjHWv9Ce+WGTG331MOzXAE1wSgU/Yf6Ly28JqObZHajmPgRCDe1bO1ru'
        }
        var params = cond.formData.toString();
        logger.info('params..........', params);
        // request(cond, function(err, rs, body) {
        request(url_order, params, function(err, rs, body) {
            if(err) {
                logger.error('er in .../account/orders', err);
                return false;
            }
            rs.setEncoding("utf8");
            if(!err && rs.statusCode == 200) {
                $ = cheerio.load(body);
                logger.info("body detail", body);
                // logger.info("form detail", $('#j_id1'));
                res.render({
                    body: body
                })
            }
        })
    });


};


