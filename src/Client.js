import request from 'superagent';

import Chain from 'maf-chain';

import Response from './Response';

export default class RestClient {
    constructor(logger, config) {
        this.Response = Response;

        this._logger = logger;
        this._config = config;

        this._base = null;

        if (this._config && typeof this._config.base !== 'undefined') {
            this._base = config.base;
        }

        this._useragent = null;

        if (this._config && this._config.useragent) {
            this._useragent = this._config.useragent;
        }

        this._accessTokenQueryName = 'token';

        if (this._config && this._config.accessTokenQueryName) {
            this._accessTokenQueryName = this._config.accessTokenQueryName;
        }

        this._accessToken = null;
    }

    setAccessToken(token) {
        this._accessToken = token;
    }

    req(method, url, logger) {
        let steps = {
            method: null,

            url: (data, value) => {
                if (typeof value === 'string' && value[0] === '/') {
                    return `${this._base}${value}`;
                }

                return value;
            },

            timeout: null,

            requestId: (data, value) => {
                if (typeof value === 'undefined') {
                    return;
                }

                if (!data.headers) {
                    data.headers = {};
                }

                data.headers['x-request-id'] = value;
            },

            reqId: (data, value) => {
                if (typeof value === 'undefined') {
                    return;
                }

                if (!data.headers) {
                    data.headers = {};
                }

                data.headers['x-request-id'] = value;
            },

            useragent: (data, value) => {
                if (typeof value === 'undefined') {
                    return;
                }

                if (!data.headers) {
                    data.headers = {};
                }

                data.headers['user-agent'] = value;
            },

            query: {},
            cookies: null,
            headers: null,
            stream: null,
            body: null,
            auth: function(data, user, password) {
                data.auth = {
                    user,
                    password
                };
            }

        };

        let defaults = {
            method: method,
            stream: false,
            timeout: 1500,
            query: {},
            headers: {}
        };

        let chain = new Chain(steps, defaults);

        if (typeof url !== 'undefined') {
            chain.url(url);
        }

        chain.onExec((req) => {
            if (!req.headers['user-agent'] && this._useragent) {
                req.headers['user-agent'] = this._useragent;
            }

            if (this._accessToken) {
                req.query[this._accessTokenQueryName] = this._accessToken;
            }

            return this._send(req, logger);
        });

        return chain;
    }

    get(url, logger) {
        return this.req('GET', url, logger);
    }

    post(url, logger) {
        return this.req('POST', url, logger);
    }

    patch(url, logger) {
        return this.req('PATCH', url, logger);
    }

    del(url, logger) {
        return this.req('DELETE', url, logger);
    }

    _send(req, logger) {
        return new Promise((resolve, reject) => {
            let method = req.method.toUpperCase();

            if (['GET', 'POST', 'PATCH', 'DELETE'].indexOf(method) > -1) {
                this['_send' + method](req, logger)
                    .then((res) => {
                        let response = new this.Response(res);
                        resolve(response);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } else {
                reject(new this.Error('unsupported method' + method));
            }
        });
    }

    _sendGET(req, logger) {
        return new Promise((resolve, reject) => {
            logger = logger || this._logger;

            logger.trace(req, 'GET');

            let http = request.get(req.url);

            this._processBasicData(http, req);

            http
                .then((res) => {
                    resolve(res);
                })
                .catch((error) => {
                    reject(this._processError(req, error));
                });
        });
    }

    _sendPOST(req, logger) {
        return new Promise((resolve, reject) => {
            logger = logger || this._logger;

            logger.trace(req, 'POST');

            let http = request.post(req.url);

            this._processBasicData(http, req);

            if (req.body) {
                http.send(req.body);
            }

            http
                .then((res) => {
                    resolve(res);
                })
                .catch((error) => {
                    reject(this._processError(req, error));
                });
        });
    }

    _sendPATCH(req, logger) {
        return new Promise((resolve, reject) => {
            logger = logger || this._logger;

            logger.trace(req, 'PATCH');

            let http = request.patch(req.url);

            this._processBasicData(http, req);

            if (req.body) {
                http.send(req.body);
            }

            http
                .then((res) => {
                    resolve(res);
                })
                .catch((error) => {
                    reject(this._processError(req, error));
                });
        });
    }

    _sendDELETE(req, logger) {
        return new Promise((resolve, reject) => {
            logger = logger || this._logger;

            logger.trace(req, 'DELETE');

            let http = request.del(req.url);

            this._processBasicData(http, req);

            if (req.body) {
                http.send(req.body);
            }

            http
                .then((res) => {
                    resolve(res);
                })
                .catch((error) => {
                    reject(this._processError(req, error));
                });
        });
    }

    _processBasicData(http, req) {
        if (Object.keys(req.query).length) {
            http.query(req.query);
        }

        if (req.body) {
            http.send(req.body);
        }

        if (req.headers) {
            http.set(req.headers);
        }

        if (req.auth) {
            http.auth(req.auth.user, req.auth.password);
        }

        if (req.timeout) {
            http.timeout(req.timeout);
        }
    }

    _processError(req, error) {
        error.req = req;
        error.res = error.response;

        if (
            error.response &&
            error.response.body &&
            error.response.body.error &&
            // error.response.body.error.code &&
            error.response.body.error.message
        ) {
            error.requestId = error.response.headers['x-request-id'];
            error.code = error.response.body.error.code;
            error.message = error.response.body.error.message;
            error.details = error.response.body.error.details;
        }

        error.req = {
            connection: 'fake conn',
            method: req.method,
            url: req.url,
            headers: req.headers,
            req_id: req.requestId
        };

        return error;
    }
}
