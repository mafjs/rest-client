'use strict';

var RestClient = require('../package');

var Response = require('../package/Response');

class GithubResponse extends Response {

    get user () {
        return this.body();
    }

    get rateLimit () {
        return this.header('X-RateLimit-Limit');
    }

    get remainingRateLimit () {
        return this.header('X-RateLimit-Remaining');
    }

    get rateLimitReset () {
        return this.header('X-RateLimit-Reset');
    }

}


class GithubClient extends RestClient {

    constructor (logger, config) {
        super(logger, config);

        if (!this._base) {
            this._base = 'https://api.github.com';
        }

        this.Response = GithubResponse;
    }

    getUser (user) {
        return this.get(`/users/${user}`).exec();
    }

    getUserRepos (user) {
        return this.get(`/users/${user}/repos`);
    }

}

module.exports = GithubClient;
