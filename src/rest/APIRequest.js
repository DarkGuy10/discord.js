'use strict';

const https = require('https');
const FormData = require('@discordjs/form-data');
const AbortController = require('abort-controller');
const fetch = require('node-fetch');
const constants = require('../util/Constants');

if (https.Agent) var agent = new https.Agent({ keepAlive: true });

class APIRequest {
  constructor(rest, method, path, options) {
    this.rest = rest;
    this.client = rest.client;
    this.method = method;
    this.route = options.route;
    this.options = options;
    this.retries = 0;

    let queryString = '';
    if (options.query) {
      const query = Object.entries(options.query)
        .filter(([, value]) => value !== null && typeof value !== 'undefined')
        .flatMap(([key, value]) => (Array.isArray(value) ? value.map(v => [key, v]) : [[key, value]]));
      queryString = new URLSearchParams(query).toString();
    }

    this.path = `${path}${queryString && `?${queryString}`}`;
  }

  make() {
    const API =
      this.options.versioned === false
        ? this.client.options.http.api
        : `${this.client.options.http.api}/v${this.client.options.http.version}`;
    const url = API + this.path;
    let headers = {};

    const token = this.rest.getAuth();
    if (this.options.auth !== false) headers.Authorization = token;
    if (this.options.reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(this.options.reason);
    headers['User-Agent'] = this.client.properties?.info['browser_user_agent'] ?? constants.userAgent;
    if (this.options.headers) headers = Object.assign(headers, this.options.headers);

    let body;
    if (this.options.files && this.options.files.length) {
      body = new FormData();
      for (const file of this.options.files) if (file && file.file) body.append(file.name, file.file, file.name);
      if (typeof this.options.data !== 'undefined') body.append('payload_json', JSON.stringify(this.options.data));
      headers = Object.assign(headers, body.getHeaders());
      // eslint-disable-next-line eqeqeq
    } else if (this.options.data != null) {
      body = JSON.stringify(this.options.data);
      headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeout = this.client.setTimeout(() => controller.abort(), this.client.options.restRequestTimeout);

    if (this.path.includes('/invites')) {
      headers = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Laguage': 'en-US',
        'Authorization': token,
        'Connection': 'keep-alive',
        'Cookie': '__cfduid=db537515176b9800b51d3de7330fc27d61618084707; __dcfduid=ec27126ae8e351eb9f5865035b40b75d; locale=en-US',
        'DNT': '1',
        'origin': 'https://discord.com',
        'Referer': 'https://discord.com/channels/@me',
        'TE': 'Trailers',
        'User-Agent': this.client.properties.info['User-Agent'],
        'X-Super-Properties': this.client.properties.toBase64()
      };
    }

    return fetch(url, {
      method: this.method,
      headers,
      agent,
      body,
      signal: controller.signal,
    }).finally(() => this.client.clearTimeout(timeout));
  }
}

module.exports = APIRequest;
