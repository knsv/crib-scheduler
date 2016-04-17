/**
 * Created by knut on 2016-04-17.
 */
var cronJob = require('cron').CronJob;
var cribMq = require('crib-mq');

var buss = cribMq.register('crib-scheduler', 'http://127.0.0.1:8900');
console.log('Starting Scheduling service',process.cwd());
module.exports = function(config){
    config.scheduler.forEach(function (cronItem) {
        console.log('Setting up CRON event: ' + cronItem.id + 'with date str: ' + cronItem.date);
        var job = new cronJob(cronItem.date, function () {
            console.log('Cron triggering event: ' + cronItem.id);
            buss.emit(cronItem.id, cronItem.args);
        }, null, true);
    });
};

var conf = require(process.cwd()+'/crib.conf.js');
module.exports(conf);