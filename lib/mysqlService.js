var mysql = require('mysql');
var log4js = require('log4js');
var logger = log4js.getLogger();
var MYSQL_POOL ="";
var MYSQL_POOL_other ={};
// var db = function(config, name){
//  var _default = 'default';

//  if(MYSQL_POOL_other&&MYSQL_POOL_other[_default]){
//      MYSQL_POOL_other[_default] = MYSQL_POOL_other[_default];
//  }else{
//      if(name) _default = name;
//      MYSQL_POOL_other[_default] = mysql.createPool(config);
//  }
//  return MYSQL_POOL;
// }

// var query = function(sql, callback, name){
//  var _default = 'default';
//  if(name) _default = name;
//  MYSQL_POOL_other[_default].getConnection(function(err, connection){
//      if(err) {
//          logger.error("err in MYSQL_POOL.getConnection:",err);
//          return false;
//      }
//      connection.query(sql, function (err1, row, fields){
//          if(err1){
//              logger.error("err1:",err1);
//              // connection.release();
//              // callback(err, row, fields);
//          }
//          connection.release();
//             callback(err, row, fields);
//         });
//  })
// }


//20170520   只联一个数据库的情况
var db = function(config){
    if(MYSQL_POOL){
        MYSQL_POOL = MYSQL_POOL;
    }else{
        MYSQL_POOL= mysql.createPool(config);
    }
    return MYSQL_POOL;
}

var query = function(sql, callback){
    MYSQL_POOL.getConnection(function(err, connection){
        if(err) {
            logger.error("getConnection err...", err);
        } else {
            connection.query(sql, function (err, row, fields){
                if(err){
                    logger.error("err:",err);
                    // connection.release();
                    // callback(err, row, fields);
                }
                connection.release();
                callback(err, row, fields);
            });
        }
        
    })
}

var queryInsert = function(sql, param, callback){
    MYSQL_POOL.getConnection(function(err, connection){
        if(err) {
            logger.error("getConnection err...", err);
        } else {
            connection.query(sql, param, function (err, row, fields){
                if(err){
                    logger.error("err:",err);
                }
                connection.release();
                callback(err, row, fields);
            });
        }
    })
}

module.exports = {
    'query':query,
    'queryInsert':queryInsert,
    'db':db
};