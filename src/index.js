/**
 * Created by knut on 2016-04-17.
 */
var cronJob = require('cron').CronJob;
var cribMq = require('crib-mq');

var buss = cribMq.register('crib-scheduler', 'http://127.0.0.1:8900');

module.export = function(config){
    config.cron.forEach(function (cronItem) {
        //log.trace('Setting up CRON event: ' + cronItem.id + 'with date str: ' + cronItem.date);
        var job = new cronJob(cronItem.date, function () {
            //console.log('Cron triggering event: ' + cronItem.id);
            buss.emit(cronItem.id, cronItem.args);
        }, null, true);
    });
};

