export type SmsSupplierServiceType = 'activation' | 'rental' | 'public' | 'app' | 'messaging' | 'bot' | 'unknown';
export type SmsSupplierVerificationStatus = 'official' | 'needsReview';
export type SmsSupplierPrivacy = 'private' | 'mixed' | 'public' | 'unknown';

export interface SmsSupplier {
  id: string;
  name: string;
  domain: string;
  url: string;
  serviceTypes: SmsSupplierServiceType[];
  privacy: SmsSupplierPrivacy;
  apiSupport: 'yes' | 'unknown';
  verificationStatus: SmsSupplierVerificationStatus;
}

// Curated from the user-supplied JSON. Statuses and classifications are retained as submitted, not independently re-verified here.
export const SMS_SUPPLIERS: readonly SmsSupplier[] = [
  {
    "id": "hero-sms",
    "name": "HeroSMS",
    "domain": "hero-sms.com",
    "url": "https://hero-sms.com/",
    "serviceTypes": [
      "activation",
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "5sim",
    "name": "5SIM",
    "domain": "5sim.net",
    "url": "https://5sim.net/",
    "serviceTypes": [
      "activation"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "sms-man",
    "name": "SMS-MAN",
    "domain": "sms-man.com",
    "url": "https://sms-man.com/",
    "serviceTypes": [
      "activation",
      "rental",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "tiger-sms",
    "name": "Tiger SMS",
    "domain": "tiger-sms.com",
    "url": "https://tiger-sms.com/",
    "serviceTypes": [
      "activation",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "pingme",
    "name": "PingMe",
    "domain": "pingme.tel",
    "url": "https://pingme.tel/",
    "serviceTypes": [
      "app",
      "activation",
      "rental",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "smssir",
    "name": "SMSSir",
    "domain": "smssir.com",
    "url": "https://smssir.com/",
    "serviceTypes": [
      "activation",
      "rental",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "onlinesim",
    "name": "OnlineSIM",
    "domain": "onlinesim.io",
    "url": "https://onlinesim.io/",
    "serviceTypes": [
      "activation",
      "rental",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "globalsms",
    "name": "GlobalSMS",
    "domain": "globalsms.io",
    "url": "https://globalsms.io/",
    "serviceTypes": [
      "activation",
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "smspool",
    "name": "SMSPool",
    "domain": "smspool.net",
    "url": "https://www.smspool.net/",
    "serviceTypes": [
      "activation",
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "textverified",
    "name": "Textverified",
    "domain": "textverified.com",
    "url": "https://www.textverified.com/",
    "serviceTypes": [
      "activation",
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "quackr",
    "name": "quackr",
    "domain": "quackr.io",
    "url": "https://quackr.io/",
    "serviceTypes": [
      "rental",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "sms24",
    "name": "SMS24.me",
    "domain": "sms24.me",
    "url": "https://sms24.me/en",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "sms-online",
    "name": "SMS Online",
    "domain": "sms-online.co",
    "url": "https://sms-online.co/receive-free-sms",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "getfreesmsnumber",
    "name": "GetFreeSMSNumber",
    "domain": "getfreesmsnumber.com",
    "url": "https://getfreesmsnumber.com/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "sms-receive-net",
    "name": "SMS Receive NET",
    "domain": "sms-receive.net",
    "url": "http://sms-receive.net/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "7sim",
    "name": "7SIM.NET",
    "domain": "7sim.net",
    "url": "https://7sim.net/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "hs3x",
    "name": "HS3X",
    "domain": "hs3x.com",
    "url": "https://hs3x.com/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "receivefreesms-net",
    "name": "Receive Free SMS NET",
    "domain": "receivefreesms.net",
    "url": "https://receivefreesms.net/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "receivesmsonline-in",
    "name": "Receive SMS Online IN",
    "domain": "receivesmsonline.in",
    "url": "https://receivesmsonline.in/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "groovl",
    "name": "Groovl",
    "domain": "groovl.com",
    "url": "https://www.groovl.com/",
    "serviceTypes": [
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "sellaite",
    "name": "SMS.SELLAITE",
    "domain": "sms.sellaite.com",
    "url": "https://sms.sellaite.com/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "sendsmsnow",
    "name": "SendSMSnow",
    "domain": "sendsmsnow.com",
    "url": "https://www.sendsmsnow.com/",
    "serviceTypes": [
      "messaging"
    ],
    "privacy": "private",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "proovl",
    "name": "Proovl",
    "domain": "proovl.com",
    "url": "https://www.proovl.com/lite",
    "serviceTypes": [
      "messaging",
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "anon-sms",
    "name": "Anon-SMS",
    "domain": "anon-sms.com",
    "url": "https://anon-sms.com/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "pinger",
    "name": "Pinger",
    "domain": "pinger.com",
    "url": "https://www.pinger.com/",
    "serviceTypes": [
      "app"
    ],
    "privacy": "private",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "1s2u",
    "name": "1S2U",
    "domain": "1s2u.com",
    "url": "https://1s2u.com/",
    "serviceTypes": [
      "messaging"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "virtty",
    "name": "Virtty",
    "domain": "virtty.com",
    "url": "https://virtty.com/en",
    "serviceTypes": [
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "textanywhere",
    "name": "TextAnywhere",
    "domain": "textanywhere.com",
    "url": "https://www.textanywhere.com/",
    "serviceTypes": [
      "messaging"
    ],
    "privacy": "private",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "smspinverify",
    "name": "SMSPinVerify",
    "domain": "smspinverify.com",
    "url": "https://www.smspinverify.com/",
    "serviceTypes": [
      "activation",
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "anonymsms",
    "name": "ASMS / AnonymSMS",
    "domain": "asms.ai",
    "url": "https://asms.ai/",
    "serviceTypes": [
      "activation",
      "rental",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "foxsims",
    "name": "FoxSIMs",
    "domain": "foxsims.com",
    "url": "https://foxsims.com/",
    "serviceTypes": [
      "activation",
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "buru",
    "name": "Buru",
    "domain": "buru.xyz",
    "url": "https://buru.xyz/",
    "serviceTypes": [
      "activation",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "pvacodes",
    "name": "PVACodes",
    "domain": "pvacodes.com",
    "url": "https://pvacodes.com/",
    "serviceTypes": [
      "activation"
    ],
    "privacy": "private",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "freeje",
    "name": "Freeje",
    "domain": "freeje.com",
    "url": "https://freeje.com/",
    "serviceTypes": [
      "activation",
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "pvapins",
    "name": "PVAPins",
    "domain": "pvapins.com",
    "url": "https://pvapins.com/",
    "serviceTypes": [
      "activation",
      "rental",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "sms7",
    "name": "USA SIM / SMS7",
    "domain": "sms7.top",
    "url": "https://sms7.top/",
    "serviceTypes": [
      "activation",
      "rental"
    ],
    "privacy": "private",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "receiveasms",
    "name": "ReceiveASMS",
    "domain": "receiveasms.com",
    "url": "https://receiveasms.com/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "us-phone-number",
    "name": "US-Phone-Number.com",
    "domain": "us-phone-number.com",
    "url": "https://us-phone-number.com/",
    "serviceTypes": [
      "public"
    ],
    "privacy": "public",
    "apiSupport": "unknown",
    "verificationStatus": "official"
  },
  {
    "id": "sms-verification-number",
    "name": "SV Number",
    "domain": "sms-verification-number.com",
    "url": "https://sms-verification-number.com/",
    "serviceTypes": [
      "activation",
      "rental",
      "public"
    ],
    "privacy": "mixed",
    "apiSupport": "yes",
    "verificationStatus": "official"
  },
  {
    "id": "smsreceivefree",
    "name": "SMS Receive Free",
    "domain": "smsreceivefree.com",
    "url": "https://smsreceivefree.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smsreceiveonline",
    "name": "SMS Receive Online",
    "domain": "smsreceiveonline.com",
    "url": "https://smsreceiveonline.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "receivesmsonline-net",
    "name": "Receive SMS Online NET",
    "domain": "receivesmsonline.net",
    "url": "https://receivesmsonline.net/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "freesmsverifications",
    "name": "Free SMS Verifications",
    "domain": "freesmsverifications.com",
    "url": "http://freesmsverifications.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "receivefreesms",
    "name": "Receive Free SMS",
    "domain": "receivefreesms.com",
    "url": "http://receivefreesms.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "receive-sms-online",
    "name": "Receive SMS Online",
    "domain": "receive-sms-online.com",
    "url": "https://receive-sms-online.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smsver",
    "name": "SMSVer / See SMS",
    "domain": "smsver.com",
    "url": "https://smsver.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "receivesmsonline-eu",
    "name": "Receive SMS Online EU",
    "domain": "receivesmsonline.eu",
    "url": "http://receivesmsonline.eu/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "hidemynumbers",
    "name": "Hide My Numbers",
    "domain": "hidemynumbers.com",
    "url": "http://hidemynumbers.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "freeonlinephone",
    "name": "Free Online Phone",
    "domain": "freeonlinephone.org",
    "url": "https://freeonlinephone.org/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "catchsms",
    "name": "Catch SMS",
    "domain": "catchsms.com",
    "url": "https://catchsms.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smsget",
    "name": "SMS Get",
    "domain": "smsget.net",
    "url": "http://smsget.net/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "getsms",
    "name": "Get SMS",
    "domain": "getsms.org",
    "url": "http://getsms.org/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "receivesmsonline-me",
    "name": "Receive SMS Online ME",
    "domain": "receivesmsonline.me",
    "url": "http://receivesmsonline.me/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "virtualnumberbuy",
    "name": "Virtual Number Buy",
    "domain": "virtualnumberbuy.com",
    "url": "http://virtualnumberbuy.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "freereceivesmsonline",
    "name": "Free Receive SMS Online",
    "domain": "freereceivesmsonline.com",
    "url": "http://freereceivesmsonline.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "ndtan",
    "name": "NDTAN SMS",
    "domain": "sms.ndtan.net",
    "url": "https://sms.ndtan.net/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smslisten",
    "name": "SMS Listen",
    "domain": "smslisten.com",
    "url": "https://smslisten.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "freevirtualsmsnumber",
    "name": "Free Virtual SMS Number",
    "domain": "freevirtualsmsnumber.com",
    "url": "https://freevirtualsmsnumber.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smstibo",
    "name": "SMS Tibo",
    "domain": "smstibo.com",
    "url": "https://smstibo.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "receivesmsnumber",
    "name": "Receive SMS Number",
    "domain": "receivesmsnumber.com",
    "url": "https://receivesmsnumber.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "freesmscode",
    "name": "Free SMS Code",
    "domain": "freesmscode.com",
    "url": "https://freesmscode.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smsnumbersonline",
    "name": "SMS Numbers Online",
    "domain": "smsnumbersonline.com",
    "url": "https://smsnumbersonline.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smsreceiving",
    "name": "SMS Receiving",
    "domain": "smsreceiving.com",
    "url": "https://smsreceiving.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "mytrashmobile",
    "name": "MyTrashMobile",
    "domain": "es.mytrashmobile.com",
    "url": "https://es.mytrashmobile.com/numeros",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smsplanet",
    "name": "SMSPlanet",
    "domain": "smsplanet.net",
    "url": "https://smsplanet.net/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "cheapsms",
    "name": "CheapSMS",
    "domain": "cheapsms.io",
    "url": "https://cheapsms.io/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "vak-sms",
    "name": "VAK-SMS",
    "domain": "vak-sms.com",
    "url": "https://vak-sms.com/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smsak",
    "name": "SMSAK",
    "domain": "smsak.org",
    "url": "https://smsak.org/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "tqsms",
    "name": "TQSMS",
    "domain": "web.tqsms.xyz",
    "url": "https://web.tqsms.xyz/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "smslive",
    "name": "SMSLive",
    "domain": "smslive.pro",
    "url": "https://smslive.pro/",
    "serviceTypes": [
      "unknown"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "receivesmsrobot",
    "name": "@ReceiveSMSRobot",
    "domain": "t.me",
    "url": "https://t.me/ReceiveSMSRobot",
    "serviceTypes": [
      "bot"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "kupitnomerbot",
    "name": "@KupitNomerBot",
    "domain": "t.me",
    "url": "https://t.me/KupitNomerBot",
    "serviceTypes": [
      "bot"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "receive-robot",
    "name": "@receive_robot",
    "domain": "t.me",
    "url": "https://t.me/receive_robot",
    "serviceTypes": [
      "bot"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "timeofsms-bot",
    "name": "@timeofsms_bot",
    "domain": "t.me",
    "url": "https://t.me/timeofsms_bot",
    "serviceTypes": [
      "bot"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  },
  {
    "id": "thephonebot",
    "name": "@ThePhoneBot",
    "domain": "t.me",
    "url": "https://t.me/ThePhoneBot",
    "serviceTypes": [
      "bot"
    ],
    "privacy": "unknown",
    "apiSupport": "unknown",
    "verificationStatus": "needsReview"
  }
];
