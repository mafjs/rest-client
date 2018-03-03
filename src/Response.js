class Response {
    constructor(res) {
        this._res = res;
    }

    body() {
        return this._res.body;
    }

    one() {
        return this._res.body.result;
    }

    raw() {
        return this._res.text;
    }

    metadata() {
        return this._res.body.metadata;
    }

    many() {
        return this._res.body.result;
    }

    requestId() {
        return this._res.headers['x-request-id'];
    }

    headers() {
        return this._res.headers;
    }

    header(name) {
        name = name.toLowerCase();
        return this._res.headers[name];
    }
}

module.exports = Response;
