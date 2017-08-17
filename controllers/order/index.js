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
var repService = require('../../service/getRepOrder');


module.exports = function(router) {

    var host = 'saas.gooddrug.cn';
    var url_order = 'http://saas.gooddrug.cn/views/center/inv/purIn/list.views';//采购验收入库单查询url

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

    //  仓库 》采购验收入库单信息   
    // *****/views/center/inv/purIn/list.views
    router.get('/repoData', function(req, res) {
        var searchParam = {
            begDate: '2017-08-11',
            endDate: '2017-08-11',
            pageSize: '30'
        }
        cookDb.findOne({'host': host}, function(err, result) {
            if(err) {
                logger.error('获取cookie失败，请登录', err);
                res.send('获取cookie失败，请登录');
                return false;
            }
            var tempCookie = 'JSESSIONID=' + result.JSESSIONID;
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
                //该参数和cookie一样，会定时过期
                'javax.faces.ViewState': 'KhwIrmnZebSXKue99l/p42k2kSkZNGa42wVVuG14ELomSM51BiCYFlOMtFK/Yv72h3EkjZdzL4/avKgjUbvRuy9qh04tNERUj5Lnt54JXjCJB0L8aa0r2WI5QsM96jedCWZSvSt+jwXPxNyTV7nxz4PSZBVvs2DZDyEpqEBSdWxwsUZeYcLm3i1rnjz0EuN9WU/vn6DPJ5qlgwJPeuzuCEbh0i3ch4uPimjPf+smSFjU1eb/s74NXASN0isKTSU7m2vtTKZTw6khGRIq8Won2YWigO/f1E9LfFfK4nap7eNUiTI5pDP9WxZeGWaglvGg5uGSmboabkVx9lhox9aAV4qGKn7RzHougXY7hMvYDIzJqMR4LfyZRUHHHPtz3BTTdSAE640QLc8EbMbXMLPHDelZOoL2dUNUqtebadDfZB1b8qHpvgQZdJcuPPBw7K2xqybZrWFbiQ9OYxqaHwKWpG20kYOdANkMqCo/ANA/QXETd9mmi/FXuO7Fi7Ur0L9Tqo9WkbQofRFSMLkCDLNIVZvFOtSIh3KYfU1IIEvtV1gSZHtD2Y7qsT7JGNkSJIMKKIIma1MhLP7CFc+NlCv5mKuEN23VEr1P+vFQgQpDzzYB+UoWKl/vGmV7fUaqL6HrxpCHyiHPFLS13GpbOfP/nVdXBHmYAK+s34tnesytbAr2Ub8rmArYjZI5J5v/dUQ1Q2/0euqmBWWIiLqfGM2eujYLHEl8YVz4Qm8DVuEqjzGHp291WRMkWCp66iwPOrN+UJ8GAvOTe3uzaXYH1GAzrmlD1FI4hAlCkd6jTKRCCD4TyuWPqRprngua4Ti4IeOK2d162VaOdpgj0gzczaVVudpNod61Lxcxi4P1v7rKOPkGb4W+nksrhwWLShLCMwNS5+GouCZXrkw4Z54xDAhohQmg5tY8ZF52fjH/YXVeqZC5Cag2Z5BtRJf/5rxZ5NoQ718VmsVjFp2nTts5rLFsg/aCFzlKPwi3sRmnPJSq0op0UY6+11HnddHRhf82sANrvTaAgdu2m9H0IEDaQGmmCuBbe6cJhaJUlWzS43W5Vhjc9ewuLC0BMsRJ5Gb1ej1BYMuCQ336uEKJmPhqDzW6Zmp14DNW0YpL9dR9ZlKIIzWga9zBU8hKoNNGrKAVJ1Gg+turk8fpot0KJliucviuwCPM3pAscgjnJW+bCMEWI23a4Uy97UFe/RhaqPQEIVIJ69YhB0hkf3sndOCLAbrynSaaNX9jVO1CaY8TCoMbf8YaMumJYwbBpAf8ejacxG0CgAKGMvZF9RDc30EVA48X2AZnrBqiKoLd/XxC6ZA4Py7JLA+XYjo9FW6KtRu0MbvrhadfcwUXeCWrJdzyem/ofRoOrqZwrhIxt9yS3X1oKnsSX6bInG+lSNgLAfTdwi8vzSGT+Cexybt6W62skjk9PMns9IUej4pQsW8GCje192t+3ksoMUZ9XZ0nQucR8KgeBL8qIoD2TgWZSyXQPLLGs1Rc4IN8ZxcZX06SXw9Rx6besSBSaTey06W9prsYtUQ13N75JcE2sVfZYXOOmJSpcgjwMWXZwSj5zG+hG9rj5Pa0bBt9UZrRJdU1zNMV1zO86dnVF5T+pSgDSJhPdYOE4/Hg5Pq7oi8VXekiDwA4MN6ccsAqWXy0Hu0RKRPtjmLS2sVQYe4JMYBhY6kLBQV/hwUUyvjE7Rlh1R649Qiyl+CTbtZY1IpeWPqSM/TOhfSv9xy9S7SZ/8qIzinQmtHQaR4w094T2e3QbQ+v2vx95ZT2KhUc/du/5KSTSR33lWatmng4GlyV1QAdbh3L8dItQ77iWDT5gsBMp2ZByB88sM4QudU7e8Li3YMv8OLXkker4eqBFuT6OHUs+rxxmqkBWQXmUraHNqy6zCoXuBKt3ka6OlMcq8SyzHn6Ug+vmIlZaYbV86qbfG9V8y3uA19pDo6wsZ55bB5WN1Ac/1XwiaieytQ0ysYADfdfug0Bxhmfw1fx1WmqeC/itthTRfeq/gGCLyg5TnbFTprsJsXkORIRKP8DAg1APJm5AmdT1nQsRFuwu6iqlj0mMw1EyGq/2PDersuNtYEmRNEWH1cukdfxsxWoAWEuqYKrLyLZdJZVniDR7rbuvGSsFq3JKePxByBo/vl67zn0W29fyKUZuri5awKFknRpcvyUkD8HekCrKH2C0+rBDRYxYASUCXwPtosg/Qs0Li25+0nPoTxxRph29w4sbfRYSSkMKHoNyoT3Fzpgouk9usXP7vfUFfpz097VmZxvcWHnVNRm1+Cu6Txu6RW4V7xgQp8fh3G0XYmrXkWvYDCXlgkqO2e9vS9sVUhNy/1sKWBr/BD1BqP9uFpFuT5+FzU9eL5Hg40xQfyg'
            };

            repService.getRepOrder(url_order, params, searchParam, tempCookie, function(er,dataArr, records) {
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


    //提交表单，获取订单信息 使用request 
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


