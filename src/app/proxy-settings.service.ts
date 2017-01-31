import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { LocalStorageService } from 'angular-2-local-storage';
import { HqService } from './hq.service';
import { SettingsService } from './settings.service';
import { Observable } from 'rxjs/Rx';
import { PingService } from './ping.service';

@Injectable()
export class ProxySettingsService {
  servers;
  serverArr;
  latencyList;
  fastestServer;
  fastestServerName = 'Loading...';

  regionOrder = [
    "DEV",
    "NA",
    "SA",
    "CR",
    "EU",
    "ME",
    "AF",
    "AS",
    "OP"
  ];

  regions = {
    "NA": "North America",
    "SA": "Central & South America",
    "CR": "Caribbean",
    "OP": "Oceania & Pacific",
    "EU": "Europe",
    "ME": "Middle East",
    "AF": "Africa",
    "AS": "Asia & India Subcontinent",
    "DEV": "Development"
  };

  countries = {
    "US": "United States",
    "CA": "Canada",
    "MX": "Mexico",
    "AR": "Argentina",
    "BR": "Brazil",
    "CL": "Chile",
    "CO": "Colombia",
    "CR": "Costa Rica",
    "EC": "Ecuador",
    "GT": "Guatemala",
    "PA": "Panama",
    "PE": "Peru",
    "UY": "Uruguay",
    "VE": "Venezuela, Bolivarian Republic of",
    "BZ": "Belize",
    "BO": "Bolivia, Plurinational State of",
    "SV": "El Salvador",
    "GF": "French Guiana",
    "GY": "Guyana",
    "HN": "Honduras",
    "NI": "Nicaragua",
    "PY": "Paraguay",
    "SR": "Suriname",
    "AW": "Aruba",
    "BS": "Bahamas",
    "BB": "Barbados",
    "BM": "Bermuda",
    "DO": "Dominican Republic",
    "HT": "Haiti",
    "JM": "Jamaica",
    "PR": "Puerto Rico",
    "TT": "Trinidad and Tobago",
    "VI": "Virgin Islands, U.S.",
    "AI": "Anguilla",
    "AG": "Antigua and Barbuda",
    "BQ": "Bonaire, Sint Eustatius and Saba",
    "VG": "Virgin Islands, British",
    "KY": "Cayman Islands",
    "CW": "Curaçao",
    "DM": "Dominica",
    "GD": "Grenada",
    "GP": "Guadeloupe",
    "MQ": "Martinique",
    "MS": "Montserrat",
    "MF": "Saint Martin (French part)",
    "SX": "Sint Maarten (Dutch part)",
    "KN": "Saint Kitts and Nevis",
    "LC": "Saint Lucia",
    "VC": "Saint Vincent and the Grenadines",
    "TC": "Turks and Caicos Islands",
    "AS": "American Samoa",
    "AU": "Australia",
    "FJ": "Fiji",
    "GU": "Guam",
    "NZ": "New Zealand",
    "MP": "Northern Mariana Islands",
    "VU": "Vanuatu",
    "WF": "Wallis and Futuna",
    "CK": "Cook Islands",
    "PF": "French Polynesia",
    "MH": "Marshall Islands",
    "FM": "Micronesia, Federated States of",
    "NC": "New Caledonia",
    "PW": "Palau",
    "PG": "Papua New Guinea",
    "BE": "Belgium",
    "FR": "France",
    "DE": "Germany",
    "IT": "Italy",
    "ES": "Spain",
    "CH": "Switzerland",
    "NL": "Netherlands",
    "TR": "Turkey",
    "GB": "United Kingdom",
    "AL": "Albania",
    "AM": "Armenia",
    "AT": "Austria",
    "AZ": "Azerbaijan",
    "BY": "Belarus",
    "BA": "Bosnia and Herzegovina",
    "BG": "Bulgaria",
    "HR": "Croatia",
    "CY": "Cyprus",
    "CZ": "Czech Republic",
    "DK": "Denmark",
    "EE": "Estonia",
    "FO": "Faroe Islands",
    "FI": "Finland",
    "GE": "Georgia",
    "GI": "Gibraltar",
    "GR": "Greece",
    "GL": "Greenland",
    "HU": "Hungary",
    "IS": "Iceland",
    "IE": "Ireland",
    "KZ": "Kazakhstan",
    "LV": "Latvia",
    "LI": "Liechtenstein",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "MK": "Macedonia, the former Yugoslav Republic of",
    "MT": "Malta",
    "MD": "Moldova, Republic of",
    "MC": "Monaco",
    "ME": "Montenegro",
    "NO": "Norway",
    "PL": "Poland",
    "PT": "Portugal",
    "RO": "Romania",
    "RU": "Russian Federation",
    "SM": "San Marino",
    "RS": "Serbia",
    "SK": "Slovakia",
    "SI": "Slovenia",
    "SE": "Sweden",
    "TM": "Turkmenistan",
    "UA": "Ukraine",
    "UZ": "Uzbekistan",
    "VA": "Holy See (Vatican City State)",
    "BH": "Bahrain",
    "KW": "Kuwait",
    "OM": "Oman",
    "QA": "Qatar",
    "SA": "Saudi Arabia",
    "AE": "United Arab Emirates",
    "EG": "Egypt",
    "IR": "Iran, Islamic Republic of",
    "IQ": "Iraq",
    "IL": "Israel",
    "JO": "Jordan",
    "LB": "Lebanon",
    "SY": "Syrian Arab Republic",
    "YE": "Yemen",
    "BW": "Botswana",
    "KE": "Kenya",
    "MW": "Malawi",
    "MA": "Morocco",
    "MZ": "Mozambique",
    "NA": "Namibia",
    "NG": "Nigeria",
    "ZA": "South Africa",
    "SZ": "Swaziland",
    "ZM": "Zambia",
    "DZ": "Algeria",
    "AO": "Angola",
    "BJ": "Benin",
    "BF": "Burkina Faso",
    "BI": "Burundi",
    "CM": "Cameroon",
    "CV": "Cape Verde",
    "CF": "Central African Republic",
    "TD": "Chad",
    "CG": "Congo",
    "CD": "Congo, the Democratic Republic of the",
    "DJ": "Djibouti",
    "GQ": "Equatorial Guinea",
    "ER": "Eritrea",
    "ET": "Ethiopia",
    "GA": "Gabon",
    "GM": "Gambia",
    "GH": "Ghana",
    "GN": "Guinea",
    "GW": "Guinea-Bissau",
    "CI": "Côte d'Ivoire",
    "LS": "Lesotho",
    "LR": "Liberia",
    "LY": "Libya",
    "MG": "Madagascar",
    "ML": "Mali",
    "MR": "Mauritania",
    "MU": "Mauritius",
    "NE": "Niger",
    "RE": "Réunion",
    "RW": "Rwanda",
    "SN": "Senegal",
    "SC": "Seychelles",
    "SL": "Sierra Leone",
    "SO": "Somalia",
    "SD": "Sudan",
    "TZ": "Tanzania, United Republic of",
    "TG": "Togo",
    "TN": "Tunisia",
    "UG": "Uganda",
    "ZW": "Zimbabwe",
    "CN": "China",
    "HK": "Hong Kong",
    "IN": "India",
    "ID": "Indonesia",
    "JP": "Japan",
    "MY": "Malaysia",
    "PH": "Philippines",
    "SG": "Singapore",
    "KR": "Korea, Republic of",
    "TW": "Taiwan, Province of China",
    "TH": "Thailand",
    "AF": "Afghanistan",
    "BD": "Bangladesh",
    "BT": "Bhutan",
    "BN": "Brunei Darussalam",
    "KH": "Cambodia",
    "KG": "Kyrgyzstan",
    "LA": "Lao People's Democratic Republic",
    "MO": "Macao",
    "MV": "Maldives",
    "MN": "Mongolia",
    "NP": "Nepal",
    "PK": "Pakistan",
    "LK": "Sri Lanka",
    "VN": "Viet Nam"
  };

  premiumProxyAccount;
  accountType;

  constructor (
    private http: Http,
    private localStorageService: LocalStorageService,
    private settingsService: SettingsService,
    private hqService: HqService,
    private pingService: PingService
  ) {
    let serverData = this.settingsService.proxySettingsService();
    this.latencyList = serverData.latencyList;
    if (this.latencyList) {
      this.servers = serverData.proxyServers;
      this.serverArr = serverData.proxyServersArr;
      this.fastestServer = this.servers[serverData.latencyList[0].id];
      this.fastestServerName = this.fastestServer.name;
      this.premiumProxyAccount = serverData.premiumAccount;
    }

    // If app is updated while open
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "ServersUpdated") {
        console.log('SERVERS UPDATED');
        let updatedServerData = this.settingsService.proxySettingsService();
        this.servers = updatedServerData.proxyServers;
        this.serverArr = updatedServerData.proxyServersArr;
        this.latencyList = updatedServerData.latencyList;
        this.fastestServer = this.servers[updatedServerData.latencyList[0].id];
        this.fastestServerName = this.fastestServer.name;
        this.premiumProxyAccount = updatedServerData.premiumAccount;
      }
    });
  }

  loadServers() {
    return new Promise((resolve, reject) => {
      this.hqService.fetchUserStatus().flatMap(data => {
        this.accountType = data.account.type;
        this.premiumProxyAccount = this.accountType === 'premium';
        this.settingsService.saveProxyCredentials(data.privacy.username, data.privacy.password);
        return this.hqService.findServers(this.accountType); // fetch proxy server list
      }).subscribe(servers => {
        this.servers = servers;
        this.serverArr = this.getServerArray();
        this.settingsService.saveProxyServers(servers, this.serverArr);

        // Populate list of servers sorted by latency
        this.pingService.getServerLatencyList(this.serverArr, 3, this.premiumProxyAccount)
        .then((latencyArray) => {
          this.settingsService.saveLatencyList(latencyArray);
          this.latencyList = latencyArray;
          this.fastestServer = this.servers[latencyArray[0].id];
          this.fastestServerName = this.fastestServer.name;
          console.log(latencyArray, this.fastestServer, this.fastestServerName);
          resolve();
        });
      });
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
    serverArr.sort(function(a,b) {
      if (order[a.region] < order[b.region]) return -1;
      if (order[a.region] > order[b.region]) return 1;
      if (a.country < b.country) return -1;
      if (a.country > b.country) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

    return serverArr;
  }

  getServer(serverId: any) {
    if (!serverId || !this.servers) return {};
    return this.servers[serverId];
  }

  enableProxy() {
    if (!this.servers) return;
    let config = this.generatePACConfig();
    console.log(config.pacScript.data);
    chrome.proxy.settings.set({ value: config, scope: 'regular' });
  }

  disableProxy() {
    chrome.proxy.settings.set({ value: { mode: "system" }, scope: 'regular' });
  }

  generatePACConfig() {
    let config = {
      mode: "pac_script",
      pacScript: {
        data: this.generatePACScript()
      }
    };
    this.settingsService.savePacScriptConfig(config);
    return config;
  }

  generatePACScript() {
    // Fetch latest domain specific and default routing settings
    let pacScriptSettings = this.settingsService.pacScriptSettings();
    console.log(pacScriptSettings);

    let pacScript = "function FindProxyForURL(url, host) {\n";
    pacScript += "  if (shExpMatch(host, \"cypherpunk.com\")) return 'DIRECT';\n";

    // 1. Generate direct pinging rules for proxy addresses
    // Do not apply proxy when pinging proxy servers to measure latency
    pacScript += this.generateDirectPingRules();

    // 2. Iterate through "routing" object and generate domain specific rules
    pacScript += this.generateDomainSpecificRules(pacScriptSettings);

    // 3. Look at default selected Routing type and generate base rules
    pacScript += this.generateDefaultRoutingRules(pacScriptSettings.defaultRouting);

    pacScript += "}";

    return pacScript;
  }

  generateDirectPingRules() {
    let directPingRules = "";
    this.serverArr.forEach(function(server) {
      if (server.ovHostname) {
        directPingRules += "  if (shExpMatch(host, \"" + server.ovHostname + "\")) return 'DIRECT';\n";
      }
    });
    return directPingRules;
  }

  generateDomainSpecificRules(pacScriptSettings) {
    let routing = pacScriptSettings.routing;
    let defaultRouting = pacScriptSettings.defaultRouting;
    let domainSpecificRules = "";
    let domains = Object.keys(routing);
    let domainSettings;
    domains.forEach((domain) => {
      domainSettings = routing[domain];
      // Fastest: Route to fastest server always
      if (domainSettings.type === 'FASTEST') {
        let fastestProxyIp = this.servers[this.latencyList[0].id].httpDefault[0];

        domainSpecificRules += "  if (shExpMatch(host, \"" + domain + "\") || dnsDomainIs(host, \"." + domain + "\")) return 'PROXY " +
          fastestProxyIp + ":80';\n";
      }
      // Selected: Route to the selected server
      else if (domainSettings.type === 'SELECTED') {
        let selectedProxyId = domainSettings.serverId;
        let selectedProxyIp = this.servers[selectedProxyId].httpDefault[0];

        domainSpecificRules += "  if (shExpMatch(host, \"" + domain + "\") || dnsDomainIs(host, \"." + domain + "\")) return 'PROXY " +
          selectedProxyIp + ":80';\n";
      }
      // None: Do not proxy
      else if (domainSettings.type === 'NONE') {
        domainSpecificRules += "  if (shExpMatch(host, \"" + domain + "\") || dnsDomainIs(host, \"." + domain + "\")) return 'DIRECT';\n";
      }
      // Smart: Route to fastest server for TLD
      else {
        let match = domain.match(/[.](au|br|ca|ch|de|fr|uk|hk|in|it|jp|nl|no|ru|se|sg|tr|com)/);
        let tld = match && match.length ? match[0] : null;
        let countryCode;
        if (tld) {
          tld = tld.slice(1); // remove "."
          countryCode = tld;
        }
        else { countryCode = "US"; }
        let smartProxyIP = this.getSmartServer(countryCode).httpDefault[0];
        domainSpecificRules += "  if (shExpMatch(host, \"" + domain + "\") || dnsDomainIs(host, \"." + domain + "\")) return 'PROXY " +
          smartProxyIP + ":80';\n";
      }
    });
    return domainSpecificRules;
  }

  generateDefaultRoutingRules(defaultRouting) {
    let defaultRoutingRules = "";

    // Fastest: Route to fastest server always
    if (defaultRouting.type === "FASTEST") {
      let fastestProxyIp = this.servers[this.latencyList[0].id].httpDefault[0];
      defaultRoutingRules += "  else return 'PROXY " +
        fastestProxyIp + ":80';\n";
    }
    // Selected: Route to the default selected server
    else if (defaultRouting.type === "SELECTED") {
      let selectedProxyId = defaultRouting.selected.toString();
      let selectedProxyIp = this.servers[selectedProxyId].httpDefault[0];
      defaultRoutingRules += "  else return 'PROXY " +
        selectedProxyIp + ":80';\n";
    }
    // None: Do not proxy
    else if (defaultRouting.type === "NONE") {
      defaultRoutingRules += "  else return 'DIRECT';\n";
    }
    // Smart: Route to fastest server for each TLD
    else {
      let tlds = [
        "au", "br", "ca", "ch", "de", "fr", "uk", "hk", "in",
        "it", "jp", "nl", "no", "ru", "se", "sg", "tr", "com"
      ];
      tlds.forEach((tld) => {
        defaultRoutingRules += "  if (shExpMatch(host, \"*." + tld + "\")) return 'PROXY " +
          this.getSmartServer(tld).httpDefault[0] + ":80';\n"
      });

      // Default to fastest US server if TLD is unknown
      defaultRoutingRules += "  else return 'PROXY " +
        this.getSmartServer("com").httpDefault[0] + ":80';\n";
    }
    return defaultRoutingRules;
  }

  getSmartServer(countryCode) {
    countryCode = countryCode.toUpperCase();

    // .com -> US and .uk -> GB, all other tlds are direct translations
    if (countryCode === "COM") { countryCode = "US"; }
    else if (countryCode === "UK") { countryCode = "GB" }

    let fastestServer, curServer, latency, firstUsServer;
    // Find fastest server for given country
    // Latency list is ordered from lowest latency to highest
    for (let x = 0; x < this.latencyList.length; x++) {
      latency = this.latencyList[x].latency;
      curServer = this.servers[this.latencyList[x].id];

      // Store First/Fastest US server we encounter for default case
      if (!firstUsServer && curServer.country === "US") { firstUsServer = curServer; }

      // Grab fastest server for the given country
      if (curServer.country === countryCode && latency < 9999) {
        fastestServer = curServer;
        break;
      }

    }
      // All servers pinged 9999 or higher or there is no proxy
      // available for the provided TLD, default to first/fastest US Server
      if (!fastestServer) { fastestServer = firstUsServer; }

    return fastestServer;
  }

}
