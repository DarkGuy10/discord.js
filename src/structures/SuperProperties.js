const fetch = require('node-fetch');

module.exports = class SuperProperties {
   constructor() {
      this.info = {
         os: 'Windows',
         browser: 'Chrome',
         device: '',
         system_locale: 'en-US',
         os_version: '10',
         referrer: '',
         referring_domain: '',
         referrer_current: '',
         referring_domain_current: '',
         release_channel: 'stable',
         client_event_source: null
      };

      this.getInfo();
      this.getBrowser();
   }

   async getInfo() {
      const res = await fetch('https://discord.com/app').then(r => r.text());
      const assets = res?.match(/\/assets\/.{20}\.js/g);

      let version;
      for (const asset of assets ?? []) {
         const get = await fetch(`https://discord.com/${asset}`).then(r => r.text());
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

   async getBrowser() {
      const res = await fetch('https://jnrbsn.github.io/user-agents/user-agents.json').then(r => r.json());

      if (!res) throw `Unable to get latest user agent`;

      const agent = res?.[0];
      const version = agent?.match(/Chrome\/([\d]+\.[\d]?\.?[\d]+)/g)?.[0]?.replace('Chrome/', '');

      if (!agent || !version) throw `Unable to get agent/version from user agent getter`;

      this.info['browser_version'] = version;
      this.info['browser_user_agent'] = agent;
   }

   toString() {
      return JSON.stringify(this.info);
   }

   toBase64() {
      return Buffer.from(JSON.stringify(this.info)).toString('base64');
   }
};