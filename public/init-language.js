(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    var requested = params.getAll('lang');
    var fromUrl = requested.length === 1 && (requested[0] === 'en' || requested[0] === 'ar')
      ? requested[0]
      : null;
    var saved = fromUrl ? null : localStorage.getItem('amnabd-lang');
    var preferred = fromUrl || saved;
    var isOfflinePage = typeof document !== 'undefined' && (document.getElementById('arabic') || document.getElementById('english'));
    var lang;
    if (isOfflinePage && !preferred && typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('en')) {
      lang = 'en';
    } else {
      lang = preferred === 'en' ? 'en' : 'ar';
    }

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    if (isOfflinePage) {
      var isEn = lang === 'en';
      document.title = isEn ? 'Offline | AMNABD Deals' : 'غير متصل | AMNABD Deals';
      var arSection = document.getElementById('arabic');
      var enSection = document.getElementById('english');
      if (arSection) arSection.hidden = isEn;
      if (enSection) enSection.hidden = !isEn;
    }
  } catch (_) {}
})();

