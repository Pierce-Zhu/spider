'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger();
var qs = require('querystring');
var cheerio = require('cheerio');
var fs = require('fs');
var moment = require('moment');
var URL = require("url");
var http = require("http");
var https = require("https");
var request = require('request');

var myhttp = require('../../lib/myhttp');
var common = require('../../lib/common');
var cookDb = require('../../models/cookies');

// var common = require('../../../lib/common');


module.exports = function(router) {

	var host = 'saas.gooddrug.cn';
	var urlLogin = 'http://saas.gooddrug.cn/views/home/login.views';  //登录页url

	//进入平台登录页,获取cookie
	router.get('/loginPage', function(req, res) {
		var url = 'http://saas.gooddrug.cn/views/home/login.views';
		myhttp.get_cookie(urlLogin, function(result) {
			var cookieTemp = result.cookie[0].split(";")[0].split('=')[1];
			// cookieTemp = '713867ACF2FD4DFD29064591D866413B.pro_rtl_1';
			logger.info('cookieTemp......', cookieTemp);
            var params = {
            	'javax.faces.partial.ajax':'true',
            	'javax.faces.source':'j_idt20',
				'javax.faces.partial.execute':'@all',
				'javax.faces.partial.render':'messages',
            	'loginform':'loginform',
            	'appId_focus':'',
                'appId_input': '13',  //选择总部系统
                "user": 'admin20030',
                "Password": '000000',
                'code': '',	
                'javax.faces.ViewState': 'SMLa9Dwfc7ZsCcMu9UWRSpI4jLD38UDW8YnCnS3Xh/c//LZIzIymBJY9pTQi5hVNrbqstrlC9mevY4TYt/33vtujwpxwmsiqLZ30BggSduTkANwnJmfSCuoRT8qCKf2YVw6lxzyQcxQldRml06Z7oo69zdjxk1LwbdDJSnMvsDXB2xd2LhyEO6IQN9ajC/WE5qzpq3PM5AlICoYjww0mAJIoSCnfAhJu7Ntiq5lATtLrrEk+znaTmrz/TiB1lOrPZP5lYIXJX9S/H5vblAEZ1Y0HgIuLpJk0/Ve2rYCPOGkutFOSu0Go9SzUdjidseFOB/l1sSLEhkcHfAHkAmg4CrwohqKTupJEgue37wcbBU4695jR0sn5r596WhpXxMk/HDNl4PFkcR3TRkPvtnH+fbT6l1ryoPdluJttD0gECM/p6ieQvuv8sDJADBZfyN7KNgr5vYtRvRH1ho2v104MzDb9jwIL9raR7Kn7iC4XufvTL6VJgdvKxtkeiqizHs9DX7xwRo5ZsoPzcxFSwCey43MZopHA7qKzhHiOT02MxH0cQGOINF5nzD/N2NwEVPDOt6gGjQgxeZkfuwuqJjSJgF7Tdbv9vcsyvOBdB0EAPkYkyj7xfRt2dYDrsbylxky8IB2LlzGKR73sfxAZlMzZahpm2bjrPIpZaBXtpRycvvlhzWXnXxxnkkSntWF1xPjlT2ouDrR7/f0AqhgmutbPtwkg7fwoR4MzRX7f+7ZWbpu0DWLnCUAgmPjFxB+jMgqabGTOlBqYm6T46W4iP4t2tYup8nRzm/24bt2ULn1JSzyxD/TKWrj13kwFO/HqoJmtoIIrxLPRsvUZ14rNVG6d5+RNqstARYuO0CX/rBWTyyIprKLFtfC8ZTTvmBKx7lLkgaw1FGwayCClE3WoKHXjlIOI930P3fjKpBNAL+mH0zQowCfsfGCBZZCQW4z0MQFIKnvXMQgf2aUSdWfocP9YN7qySbZIjT+/JIDO2WoIEAzTOArIEZC4xonKgDr8WwqJZVxyqWvod72dKZDtdlNznaPde8EsOvyCzUNcQmwNOeQcOXPiX6E/rT+yiOvnqcVmAvistKY5vcF9HivoSuEkJleGXtJo6y4MGwOa6E8uuOySe5mz2ILE+9GbVJUQL9FX6d46fxBZI3TmjtZRKTbRJiSn7rCR7GKwLMg6SMEq3betmom9zKR6sKx9ycywYPe6yfCfJUYlUAvtPiHnRYiRz0BMJ9CVbvvScWgxXCs8kjO0rp+AL6ubN10n0ex7MvXZ7ADFNaIGSZzIM5qI+Lq38mznGY2zS8jIFPFJ4POyrfE='
            }
    		myhttp._post(urlLogin, params, cookieTemp, function(data) {
    			logger.info('cookie data>>>>', data.cookie[0].split(";")[0]);
    			var params = {
					host: host,
					time: moment().format('YYYY-MM-DD HH:mm:ss'),
					JSESSIONID: data.cookie[0].split(";")[0],
					// JSESSIONID: '713867ACF2FD4DFD29064591D866413B.pro_rtl_1'
				}
				cookDb.remove({'host': host},function(err){
	               	if(err){
	                    logger.error('err in delete cookie->', err);
	                    res.send(err1)
	              	 }else{
	                    cookDb.create(params,function(err2){
	                        if(err2){
	                            logger.error('err in save cookie->', err2);
	                            res.send(err2);
	                            return false;
	                        }
	                        res.send('登陆成功');
	                    })
	                }
	            })
    		});
		});
	});

	//登录服务平台获取门店订单信息
	router.get('/order', function(req, res) {
        //form表单
        var params = 'javax.faces.partial.ajax=true&javax.faces.source=mainForm%3AheaderContent%3Aj_idt48&javax.faces.partial.execute=%40all&javax.faces.partial.render=mainForm%3AlistMain&mainForm%3AheaderContent%3Aj_idt48=mainForm%3AheaderContent%3Aj_idt48&mainForm=mainForm&mainForm%3AheaderContent%3Aj_idt20=&mainForm%3AheaderContent%3Aj_idt34_input=2017-08-01&mainForm%3AheaderContent%3Aj_idt36_input=2017-08-01&mainForm%3AheaderContent%3Aj_idt40=31&mainForm%3Aj_idt49_selection=&mainForm%3Aj_idt49_scrollState=0%2C0&mainForm%3Aj_idt80%3An_pageSize=20&mainForm%3Aj_idt80%3ApageNumber=1&javax.faces.ViewState=cZCVuZcaFdx7NrmIjk%2BYJ8N2FbnDfwHgMTh5fJbQlr80Sy5AOupgSYzGYt03DO%2Ft3TOQijikGwK%2BLuMFFuvcvyJkyQE3slQxAgnQikl0CpiVDzRsOjhXPuzPp6SEW9kTPesbi1jkDdE1dnuvXN%2B8eVN5YMZyypsOCCj%2BHLvfsX7FP83bqCHzw9Q0CS4CuhzLyDGkNWRSFfS160wTJbXTt1IPh55DwJE5%2BBG2z4Nu%2Fnj5Wz8pZAj1zL9nSXNoWwCbC3JRiXiTaPFjLvrVABk6oDFssx2yBcYpOA%2FdOFnsdI7ng3meh4tflaYmBFZij3mQDUMIDZL74lpPNstTq6GVrv2qbUPGY1i9EynNzOlYdCbsS%2BNDfaqD2iA0aGHZMfwAPaK4OKUndUv660vdOoaCnfRGIaz1J9SAmo5AqfrEKE06qCqPEHB2FFZvzUwES3eTB%2Bl5u8jI78LroeC4QUcpAeJqHvn8A3e1gdobWEunbkdvOHvI6paIsJymkRelXVMDlCzTLnDc4KG9dH2A0LRgQRDjDZiBdb8uF9oIPSdmxNQBSsNTEJLrfz2GVYG3gQ8MExcVRSt92ZVXCZ0a4qmq3L8E8nsWQzZoBOuAmVA4%2BZbK7EvNCQt2npSpAfALshQalAd2nAsi12jR3RA%2BOcYSaPyilq4e0GyWr3OgIyQiQThwFSo9cHHeojcSzduXl8dhJN2hIfK8gKMLR5EYr8UQZUu4y2TPD1GdGUDXVWRz5HUtJ%2F7FxuofIWqDES8yUOoQ4A8J%2Fb4pn3XqO7PHKy2zBaaSioHxJvNcdm4eDY0Fn7ws%2FlKcEV%2BYsvVY%2BJ9iL0MymVsn3J%2BnO6j%2FuTnhgdCr0bx5v8G0XPS3Ild9DBp2xHhMB898S%2BeZgSH1sb4wYxi3zYRJOoRbResLH5iyItkZuL3DKeerCuZoE%2BB5SBxusnSvTKOdiFW8f3LPpgRI4hjsx7ZlK%2B2Vz1VLK14%2FqY3V0%2Be2LrSEjnnm6APBLGaQZTXIXxQjGjxW6mmn5p87TWR5%2FRACWQAziDJhTALtfW85kiTrMA5f6v0ty7StshlNBREseT8O6FsxjZ4TI50EE2DLBSXw70xOSp1zBH72e4zMRjLeM5nQ8%2FxAQ43ZsR8jTEa211WSVxlUQhG40ZnBgrO8TLUCBQp8W1odVDFLTflqnsYqdA2z%2BgvAN5JlDmTxJj6K1Rwj8Ka0Vx5cgKoDch8mjOA609UU%2FyrXTz4NeQFaluetkKIEmgW66oBCw6DqICS3eFWZASd%2B%2FBAi%2F7kS8MDGAb3u1o6RN%2BlwLkBQtVpANmAuAlBfE%2BSRb8qg4psqFuAIfIHXxm5RpaaqWkwyqyXg9Le%2Bf8E1uvCyUghKlaWJNLy%2F1xQr%2FaudCcf%2BVbMJkayi3DoHYqacuHnr8VVv0Ushg71ecWktcrM77nE6SWkRudjMIlhQrwTCHFhkQSw7GKcHGaH4EGTo2bYswZIpSUxfdm0zkcrTVgr%2FoKvR4M7Yv2XqTrZbP%2BwOy%2BwAmAYZWDyCq5tLxuzeYJUyZ4eIcar9HjnUbDS8KKlDHxPLcNzG6Qn5hQPNPXU8d23lt6E3IfZ6MyNC7UxKmdHdD5lsblp9t8wcEtT2k2Bic7N4UVCk9MxzBoFirouYdPID5MO4k8Gx9GRU17fTYotXOCpvTSVUjOqXUK5HmmykKyDDVsx0xHDm24vEMVv9Lc%2FTdaoJpXFj0yynlt%2BhsdQ6fKRn7DwiPQgEVIASptYYm%2FTBjheY%2BYVDQQm2S2WKGzExPDnSv0znSyviyo6Ihl8zeZgm6T%2Fip%2BYz17FwH4gacvLdWgJeL%2Fr7W0lrKDSWRWSRlkgV0DbGP69k7%2FY1l2bKnRyBsTGc8oH3jsEiop%2BrXjPjQ37Wb%2B4igwkyNm0mzgOWFLFo%2BhBEn%2BMzC9GX9jzCQZ6sNjDOFvyXULZnzWIwe3qQ1QIRGvxiJhAALQQbxFv%2F5fLKEx9L%2BPZaMA%2FH2FUOasX4unEVWf80WNtjXjH4wRw06r2tpbh92dPgUMMxxhaN5p1y7eV9zy95CPAJTtpKkVxEalZYkAwAyJt9vmR7pFj3b6Qvk0wzQHk16u819emP9O9%2B%2FtthnPSk6nB1CdqnV9Wo%2BxmsdE8Poo1cxgcLCg2Hpc%2FDS%2F%2BpNyJFlxPaEQPxc3QGP4GmBg1wMTdNsqOZt3%2FEqqHxySEs8ejc37Fx3fQfpShM61KmISjhL9%2Fcps8Wc%2FkiaRliLIjdTIMk5FhGRvpl4pR0FKRsfQ9VmBGoM1EuvKcw5YsuL5beJkA7shrQQe6ztt8Vj%2BIoH1zKgr5CDb%2FNhFs%2BznpRuaZ6BVhSNhO99O8oCQfUdwRLB6ExODYGvgDN2ELeV50eRRl6Pab6VGmJ20o5IqMudYDf%2FvVuNKYQSPhmV%2F658FqW1cYHZvba%2FYhseyERPZSOqJfRkRCKecbU11XlG5JLIh2GdDFQqcPkepQLOo%2B3TrOpEpVWJz64qs249GWDm1GmW3nmFf9IDJKE7wr5FF3%2BRSfpSoGitu2a25xudsooH02D2PvbRhlt%2Bs5O3s%2Bghrj6OQ2oqeX2Z27lP50GZfxUrdB0mmhMrVZJWPNjJJjnBiSJfw%2BUAMPuJBX51MxoKULAGlWA1SrCVeAMw5S3IIfR%2FZshxNJu1r%2BrVHFBo8aThEl%2BeDtmk1ialASYLcMYVabEmN9D6KWH%2Frf69tG0USFe3k%2Be8%2FoWzNHuco%2B4jWAjtFmA%2FqkQmOxur%2FJom7MMaR%2Ba02qZmLIEmH%2BaSoPl%2FAQKrM75P7HUpAQm3y6WzeQwXYuLg4oSE9KISmloT7PCpyk0ldJ76BCL6IgMZMX9bFFfuknR8kW5QhavYVG6lAV77B8ENRzkwAOoOtyN3awEc1HJHm1on7eauaLyyeUJjXRbqleBLa25EI7QMPH1RnaT%2FMKJVKJ5DfpzW%2F020MtUoxvl%2FkLu0jDqoKPCYsrnh1M4IYjBZkNw%2FrheStzF5gevO%2BKtvttLsjlQLzxtqUL31VglcSF4acvHIj8lR%2B2LIutAJIKFl1%2FqwpESqXqx8yc5t3xRzwn0I2SqUIOr%2FPHDDAXP9O943gVjXrU3%2Byj0qya2IwjXOGU6Gvgw%2BB5g%2B1nKQvdeMbVZ0qXz8234DNVDH9%2FE00e2r59K9e5vKcF4WfTPZGw6RgQiuGiWC1srO0ffg%2B2OMHr%2F7Ctbm9IhTumxjTunOfyLvf6uXpcPsN2D';
        //登录action
        var url = 'http://saas.gooddrug.cn/views/center/inv/purIn/list.views';
		_post(url, params, function(data) {
            logger.info('login post data->', data);
            res.send('---ok---');
        })
    });


	var post_login = function(url, params, cookie, cb){
	    logger.info('_post cookie-->', cookie);
		var params = qs.stringify(params);
		logger.info('post params111', params);
		var options = URL.parse(url);

		options.method = 'POST';
		//判断是https还是http请求
		options.port = options.protocol === "https:" ? 443 : 80;
		options.headers = { // 必选信息
			"Host":host,
            'Content-Length':'1660',
			'Origin':'http://saas.gooddrug.cn',
			'Faces-Request':'partial/ajax',
			"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36",
			"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
			'Accept':'application/xml, text/xml, */*; q=0.01',
			"X-Requested-With":'XMLHttpRequest',
			'Referer':urlLogin,
			'Accept-Encoding':'gzip, deflate',
			'Accept-Language':'zh-CN,zh;q=0.8,en;q=0.6',
			"Cookie": cookie
		}

	    // 接下来就是创建http请求
	    var _http = options.protocol === "https:" ? https : http;
		var req = _http.request(options, function(res) {
			var arrBuf = []; //arrBuf：接收数据块
			var bufLength = 0;

			res.on('data', function(chunk) {
				arrBuf.push(chunk);
				bufLength += chunk.length;
			});

			res.on('error', function(err) {
				logger.error('_post res error-->', err);
				cb(err);
				return false;
			});

			//在数据发送完毕后触发
			res.on('end', function() {
				logger.info('_post res header-->', res.headers);
				logger.info('_post res header set-cookie-->', res.headers['set-cookie']);
				logger.info('_post res arrBuf-->', arrBuf);
				var chunkAll = Buffer.concat(arrBuf, bufLength);
				var encoding = res.headers['content-encoding'];
				logger.info('_post chunkAll-->', chunkAll);
				logger.info('_post encoding-->', encoding);

				var datas = {
					body: '',
					cookie: res.headers["set-cookie"]
				}

				//因为Accept-Encoding为gzip, deflate，所以接收到的数据需要通过zlib解压缩
				// common.decompression(encoding, chunkAll, function(data) {
				// 	datas['body'] = data;
				// 	cb(datas);
				// });
			});
		});

		req.on('error', function(err) {
			logger.error('_post req err-->', err);
			cb(err);
			return false;
		});

		req.write(params);
		req.end();
	}  

	function _post(url, params, cb) {
		//var params = qs.stringify(params);
		var options = URL.parse(url);
		logger.info('params-->',params);
		logger.info('length-->',params.length);

		options.method = 'POST';
		//判断是https还是http请求
		options.port = options.protocol === "https:" ? 443 : 80;

		options.headers = { // 必选信息, 如果不知道哪些信息是必须的, 建议用抓包工具看一下, 都写上也无妨...
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", // 可以设置一下编码
			"Content-Length": params.length, // 请求长度, 通过上面计算得到     
			"Accept": "application/json, text/javascript, */*; q=0.01",
			"X-Requested-With": 'XMLHttpRequest',
			// 这些都是用抓包程序看到的..就都写上了, 若想少写, 可以一个一个删除试试
			"Accept-Encoding": "gzip, deflate",
			"Faces-Request":'partial/ajax',
			"Accept-Language": "zh-CN,zh;q=0.8,en;q=0.6",
			"Cache-Control": "max-age=0",
			"Connection": "Keep-Alive",
			"Host": options.host,
			'Origin': options.protocol + options.host,
			"Referer": 'http://saas.gooddrug.cn/views/home/login.views',
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:54.0) Gecko/20100101 Firefox/54.0",
			// 最后 有些网站的某些功能是需要附带cookie信息的. 因此在这里还需加一行
			'Cookie':'JSESSIONID=713867ACF2FD4DFD29064591D866413B.pro_rtl_1'
		}

		var _http = options.protocol === "https:" ? https : http;

		logger.info('_post options-->', options);

		var req = _http.request(options, function(res) {
			var arrBuf = []; //arrBuf：接收数据块
			var bufLength = 0;

			res.on('data', function(chunk) {
				arrBuf.push(chunk);
				bufLength += chunk.length;
			});

			res.on('error', function(err) {
				logger.error('_post res error-->', err);
				cb(err);
				return false;
			});

			//在数据发送完毕后触发
			res.on('end', function() {
				logger.info('_post res header-->', res.headers);
				logger.info('_post res arrBuf-->', arrBuf);


				var chunkAll = Buffer.concat(arrBuf, bufLength);
				var encoding = res.headers['content-encoding'];
				logger.info('_post chunkAll-->', chunkAll);
				logger.info('_post encoding-->', encoding);

				var datas = {
					body: '',
					cookie: res.headers["set-cookie"]
				}

				//因为Accept-Encoding为gzip, deflate，所以接收到的数据需要通过zlib解压缩
				common.decompression(encoding, chunkAll, function(data) {
					datas['body'] = data;
					// cb(null, datas);
					cb(datas);
				});
			});
		});

		req.on('error', function(err) {
			logger.error('_post req err-->', err);
			cb(err);
			return false;
		});

		req.write(params);
		req.end();
	}
	
}