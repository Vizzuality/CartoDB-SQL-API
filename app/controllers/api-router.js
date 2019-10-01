'use strict';

const { Router: router } = require('express');

const UserDatabaseService = require('../services/user_database_service');
const UserLimitsService = require('../services/user_limits');

const BatchLogger = require('../../batch/batch-logger');

const JobPublisher = require('../../batch/pubsub/job-publisher');
const JobQueue = require('../../batch/job_queue');
const JobBackend = require('../../batch/job_backend');
const JobCanceller = require('../../batch/job_canceller');
const JobService = require('../../batch/job_service');

const QueryController = require('./query_controller');
const CopyController = require('./copy_controller');
const JobController = require('./job_controller');

const cors = require('../middlewares/cors');
const servedByHostHeader = require('../middlewares/served-by-host-header');


module.exports = class ApiRouter {
    constructor ({ redisPool, metadataBackend, statsClient, dataIngestionLogger }) {
        const userLimitsServiceOptions = {
            limits: {
                rateLimitsEnabled: global.settings.ratelimits.rateLimitsEnabled
            }
        };

        const userDatabaseService = new UserDatabaseService(metadataBackend);
        const userLimitsService = new UserLimitsService(metadataBackend, userLimitsServiceOptions);

        this.queryController = new QueryController(
            metadataBackend,
            userDatabaseService,
            statsClient,
            userLimitsService
        );

        this.copyController = new CopyController(
            metadataBackend,
            userDatabaseService,
            userLimitsService,
            dataIngestionLogger
        );

        const logger = new BatchLogger(global.settings.batch_log_filename, 'batch-queries');
        const jobPublisher = new JobPublisher(redisPool);
        const jobQueue = new JobQueue(metadataBackend, jobPublisher, logger);
        const jobBackend = new JobBackend(metadataBackend, jobQueue, logger);
        const jobCanceller = new JobCanceller();
        const jobService = new JobService(jobBackend, jobCanceller, logger);

        this.jobController = new JobController(
            metadataBackend,
            userDatabaseService,
            jobService,
            statsClient,
            userLimitsService
        );
    }

    route (app) {
        const apiRouter = router({ mergeParams: true });

        apiRouter.use(cors());
        apiRouter.use(servedByHostHeader());

        this.queryController.route(apiRouter);
        this.copyController.route(apiRouter);
        this.jobController.route(apiRouter);

        app.use(`${global.settings.base_url}`, apiRouter);
    }
};