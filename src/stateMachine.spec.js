/**
 * Created by knut on 2016-01-24.
 */
var stateMachine = require('./stateMachine');
describe('When converting time strings to cron strings', function () {

    it('should handle time string with only hours defined', function () {
        expect(stateMachine.hourStrToCronStr('7',true)).toBe('0 0 7 * * 1-5');
    });

    it('should handle time string with hours and minutes defined', function () {
        expect(stateMachine.hourStrToCronStr('7:30',true)).toBe('0 30 7 * * 1-5');
    });

    it('should handle time string with hours, minutes and seconds defined', function () {
        expect(stateMachine.hourStrToCronStr('7:30:15',true)).toBe('15 30 7 * * 1-5');
    });

    it('should weekends', function () {
        expect(stateMachine.hourStrToCronStr('7:30:15',false)).toBe('15 30 7 * * 0,6');
    });
});


describe('When initializing the stateMachine', function () {
    var conf = {

    };
    beforeEach(function(){
       conf = {
           "dayDefintion": {
               "default": {
                   "PRE_NIGHT": "0:00",
                   "NIGHT": "1:30",
                   "PRE_MORNING": "6:00",
                   "MORNING"    : "7:00",
                   "DAY": "8:00",
                   "AFTERNOON": "14:30",
                   "PRE_EVENING": "17:00",
                   "EVENING": "20:00",
                   "POST_EVENING": "22:00"
               },
               "weekend": {
                   "PRE_NIGHT": "0:00",
                   "NIGHT": "1:30",
                   "PRE_MORNING": "8:00",
                   "MORNING"    : "9:00",
                   "DAY": "10:30",
                   "AFTERNOON": "14:30",
                   "PRE_EVENING": "17:00",
                   "EVENING": "20:00",
                   "POST_EVENING": "22:00"
               }
           }
       };
    });
    it('should handle time string with only hours defined', function () {
        spyOn(stateMachine,'registerCronjob');
        stateMachine.init(conf);
        expect(stateMachine.registerCronjob).toHaveBeenCalledWith('0:00','PRE_NIGHT',true);
        expect(stateMachine.registerCronjob).toHaveBeenCalledWith('1:30','NIGHT',true);
        expect(stateMachine.registerCronjob).toHaveBeenCalledWith('6:00','PRE_MORNING',true);
        expect(stateMachine.registerCronjob).toHaveBeenCalledWith('7:00','MORNING',true);
        expect(stateMachine.registerCronjob).toHaveBeenCalledWith('8:00','DAY',true);
        expect(stateMachine.registerCronjob).toHaveBeenCalledWith('22:00','POST_EVENING',true);
        expect(stateMachine.registerCronjob).toHaveBeenCalledWith('8:00','PRE_MORNING',false);
    });

    it('should figure out what the current state is', function () {
        //spyOn(stateMachine,'registerCronjob');
        var date = new Date();

        date.setHours(15);
        date.setMinutes(30);
        date.setSeconds(0);
        expect(stateMachine.findCurrentState(conf.dayDefintion.weekend,date)).toBe('AFTERNOON');

        date.setHours(8);
        date.setMinutes(30);
        date.setSeconds(0);
        expect(stateMachine.findCurrentState(conf.dayDefintion.weekend,date)).toBe('PRE_MORNING');

        date.setHours(8);
        date.setMinutes(30);
        date.setSeconds(0);
        expect(stateMachine.findCurrentState(conf.dayDefintion.default,date)).toBe('DAY');

    });
});