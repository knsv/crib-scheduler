/**
 * Created by knut on 2016-01-24.
 */
var cronJob = require('cron').CronJob;

var state = {
  DAY_STATE: ''
};

var buss;

exports.getState = function(stateType) {
  return state[stateType];

};

exports.isWeekday = function(date) {
  return !(date.getDay() === 0 || date.getDay() === 6);
};

exports.hourStrToCronStr = function(hourStr, weekday) {
  var timeParts = hourStr.split(':');

  var res = '';
  switch (timeParts.length) {
    case 1:
      // Only hour was defined
      res = '0 0 ' + timeParts[0];
      break;
    case 2:
      // Hours and  was defined
      res = '0 ' + timeParts[1] + ' ' + timeParts[0];
      break;
    case 3:
      // Hours and  was defined
      res = timeParts[2] + ' ' + timeParts[1] + ' ' + timeParts[0];
  }

  if (weekday) {
    res = res + ' * * 1-5';
  } else {
    res = res + ' * * 0,6';
  }
  return res;
};

exports.registerCronjob = function(hourStr, eventName, weekday) {
  var cronStr = exports.hourStrToCronStr(hourStr, weekday);
  console.log('Cronstr = ' + cronStr);
  var job = new cronJob(cronStr, function() {
    state.DAY_STATE = eventName;
    buss.emit('DAY_STATE_CHANGE', [state.DAY_STATE]);
  }, false, process.env.TZ);
  job.start();
};

exports.findCurrentState = function(intervalls, date) {
  var keys = Object.keys(intervalls);
  var i = 0;

  var orgTime = date.getTime();

  var setTimeFromStr = function(_date, str) {
    var timeParts = str.split(':');
    var res = '';
    switch (timeParts.length) {
      case 1:
        // Only hour was defined
        _date.setHours(timeParts[0]);
        _date.setMinutes(0);
        _date.setSeconds(0);
        break;
      case 2:
        // Hours and  was defined
        _date.setHours(timeParts[0]);
        _date.setMinutes(timeParts[1]);
        _date.setSeconds(0);
        break;
      case 3:
        // Hours and  was defined
        _date.setHours(timeParts[0]);
        _date.setMinutes(timeParts[1]);
        _date.setSeconds(timeParts[2]);
    }
    return date;
  };

  var matchingKey;
  for (i = 0; i < keys.length; i++) {
    var key = keys[i];
    // Create date based to date but with time from inter
    date = setTimeFromStr(date, intervalls[key]);

    // See if that date is bigger then the current date, if so return last found intervall
    if (date.getTime() < orgTime) {
      matchingKey = key;
    } else {
      return matchingKey;
    }
  }
};

exports.init = function(cnf, _buss) {
  console.log('statemachine init', cnf);
  buss = _buss;
  // Setup weekday events
  Object.keys(cnf.default).forEach(function(def) {
    exports.registerCronjob(cnf.default[def], def, true);
  });

  // Setup weekday events
  Object.keys(cnf.weekend).forEach(function(def) {
    exports.registerCronjob(cnf.weekend[def], def, false);
  });

  // Send initial event with current state
  var now = new Date();
  if (exports.isWeekday(now)) {
    state.DAY_STATE = exports.findCurrentState(cnf.default, now);
  } else {
    state.DAY_STATE = exports.findCurrentState(cnf.weekend, now);
  }
  console.log('before emit');
  buss.emit('DAY_STATE_CHANGE', [state.DAY_STATE]);

  buss.on('REQUEST_DAY_STATE',()=>{
    buss.emit('DAY_STATE', [state.DAY_STATE]);
  });

};
