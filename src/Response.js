class ClientResponse {

    constructor (res) {
        this._res = res;
    }

    one () {
        return this._res.body.result;
    }

    raw () {
        return this._res.text;
    }

    metadata () {
        return this._res.body.metadata;
    }

    many () {
        return this._res.body.result;
    }

    requestId () {
        return this._res.headers['x-request-id'];
    }
}

module.exports = ClientResponse;
