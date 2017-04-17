window.createSocket = function createSocket(url) {
  return new WebSocket(url);
};

window.onresize = function(event) {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;

  requestAnimationFrame(function() {
    viewport.render();
  });
};

var content = document.querySelector('main');

var colors = {
  white: [255, 255, 255, 255],
  lightgray: [211, 211, 211, 255],
  darkgray: [169, 169, 169, 255],
  black: [0, 0, 0, 255],
  pink: [255, 192, 203, 255],
  red: [255, 0, 0, 255],
  gold: [255, 215, 0, 255],
  brown: [165, 42, 42, 255],
  yellow: [255, 255, 0, 255],
  lightgreen: [144, 238, 144, 255],
  green: [0, 128, 0, 255],
  aqua: [0, 255, 255, 255],
  lightblue: [173, 216, 230, 255],
  blue: [0, 0, 255, 255],
  hotpink: [255, 105, 180, 255],
  purple: [128, 0, 128, 255],
  darkorange: [255, 140, 0, 255],
  crimson: [220, 20, 60, 255],
};

var names = Object.keys(colors);
var palette = document.createElement('section');

palette.id = 'palette';
palette.className = 'palette';
names.forEach(function(name) {
  var button = document.createElement('button');
  button.id = name;
  button.className = 'swatch ' + name;
  button.style.backgroundColor = name;
  button.onclick = function(event) {
    palette.style.backgroundColor = name;
    viewport.color = colors[name];
  };

  palette.appendChild(button);
});

content.appendChild(palette);

var viewport = document.createElement('canvas');
viewport.id = 'viewport';
viewport.className = 'viewport';
viewport.width = window.innerWidth;
viewport.height = window.innerHeight;
viewport.tabIndex = 0;

viewport.x = 0;
viewport.y = 0;

viewport.scale = 10;

viewport.color = colors.black;
viewport.tileX = 0;
viewport.tileY = 0;

viewport.canvas = document.createElement('canvas');
viewport.canvas.width = 2;
viewport.canvas.height = 2;

window.ondblclick = function dblclick(event) {
  if (event.button == 0) {
    if (event.shiftKey || event.ctrlKey || event.altKey) {
      return event.preventDefault();
    }

    if (viewport.timeout == null) {
      var x = Math.floor(
        (event.offsetX - viewport.x - viewport.width / 2) / viewport.scale
      ) + viewport.canvas.width / 2;

      var y = Math.floor(
        (event.offsetY - viewport.y - viewport.height / 2) / viewport.scale
      ) + viewport.canvas.height / 2;

      var canvas = viewport.canvas;

      if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
        return event.preventDefault();
      }

      var data = new Uint8Array(12);
      var view = new DataView(data.buffer, data.byteOffset, data.byteLength);

      view.setUint16(0, x);
      view.setUint16(2, y);
      view.setUint16(4, 1);
      view.setUint16(6, 1);

      view.setUint8(8, viewport.color[0]);
      view.setUint8(9, viewport.color[1]);
      view.setUint8(10, viewport.color[2]);
      view.setUint8(11, viewport.color[3]);

      socket.send(data);

      viewport.tileX = null;
      viewport.tileY = null;
    }

    requestAnimationFrame(function() {
      viewport.render();
    });

    return event.preventDefault();
  }
};

window.ontouchstart = function(event) {
  var screenX, screenY;
  var distance;

  window.ontouchstart = function touchstart(event) {
    if (event.touches.length == 1) {
      screenX = event.touches[0].screenX;
      screenY = event.touches[0].screenY;
    }

    if (event.touches.length == 2) {
      var x = event.touches[0].screenX - event.touches[1].screenX;
      var y = event.touches[0].screenY - event.touches[1].screenY;

      distance = Math.sqrt(x * x + y * y);
    }
  };

  window.ontouchmove = function touchmove(event) {
    if (event.touches.length == 1) {
      var touch = event.touches[0];
      viewport.x = viewport.x + (event.touches[0].screenX - screenX);
      viewport.y = viewport.y + (event.touches[0].screenY - screenY);

      screenX = event.touches[0].screenX;
      screenY = event.touches[0].screenY;
    } else if (event.touches.length == 2) {
      var x = event.touches[0].screenX - event.touches[1].screenX;
      var y = event.touches[0].screenY - event.touches[1].screenY;

      var value = Math.sqrt(x * x + y * y);
      var delta = value - distance;

      viewport.scale = Math.min(Math.max(viewport.scale + (delta * 0.25), 1), 100);
      distance = value;
    }

    requestAnimationFrame(function() {
      viewport.render();
    });

    event.preventDefault();
  };

  window.ontouchend = function touchend(event) {
    screenX = event.touches[0].screenX;
    screenY = event.touches[0].screenY;
  };

  return window.ontouchstart(event);

};

window.onmousedown = function(event) {
  var buttons = {};
  var screenX, screenY;

  window.onclick = function click(event) {
    if (event.button == 0) {
      if (event.altKey || event.ctrlKey) {
        viewport.scale = Math.max(1, viewport.scale - 10);
      } else if (event.shiftKey) {
        viewport.scale = Math.min(100, viewport.scale + 10);
      }

      requestAnimationFrame(function() {
        viewport.render();
      });

      return event.preventDefault();
    }
  };

  window.onwheel = function wheel(event) {
    viewport.scale = Math.min(Math.max(viewport.scale + event.deltaY * -0.1, 1), 100);
    requestAnimationFrame(function() {
      viewport.render();
    });
  };

  window.onmousedown = function(event) {
    buttons[event.button] = true;

    screenX = event.screenX;
    screenY = event.screenY;

    event.preventDefault();
  };

  window.onmousemove = function mousemove(event) {
    if (viewport.style.cursor == 'move') {
      viewport.style.cursor = '';
    }

    if (buttons[0]) {
      viewport.style.cursor = 'move';
      viewport.x = viewport.x + (event.screenX - (screenX || event.screenX));
      viewport.y = viewport.y + (event.screenY - (screenY || event.screenY));
    }

    viewport.tileX = Math.floor(
      (event.offsetX - viewport.x - viewport.width / 2) / viewport.scale
    );

    viewport.tileY = Math.floor(
      (event.offsetY - viewport.y - viewport.height / 2) / viewport.scale
    );

    requestAnimationFrame(function() {
      viewport.render();
    });

    event.preventDefault();

    screenX = event.screenX;
    screenY = event.screenY;
  };

  window.onmouseup = function mouseup(event) {
    if (event.button == 0) {
      if (viewport.style.cursor == 'move') {
        viewport.style.cursor = '';
      }
    }

    delete buttons[event.button];
  };

  window.onmouseout = function(event) {
    for (var key in buttons) {
      delete buttons[key];
    }
  };

  return window.onmousedown(event);
};

viewport.render = function render() {
  var context = viewport.getContext('2d');

  context.save();
  context.clearRect(0, 0, viewport.width, viewport.height);

  context.translate(viewport.width / 2, viewport.height / 2);
  context.translate(viewport.x, viewport.y);
  context.scale(viewport.scale, viewport.scale);

  var canvas = viewport.canvas;

  context.fillStyle = 'white';
  context.fillRect(canvas.width * -0.5, canvas.height * -0.5, canvas.width, canvas.height);

  context.imageSmoothingEnabled = false;
  context.drawImage(canvas, canvas.width * -0.5, canvas.height * -0.5);

  if (typeof viewport.tileX == 'number' && typeof viewport.tileY == 'number') {
    context.fillStyle = 'rgba(' + viewport.color.join(',') + ')';
    context.fillRect(viewport.tileX, viewport.tileY, 1, 1);
  }

  context.restore();
};

requestAnimationFrame(function() {
  viewport.render();
});

content.appendChild(viewport);

var socket = window.createSocket(
  location.protocol.replace('http', 'ws') + '//' + location.host
);

socket.binaryType = 'arraybuffer';
socket.onopen = function(event) {
  socket.reconnect = true;

  var hint = document.createElement('p');
  hint.id = 'hint';

  var hints = localStorage.getItem('hints');
  if (hints) {
    hints = hints.split('\n');
  } else {
    hints = [
      'The cooldown after placing a pixel can be up to 8192 seconds long.',
      'The canvas will expand every 8192 seconds.',
      'Use your imagination, be creative and have fun.',
      'Try to work with what is already on the canvas.',
      'The palette will colors change every now and then.',
      '8192px is open source, check it out on <a href="https://github.com/8192px/8192px">GitHub</a>',
    ];

    if (/phone|pad|tablet|droid/i.test(navigator.userAgent)) {
      hints = [
        'Double tap to place a pixel.',
        'Pinch to zoom in and out.',
      ].concat(hints);
    } else {
      hints = [
        'Double click to place a pixel.',
        'Click a color swatch in the palette to switch colors.',
        'Click while holding the shift key to zoom in.',
        'Click and drag to move the canvas.',
        'Click while holding the control key to zoom out.',
      ].concat(hints);
    }

    hints = hints.sort(function() {
      return Math.random() * 0.5;
    });
  }

  hint.className = 'hint fade-out';
  hint.innerHTML = hints.shift();

  content.appendChild(hint);
  setTimeout(function() {
    content.removeChild(hint);
  }, 15 * 1000);

  localStorage.setItem('hints', hints.join('\n'));
};

socket.onmessage = function(event) {
  var data = new Uint8Array(event.data);
  var view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (data.byteLength == 8) {
    data = new Float64Array(event.data);
    view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    var hint = document.createElement('p');
    hint.id = 'hint';
    hint.className = 'hint';
    content.appendChild(hint);

    viewport.timeout = setTimeout(function tick(wait) {
      var now = Date.now();
      var time = wait - now;

      hint.innerHTML = 'Wait... (' + Math.ceil(time / 1000) + ')';

      if (viewport.style.cursor == '') {
        viewport.style.cursor = 'wait';
      }

      if (time > 0) {
        return viewport.timeout = setTimeout(tick, 1000, wait);
      }

      content.removeChild(hint);
      viewport.timeout = null;

      if (viewport.style.cursor == 'wait') {
        viewport.style.cursor = '';
      }
    }, 0, view.getFloat64(0, true));
  } else {
    var canvas = viewport.canvas;
    var context = canvas.getContext('2d');

    var x = view.getUint16(0);
    var y = view.getUint16(2);

    var width = view.getUint16(4);
    var height = view.getUint16(6);

    if ((width != 1 && width != canvas.width) || (height != 1 && height != canvas.height)) {
      var bitmap = context.getImageData(0, 0, canvas.width, canvas.height);

      canvas.width = width;
      canvas.height = height;

      context.putImageData(bitmap, 0, 0);
    }

    var bitmap = context.getImageData(x, y, width, height);
    bitmap.data.set(data.slice(8));

    context.putImageData(bitmap, x, y);

    requestAnimationFrame(function() {
      viewport.render();
    });
  }
};

socket.onclose = function() {
  var status = document.createElement('p');
  status.className = 'hint';

  if (socket.reconnect) {
    status.innerHTML = [
      'Connection lost, <a href="#" onclick="location.reload()">click</a> or wait to reconnect...',
    ].join('\n');

    setTimeout(function() {
      location.reload();
    }, 60 * 1000);
  } else {
    status.innerHTML = [
      'Unable to connect, <a href="#" onclick="location.reload()">click</a> to retry...',
    ].join('\n');
  }

  content.appendChild(status);
};
