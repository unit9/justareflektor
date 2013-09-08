$(function() {

  var duration = View.TRANSITION_TIME;
  var files = Sandbox.Nodes.VideoTexture.Files;
  var getCurrentLanguage = function() {
    return (i18n.lng() || 'en-us').toLowerCase();
  };

  var reveal = _.after(1, function() {

    // Appropriate Language Settings
    var $select = $('select.language').change(function(e) {
      window.location.href = '/tech/?lng=' + $select.val();
    });

    $('#back-to-home').css({
      display: url['boolean']('home', false) ? 'block' : 'none'
    }).click(function(e) {
      e.preventDefault();
      window.location.href = '/?lng=' + getCurrentLanguage();
    });

    $('#content').css('display', 'block');
    _.defer(function() {

      /**
       * Add Links
       */

      $('#code-film').click(function(e) {
        AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_TECH_CODE, {
          label: 'Downloaded film code'
        });
      });
      $('#code-sandbox').click(function(e) {
        AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_TECH_CODE, {
          label: 'Downloaded sandbox code'
        });
      });
      $('#code-threejs').click(function(e) {
        AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_TECH_CODE, {
          label: 'Downloaded threejs code'
        });
      });
      $('#code-tailbone').click(function(e) {
        AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_TECH_CODE, {
          label: 'Downloaded tailbone code'
        });
      });

      _.each(document.querySelectorAll('[data-url]'), function(elem) {
        var $elem = $(elem).click(function(e) {
          e.preventDefault();
          window.location = $elem.attr('data-url') + '?lng=' + getCurrentLanguage();
        });
      });

      $('#veil').fadeOut(duration, function() {
        initializeSandbox();
      });

    });

  });

  /**
   * Localize content
   */

  if (resource.local) {

    reveal();

  } else {

    window.i18n.init({
      fallbackLng: 'en',
      detectLngQS: 'lng',
      cookieName: 'lng',
      ns: 'desktop',
      resGetPath: '/api/client/localisation/get?lng=__lng__&ns=__ns__&format=unit9'
    }, function(t) {

      // Select current language

      var selected = getCurrentLanguage();
      var languages = document.querySelector('.language').children;

      AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_TECH_LANG, {
        label: 'Set language: ' + selected
      });

      if (selected === 'ar') {
        $(document.body).addClass('ar');
      }

      for (var i = 0, l = languages.length; i < l; i++) {

        var el = languages[i];

        if (el.value === selected) {
          el.setAttribute('selected', '');
          break;
        }

      }

      // Appropriate links

      var sharingController = SharingController.getInstance();
      var getShareLink = function() {
        return window.location.protocol + '//' + window.location.host + '/tech/?lng=' + getCurrentLanguage();
      };

      document.querySelector('.google').addEventListener('click', function() {
        var url = getShareLink();
        sharingController.shareLinkOnGoogle(url);
      });
      document.querySelector('.facebook').addEventListener('click', function() {
        var url = getShareLink();
        sharingController.shareLinkOnFacebook(url);
      });
      document.querySelector('.twitter').addEventListener('click', function() {
        var url = getShareLink();
        sharingController.shareOnTwitter(url);
      });

      _.each(document.querySelectorAll('[data-i18n]'), function(el) {
        el.innerHTML = t(el.getAttribute('data-i18n'));
      });

      reveal();

    });

  }

  /**
   * Preload Assets
   */

  if (!has.webgl) {
    AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_TECH_WEBGL, {
      label: 'no webgl'
    });
    $('[data-i18n="Technology.overview"]').css('display', 'none');
    $('[data-i18n="Technology.sandbox.additionalPresets"]').css('display', 'none');
    $('#presets').css('display', 'none');
    $('#additional-presets').css('display', 'none');
    // reveal();
    // reveal();
    return;
  } else {
    AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_TECH_WEBGL);
  }

  // Sandbox.Nodes.VideoTexture.ready(reveal);
  // Sandbox.Nodes.PointData.ready(reveal);

});

function initializeSandbox() {

  if (!has.webgl) {
    $('#webgl-error').css({
      display: 'block',
      opacity: 1.0
    });
    return;
  }

  var $elem = $('#sandbox');
  var presets;

  var sandbox = window.sandbox = new Sandbox({
    showGraph: !!url['boolean']('editor'),
    showNodeListing: !!url['boolean']('params'),
    useDefault: true,
    size: 25,
    width: 1000,
    height: 1000 / Sandbox.aspectRatio
  }).appendTo($elem[0]);

  $.getJSON('./data/track.json', function(json) {

    var data = _.map(json.waveforms, function(v) {
      return v / 100;
    });

    presets = new Presets({
      data: data,
      width: 1000,
      height: 100
    }).appendTo(document.querySelector('#presets'));

    presets.setSandbox(sandbox);

  });

  addAdditionalPresets(sandbox);

  $(window).bind('keydown', function(e) {
    if (e.which === 32) {
      e.preventDefault();
      e.stopPropagation();
      sandbox.toggle();
    }
  });

  var loop = function() {
    sandbox.update();
    if (presets) presets.update();
    requestAnimationFrame(loop);
  };

  loop();

}

function addAdditionalPresets(sandbox) {

  var domElement = document.querySelector('#additional-presets');

  var analytics = AnalyticsController.getInstance();

  _.each(Presets.defaults, function(data, i) {

    if (data.isFilm) {
      return;
    }

    var elem = document.createElement('li');
    _.defer(function() {
      elem.classList.add('item');
    });
    elem.innerHTML = '<img src="' + data.thumbnail + '" onmousedown="return false" width="150" height="75" alt="" />';

    $(elem)
      .click(function(e) {
        e.preventDefault();
        sandbox.loadJSON(data.json);
        analytics.trackEvent(AnalyticsController.EVENT_TECH_PRESET, {
          label: 'Selected preset ' + i
        });
      });

    domElement.appendChild(elem);

  });

}