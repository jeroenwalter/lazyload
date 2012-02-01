//
//  LAZY Loading Images
//
//  Handles lazy loading of images in one or more targeted divs,
//  or in the entire page. It also keeps track of scrolling and
//  resizing events, and removes itself if the work is done.
//
//  Licensed under the terms of the MIT license.
//
//  (c) 2010 Balázs Galambosi
//

!function(window, document){

// glocal variables
var instances = {},
    lazyAttr = "data-src",
    winH;

// cross browser event handling
function addEvent( el, type, fn ) {
  if ( window.addEventListener ) {
    el.addEventListener( type, fn, false );
  } else if ( window.attachEvent ) {
    el.attachEvent( "on" + type, fn );
  } else {
    var old = el["on" + type];
    el["on" + type] = function() { old(); fn(); };
  }
}

// cross browser event handling
function removeEvent( el, type, fn ) {
  if ( window.removeEventListener ) {
    el.removeEventListener( type, fn, false );
  } else if ( window.attachEvent ) {
    el.detachEvent( "on" + type, fn );
  }
}

// cross browser window height
function getWindowHeight() {
  if ( window.innerHeight ) {
    winH = window.innerHeight;
  } else if ( document.documentElement.clientHeight ) {
    winH = document.documentElement.clientHeight;
  } else if ( document.body && document.body.clientHeight ) {
    winH = document.body.clientHeight;
  } else {        // fallback:
    winH = 10000; // just load all the images
  }
  return winH;
}

// getBoundingClientRect alternative
function findPos(obj) {
  var top  = 0;
  if (obj && obj.offsetParent) {
    do {
      top += obj.offsetTop || 0;
      top -= obj.scrollTop || 0;
    } while (obj = obj.offsetParent); //
    return { "top" : top };
  }
}

// top position of an element
var getTopPos = (function() {
  var dummy = document.createElement("div");
  if ( dummy.getBoundingClientRect ) {
    return function( el ) {
      return el.$$top || el.getBoundingClientRect().top;
    };
  } else {
    return function( el ) {
      return el.$$top || findPos( el ).top;
    };
  }
})();

// sorts images by their vertical positions
function img_sort( a, b ) {
  return getTopPos( a ) - getTopPos( b );
}

// let's just provide some interface
// for the outside world
var LazyImg = function( target, offset ) {

  var imgs,    // images array (ordered)
      last,    // last visible image (index)
      id,      // id of the target element
      self;    // this instance

  offset = offset || 200; // for prefetching

  if ( !target ) {
    target = document;
    id = "$document";
  } else if ( typeof target === "string" ) {
    id = target;
    target = document.getElementById( target );
  } else {
    id = target.id || "$undefined";
  }

  // return if this instance already exists
  if ( instances[id] ) {
    return instances[id];
  }

  // or make a new instance
  self = instances[id] = {

    // init & reset
    init: function() {
      imgs = null;
      last = 0;
      addEvent( window, "scroll", self.fetchImages );
      self.fetchImages();
      return this;
    },

    destroy: function() {
      removeEvent( window, "scroll", self.fetchImages );
      delete instances[id];
    },

    // fetches images, starting at last (index)
    fetchImages: function() {

      var img, temp, len, i;

      // still trying to get the target
      target = target || document.getElementById( id );

      // if it's the first time
      // initialize images array
      if ( !imgs && target ) {

        temp = target.getElementsByTagName( "img" );

        if ( temp.length ) {
          imgs = [];
          len  = temp.length;
        } else return;

        // fill the array for sorting
        for ( i = 0; i < len; i++ ) {
          img = temp[i];
          if ( img.nodeType === 1 && img.getAttribute(lazyAttr) ) {

              // store them and cache current
              // positions for faster sorting
              img.$$top = getTopPos( img );
              imgs.push( img );
          }
        }
        imgs.sort( img_sort );
      }

      // loop through the images
      while ( imgs[last] ) {

        img = imgs[last];

        // delete cached position
        if ( img.$$top ) img.$$top = null;

        // check if the img is above the fold
        if ( getTopPos( img ) < winH + offset )  {

          // then change the src
          img.src = img.getAttribute(lazyAttr);
          last++;
        }
        else return;
      }

      // we've fetched the last image -> finished
      if ( last && last === imgs.length )  {
        self.destroy();
      }
    }
  };

  return self.init();
};

// initialize
getWindowHeight();
addEvent( window, "load",   LazyImg().fetchImages );
addEvent( window, "resize", getWindowHeight       );
LazyImg();

window.LazyImg = LazyImg;

}(this, document)
