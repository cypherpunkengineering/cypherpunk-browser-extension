import { Http } from '@angular/http';
import { HqService } from './hq.service';
import { Injectable } from '@angular/core';
import { PingService } from './ping.service';
import { Observable } from 'rxjs/Observable';
import { SettingsService } from './settings.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { LocalStorageService } from 'angular-2-local-storage';

@Injectable()
export class ProxySettingsService {
  servers;
  serverArr;
  latencyList;
  accountType;
  proxyExtSubject: BehaviorSubject<any>;
  proxyExtObservable: Observable<any>;

  constructor (
    private http: Http,
    private hqService: HqService,
    private pingService: PingService,
    private settingsService: SettingsService,
    private localStorageService: LocalStorageService
  ) {
    // Try to load cached server info
    let serverData = this.settingsService.proxySettingsService();
    this.latencyList = serverData.latencyList;
    if (this.latencyList) {
      this.servers = serverData.proxyServers;
      this.serverArr = serverData.proxyServersArr;
    }

    // If app is updated by background script while open
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'ServersUpdated') {
        console.log('SERVERS UPDATED');
        let updatedServerData = this.settingsService.proxySettingsService();
        this.servers = updatedServerData.proxyServers;
        this.serverArr = updatedServerData.proxyServersArr;
        this.latencyList = updatedServerData.latencyList;
      }
    });

    // check if proxy settings are allowed
    this.proxyExtSubject = <BehaviorSubject<any>>new BehaviorSubject({});
    this.proxyExtObservable = this.proxyExtSubject.asObservable();
    let isFirefox = this.settingsService.isFirefox();
    if (!isFirefox) {
      chrome.proxy.settings.get({incognito: false}, (details) => {
        if (details.levelOfControl !== 'controlled_by_this_extension' || details.levelOfControl !== 'controlled_by_this_extension') {
          this.findProxyExtension();
        }
      });
    }
  }

  findProxyExtension() {
    let found = false;
    chrome.management.getAll((exts) => {
      exts.forEach((ext) => {
        if (ext.enabled &&
            ext.id !== chrome.runtime.id &&
            ext.permissions.indexOf('proxy') > -1 &&
            !found) {
          found = true;
          this.proxyExtSubject.next(ext);
          return;
        }
      });
    });
  }

  loadServers() {
    return new Promise((resolve, reject) => {
      this.hqService.fetchUserStatus()
      .flatMap(data => {
        this.accountType = data.account.type;
        this.settingsService.saveProxyCredentials(data.privacy.username, data.privacy.password);
        return this.hqService.findServers(this.accountType); // fetch proxy server list
      })
      .subscribe(
        servers => {
          this.servers = servers;
          this.serverArr = this.getServerArray();
          this.settingsService.saveProxyServers(servers, this.serverArr);

          // Populate list of servers sorted by latency
          this.pingService.getServerLatencyList(this.serverArr, 3, this.accountType)
          .then((latencyArray) => {
            this.settingsService.saveLatencyList(latencyArray);
            this.latencyList = latencyArray;
            resolve();
          });
        },
        error => { reject(error); }
      );
    });
  }

  getServerArray() {
    let order = {};

    for (let i = 0; i < this.regionOrder.length; i++) {
      order[this.regionOrder[i]] = i + 1;
    }

    let serverArr = [];
    let serverKeys = Object.keys(this.servers);
    serverKeys.forEach((key: any) => { serverArr.push(this.servers[key]); });

    // Sort By Region, Country, Name
    serverArr.sort(function(a, b) {
      if (order[a.region] < order[b.region]) { return -1; };
      if (order[a.region] > order[b.region]) { return 1; }
      if (a.country < b.country) { return -1; }
      if (a.country > b.country) { return 1; }
      if (a.name < b.name) { return -1; }
      if (a.name > b.name) { return 1; }
      return 0;
    });

    return serverArr;
  }

  getServer(serverId: any) {
    if (!serverId || !this.servers) { return {}; }
    return this.servers[serverId];
  }

  enableProxy() {
    if (!this.settingsService.enabled) { return; }
    if (!this.latencyList || !this.servers) { return; }
    let config = this.generatePACConfig();

    // Firefox has to apply proxy in background script
    if (this.settingsService.isFirefox()) {
      chrome.runtime.sendMessage({ action: 'SetPACScript', pacScript: config.pacScript.data });
    }
    // Apply PAC Script in Chrome
    else { chrome.proxy.settings.set({ value: config, scope: 'regular' }); }
  }

  disableProxy() {
    // Firefox has to reset proxy in background script
    if (this.settingsService.isFirefox()) {
      chrome.runtime.sendMessage({ action: 'ResetPACScript'});
    }
    // Rest PAC Script settings in Chrome
    else { chrome.proxy.settings.set({ value: { mode: 'system' }, scope: 'regular' }); }
  }

  generatePACConfig() {
    let config = { mode: 'pac_script', pacScript: { data: this.generatePACScript() } };
    this.settingsService.savePacScriptConfig(config);
    return config;
  }

  generatePACScript() {
    let pacScript = 'function FindProxyForURL(url, host) {\n' +
      '  /* Normalize the URL for pattern matching */\n' +
      '  url = url.toLowerCase();\n' +
      '  host = host.toLowerCase();\n\n' +
      '  /* Don\'t proxy local hostnames */\n' +
      '  if (isPlainHostName(host)) return \'DIRECT\';\n\n' +
      '  /* Don\'t proxy connection to cypherpunk domains */\n' +
      '  if (shExpMatch(host, "api.cypherpunk.com")) return \'DIRECT\';\n' +
      '  if (shExpMatch(host, "cypherpunk.com")) return \'DIRECT\';\n';

    // 1. Generate direct pinging rules for proxy addresses
    // Do not apply proxy when pinging proxy servers to measure latency
    pacScript += this.generateDirectPingRules();

    // 2. Iterate through "siteOverride" object and generate domain specific rules
    pacScript += this.generateDomainSpecificRules();

    // 3. Look at default selected Routing type and generate base rules
    pacScript += this.generateDefaultRoutingRules();

    pacScript += '}';

    console.log(pacScript);

    return pacScript;
  }

  generateDirectPingRules() {
    let directPingRules = '';
    this.serverArr.forEach(function(server) {
      if (server.ovHostname) {
        directPingRules += '  if (shExpMatch(host, "' + server.ovHostname + '")) return \'DIRECT\';\n';
      }
    });

    return directPingRules;
  }

  generateDomainSpecificRules() {
    let rules = ''; // return value
    let privacyMode = this.settingsService.privacyMode;
    let overrides = this.settingsService.siteOverrides;
    let defaultProxyType = this.settingsService.defaultRoutingType;
    let defaultServerId = this.settingsService.defaultRoutingServer;
    let blockAdsGlobal = this.settingsService.privacyFilterAds;
    let blockMalwareGlobal = this.settingsService.privacyFilterMalware;

    Object.keys(overrides).forEach((domain) => {
      let override = overrides[domain];

      let proxyType = defaultProxyType;
      if (override.type !== undefined) { proxyType = override.type; }

      let serverId = defaultServerId;
      if (override.serverId !== undefined) { serverId = override.serverId; }

      let blockAds = blockAdsGlobal;
      if (override.blockAds !== undefined) { blockAds = override.blockAds; }

      let blockMalware = blockMalwareGlobal;
      if (override.blockMalware !== undefined) { blockMalware = override.blockMalware; }

      let protocol = privacyMode ? 'HTTPS' : 'PROXY';
      let port = this.generatePort(blockAds, blockMalware, proxyType, privacyMode);

      // FastestUS: Route to fastest US server always
      if (proxyType === 'FASTESTUS') {
        let fastestUSServer = this.getFastestUSServer();
        if (fastestUSServer) {
          let fusIp = fastestUSServer.ipsecHostname;
          rules += `  if (shExpMatch(host, "${domain}") || dnsDomainIs(host, ".${domain}")) return '${protocol} ${fusIp}:${port}';\n`;
        }
      }
      // FastestUK: Route to fastest UK server always
      else if (proxyType === 'FASTESTUK') {
        let fastestUKServer = this.getFastestUKServer();
        if (fastestUKServer) {
          let fukIp = fastestUKServer.ipsecHostname;
          rules += `  if (shExpMatch(host, "${domain}") || dnsDomainIs(host, ".${domain}")) return '${protocol} ${fukIp}:${port}';\n`;
        }
      }
      // Starred Servers: Route to fastest UK server always
      else if (proxyType === 'STAR') {
        let starServer = this.getStarServer();
        if (starServer) {
          let starIp = starServer.ipsecHostname;
          rules += `  if (shExpMatch(host, "${domain}") || dnsDomainIs(host, ".${domain}")) return '${protocol} ${starIp}:${port}';\n`;
        }
      }
      // Selected: Route to the selected server
      else if (proxyType === 'SELECTED') {
        let proxyIp = this.servers[serverId].ipsecHostname;
        rules += `  if (shExpMatch(host, "${domain}") || dnsDomainIs(host, ".${domain}")) return '${protocol} ${proxyIp}:${port}';\n`;
      }
      // None: Do not proxy
      else if (proxyType === 'NONE') {
        rules += `  if (shExpMatch(host, "${domain}") || dnsDomainIs(host, ".${domain}")) return 'DIRECT';\n`;
      }
      // Fastest/Smart: Route to fastest server for TLD
      else {
        let fastestServer = this.getFastestServer();
        if (fastestServer) {
          let fsIp = fastestServer.ipsecHostname;
          rules += `  if (shExpMatch(host, "${domain}") || dnsDomainIs(host, ".${domain}")) return '${protocol} ${fsIp}:${port}';\n`;
        }
      }
    });
    return rules;
  }

  generateDefaultRoutingRules() {
    let defaultRoutingRules = '';
    let useCypherPlay = !this.settingsService.serverId;
    let serverId = this.settingsService.serverId;
    let privacyMode = this.settingsService.privacyMode;
    let blockAds = this.settingsService.privacyFilterAds;
    let blockMalware = this.settingsService.privacyFilterMalware;
    let protocol = privacyMode ? 'HTTPS' : 'PROXY';
    let port = this.generatePort(blockAds, blockMalware, useCypherPlay, privacyMode);

    // Fastest/Smart: Route to fastest server for each TLD
    if (useCypherPlay) {
      let fastestServer = this.getFastestServer();
      if (fastestServer) {
        let fastestServerIp = fastestServer.ipsecHostname;
        defaultRoutingRules += `  else return '${protocol} ${fastestServerIp}:${port}';\n`;
      }
    }
    // Selected: Route to the default selected server
    else {
      let proxyIp = this.servers[serverId].ipsecHostname;
      defaultRoutingRules += `  else return '${protocol} ${proxyIp}:${port}';\n`;
    }
    return defaultRoutingRules;
  }

  old_generateDefaultRoutingRules() {
    let defaultRoutingRules = '';
    let routingType = this.settingsService.defaultRoutingType;
    let serverId = this.settingsService.defaultRoutingServer;
    let privacyMode = this.settingsService.privacyMode;
    let blockAds = this.settingsService.privacyFilterAds;
    let blockMalware = this.settingsService.privacyFilterMalware;
    let protocol = privacyMode ? 'HTTPS' : 'PROXY';
    let port = this.generatePort(blockAds, blockMalware, routingType, privacyMode);

    // FastestUS: Route to fastest US server always
    if (routingType === 'FASTESTUS') {
      let fastestUSServer = this.getFastestUSServer();
      if (fastestUSServer) {
        let fastestUSServerIp = fastestUSServer.ipsecHostname;
        defaultRoutingRules += `  else return '${protocol} ${fastestUSServerIp}:${port}';\n`;
      }
    }
    // FastestUK: Route to fastest UK server always
    else if (routingType === 'FASTESTUK') {
      let fastestUKServer = this.getFastestUKServer();
      if (fastestUKServer) {
        let fastestUKServerIp = fastestUKServer.ipsecHostname;
        defaultRoutingRules += `  else return '${protocol} ${fastestUKServerIp}:${port}';\n`;
      }
    }
    // Starred Servers: Route to fastest UK server always
    else if (routingType === 'STAR') {
      let starServer = this.getStarServer();
      if (starServer) {
        let starIp = starServer.ipsecHostname;
        defaultRoutingRules += `  else return '${protocol} ${starIp}:${port}';\n`;
      }
    }
    // Selected: Route to the default selected server
    else if (routingType === 'SELECTED') {
      let selectedProxyId = serverId;
      let proxyIp = this.servers[selectedProxyId].ipsecHostname;
      defaultRoutingRules += `  else return '${protocol} ${proxyIp}:${port}';\n`;
    }
    // None: Do not proxy
    else if (routingType === 'NONE') {
      defaultRoutingRules += `  else return 'DIRECT';\n`;
    }
    // Fastest/Smart: Route to fastest server for each TLD
    else {
      let fastestServer = this.getFastestServer();
      if (fastestServer) {
        let fastestServerIp = fastestServer.ipsecHostname;
        defaultRoutingRules += `  else return '${protocol} ${fastestServerIp}:${port}';\n`;
      }
    }
    return defaultRoutingRules;
  }

  generatePort(blockAds, blockMalware, useCypherPlay, useTLS): string {
    let port = 0;

    if (blockAds) { port += 1; }
    if (blockMalware) { port += 2; }
    if (useCypherPlay) { port += 4; }
    if (useTLS) { port += 512; }

    if (port === 0) { port = 80; }
    if (port === 512) { port = 443; }
    return port.toString();
  }

  getFastestServer() {
    if (!this.servers || !this.latencyList) { return null; }
    return this.servers[this.latencyList[0].id];
  }

  getFastestUKServer() {
    if (!this.servers || !this.latencyList) { return null; }
    let latencyServer = this.latencyList.find((serverLatency) => {
      return this.servers[serverLatency.id].country === 'GB';
    });
    if (!latencyServer) { return null; }
    return this.servers[latencyServer.id];
  }

  getFastestUSServer() {
    if (!this.servers || !this.latencyList) { return null; }
    let latencyServer = this.latencyList.find((serverLatency) => {
      return this.servers[serverLatency.id].country === 'US';
    });
    if (!latencyServer) { return null; }
    return this.servers[latencyServer.id];
  }

  getStarServer() {
    let starredServers = this.settingsService.starredServers;
    if (!starredServers.length) { return; }

    let mostRecent, first;
    starredServers.forEach((server) => {
      if (!server.httpDefault.length) { return; }

      if (!first) { first = server; }

      if (server.last_used && !mostRecent) { mostRecent = server; }
      else if (mostRecent && server.last_used > mostRecent.last_used) { mostRecent = server; }
    });

    let chosen;
    if (mostRecent) { chosen = mostRecent; }
    else if (first) { chosen = first; }

    return chosen;
  }

  regionOrder = [
    'DEV',
    'NA',
    'SA',
    'CR',
    'EU',
    'ME',
    'AF',
    'AS',
    'OP'
  ];

  regions = {
    'NA': 'North America',
    'SA': 'Central & South America',
    'CR': 'Caribbean',
    'OP': 'Oceania & Pacific',
    'EU': 'Europe',
    'ME': 'Middle East',
    'AF': 'Africa',
    'AS': 'Asia & India Subcontinent',
    'DEV': 'Development'
  };

  countries = {
    'US': 'United States',
    'CA': 'Canada',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'BR': 'Brazil',
    'CL': 'Chile',
    'CO': 'Colombia',
    'CR': 'Costa Rica',
    'EC': 'Ecuador',
    'GT': 'Guatemala',
    'PA': 'Panama',
    'PE': 'Peru',
    'UY': 'Uruguay',
    'VE': 'Venezuela, Bolivarian Republic of',
    'BZ': 'Belize',
    'BO': 'Bolivia, Plurinational State of',
    'SV': 'El Salvador',
    'GF': 'French Guiana',
    'GY': 'Guyana',
    'HN': 'Honduras',
    'NI': 'Nicaragua',
    'PY': 'Paraguay',
    'SR': 'Suriname',
    'AW': 'Aruba',
    'BS': 'Bahamas',
    'BB': 'Barbados',
    'BM': 'Bermuda',
    'DO': 'Dominican Republic',
    'HT': 'Haiti',
    'JM': 'Jamaica',
    'PR': 'Puerto Rico',
    'TT': 'Trinidad and Tobago',
    'VI': 'Virgin Islands, U.S.',
    'AI': 'Anguilla',
    'AG': 'Antigua and Barbuda',
    'BQ': 'Bonaire, Sint Eustatius and Saba',
    'VG': 'Virgin Islands, British',
    'KY': 'Cayman Islands',
    'CW': 'Curaçao',
    'DM': 'Dominica',
    'GD': 'Grenada',
    'GP': 'Guadeloupe',
    'MQ': 'Martinique',
    'MS': 'Montserrat',
    'MF': 'Saint Martin (French part)',
    'SX': 'Sint Maarten (Dutch part)',
    'KN': 'Saint Kitts and Nevis',
    'LC': 'Saint Lucia',
    'VC': 'Saint Vincent and the Grenadines',
    'TC': 'Turks and Caicos Islands',
    'AS': 'American Samoa',
    'AU': 'Australia',
    'FJ': 'Fiji',
    'GU': 'Guam',
    'NZ': 'New Zealand',
    'MP': 'Northern Mariana Islands',
    'VU': 'Vanuatu',
    'WF': 'Wallis and Futuna',
    'CK': 'Cook Islands',
    'PF': 'French Polynesia',
    'MH': 'Marshall Islands',
    'FM': 'Micronesia, Federated States of',
    'NC': 'New Caledonia',
    'PW': 'Palau',
    'PG': 'Papua New Guinea',
    'BE': 'Belgium',
    'FR': 'France',
    'DE': 'Germany',
    'IT': 'Italy',
    'ES': 'Spain',
    'CH': 'Switzerland',
    'NL': 'Netherlands',
    'TR': 'Turkey',
    'GB': 'United Kingdom',
    'AL': 'Albania',
    'AM': 'Armenia',
    'AT': 'Austria',
    'AZ': 'Azerbaijan',
    'BY': 'Belarus',
    'BA': 'Bosnia and Herzegovina',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'CY': 'Cyprus',
    'CZ': 'Czech Republic',
    'DK': 'Denmark',
    'EE': 'Estonia',
    'FO': 'Faroe Islands',
    'FI': 'Finland',
    'GE': 'Georgia',
    'GI': 'Gibraltar',
    'GR': 'Greece',
    'GL': 'Greenland',
    'HU': 'Hungary',
    'IS': 'Iceland',
    'IE': 'Ireland',
    'KZ': 'Kazakhstan',
    'LV': 'Latvia',
    'LI': 'Liechtenstein',
    'LT': 'Lithuania',
    'LU': 'Luxembourg',
    'MK': 'Macedonia, the former Yugoslav Republic of',
    'MT': 'Malta',
    'MD': 'Moldova, Republic of',
    'MC': 'Monaco',
    'ME': 'Montenegro',
    'NO': 'Norway',
    'PL': 'Poland',
    'PT': 'Portugal',
    'RO': 'Romania',
    'RU': 'Russian Federation',
    'SM': 'San Marino',
    'RS': 'Serbia',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'SE': 'Sweden',
    'TM': 'Turkmenistan',
    'UA': 'Ukraine',
    'UZ': 'Uzbekistan',
    'VA': 'Holy See (Vatican City State)',
    'BH': 'Bahrain',
    'KW': 'Kuwait',
    'OM': 'Oman',
    'QA': 'Qatar',
    'SA': 'Saudi Arabia',
    'AE': 'United Arab Emirates',
    'EG': 'Egypt',
    'IR': 'Iran, Islamic Republic of',
    'IQ': 'Iraq',
    'IL': 'Israel',
    'JO': 'Jordan',
    'LB': 'Lebanon',
    'SY': 'Syrian Arab Republic',
    'YE': 'Yemen',
    'BW': 'Botswana',
    'KE': 'Kenya',
    'MW': 'Malawi',
    'MA': 'Morocco',
    'MZ': 'Mozambique',
    'NA': 'Namibia',
    'NG': 'Nigeria',
    'ZA': 'South Africa',
    'SZ': 'Swaziland',
    'ZM': 'Zambia',
    'DZ': 'Algeria',
    'AO': 'Angola',
    'BJ': 'Benin',
    'BF': 'Burkina Faso',
    'BI': 'Burundi',
    'CM': 'Cameroon',
    'CV': 'Cape Verde',
    'CF': 'Central African Republic',
    'TD': 'Chad',
    'CG': 'Congo',
    'CD': 'Congo, the Democratic Republic of the',
    'DJ': 'Djibouti',
    'GQ': 'Equatorial Guinea',
    'ER': 'Eritrea',
    'ET': 'Ethiopia',
    'GA': 'Gabon',
    'GM': 'Gambia',
    'GH': 'Ghana',
    'GN': 'Guinea',
    'GW': 'Guinea-Bissau',
    'CI': 'Côte d\'Ivoire',
    'LS': 'Lesotho',
    'LR': 'Liberia',
    'LY': 'Libya',
    'MG': 'Madagascar',
    'ML': 'Mali',
    'MR': 'Mauritania',
    'MU': 'Mauritius',
    'NE': 'Niger',
    'RE': 'Réunion',
    'RW': 'Rwanda',
    'SN': 'Senegal',
    'SC': 'Seychelles',
    'SL': 'Sierra Leone',
    'SO': 'Somalia',
    'SD': 'Sudan',
    'TZ': 'Tanzania, United Republic of',
    'TG': 'Togo',
    'TN': 'Tunisia',
    'UG': 'Uganda',
    'ZW': 'Zimbabwe',
    'CN': 'China',
    'HK': 'Hong Kong',
    'IN': 'India',
    'ID': 'Indonesia',
    'JP': 'Japan',
    'MY': 'Malaysia',
    'PH': 'Philippines',
    'SG': 'Singapore',
    'KR': 'Korea, Republic of',
    'TW': 'Taiwan, Province of China',
    'TH': 'Thailand',
    'AF': 'Afghanistan',
    'BD': 'Bangladesh',
    'BT': 'Bhutan',
    'BN': 'Brunei Darussalam',
    'KH': 'Cambodia',
    'KG': 'Kyrgyzstan',
    'LA': 'Lao People\'s Democratic Republic',
    'MO': 'Macao',
    'MV': 'Maldives',
    'MN': 'Mongolia',
    'NP': 'Nepal',
    'PK': 'Pakistan',
    'LK': 'Sri Lanka',
    'VN': 'Viet Nam'
  };

}
