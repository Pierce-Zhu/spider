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
    var url_order = 'http://saas.gooddrug.cn/views/center/inv/purIn/list.views';//采购验收入库单查询url
    var urlProduct = 'http://saas.gooddrug.cn/views/center/doc/god/list.views'; //资料-》商品

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
                tempCookie = 'JSESSIONID=CC2A132E1B423B8F34FEC1D0AE3E183E';
                logger.info('tempCookie', tempCookie);
                var params = {
                    'javax.faces.partial.ajax':'true',
                    'javax.faces.source':"mainForm:j_idt44",
                    'javax.faces.partial.execute': '@all',
                    'javax.faces.partial.render':'mainForm:listMain',
                    'mainForm:j_idt44': 'mainForm:j_idt44',
                    'mainForm':'mainForm',
                    'mainForm:j_idt18': '',
                    'mainForm:select': '-1',
                    'mainForm:j_idt25': '60',   //化妆品
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
                    // if(dataArr[0][0] == '没有数据记录！') {
                    //     logger.info('没有数据记录！');
                    //     return false;
                    // }
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
                        logger.info('arrTemp element detail', arrTemp);
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

    //  仓库 》采购验收入库单信息   
    // *****/views/center/inv/purIn/list.views
    router.get('/repoData', function(req, res) {
        var searchParam = {
            begDate: '2017-08-01',
            endDate: '2017-080-01',
            pageSize: '30',
            type: 'ckrkd'        //查询类型
        }
        cookDb.findOne({'host': host}, function(err, result) {
            if(err) {
                logger.error('获取cookie失败，请登录', err);
                res.send('获取cookie失败，请登录');
                return false;
            }
            // var tempCookie = 'JSESSIONID=' + result.JSESSIONID;
            var tempCookie = result.JSESSIONID;
            tempCookie = 'JSESSIONID=EC5CB63112092BB97EC9E8BC2916196C';
            logger.info('tempCookie', tempCookie);
            var params = {
                'javax.faces.partial.ajax':'true',
                'javax.faces.source':"mainForm:headerContent:j_idt48",
                // 'javax.faces.source':"mainForm:j_idt80:n_next",
                'javax.faces.partial.execute': '@all',
                'javax.faces.partial.render':'mainForm:listMain',
                'mainForm:headerContent:j_idt48': 'mainForm:headerContent:j_idt48',
                // 'mainForm:j_idt80:n_next':'mainForm:j_idt80:n_next',
                'mainForm':'mainForm',
                'mainForm:headerContent:j_idt20': '', 
                'mainForm:headerContent:j_idt34_input' : searchParam.begDate,    
                'mainForm:headerContent:j_idt36_input': searchParam.endDate,     
                'mainForm:headerContent:j_idt40': '31',
                'mainForm:j_idt49_selection': '',  
                'mainForm:j_idt49_scrollState' :'0,0',
                'mainForm:j_idt80:n_pageSize': searchParam.pageSize,        //每次上限为100条
                'mainForm:j_idt80:pageNumber': '1',
                //该参数会定时过期
                'javax.faces.ViewState': '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'
            };

            dataService.getRepOrder(url_order, params, searchParam, tempCookie, function(er,dataArr, records) {
                if(er) {
                    logger.info("数据获取失败", er);
                    res.send('数据获取失败');
                    return false;
                }
                logger.info('data...........', dataArr.length);
                logger.info("records..........", records);
                if(dataArr[0][0] == '没有数据记录！') {
                    logger.info('没有数据记录！');
                    return false;
                }
                async.eachSeries(dataArr,function(it, callback){
                    var sql = 'insert into reporder values(?,?,?,?,?,?,?,?)';
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
        // logger.info('cond..........', cond);
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


