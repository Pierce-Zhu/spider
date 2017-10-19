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
    var urlMdjfyw = 'http://saas.gooddrug.cn/views/center/str/rep/inoutItemRep.views';  //门店》》进发业务明细表
    var urlStock= 'http://saas.gooddrug.cn/views/center/str/rep/stockItemRep.views';  //门店》》库存明细表
    var urlReturn= 'http://saas.gooddrug.cn/views/center/inv/salReturnIn/list.views';  //仓库》》销售退货入库单

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
                Source: 'mainForm:j_idt97:n_next',
                mainFormNext: 'mainForm:j_idt97:n_next',  //增加该项
                deleteParam: 'mainForm:j_idt44',
                renderParam: 'mainForm:mainContent',
                pageParam: 'mainForm:j_idt97:pageNumber',  //分页
            }

            cookDb.findOne({'host': host}, function(err, result) {
                if(err) {
                    logger.error('获取cookie失败，请登录', err);
                    res.send('获取cookie失败，请登录');
                    return false;
                }
                var tempCookie = result.JSESSIONID;
                tempCookie = 'JSESSIONID=6EE80AB416666CBF39324249B2296682';
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
                    'mainForm:j_idt25': '',   //商品类型，50-食品，60化妆品70-其他用品，90消毒产品
                    'mainForm:j_idt30': '',
                    'mainForm:j_idt35': '',
                    'mainForm:j_idt40_input': '',
                    'mainForm:j_idt42_input': '',
                    'mainForm:selectedRow': '',
                    'mainForm:list_selection': '',
                    'mainForm:list_scrollState': '0,0',
                    'mainForm:j_idt97:n_pageSize': searchParam.pageSize,
                    'mainForm:j_idt97:pageNumber': '0',
                    'javax.faces.ViewState': viewState+''
                };
                dataService.getRepOrder(urlProduct, params, searchParam, tempCookie, function(er, records) {
                    if(er) {
                        logger.info("数据获取失败", er);
                        res.send('数据获取失败');
                        return false;
                    }
                    logger.info("records..........", records);
                    if(records == 0) {
                        logger.info('没有数据记录！');
                        res.send('采购验收入库单数据插入失败');
                        return false;
                    }
                    res.send('成功插入商品数据' + records + '条！');
                    // async.eachSeries(dataArr,function(it, callback){
                    //     var sql = 'insert into product values(?,?,?)';
                    //     //不同商品可能对应同一个商品代码
                    //     Mysql.queryInsert(sql, it, function(errInsert, row, field) {
                    //         callback(errInsert);
                    //     })
                    // }, function(errSql) {
                    //     if(errSql) {
                    //         logger.info("repOder insert err", errSql);
                    //         res.send('采购验收入库单数据插入失败');
                    //         return false;
                    //     }
                    //     res.send('采购验收入库单数据保存成功');
                    // });
                });
            });    
        })
        
    });

    //  门店 》》进发业务明细表   
    // *****/views/center/str/rep/inoutItemRep.views
    router.get('/inoutRepoData', function(req, res) {
        dataService.getViewState(urlMdjfyw, function(viewState) {
            logger.info("repoData  viewState", viewState);
            var searchParam = {
                begDate: '2017-09-03',
                endDate: '2017-09-03',
                pageSize: '20',
                type: 'mdjfyw',        //查询类型
                Source: 'j_idt193:n_next',
                mainFormNext: 'mainForm:mainContent:j_idt193:n_next',
                deleteParam: 'mainForm:headerContent:j_idt35',
                // renderParam: 'mainForm:mainContent',
                pageParam: 'mainForm:mainContent:j_idt193:pageNumber',  //分页
            }
            dataService.getCookieNew(urlMdjfyw, function(err, result) {
                if(err) {
                    logger.error('获取cookie失败', err);
                    res.send('获取cookie失败，请登录');
                    return false;
                }
                var tempCookie = result;
                tempCookie = 'JSESSIONID=1C8EB14E10B19221C11392318D86A545';
                logger.info('tempCookie', tempCookie);
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
                    'mainForm:headerContent:j_idt31_input' : searchParam.begDate,    
                    'mainForm:headerContent:j_idt33_input': searchParam.endDate,     
                    'mainForm:mainContent:dataList_selection': '',  
                    'mainForm:mainContent:dataList_scrollState' :'0,0',
                    'mainForm:mainContent:j_idt193:n_pageSize': searchParam.pageSize,        //每次上限为100条
                    'mainForm:mainContent:j_idt193:pageNumber': '1',
                    //该参数会定时过期
                    'javax.faces.ViewState': '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'
                };

                dataService.getRepOrder(urlMdjfyw, params, searchParam, tempCookie, function(er, records) {
                    if(er) {
                        logger.info("数据获取失败", er);
                        res.send('数据获取失败');
                        return false;
                    }
                    logger.info("records..........", records);
                    if(records == 0) {
                        logger.info('没有数据记录！');
                        res.send('没有数据记录,采购验收入库单数据插入失败');
                        return false;
                    }
                    res.send('成功插入数据' + records + '条！');
                    // async.eachSeries(dataArr,function(it, callback){
                    //     var sql = 'insert into reporder(date, productCode, store, receiptno,productinfo,number,begindate,enddate,prize,amount,cost,cose_notax,taxrate,taxamount) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
                    //     Mysql.queryInsert(sql, it, function(errInsert, row, field) {
                    //         callback(errInsert);
                    //     })
                    // }, function(errSql) {
                    //     if(errSql) {
                    //         logger.info("repOder insert err", errSql);
                    //         res.send('采购验收入库单数据插入失败');
                    //         return false;
                    //     }
                    //     res.send('采购验收入库单数据保存成功');
                    // });
                });
            }); 
        });
        
    });

    /**   门店 》》库存明细表   
    /*** ****views/center/str/rep/inoutItemRep.views
    /**
    **/
    router.get('/stock', function(req, res) {
        dataService.getViewState(urlStock, function(viewState) {
            logger.info("stock  viewState", viewState);
            var searchParam = {
                begDate: '2017-10-01',
                endDate: '2017-10-01',
                pageSize: '20',
                type: 'stock',        //查询类型
                Source: 'mainForm:mainContent:j_idt179:n_next',
                mainFormNext: 'mainForm:mainContent:j_idt179:n_next',
                deleteParam: 'mainForm:j_idt22',
                // renderParam: 'mainForm:mainContent',
                pageParam: 'mainForm:mainContent:j_idt179:pageNumber',  //分页
            }
            dataService.getCookieNew(urlStock, function(err, result) {
                if(err) {
                    logger.error('获取cookie失败', err);
                    res.send('获取cookie失败，请登录');
                    return false;
                }
                var tempCookie = result;
                tempCookie = 'JSESSIONID=6EE80AB416666CBF39324249B2296682';
                logger.info('tempCookie', tempCookie);
                var params = {
                    'javax.faces.partial.ajax':'true',
                    'javax.faces.source':"mainForm:j_idt22",
                    'javax.faces.partial.execute': '@all',
                    'javax.faces.partial.render':'mainForm:listMain',
                    'mainForm:j_idt22': 'mainForm:j_idt22',
                    'mainForm':'mainForm',
                    'mainForm:queryText': '',
                    'mainForm:j_idt18_input' : searchParam.begDate,    
                    'mainForm:j_idt20_input': searchParam.endDate,     
                    'mainForm:mainContent:dataList_selection': '',  
                    'mainForm:mainContent:dataList_scrollState' :'0,0',
                    'mainForm:mainContent:j_idt179:n_pageSize': searchParam.pageSize,        //每次上限为100条
                    'mainForm:mainContent:j_idt179:pageNumber': '0',
                    'javax.faces.ViewState': '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'
                };

                dataService.getRepOrder(urlStock, params, searchParam, tempCookie, function(er, records) {
                    if(er) {
                        logger.info("数据获取失败", er);
                        res.send('数据获取失败');
                        return false;
                    }
                    // logger.info('data....
                    //     .......', dataArr.length);
                    logger.info("records..........", records);
                    if(records == 0) {
                        logger.info('没有数据记录！');
                        res.send('没有数据记录,采购验收入库单数据插入失败');
                        return false;
                    }
                    res.send('成功插入数据' + records + '条！');
                    // async.eachSeries(dataArr,function(it, callback){
                    //     var sql = 'insert into reporder(date, productCode, store, receiptno,productinfo,number,begindate,enddate,prize,amount,cost,cose_notax,taxrate,taxamount) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
                    //     Mysql.queryInsert(sql, it, function(errInsert, row, field) {
                    //         callback(errInsert);
                    //     })
                    // }, function(errSql) {
                    //     if(errSql) {
                    //         logger.info("repOder insert err", errSql);
                    //         res.send('采购验收入库单数据插入失败');
                    //         return false;
                    //     }
                    //     res.send('采购验收入库单数据保存成功');
                    // });
                });
            }); 
        });
        
    });

    /**   仓库 》》销售退货入库   
    /*** http://saas.gooddrug.cn/views/center/inv/salReturnIn/list.views
    /**
    **/
    router.get('/return', function(req, res) {
        dataService.getViewState(urlReturn, function(viewState) {
            logger.info("return  viewState>>>>>>>>>>>>>>>>>>", viewState);
            var searchParam = {
                pageSize: '20',
                type: 'return',        //查询类型
                Source: 'mainForm:j_idt82:n_next',
                mainFormNext: 'mainForm:j_idt82:n_next',
                deleteParam: 'mainForm:headerContent:j_idt45',
                pageParam: 'mainForm:j_idt82:pageNumber',  //分页
            }
            dataService.getCookieNew(urlReturn, function(err, result) {
                if(err) {
                    logger.error('获取cookie失败', err);
                    res.send('获取cookie失败，请登录');
                    return false;
                }
                var tempCookie = result;
                tempCookie = 'JSESSIONID=6EE80AB416666CBF39324249B2296682';
                logger.info('tempCookie', tempCookie);
                var params = {
                    'javax.faces.partial.ajax':'true',
                    'javax.faces.source':"mainForm:headerContent:j_idt45",
                    'javax.faces.partial.execute': '@all',
                    'javax.faces.partial.render':'mainForm:listMain',
                    'mainForm:headerContent:j_idt45': 'mainForm:headerContent:j_idt45',
                    'mainForm':'mainForm',
                    'mainForm:headerContent:j_idt17': '',
                    'mainForm:headerContent:j_idt31_input' : '',    
                    'mainForm:headerContent:j_idt33_input': '',
                    'mainForm:headerContent:j_idt37':'31',     
                    'mainForm:dataList_selection': '',  
                    'mainForm:dataList_scrollState' :'0,0',
                    'mainForm:j_idt82:n_pageSize': searchParam.pageSize,        //每次上限为100条
                    'mainForm:j_idt82:pageNumber': '0',
                    'javax.faces.ViewState': viewState + '',
                };

                dataService.getRepOrder(urlReturn, params, searchParam, tempCookie, function(er, records) {
                    if(er) {
                        logger.info("数据获取失败", er);
                        res.send('数据获取失败');
                        return false;
                    }
                    logger.info("records..........", records);
                    if(records == 0) {
                        logger.info('没有数据记录！');
                        res.send('没有数据记录,仓库退货入库单数据插入失败');
                        return false;
                    }
                    res.send('成功插入数据' + records + '条！');
                });
            }); 
        });
        
    });



















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


