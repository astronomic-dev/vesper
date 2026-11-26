/**
 * Loaded into a build's Node server by the harness (`node --import`). Each time a server of this process listens on a TCP
 * port, it writes the port and a line end to file descriptor 3, the harness's pipe. So the harness knows the process it
 * started is the one that answers on the port (see `serve` in harness.mjs). It changes nothing else.
 */
import { writeSync } from "node:fs";
import { Server } from "node:net";

const { listen } = Server.prototype;
Server.prototype.listen = function (...args) {
	this.once("listening", () => {
		const port = this.address()?.port;
		if (port) writeSync(3, `${port}\n`);
	});
	return listen.apply(this, args);
};
