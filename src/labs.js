/**
 * Created by knut on 2016-04-17.
 */
var cronJob = require('cron').CronJob;
var cribMq = require('../../crib-mq');

var cribLog = require('../../crib-log/src/api');

var log = cribLog.createLogger('crib-scheduler-labs', 'debug');

var buss = cribMq.register('crib-scheduler');
log.info('Starting Scheduling service ', process.cwd());

var storage = require('../../crib-storage/src/api');
var dayState = require('./stateMachine.js');

storage.init(buss);

let scheduler = [{
  id: "EVENT_ID",
  date: '0 0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
  args: ['Ingvild on 0']
}];

let jobList = [];
module.exports.start = function(scheduleConf) {
  scheduleConf.forEach(function(cronItem) {
    log.debug('Setting up CRON event: ' + cronItem.id + 'with date str: ' + cronItem.date);
    var job = new cronJob(cronItem.date, function() {
      log.info('Cron triggering event: ' + cronItem.id + ' ' + cronItem.event);
      if (cronItem.event) {
        buss.emit(cronItem.event, cronItem.args);
      } else {
        buss.emit(cronItem.id, cronItem.args);
      }
    }, null, true);
    jobList.push(job);
  });
};

log.debug('Loading config from storage', process.cwd());

storage.get('dayDefinition').then((def) => {
  let dayDefinition;
  if (!def) {
    dayDefinition = {
      default: {
        PRE_NIGHT: '0:00',
        NIGHT: '1:30',
        PRE_MORNING: '5:30',
        MORNING: '6:00',
        DAY: '8:15',
        AFTERNOON: '14:30',
        PRE_EVENING: '17:30',
        EVENING: '19:30',
        POST_EVENING: '22:00'
      },
      weekend: {
        PRE_NIGHT: '0:00',
        NIGHT: '1:30',
        PRE_MORNING: '7:30',
        MORNING: '8:00',
        DAY: '10:30',
        AFTERNOON: '14:50',
        PRE_EVENING: '17:30',
        EVENING: '19:30',
        POST_EVENING: '22:00'
      },
      isVacation: false
    };

    // Todo save new conf
    storage.set('dayDefinition', dayDefinition);
    dayState.init(dayDefinition, buss); 
  }
  else {
    dayState.init(def, buss); 
  }
   
});

exports.stop = function() {
  jobList.forEach(function(aCronJob) {
    aCronJob.stop();
  });

  jobList = [];
};

