export type SmsSupplierServiceType = 'activation' | 'rental' | 'public' | 'app' | 'messaging' | 'bot' | 'unknown';
export type SmsSupplierSourceClassification = 'official' | 'needsReview';
export type SmsSupplierVerificationStatus = 'unchecked' | 'checked' | 'unverifiable';
export type SmsSupplierPrivacy = 'private' | 'mixed' | 'public' | 'unknown';

export interface SmsSupplier {
  id: string;
  name: string;
  domain: string;
  url: string;
  serviceTypes: SmsSupplierServiceType[];
  privacy: SmsSupplierPrivacy;
  apiSupport: 'yes' | 'unknown';
  sourceClassification: SmsSupplierSourceClassification;
  verificationStatus: SmsSupplierVerificationStatus;
  sourceReferenceUrl?: string;
  lastCheckedAt?: string;
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "official",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
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
    "sourceClassification": "needsReview",
    "verificationStatus": "unchecked"
  }
];
