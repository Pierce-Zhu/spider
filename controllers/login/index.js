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
var dataService = require('../../service/getData');

// var common = require('../../../lib/common');


module.exports = function(router) {

	var host = 'saas.gooddrug.cn';
	var urlLogin = 'http://saas.gooddrug.cn/views/home/login.views';  //登录页url

	//进入平台登录页,获取cookie
	router.get('/loginPage', function(req, res) {
		var url = 'http://saas.gooddrug.cn/views/home/login.views';
		dataService.getViewState(urlLogin, function(viewState) {
            logger.info("loginPage  viewState>>>>>>>>>>>>>>>>>>>", viewState);
	        myhttp.get_cookie(urlLogin, function(result) {
				var cookieTemp = result.cookie[0].split(";")[0].split('=')[1];
				// var cookieTemp = 'JSESSIONID=EE1D1D1F801492D089DE55A8477869D0';
				logger.info('cookieTemp......', cookieTemp);
	            var params = {
	            	'javax.faces.partial.ajax':'true',
	            	'javax.faces.source':'j_idt18',
					'javax.faces.partial.execute':'@all',
					'javax.faces.partial.render':'messages',
					'j_idt18': 'j_idt18',
	            	'loginform':'loginform',
	            	'appId_focus':'',
	                'appId_input': '13',  //选择总部系统
	                "user": 'admin20030',
	                "Password": '000000',
	                'code': '',	
	                'javax.faces.ViewState': viewState,
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
        })
	});

	//登录服务平台获取门店订单信息
	router.get('/order', function(req, res) {
        //form表单
        var params = 'javax.faces.partial.ajax=true&javax.faces.source=mainForm%3AheaderContent%3Aj_idt48&javax.faces.partial.execute=%40all&javax.faces.partial.render=mainForm%3AlistMain&mainForm%3AheaderContent%3Aj_idt48=mainForm%3AheaderContent%3Aj_idt48&mainForm=mainForm&mainForm%3AheaderContent%3Aj_idt20=&mainForm%3AheaderContent%3Aj_idt34_input=2017-08-01&mainForm%3AheaderContent%3Aj_idt36_input=2017-08-01&mainForm%3AheaderContent%3Aj_idt40=31&mainForm%3Aj_idt49_selection=&mainForm%3Aj_idt49_scrollState=0%2C0&mainForm%3Aj_idt80%3An_pageSize=20&mainForm%3Aj_idt80%3ApageNumber=1&javax.faces.ViewState=Ft16aOUmhvgJBN6qI06KSF6hJxUuK%2BJfPxhdCZ4VyJv4W8kZylXcIRu57Ok8B%2BrRQmyGUM1I7yRMsG5tn0%2FsUBuwGTzSmeB1UVjAwYIeu5AQZnFCk%2Buyz%2BBRvquiVAUiKRqjIBL3yHZxc7KfDWBfX3FJX1HoDIM1ciCvlV7zLDfEH5buFvkpIZ37VyOMR8AgXbU1C5D%2BTYipqoJe6eN2bLodj5y19wLJTSYr6eUPhEgJfQTXLoBm8uw3MA%2F5D4B%2F1Z9n88Y0lrG4B8qbNvC3cuWVr7oyLM7IAWGMvlzuRZw9opGN%2F69rPXinNjSFIkJ7YBM6vc%2Fhj0b0O%2BRs4KkUf7raN9B8uM30QHmfpCdVgG%2FYydippg%2BGnOUUsp174djyfjeoeTbVxyzH%2Bj1BT3sv3D%2BGyyYpfDeHS%2BxSquzaMotiTooHwEhn7OVTos6JC4SwYfhhiE755j70NTb0L385X3kNN6aZ%2F25Ox8hFwZSE2Ri3Ls2q0fSMNcyY1If1%2FlSha9Jy%2FFVT3E8XijFk%2FGjlLqJpZ87ncNt%2BJQYGa%2FoPu%2B2X9U6DBtWWLa0mHCgQgc9z8cPwuiDc319B5ceEgjkST7u9oIQtK16iRqZLVO8VCNwsB6l%2B4CjRe3nE8O4WfDCGGJaOlCIoFOyeylMhlaLl2OZAuNfPmo2u0xTVdpJB7BS6saO%2BJmpcJiTSSeL%2FJPx0gARdzIlxEPtovEFsSyTAaXur1cc1dOBFnORHlIjAe%2B%2FlxgLSOTiiNfQ4RaX2qHQnDFQhjTpg6iNvgZHKiYUPOMn1Nh7sYLCqf9a%2FJDrwGWnmrmIANQSQWwq3bedP3BrDdR%2BF7MwzPJLx7okU7qbWHE%2Fw%2FtD9hSg8Z6Mn0XXHaqTERXE29AQuyJH6oKvjBqQpHoEuREGOo2TYxD3p6KoLtg4URdTRkaAD1F9kAtf2wRCXxlSJuM0cECcV7q20n7kfwCDlH4ajgresicb%2BrhxyFerY0PFLjqS7jmnKJ2xZ0fsg9n2oPnELmM%2F0pFzwDMqDaOzkuuUGNMMMU6Og8dOpbxZR0AFbeoaLkNVc5ugFz%2FpTXrharOvgDYADUEUukdvrGAX7YlYxdqGDwSomMFc%2BRvc0rXnkPBhf8%2B2r2YqzsM%2BE0ZQrb5giy0RArktsMmUlVVpxwX0MRo36Xs2wbQtbWVOlohmmQU4Y2AioLnACvHFUIWWOBzp1m2YYldOXML0ZOgtSQG%2Bg9XbjZ5qaZtxksAVzzMQu3uu%2Fz5N15AUdSoxg0X1LST7a%2BGFye8eddSZ0sG3l%2Blm7Wu1EfEefI7y5liST2kEfoL0nuURzm50aqkwNsbTkYldWmFEGh%2FbIZjxrTXL6b5nEgtnEiBbsk7tEzmyesLAqo62%2BYFQpV9rHkRizkyLLnmVyutE9XuTMfGEBa8ZSbn2r6eKpkJVs1HWoDChZuh%2F4MeX0E7FmBqguO832b%2BvP6cRGFJFCsB2r%2FkAuBtfXzf9SA2kiEvIhBZd9oHQm%2FBzCKq3%2F56zZYCtj%2F3c2rsvSS%2FT%2Ftz9Uf4OM11fwbLWYIJ%2Fq4fvGCmDGZEQ%2B30uVg2PiEMnia1aXH07JNvBG3tWitB7m7vP3KLNPb217iJFzvWmttUJ0OXqRrO6%2F2waMmnrIvG6BaqQYSn0RHheLftH2qWjBcSLZn4%2BoEaMJNME5fnEQ0xLgbb57D3juTlpFXZjh2zsgux7KkILjnbU7pncCqjV5Ia%2BHsirG0ZbQKruBVmfMX8Be9ZDaahlzeMu0AqiAg2AyYuICqghO6yKhlEkp%2BpbdOluYwZx%2FPlOMiwpzLXKufdfE2%2FF2QYYvZWadp7NOEcWeqJgnYXtWoZHzf%2FjFWhTL9lkRZobF23PT9OaOjwuI5vpK%2Fq0fmfoDEvQBkwnzFwcpfuDD%2FOxRcKmvalRJHwhR%2FDf5JD9fNiwd%2BFl6cPaJ1Aero0IVSobGwrqrjDwShCh157XalmRav1Yw5%2BKsPsloOQbIo10mD0O9sNuUYQxamjpVkSB5924i86RFAxd1G6Xg6Hg6QJDnn71MDM2rGGiBNoqYzl2rIw%2FEbD8nVfatXWR%2B4bu07qehte6RfSH2wuiv5H8p9JULWV8MbXJ98JI8Bt6HV5X8Ie730b3UK4q1640A%2FHJTjUJ9zv1JTvgQF2FQEuk1S7GMsrKwOuNuiB9i7Ervx3pdn6midXgRocZGbU2iLVW6Y5uVXVmzvUAYTpgdfqPKZ8ivuMCNuGcHYVjX8pno06vzmj6msJbGnysp1pi1E5bBXlIug%2FCllW7Vp8t7b744wQfsj%2FU9YMRBDi47LXILN%2BAbZ8mYh0DmChuceWhTCshDAoAwkazWsS8d0oCt%2BCdbm6RpGHkyTj%2FetAmp%2FzwOkrzPppHLLRI8uYExoU1jyM6OZTRdwy%2BsFWj4Gm%2BeZq7JuIwEGMkhAMeVEpvy0ooEQndVDhETdc1J%2Fq9gRHMG4D7vpMIsXZdWe1XkJwf0%2FmrikTVTQx3KBjHPONZcZ1kgwuVNV%2B9i3SnrtEpXbKLGF7HytG2nhgKl12hWMWtanjnu6OiBXqhoWkdAcT73ygT30gK5yHnLu0v8kOyX55%2BJ8HmZ1EPO2GrlLzgP%2BGm74A88trMDjzCz5uV%2Bnsq8pNc%2Fz6dxnJHzA3cPg6XlGK%2B235DcsGIgrbWwvUICOGxsZs%2FAaQshmyF5Gc9bMG1mjcdL%2BRZOXvRLDzhokLjjdKZd7Q0laQYjRtKQhuGy0SX%2FQLcll7vImbbvpqOnkp%2FZJfAJgYGpykSkrKjMO63GNc3%2FkMtKU7BwXtlbw0LZOA9AGPaoMGK50hOJ2QbVwWCk1n61xL2N9NjaC81H%2FKWPoEvyX%2FW83GmVG9gnGSV7IoJr%2BxXjyDpujaZId%2BYdZdQZC66LeR1UIJgwOYLV%2Bd%2BmPSW%2F8Xent7N2agLo0LO8Eg1W%2F7R7PV69EaBL96hzh3C45ZI3fx4aMjFMFUudyPrvjdN0j63Y8talprf6lZK0ZLiooJ5dMVfA4JIV87icAzxqNmyfnip%2Bt2P833AemP1wD82CSu%2BA75xAQTNfkCxQecbTFyYqKfot%2BXTw1lYFObqv1SWE2g2Gl0yzh%2Bj5X7npn66F7qN5mFbUlzBLTlsxPdJYcBkqlkfc3JndcF08GeML3qDiHgbZPTySRwj4OvI46B2%2FNeQUHdRcvGtdsYSW3lJYc8XIv7QgOPA%3D';
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
			'Cookie':'JSESSIONID=EE1D1D1F801492D089DE55A8477869D0'
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