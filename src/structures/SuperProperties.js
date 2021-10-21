const fetch = require('node-fetch-retry');
const { UserAgent } = require('../util/Constants');

module.exports = class SuperProperties {
   constructor() {
      this.info = {
         os: 'Windows',
         browser: 'Chrome',
         device: '',
         system_locale: 'da-DK',
         os_version: '10',
         referrer: '',
         referring_domain: '',
         referrer_current: '',
         referring_domain_current: '',
         browser_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
         browser_version: '94.0.4606.71',
         release_channel: 'stable',
         client_event_source: null
      };
   }

   async getInfo() {
      const options = {
         headers: { 'User-Agent': UserAgent },
         retry: 3,
         pause: 500,
         silent: true
      };

      const res = await fetch('https://discord.com/app', options).then(r => r.text());
      const assets = res?.match(/\/assets\/.{20}\.js/g);

      let version;
      for (const asset of assets ?? []) {
         const get = await fetch(`https://discord.com/${asset}`, options).then(r => r.text());
         const find = get.match(/build_number:".{6}"/g)?.[0]
            ?.replace(/"/g, '')
            ?.replace('build_number:', '');

         if (find) {
            version = find;
            break;
         }
      }

      if (!version || !res || !assets) {
         throw `Couldn't get latest build number`;
      }

      this.info['client_build_number'] = version;
   }

   async init() {
      await this.getInfo();
   }

   toString() {
      return JSON.stringify(this.info);
   }

   toBase64() {
      return Buffer.from(JSON.stringify(this.info)).toString('base64');
   }
};