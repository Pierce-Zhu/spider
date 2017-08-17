'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger();
var cheerio = require('cheerio');
var async = require('async');
var moment = require('moment');
var parseString = require('xml2js');
var myhttp = require('../lib/myhttp');
var common = require('../lib/common');

//post data
var getRepOrder = function(url, params,searchParam, cookie, callback) {
    myhttp._post(url, params, cookie, function(data) {
        var dataArr = [];  //需要插入的数据

        dataParse(data.body, dataArr, function(response) {
            //获取总记录条数
            var $ =   cheerio.load(response['partial-response'].changes.update[0]);
            var records = $('.totalPages').find('.ui-widget').text(); 
            records = records.replace(/\s+/g, "");
            records = records.match(/共(\S*)条/)[1];
            logger.info('records length ', records);
            var pageSize = Number(searchParam.pageSize);
            //需要分页
            // logger.info("dataarr in service", dataArr);
            // callback(null,dataArr,records);
            if(records > pageSize) {
                var loopArr = [];
                for(var i = 0; i < (Math.floor(records/pageSize)); i++) {
                    loopArr.push(i + 1);
                }
                logger.info('loopArr', loopArr,records/pageSize);

                params['javax.faces.source'] = 'mainForm:j_idt80:n_next';
                delete params['mainForm:headerContent:j_idt48'];
                params['mainForm:j_idt80:n_next'] = 'mainForm:j_idt80:n_next';
                async.eachSeries(loopArr, function(it, cb) {
                    logger.info('it', it);
                    params['mainForm:j_idt80:pageNumber'] = ''+it;   //分页后从1 开始
                    // logger.info('params new......', params);
                    myhttp._post(url, params, cookie, function(dataPage) {
                        dataParse(dataPage.body, dataArr, function() {
                            cb();
                        });
                        
                    });
                }, function(err) {
                    logger.info('dataArr new new >>>>>>>>>>', dataArr.length);
                    callback(null,dataArr,records);
                });
            } else {
                callback(null,dataArr,records);
            }     
        }); 
    });
}

var dataParse = function(data, dataArr, cb) {
    parseString.parseString(data,{ 
        explicitArray : false,
        ignoreAttrs : true },      // { owner: [ "Nic Raboy" ] }改为 { owner: "Nic Raboy" }
    function(err, response){
        if(err) {
            logger.error('err in page search', err);
            res.send("page search fail");
            return false;
        }
        var $ =   cheerio.load(response['partial-response'].changes.update[0]);
        var indexDataNew = $('table').eq(0).find('td.ui-datatable-frozenlayout-left').find('div.ui-datatable-scrollable-body').find('tbody').find('tr');
        //content
        var contentDataNew = $('table').eq(0).find('td.ui-datatable-frozenlayout-right').find('div.ui-datatable-scrollable-body').find('tr');
        for(var i = 0; i < indexDataNew.length; i++) {
            var dataTemp = [];
            dataTemp.push(indexDataNew.eq(i).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(0).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(1).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(2).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(3).text() + '');
            dataTemp.push(Number(contentDataNew.eq(i).find('td').eq(4).text()));
            dataTemp.push(contentDataNew.eq(i).find('td').eq(5).text());
            dataTemp.push(contentDataNew.eq(i).find('td').eq(6).text());
            dataArr.push(dataTemp);
        }
        // logger.info('dataArr......', dataArr);
        cb(response);
    });
}

module.exports = {
    'getRepOrder': getRepOrder
}