function gcpdot_initialize(id) {
  var dot = {
    element: null,
    setColorFunc: null,
    dataSource: "gcpindex.php",
    firstRetrieve: true,
    retrieveCurrentMinute: true,
    isRetrieving: false,
    offsetTime: 0,
    defaultBaseErrorTime: 7,
    errorTime: 7,
    zScoreData: null,
    zScoreDataNext: [],
    dataLoaderTimeout: null,

    graphics: {
      gscalar: 1,
      bscalar: 1,
      element: null,
      canvas: null,
      context: null,
      dotImages: [],
      shadowImage: null,
      animateTime: 1000, //this is the time per cycle of the loading graphics
      debugSpectrum: false,
      debugScale: 1.0,
      lastScalar: -1,
      lastRender: null,
      lastRenderTrigger: null,
      dotSVG:
        "<svg xmlns='http://www.w3.org/2000/svg' id='__ID__' preserveAspectRatio='xMidYMid meet' width='__WIDTH__' height='__HEIGHT__'><defs><filter id='f1'><feGaussianBlur in='SourceGraphic' stdDeviation='__HBLUR__' /></filter><radialGradient id='highlight' cy='5%' r='50%' gradientTransform='translate(-0.25 0) scale(1.5 1)'><stop offset='10%' stop-color='white' stop-opacity='100'/><stop offset='100%' stop-color='white' stop-opacity='0'/></radialGradient><radialGradient id='grad' cy='92%' r='60%' gradientTransform='translate(-0.2 0) scale(1.4 1)'><stop offset='0%' stop-color='__C1__'/><stop offset='100%' stop-color='__C2__'/></radialGradient></defs><circle fill='url(#grad)' cx='50%' cy='45%' r='45%'/><clipPath id='ic'><circle cx='50%' cy='40%' r='37%' /></clipPath><g filter='url(#f1)'><circle fill='url(#highlight)' cx='50%' cy='50%' r='48%' clip-path='url(#ic)' /></g></svg>",
      shadowSVG:
        "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMidYMid meet' width='__WIDTH__' height='__HEIGHT__' style='opacity:0.7'><defs><filter id='fh'><feGaussianBlur in='SourceGraphic' stdDeviation='__SHADOWBLUR__ __SHADOWBLUR__' /></filter></defs><circle filter='url(#fh)' fill='black' cx='50%' cy='49%' r='45%'/></svg>",

      dotElements: [
        { id: "gcpdot0", color1: "#CDCDCD", color2: "#505050" },
        { id: "gcpdot1", color1: "#FFA8C0", color2: "#FF0064" },
        { id: "gcpdot2", color1: "#FF1E1E", color2: "#840607" },
        { id: "gcpdot3", color1: "#FFB82E", color2: "#C95E00" },
        { id: "gcpdot4", color1: "#FFD517", color2: "#C69000" },
        { id: "gcpdot5", color1: "#FFFA40", color2: "#C6C300" },
        { id: "gcpdot6", color1: "#F9FA00", color2: "#B0CC00" },
        { id: "gcpdot7", color1: "#AEFA00", color2: "#88C200" },
        { id: "gcpdot8", color1: "#64FA64", color2: "#00A700" },
        { id: "gcpdot9", color1: "#64FAAB", color2: "#00B5C9" },
        { id: "gcpdot10", color1: "#ACF2FF", color2: "#21BCF1" },
        { id: "gcpdot11", color1: "#0EEEFF", color2: "#0786E1" },
        { id: "gcpdot12", color1: "#24CBFD", color2: "#0000FF" },
        { id: "gcpdot13", color1: "#5655CA", color2: "#2400A0" },
      ],
      initialize: function (element) {
        this.gscalar = window.devicePixelRatio || 1;
        this.element = element;

        var w = element.offsetWidth,
          h = element.offsetHeight;
        var scalarSizing = Math.min(w, h) / 48.0;
        var highlightBlurX = Math.round(3.7 * scalarSizing * this.gscalar);
        var highlightBlurY = Math.round(1.1 * scalarSizing * this.gscalar);
        var blurBlock = highlightBlurX + " " + highlightBlurY;
        var shadowBlur = 1.1 * scalarSizing * this.gscalar;
        var img, svg;

        this.canvas = document.createElement("canvas");
        this.canvas.width = w;
        this.canvas.height = h;
        this.context = this.canvas.getContext("2d");
        this.bscalar =
          this.context.webkitBackingStorePixelRatio ||
          this.context.mozBackingStorePixelRatio ||
          this.context.msBackingStorePixelRatio ||
          this.context.oBackingStorePixelRatio ||
          this.context.backingStorePixelRatio ||
          1;

        if (this.gscalar != this.bscalar) {
          //This is adjusting the canvas for High Definition Displays like Apple Retina
          var ratio = this.gscalar / this.bscalar;
          this.canvas.style.width = w + "px";
          this.canvas.style.height = h + "px";
          this.canvas.width = w * ratio;
          this.canvas.height = h * ratio;
          this.context.scale(ratio, ratio);
        }

        var self = this;

        element.appendChild(this.canvas);
        this.canvas = this.canvas.getContext("2d");
        for (i = 0; i < this.dotElements.length; i++) {
          svg = this.dotSVG
            .replace("__ID__", "svgel" + i)
            .replace("__HBLUR__", blurBlock)
            .replace("__C1__", this.dotElements[i].color1)
            .replace("__C2__", this.dotElements[i].color2)
            .replace("__WIDTH__", w * this.gscalar)
            .replace("__HEIGHT__", h * this.gscalar);

          img = this.dotImages[i] = new Image();
          img.width = w * this.gscalar;
          img.height = h * this.gscalar;
          this.dotImages[i].isImgLoaded = false;
          (f = function (i) {
            self.dotImages[i].onload = function () {
              self.dotImages[i].isImgLoaded = true;
            };
          })(i);
          this.dotImages[i].src = "data:image/svg+xml;base64," + btoa(svg);
          //element.appendChild(this.dotImages[i]);
          if (i == 0) {
            svg = this.shadowSVG
              .replace("__SHADOWBLUR__", shadowBlur)
              .replace("__SHADOWBLUR__", shadowBlur)
              .replace("__WIDTH__", w * this.gscalar)
              .replace("__HEIGHT__", h * this.gscalar);
            img = this.shadowImage = new Image();
            img.width = w * this.gscalar;
            img.height = h * this.gscalar;
            this.shadowImage.isImgLoaded = false;
            this.shadowImage.onload = function () {
              self.shadowImage.isImgLoaded = true;
              self.renderDot(-1);
            };
            this.shadowImage.src = "data:image/svg+xml;base64," + btoa(svg);
          }
        }
      },
      renderDot: function (scale) {
        this.lastRenderTrigger = new Date();
        if (this.debugSpectrum) {
          scale = this.debugScale;
          this.debugScale += 0.001;
          if (this.debugScale < 0) this.debugScale = 1;
          if (this.debugScale > 1) this.debugScale = 0;
        }
        var w = this.element.offsetWidth,
          h = this.element.offsetHeight;

        var colors = [
          { tail: 0.0, mc: this.dotImages[1] },
          { tail: 0.01, mc: this.dotImages[2] },
          { tail: 0.05, mc: this.dotImages[3] },
          { tail: 0.08, mc: this.dotImages[4] },
          { tail: 0.15, mc: this.dotImages[5] },
          { tail: 0.23, mc: this.dotImages[6] },
          { tail: 0.3, mc: this.dotImages[7] },
          { tail: 0.4, mc: this.dotImages[8] },
          { tail: 0.9, mc: this.dotImages[8] },
          { tail: 0.9125, mc: this.dotImages[9] },
          { tail: 0.93, mc: this.dotImages[10] },
          { tail: 0.96, mc: this.dotImages[11] },
          { tail: 0.98, mc: this.dotImages[12] },
          { tail: 1.0, mc: this.dotImages[13] },
        ];

        if (scale >= 0 && this.lastScalar >= 0) {
          // check if the color change is not large enough to be percievable then cancel the render, use less CPU.
          // important for the green (~30% of the time) that does not change at all.
          for (i = 0; i < colors.length - 1; i++) {
            var opacity =
              (scale - colors[i].tail) / (colors[i + 1].tail - colors[i].tail);
            if (0 <= opacity && opacity <= 1)
              if (
                Math.abs(opacity + i - this.lastScalar) * 256 < 1 ||
                (colors[i].mc == colors[i + 1].mc &&
                  i == Math.floor(this.lastScalar))
              ) {
                return;
              }
          }
        }
        this.lastRender = new Date();
        this.context.save();
        this.context.fillStyle = "rgba(255, 255, 255, 0)";
        this.context.clearRect(0, 0, w, h);
        this.context.globalAlpha = 1.0;
        this.context.drawImage(
          this.shadowImage,
          0,
          0,
          this.shadowImage.width,
          this.shadowImage.height,
          0,
          0,
          w,
          h
        );

        if (scale == -1) {
          var time = Date.now();
          scale = (time % this.animateTime) / this.animateTime;

          this.lastScalar = -1;
          this.context.drawImage(
            this.dotImages[0],
            0,
            0,
            this.dotImages[0].width,
            this.dotImages[0].height,
            0,
            0,
            w,
            h
          );
          for (i = 0; i < 6; i++) {
            this.context.fillStyle =
              "rgba(255, 255, 255, " + this.animateScalar(scale - i / 6) + ")";
            this.context.beginPath();
            this.context.arc(
              ((w * 0.83) / 6) * i + w * 0.15,
              h * 0.455,
              w * 0.038,
              0,
              Math.PI * 2,
              true
            );
            this.context.closePath();
            this.context.fill();
          }
        } else {
          for (i = 0; i < colors.length - 1; i++) {
            var opacity =
              (scale - colors[i].tail) / (colors[i + 1].tail - colors[i].tail);

            if (0 <= opacity && opacity <= 1) {
              this.lastScalar = opacity + i;
              this.context.drawImage(
                colors[i].mc,
                0,
                0,
                colors[i].mc.width,
                colors[i].mc.height,
                0,
                0,
                w,
                h
              );
              if (colors[i].mc != colors[i + 1].mc) {
                this.context.globalAlpha = opacity;
                this.context.drawImage(
                  colors[i + 1].mc,
                  0,
                  0,
                  colors[i + 1].mc.width,
                  colors[i + 1].mc.height,
                  0,
                  0,
                  w,
                  h
                );
              }
              break; //skip over the partial opacity element
            }
          }
        }
        this.context.restore();
      },
      animateScalar: function (s) {
        s = s - Math.floor(s);
        if (s < 0.2) return Math.round((s / 0.2) * 100) / 100;
        if (s < 0.7) return Math.round(((0.6 - s) / 0.5) * 100) / 100;
        return 0;
      },
    },

    initialize: function (id, clickUrl) {
      var self = this;
      this.element = document.getElementById(id);
      this.element.onclick = function () {
        top.location.href = clickUrl;
      };
      this.element.style.cursor = "pointer";
      this.graphics.initialize(this.element);
      setInterval(function () {
        self.animateDot();
      }, 75);
      window.addEventListener("focus", function () {
        var nowS = Math.floor(Date.now() / 1000.0 + self.offsetTime);
        if (
          !self.firstRetrieve &&
          self.dataLoaderTimeout &&
          (!self.zScoreData ||
            typeof self.zScoreData[nowS] === "undefined" ||
            !self.zScoreData[nowS])
        ) {
          //console.log('window.focus reload data');
          // If the window focuses and the data is not in sync, grab the data immediately
          if (self.dataLoaderTimeout) clearTimeout(self.dataLoaderTimeout);
          self.dataLoaderTimeout = null;
          self.retrieveCurrentMinute = true;
          self.getData();
        }
        self.animateDot();
      });
      this.getData();
    },
    animateDot: function () {
      var s = -1;
      var now = Date.now() / 1000.0 + this.offsetTime;
      var nowS = Math.floor(now);
      if (
        !this.zScoreData ||
        typeof this.zScoreData[nowS] === "undefined" ||
        !this.zScoreData[nowS]
      )
        s = -1;
      else {
        s = now - nowS;
        var v = this.zScoreData[nowS],
          nv = this.zScoreData[nowS + 1];
        s = v * (1 - s) + nv * s;
      }

      if ((Number.isNaN && Number.isNaN(s)) || !(s == s) || s == null) s = -1;

      if (this.setColorFunc != null) this.setColorFunc(s);

      this.graphics.renderDot(s);
    },
    Xhr: function () {
      try {
        return new XMLHttpRequest();
      } catch (e) {}
      try {
        return new ActiveXObject("Msxml3.XMLHTTP");
      } catch (e) {}
      try {
        return new ActiveXObject("Msxml2.XMLHTTP.6.0");
      } catch (e) {}
      try {
        return new ActiveXObject("Msxml2.XMLHTTP.3.0");
      } catch (e) {}
      try {
        return new ActiveXObject("Msxml2.XMLHTTP");
      } catch (e) {}
      try {
        return new ActiveXObject("Microsoft.XMLHTTP");
      } catch (e) {}
      return null;
    },
    getData: function () {
      if (this.isRetrieving) return;
      this.isRetrieving = true;
      var xhr = this.Xhr(),
        self = this;
      if (!xhr) return;

      xhr.open(
        "GET",
        this.dataSource +
          (this.retrieveCurrentMinute ? "?current=1&" : "?") +
          "nonce=" +
          Math.round(Math.random() * 10000000),
        true
      );
      xhr.setRequestHeader("Content-Type", "text/plain");
      xhr.timeout = 2 * this.errorTime * 1000;
      xhr.ontimeout = function () {
        //console.log("GCPDot Network Timeout: " + (new Date()));
        if (self.dataLoaderTimeout) clearTimeout(self.dataLoaderTimeout);
        self.dataLoaderTimeout = setTimeout(function () {
          self.dataLoaderTimeout = null;
          self.getData();
        }, Math.random() * 2000 * Math.sqrt(self.errorTime));
        self.errorTime *= 1.5;
        if (self.errorTime > 300) self.errorTime = 300;
        self.retrieveCurrentMinute = true;
        return;
      };
      xhr.onerror = function () {
        //console.error("GCPDot Network Error: " + (new Date()));
        if (self.dataLoaderTimeout) clearTimeout(self.dataLoaderTimeout);
        self.dataLoaderTimeout = setTimeout(function () {
          self.dataLoaderTimeout = null;
          self.getData();
        }, self.errorTime * 1000);
        self.isRetrieving = false;
        self.errorTime *= 1.5;
        if (self.errorTime > 300) self.errorTime = 300;
        self.retrieveCurrentMinute = true;
        return;
      };
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
          //console.log('getting data: ' + xhr.status +  ' ' + (new Date()) + '     last render trigger: ' + self.graphics.lastRenderTrigger + '     last render: ' + self.graphics.lastRender);
          if (!xhr.responseText) return xhr.onerror();
          self.errorTime = self.defaultBaseErrorTime;

          var p = /<serverTime>([\d.]+)/im,
            pi = /<s t='([\d]+)'>([\d.]+)/gim,
            r;

          var nextData = [];
          var serverTime = p.exec(xhr.responseText)[1];

          self.offsetTime = serverTime - Date.now() / 1000 - 60.0;

          do {
            if ((r = pi.exec(xhr.responseText))) {
              nextData[r[1]] = r[2];
              self.zScoreDataNext[r[1]] = r[2];
            }
          } while (r);

          //console.log('capture data: waiting ' + (60 - ((serverTime - 6.0) % 60)) + ' for next data refresh');
          self.zScoreData = self.zScoreDataNext;
          self.zScoreDataNext = nextData;
          self.firstRetrieve = false;
          self.retrieveCurrentMinute = false;
          self.animateDot();

          // randomize the load time of all the data retrieves
          self.dataLoaderTimeout = setTimeout(function () {
            self.dataLoaderTimeout = null;
            self.getData();
          }, (60 - ((serverTime - 6.0) % 60) + Math.random() * 15) * 1000);
          self.isRetrieving = false;
        }
      };
      xhr.send();
    },
  };
  dot.initialize(id, "https://global-mind.org/gcpdot/");
  return dot;
}
