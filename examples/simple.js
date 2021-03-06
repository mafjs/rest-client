let GithubClient = require('./Github');

let logger = require('maf-logger').create('example', {logResponseBody: true});

logger.level('trace');

let client = new GithubClient(logger);

client.getUser('alekzonder')
    .then((res) => {
        console.log(res.user.login);
        console.log(res.rateLimit, res.remainingRateLimit, res.rateLimitReset);
    })
    .catch((error) => {
        logger.error({req: error.req, res: error.res, err: error});
    });
