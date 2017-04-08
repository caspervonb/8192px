# 8192px - A collaborative pixel canvas that grows over time

8192px is a little pixel art experiment for the web where users have to work
together to fill out the canvas as the timeouts in-between being allowed to
place a pixel makes it hard for a single person to fill out the canvas.

The rules are quite simple:

- The canvas starts out at 2x2, and grows by 2x2 every 8192 seconds of users
  being active.
- After placing a pixel, a user must wait a deterministic random amount from 0
  to 8192, the scale of the value depends on the number of active users.

Mouse and keyboard controls:

- Click and drag to pan.
- Shift/Control click to zoom.
- Double click to place a pixel.

Touch controls:

- Drag to pan
- Pinch to zoom.
- Double tap to place a pixel.

You can see it in action at [http://8192px.co](http://8192px.co), the server is
a droplet hosted over at [DigitalOcean](https://m.do.co/c/77e38b5a6b3e).

The server is written in Node with the only dependencies being `mime` and `ws`.
Due to the lack of a good image library for node, it pipes bitmap data through
`convert`, which needs to be available on the server.

The client has no external dependencies, and should run fine in any reasonable
modern browser.
