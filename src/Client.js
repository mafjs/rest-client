import request from 'superagent';

import Chain from 'maf-chain';

import Response from './Response';

export default class RestClient {

    constructor (logger, config) {

        this.Response = Response;

        this._logger = logger;
        this._config = config;

        this._base = null;

        if (this._config && this._config.base) {
            this._base = config.base;
        }

    }

    req (method, url) {

        var steps = {
            method: null,

            url: (data, value) => {

                if (typeof value === 'string' && value[0] === '/') {
                    return `${this._base}${value}`;
                }

                return value;
            },

            requestId: (data, value) => {

                if (!data.headers) {
                    data.headers = {};
                }

                data.id = value;

                data.headers['x-request-id'] = value;
            },

            query: null,
            cookies: null,
            headers: null,
            stream: null,
            body: null,
            auth: function (data, user, password) {
                data.auth = {
                    user,
                    password
                };
            }

        };

        var defaults = {
            method: method,
            stream: false
        };

        var chain = new Chain(steps, defaults);

        if (typeof url !== 'undefined') {
            chain.url(url);
        }

        chain.onExec((req) => {
            return this._send(req);
        });

        return chain;
    }

    get (url) {
        return this.req('GET', url);
    }

    post (url) {
        return this.req('POST', url);
    }

    patch (url) {
        return this.req('PATCH', url);
    }

    del (url) {
        return this.req('DELETE', url);
    }

    _send (req) {

        return new Promise((resolve, reject) => {

            let method = req.method.toUpperCase();

            if (['GET', 'POST', 'PATCH', 'DELETE'].indexOf(method) > -1) {

                this['_send' + method](req)
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

    _sendGET (req) {

        return new Promise((resolve, reject) => {
            this._logger.trace(req, 'GET');

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

    _sendPOST (req) {

        return new Promise((resolve, reject) => {
            this._logger.trace(req, 'POST');

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

    _sendPATCH (req) {

        return new Promise((resolve, reject) => {
            this._logger.trace(req, 'PATCH');

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

    _sendDELETE (req) {

        return new Promise((resolve, reject) => {
            this._logger.trace(req, 'DELETE');

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

    _processBasicData (http, req) {
        if (req.query) {
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
    }

    _processError (req, error) {
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

        return error;
    }
}
