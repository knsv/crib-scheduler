/**
 * Created by knut on 2016-04-17.
 */
var cronJob = require('cron').CronJob;
var cribMq = require('../../crib-mq');

var cribLog = require('../../crib-log/src/api');

var log = cribLog.createLogger('crib-scheduler','debug');


var buss = cribMq.register('crib-scheduler');
log.info('Starting Scheduling service ',process.cwd());

var  storage = require('../../crib-storage/src/api');
storage.init(buss);

let scheduler = [
    {id: "EVENT_1", args: {test: 1}, date: "0 * * * * *"},
    {id: "EVENT_2", date: "0 0,5,10,15,20,25,30,35,40,45,50,55 * * * *"},
    {id: "Hue Work", date: "0 15 8 * * *", event: "Hue Sleep", args: ["Ingvild on 0"]},
    {id: "Hue Afternoon", date: "0 18 15 * * *",args: ["Ingvild on 0"]},
    {id: "Hue Early Evening", date: "0 0 18 * * *", args: ["Bjarke on 0"]},
    {id: "Hue Evening", date: "0 0 20 * * *", args: ["Vidar on 0"]},
    {id: "Hue Night", date: "0 0 22 * * *", args: ["Maria on 0"]},
    {id: "Hue Late Night", date: "0 30 0 * * *", args: ["Knut on 0"]},
    {id: "Hue Sleep", date: "0 15 1 * * *", "event": "Hue Sleep", args: ["All Off"]},
    {id: "Hue Morning", date: "0 0 6 * * *", "event": "Hue Morning", args: ["Bjarke on 0"]}
];

let jobList = [];
module.exports.start = function(scheduleConf){
    scheduleConf.forEach(function (cronItem) {
        log.debug('Setting up CRON event: ' + cronItem.id + 'with date str: ' + cronItem.date);
        var job = new cronJob(cronItem.date, function () {
            log.info('Cron triggering event: ' + cronItem.id + ' ' + cronItem.event);
            if(cronItem.event){
                buss.emit(cronItem.event, cronItem.args);
            }else{
                buss.emit(cronItem.id, cronItem.args);
            }
        }, null, true);
        jobList.push(job);
    });
};



//var conf = require(process.cwd()+'/crib.conf.js');

log.debug('Loading config from storage',process.cwd());
storage.get('scheduler').then((storageConf) => {
    log.debug('Config received',storageConf);
    module.exports.start(storageConf);
});

exports.stop = function () {
    jobList.forEach(function (aCronJob) {
        aCronJob.stop();
    });

    jobList = [];
};

buss.on('START_SCHEDULER',function(){
    storage.get('scheduler').then((storageConf) => {
        log.debug('Config received',storageConf);
        module.exports.start(storageConf);
    });
});

buss.on('STOP_SCHEDULER',function(){
    jobList.forEach(function (aCronJob) {
        aCronJob.stop();
    });
});


buss.on('RESTART_SCHEDULER',function(){
    log.debug('RESTARTING SCHEDULER');
    jobList.forEach(function (aCronJob) {
        aCronJob.stop();
    });
    log.debug('Jobs stopped, starting jobs again');
    buss.emit('START_SCHEDULER');
});
