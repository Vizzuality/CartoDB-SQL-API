'use strict';

require('../../helper');
var assert = require('../../support/assert');
var Scheduler = require('../../../batch/scheduler/scheduler');
var OneCapacity = require('../../../batch/scheduler/capacity/one');
var InfinityCapacity = require('../../../batch/scheduler/capacity/infinity');

describe('scheduler', function() {

    function TaskRunner(userTasks) {
        this.results = [];
        this.userTasks = userTasks;
    }

    TaskRunner.prototype.run = function(user, callback) {
        this.results.push(user);
        this.userTasks[user]--;
        return callback(null, this.userTasks[user] === 0);
    };

    // simulate one by one or infinity capacity
    var capacities = [new OneCapacity(), new InfinityCapacity()];

    capacities.forEach(function(capacity) {
        it('should run tasks', function (done) {
            var taskRunner = new TaskRunner({
                userA: 1
            });
            var scheduler = new Scheduler(capacity, taskRunner);
            scheduler.add('userA');

            scheduler.on('done', function() {
                var results = taskRunner.results;

                assert.equal(results.length, 1);

                assert.equal(results[0], 'userA');

                return done();
            });

            scheduler.schedule();
        });


        it('should run tasks for different users', function (done) {
            var taskRunner = new TaskRunner({
                userA: 1,
                userB: 1,
                userC: 1
            });
            var scheduler = new Scheduler(capacity, taskRunner);
            scheduler.add('userA');
            scheduler.add('userB');
            scheduler.add('userC');

            scheduler.on('done', function() {
                var results = taskRunner.results;

                assert.equal(results.length, 3);

                assert.equal(results[0], 'userA');
                assert.equal(results[1], 'userB');
                assert.equal(results[2], 'userC');

                return done();
            });

            scheduler.schedule();
        });

        it('should be fair when scheduling tasks', function (done) {
            var taskRunner = new TaskRunner({
                userA: 3,
                userB: 2,
                userC: 1
            });

            var scheduler = new Scheduler(capacity, taskRunner);
            scheduler.add('userA');
            scheduler.add('userA');
            scheduler.add('userA');
            scheduler.add('userB');
            scheduler.add('userB');
            scheduler.add('userC');

            scheduler.on('done', function() {
                var results = taskRunner.results;

                assert.equal(results.length, 6);

                assert.equal(results[0], 'userA');
                assert.equal(results[1], 'userB');
                assert.equal(results[2], 'userC');
                assert.equal(results[3], 'userA');
                assert.equal(results[4], 'userB');
                assert.equal(results[5], 'userA');

                return done();
            });

            scheduler.schedule();
        });
    });
});